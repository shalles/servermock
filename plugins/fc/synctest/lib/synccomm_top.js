(function(window){
    window.__synctest = {};
    /**
     * websocket 
     * 1. 发送当前操作平台的指令 由addEventListener重写部分完成
     * 2. 接收其他平台发送的指令
     * 3. 解析并触发接收到的指令 由parseCommand部分完成
     */
    // 初始化
    var wsServer = 'ws://localhost:8080';
    var websocket = new WebSocket(wsServer);
    websocket.onopen = function(evt) {
        console.log('[synctest start success]');
    };
    websocket.onclose = function(evt) {
        console.log('[synctest closed please refresh this page]');
    };
    websocket.onerror = function(evt) {
        console.log('[synctest error please refresh this page]');
    };
    // 接收指令
    websocket.onmessage = function(evt) {
        // 解析并执行指令
        excuteCommand(parseCommand(evt.data));
    };

    /**
     * Callbacks 
     * author: shalles
     * email:shalles@163.com
     * create time: 2015.01.02
     * refer to jquery callbacks 非完整简化版
     */

    function validateFn(fn) {
        return typeof fn === 'function';
    }

    function Callbacks(options) {
        this.list = []
    }

    Callbacks.prototype = {

        // Add a callback or a collection of callbacks to the list
        add: function(fn) {
            if (validateFn(fn)) {
                this.list.push(fn);
            } else if (Object.prototype.toString.call(fn) === "[object Array]") {
                for (var i = 0, len = fn.length; i < len; i++) {
                    arguments.callee.call(this, fn[i]);
                }
            }

            return this;
        },

        // Call all callbacks with the given context and arguments
        fireWith: function(context, args) {
            var list = this.list;
            for (var i = 0, len; i < list.length; i++) {
                list[i].apply(context, args.slice ? args.slice() : args);
            }

            return this;
        },

        // Call all the callbacks with the given arguments
        fire: function() {
            this.fireWith(this, arguments);
            return this;
        }
    };

    /**
     * 公共方法部分
     */

    var eventData = {},
        eventID = 0,
        eventDomID = 'synccommand_' + new Date().getTime();
    // 解析指令
    function parseCommand(command) {
        command = JSON.parse(command);

        var selector = command.selector
            ele = selector === 'window' ? window : document.querySelectorAll(selector),
            listeners = eventData[ele[eventDomID]][command.type];
        return {
            ele: ele,
            listeners: listeners
        }
    }
    // 建立同用指令
    function buildCommand(self, e) {
        var ele = self, // e.currentTarget,
            selector = ele === window ? 'window' :
                    (ele.tagName + "#" + ele.id + ((ele.classList && ele.classList.length) ? "." +
                        ele.classList.toString().split(' ').join('.') : ''));

        var command = JSON.stringify({
            selector: selector,
            evtType: e.type
        });

        return command;
    }
    // 广播指令 实际由websocket server 端执行广播 由servermock websocket部分synccomm插件完成
    function sendCommand(command) {
        websocket.send(command);
    }
    // 在当前页执行接收到的指令
    function excuteCommand(command) {
        var listeners = command.listeners;

        listeners.fire();
    }

    /**
     * addEventListener
     * 重写时间监听 组织websocket(由buildCommand部分完成)并发送指令
     */
    var originAddEventListener = EventTarget.prototype.addEventListener;

    window.addEventListener =
        EventTarget.prototype.addEventListener = function(type, listener, useCapture) {

            var callback = function(e) {
                var self = this;

                // 组织事件
                ((eventData[eventID] || (eventData[eventID] = {}))[type] ||
                    (eventData[eventID][type] = new Callbacks())).add(
                    function() {
                        // 用户监听
                        listener.call(self, e);
                    }
                );
                self[eventDomID] || (self[eventDomID] = ++eventID);

                // 组织并发送指令
                sendCommand(buildCommand(this, e));

                // 用户监听 广播不发给自己 保证当前操作平台无延迟
                listener.call(this, e);
            }

            originAddEventListener.call(this, type, callback, useCapture);
        }


    // 重写addEventListener后为默认事件绑定监控
    window.__synctest.regriteDefaultEventListener = function (target, evt) {
        target.addEventListener(evt, function(e) {
            console.log(evt, e);
        }, false)
    }

    window.__synctest.regriteDefaultEventListenerTargetList = function (tgtList, evt) {
        for (var i = 0, len = tgtList.length; i < len; i++) {
            window.__synctest.regriteDefaultEventListener(tgtList[i], evt);
        }
    }

    window.__synctest.regriteDefaultEventListenerEventList = function (target, evtList) {
        for (var i = 0, len = evtList.length; i < len; i++) {
            window.__synctest.regriteDefaultEventListener(target, evtList[i]);
        }
    }

    window.__synctest.regriteDefaultEventListenerList = function (tgtList, evtList) {
        for (var i = 0, len = tgtList.length; i < len; i++) {
            window.__synctest.regriteDefaultEventListenerEventList(tgtList[i], evtList);
        }
    }
})(window);