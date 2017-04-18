const worker = new Worker();

process.title = 'crawler - worker';

process.on('message', (message) => {
    switch (message.type) {
        case 'dispatch':
            return worker.run(message.task);
        case 'task':
            return process.send({
                workdone: !worker.working
            });
        case 'disconnect':
            worker.exit = true;
    }
});

function Worker() {
    this.working = false;
    this.exit = false;
}

Worker.prototype.run = function (task) {
    this.start();
    this.handle(task);
    this.done();
}

Worker.prototype.handle = function (task) {
    // 处理任务
    console.log(task);
};

Worker.prototype.start = function () {
    this.working = true;
}

Worker.prototype.done = function () {
    this.working = false;
    if (this.exit) {
        return process.disconnect()
    };
    process.send({
        workdone: true
    });
}
