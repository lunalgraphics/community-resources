class SarlaccWorker {
    tasks = [];
    command = async (a) => { return (a + "").toUpperCase(); };
    outputs = [];

    constructor(tasks, command) {
        this.tasks = tasks;
        this.command = command;
        this.outputs = [];
    }

    async run() {
        this.outputs = [];
        for (let task of this.tasks) {
            this.outputs.push(await this.command(task));
        }
        return this.outputs;
    }
}

class Sarlacc {
    tasks = [];
    command = async (a) => { return (a + "").toUpperCase(); };
    numWorkers = 1;
    _workers = [];
    outputs = [];
    _workerOutputs = {};

    constructor(tasks, command, numWorkers) {
        this.outputs = [];
        this._workers = [];
        this._workerOutputs = {};
        this.tasks = tasks;
        this.command = command;
        this.outputs = [];
        if (numWorkers) this.numWorkers = numWorkers;
        else this.numWorkers = this.tasks.length;

        // distribute tasks amongst workers
        let tasksPerWorker = Math.ceil(this.tasks.length / this.numWorkers);
        let startIndex = 0;
        let endIndex = 0; // not inclusive
        for (let i = 0; i < this.numWorkers; i++) {
            endIndex = startIndex + tasksPerWorker;
            if (endIndex > this.tasks.length) endIndex = this.tasks.length;
            let myTasks = this.tasks.slice(startIndex, endIndex);
            let worker = new SarlaccWorker(myTasks, this.command);
            this._workers.push(worker);
            startIndex = endIndex;
        }
    }

    async run() {
        this._workerOutputs = {};
        for (let i = 0; i < this._workers.length; i++) {
            this._workerOutputs[i] = {
                completed: false,
                data: [],
            };
        }
        await new Promise((res, rej) => {
            for (let i = 0; i < this._workers.length; i++) {
                this._workers[i].run().then((output) => {
                    this._workerOutputs[i]["data"] = output;
                    this._workerOutputs[i]["completed"] = true;
                    if (this._allWorkersFinished()) {
                        res();
                    }
                });
            }
        });

        this.outputs = [];
        for (let key in this._workerOutputs) {
            let out = this._workerOutputs[key];
            this.outputs = [...this.outputs, ...(out["data"])];
        }

        return this.outputs;
    }

    _allWorkersFinished() {
        for (let key in this._workerOutputs) {
            if (!this._workerOutputs[key]["completed"]) {
                return false;
            }
        }
        return true;
    }
}

export default Sarlacc;