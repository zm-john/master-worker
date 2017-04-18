#!/usr/bin/env node

const program = require('commander');
const child_process = require('child_process');
const path = require('path');
const Master = require('./master');

const SOCK_FILE = path.resolve('./crawler.sock');
const WORKER_LENGTH = 1;

program.option('-d --deamon', 'master process will work deamon');

program.command('start')
    .action(() => {
        // if (program.deamon) {
        //     deamon();
        // }
        let master = new Master();
        master.listen(SOCK_FILE).setWorker(WORKER_LENGTH).run();
    });

program.command('stop')
    .action(() => {
        let client = new Master.client(SOCK_FILE);
        client.push('stop', 'master', () => {
            client.close();
            process.exit();
        });
    });

program.command('push')
    .arguments('[task]')
    .action((task) => {
        let client = new Master.client(SOCK_FILE);
        client.push(task, 'worker', () => {
            client.close();
            process.exit();
        });
    });

program.parse(process.argv);

function deamon() {
    // todo
}
