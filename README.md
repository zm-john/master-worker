# master worker

`master` 作为一个服务运行，它的作用是管理 `worker` 子进程，分配子任务给 `worker` 
`worker` 负责处理被分配的任务

## 运行示意图
![master-worker](https://github.com/zm-john/master-worker/blob/develop/master-worker.png?raw=true)