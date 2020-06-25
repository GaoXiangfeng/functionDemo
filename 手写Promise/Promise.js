/*
    自定义promise函数模块：IIFE
*/

(function (window) {

    const PENDING = 'pending'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'

    /*
        Promise构造函数
        excutor 执行器函数  同步执行
    */
    function Promise(excutor) {
        const self = this
        self.states = PENDING  //给promise对象指定状态
        self.data = undefined //给promise对象指定一个用于存储结果数据的属性
        self.callbacks = [] //每个元素的结构 {onResolved(){},onRejected(){}}


        function resolve(value) {
            //如果当前状态不是pending，则直接返回
            if (self.states !== PENDING) {
                return
            }

            //将状态改为resolved
            self.states = RESOLVED


            //保存value数据
            self.data = value

            //如果有待执行的callback函数，立即异步执行回调函数
            if (self.callbacks.length > 0) {
                setTimeout(() => { //放入队列中执行所有成功的回调
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value)
                    });
                })
            }
        }

        function reject(reason) {
            //如果当前状态不是pending，则直接返回
            if (self.states !== PENDING) {
                return
            }

            //将状态改为rejected
            self.states = REJECTED


            //保存value数据
            self.data = reason

            //如果有待执行的callback函数，立即异步执行回调函数
            if (self.callbacks.length > 0) {
                setTimeout(() => { //放入队列中执行所有成功的回调
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onRejected(reason)
                    });
                })
            }

        }

        try {
            excutor(resolve, reject)
        } catch (error) { //如果执行器抛出异常，则状态变为失败
            reject(error)
        }

    }

    /*
        promise 原型对象上的方法 then
        指定成功和失败的回调函数
        返回一个新的promise对象
    */
    Promise.prototype.then = function (onResolved, onRejected) {

        onResolved = typeof onResolved === 'function' ? onResolved : value => value
        //指定默认的失败的回调（实现错误/异常传透的关键步骤）
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason } //向后传递失败的reason

        const self = this

        //返回一个新的promise
        return new Promise((resolve, reject) => {
            function handle(callback) {
                /*
                        1.如果抛出异常，return的promise就会失败，reason就是error
                        2.如果回调函数不是promise，return的promise就是成功，value就是返回值
                        3.如果回调函数是promise，return的promise就是这个promise的结果
                    */
                try {
                    const result = callback(self.data)
                    if (result instanceof Promise) {
                        //3.如果回调函数是promise，return的promise就是这个promise的结果
                        result.then(value => {
                            resolve(value)
                        }, reason => {
                            reject(reason)
                        })
                    } else {
                        resolve(result)
                    }
                } catch (error) {
                    reject(error)
                }
            }

            if (self.states === PENDING) {
                //假设当前状态为pending状态，将回调函数保存起来
                self.callbacks.push({
                    onResolved(value) {
                        handle(onResolved)
                    },
                    onRejected(reason) {
                        handle(onRejected)
                    }
                })
            } else if (self.states === RESOLVED) {
                setTimeout(() => {
                    handle(onResolved)
                })
            } else { //rejected
                setTimeout(() => {
                    handle(onRejected)
                })
            }
        })
    }

    /*
    promise 原型对象上的方法 catch
    */
    Promise.prototype.catch = function (onRejected) {
        return this.then(undefined, onRejected)
    }

    /*
        promise 函数对象上的方法 resolve
        返回一个成功的promise
    */
    Promise.resolve = function (value) {
        //返回一个成功/失败的promise
        return new Promise((resolve, reject) => {
            if (value instanceof Promise) {
                value.then(resolve, reject)
            } else {
                resolve(value)
            }
        })
    }

    /*
        promise 函数对象上的方法 reject
        返回一个失败的promise
    */
    Promise.reject = function (reason) {
        //返回一个失败promise
        return new Promise((resolve, reject) => {
            reject(reason)
        })
    }

    /*
        返回一个promise对象，在指定的时间后确定结果
    */
    Promise.resolveDelay = function (value, time) {
        //返回一个成功/失败的promise
        return new Promise((resolve, reject) => {
            setTimeout(()=>{
                if (value instanceof Promise) {
                    value.then(resolve, reject)
                } else {
                    resolve(value)
                }
            },time)
        })
    }

    /*
        promise 函数对象上的方法 reject
        返回一个失败的promise,在指定的时间后才确定结果
    */
    Promise.rejectDelay = function (reason, time) {
        //返回一个失败promise
        return new Promise((resolve, reject) => {
            setTimeout(()=>{
                reject(reason)
            },time)
        })
    }

    /*
        promise 函数对象上的方法 all
        返回一个promise，所有都成功才成功，否则一个失败就失败了
    */
    Promise.all = function (promises) {
        const values = new Array(promises.length)//用来保存所有value的数组

        //用来保存成功数量的定时器
        let resolvedCount = 0

        return new Promise((resolve, reject) => {
            promises.forEach((p, index) => {
                Promise.resolve(p).then(value => {
                    resolvedCount++
                    //p成功了，将成功的value保存进values
                    values[index] = value

                    //如果全部成功了，返回
                    if (resolvedCount == promises.length) {
                        resolve(values)
                    }
                }, reason => {//只要有一个失败了，return的promise就失败了
                    reject(reason)
                })
            })
        })
    }

    /*
        promise 函数对象上的方法 race
        返回一个promise，取决于第一个返回的promise
    */
    Promise.race = function (promises) {
        return new Promise((resolve, reject) => {
            promises.forEach((p, index) => {
                Promise.resolve(p).then(value => {//一旦成功变为成功
                    resolve(value)
                }, reason => {//一旦失败变为失败
                    reject(reason)
                })
            })
        })
    }


    //向外暴露Promise
    window.Promise = Promise
})(window)