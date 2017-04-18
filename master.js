const fork = require('child_process').fork;
const net = require('net');
const path = require('path');

function Master() {
    this.workers = [];
    this.tasks = [];
    this.sockFile = null;
    this.server = null;
}

process.title = 'crawler(Master)';
process.on('uncaughtException', (err) => {
    console.log(err);
    process.exit(1);
});

Master.prototype.setWorker = function (num) {
    for (let i = 1; i <= num; i++) {
        let worker = fork(path.resolve('./worker'));
        this.workers.push(worker);
        worker.on('message', this.message(worker));
        worker.on('disconnect', () => {
            console.log('worker:'+worker.pid+' disconnect!');
        });
    }
    return this;
};

Master.prototype.dispatch = function (task, worker) {
    worker = worker || this.worker();
    if (!task || !worker) return;
    worker.send({type: 'dispatch', task: task});
    this.workers.push(worker);
};

Master.prototype.run = function () {
    let task = this.task();
    if (!task) return;
    this.dispatch(task, this.worker());
};

Master.prototype.stop = function () {
    this.server.close();
    this.workers.forEach((worker) => {
        worker.send({type: 'disconnect'});
    });
};

Master.prototype.task = function (task) {
    return this.tasks.shift();
};

Master.prototype.worker = function () {
    return this.workers.shift();
};

Master.prototype.push = function (task) {
    if (!task) return;
    this.tasks.push(task);
    this.broadcast({type: 'task'});
    return this;
};

Master.prototype.broadcast = function (message) {
    this.workers.forEach((worker) => {
        worker.send(message);
    });
};

Master.prototype.message = function (worker) {
    return (message) => {
        if (message.workdone) {
            this.dispatch(this.task(), worker)
        }
    };
};

Master.prototype.listen = function (sockFile) {
    this.sockFile = sockFile;
    this.server = net.createServer((socket) => {
        socket.on('data', (data) => {
            data = JSON.parse(data.toString());
            if (data.type == 'worker') {
                return this.push(data.task);
            }
            if (data.type == 'master') {
                switch (data.task) {
                    case 'stop':
                        this.stop();
                        process.exit();
                }
            }
        });
    }).listen(sockFile);
    this.server.on('error', (err) => {
        console.log('捕获到异常');
        console.log(err);
        process.exit();
    });
    return this;
};

/** Client **/
function Client(sockFile) {
    this.connect = new net.Socket();
    this.connect.connect(sockFile);
    this.connect.on('error', () => {
        console.log('master server error!');
    });
    this.connect.on('data', function (data) {
        console.log(data.toString());
    });
}

Client.prototype.send = function (data) {
    this.connect.write(JSON.stringify(data));
};

Client.prototype.close = function () {
    this.connect.destroy();
};

Client.prototype.push = function (task, type, callback) {
    callback = callback || function () {};
    this.connect.write(JSON.stringify({
        type: type || 'worker',
        task: task
    }), callback);
};

exports = module.exports = Master;
exports.client = Client;
