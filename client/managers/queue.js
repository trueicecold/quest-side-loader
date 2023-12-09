let queue = {
    pending: [],
    current: null,
    completed: []
};

let QueueType = {
    INSTALL: "0",
    BACKUP_APP: "1",
    BACKUP_DATA: "2",
    UNINSTALL: "3",
    DOWNLOAD: "4"
}

const add = (type, params) => {
    queue.pending.push({
        type: type,
        params: params,
        data: {}
    });
    if (!queue.current) {
        queue.current = queue.pending.shift();
        processCurrent();
    }
    return {
        status: 1
    };
}

const get = () => {
    let currentQueue = structuredClone(queue);
    queue.completed.forEach((item) => {
        item.new = false;
    });
    return {
        status: 1,
        queue: currentQueue
    };
}

const complete = () => {
    if (queue.current) {
        queue.current.new = true;
        queue.completed.unshift(queue.current);
        queue.current = null;

        if (queue.pending.length > 0) {
            queue.current = queue.pending.shift();
            processCurrent();
        }
    }
}

const getCurrent = () => {
    return queue.current;
}

const processCurrent = async () => {
    switch (queue.current.type) {
        case QueueType.INSTALL:
            let queueResult = await global.managers.adb.installPackage(queue.current.params.path, queue.current.params.obb, queue.current.params.install);
            
            queue.current.success = queueResult.status;
            queue.current.error = queueResult.error || "";
            complete();
            break;
        case QueueType.BACKUP_APP:
            global.managers.adb.backupApp(queue.current.params);
            break;
        case QueueType.BACKUP_DATA:
            global.managers.adb.backupData(queue.current.params);
            break;
        case QueueType.UNINSTALL:
            global.managers.adb.uninstallPackage(queue.current.params);
            break;
    }
}

module.exports = {
    add,
    get,
    complete,
    getCurrent,
    QueueType
}