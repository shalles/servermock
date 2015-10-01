(function(window){
    window.__synctest = {};

    var wsServer = 'ws://localhost:8080',
        websocket = new WebSocket(wsServer);
    // window.addEventListener('DOMContentLoaded', function(){
    websocket.onopen = function(evt) {
        initDefaultEvent();
        console.log('[synctest start success]');
    };
    websocket.onclose = function(evt) {
        console.log('[synctest closed please check the server or refresh this page]');
    };
    websocket.onmessage = function(evt) {
        excuteCommand(parseCommand(evt.data));
    };
    websocket.onerror = function(evt) {
        console.log('[synctest closed please check the server or refresh this page]');
    };
    // });

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

    function inArray(a , arr){
        return arr.indexOf(a) > -1;
    }
    function inList(item, list){
        for(var i in list){
            if(inArray(item.ele, list[i].ele) && inArray(item.type, list[i].type)){
                return true;
            }
        }
        return false;
    }
    
    /**
     * 公共方法部分
     */

    var eventData = {},
        eventID = 0,
        eventDomID = 'synccommand_' + new Date().getTime(),
        notSendList = [{ 
            ele: ['window', 'document'],
            type:['DOMContentLoaded', 'load']
        }];

    // 解析指令
    function parseCommand(command) {
        command = JSON.parse(command);

        var selector = command.selector, ele, listeners;
            
        if(!inList({ele: selector, type: command.type})) return;

        ele = selector === 'window' ? window : document.querySelector(selector); //通知值操作一个事件
        listeners = eventData[ele[eventDomID]][command.type];

        // 识别事件 执行不同的方法
        switch(e.type){
            case 'input': 
                ele.value = common.value;
                break;
            default:
                break;
        }

        return {
            ele: ele,
            listeners: listeners
        }
    }

    // 建立通用指令
    function buildCommand(self, e) {
        var ele = self, // e.currentTarget,
            selector = (ele === window) ? 'window' : 
                        (ele === window.document) ? 'document' :
                            (ele.tagName + "#" + ele.id + ((ele.classList && ele.classList.length) ? 
                                "." + ele.classList.toString().split(' ').join('.') : ''));

        var command = {
            selector: selector,
            type: e.type
        };
        // 识别事件 配置不同的数据
        switch(e.type){
            case 'input': 
                command.value = ele.value;
                break;
            default:
                break;
        }

        return JSON.stringify(command);
    }
    // 广播指令 实际由websocket server 端执行广播 由servermock websocket部分synccomm插件完成
    function sendCommand(command) {
         (websocket.readyState === 1) && websocket.send(command);
    }
    // 在当前页执行接收到的指令
    function excuteCommand(command) {
        command.listeners.fire();
    }

    /**
     * addEventListener
     * 重写时间监听 组织websocket(由buildCommand部分完成)并发送指令
     */
    var originAddEventListener = EventTarget.prototype.addEventListener;

    window.addEventListener =
        EventTarget.prototype.addEventListener = function(type, listener, useCapture) {
            var self = this;
            // 组织并存储事件监听
            ((eventData[eventID] || (eventData[eventID] = {}))[type] ||
                (eventData[eventID][type] = new Callbacks())).add(
                function() {
                    // 用户监听
                    listener.call(self, e);
                }
            );
            
            self[eventDomID] || (self[eventDomID] = ++eventID);

            var callback = function(e) {
                
                // 组织并发送指令
                sendCommand(buildCommand(this, e));

                // 用户监听 广播不发给自己 保证当前操作平台无延迟
                listener.call(this, e);
            }

            originAddEventListener.call(self, type, callback, useCapture);
        }


    // 重写addEventListener后为默认事件绑定监控
    function regriteDefaultEventListener(target, evt) {
        target.addEventListener(evt, function(e) {
            console.log(evt, e);
        }, false)
    }

    function regriteDefaultEventListenerTargetList(tgtList, evt) {
        for (var i = 0, len = tgtList.length; i < len; i++) {
            regriteDefaultEventListener(tgtList[i], evt);
        }
    }

    function regriteDefaultEventListenerEventList(target, evtList) {
        for (var i = 0, len = evtList.length; i < len; i++) {
            regriteDefaultEventListener(target, evtList[i]);
        }
    }

    function regriteDefaultEventListenerList(tgtList, evtList) {
        for (var i = 0, len = tgtList.length; i < len; i++) {
            regriteDefaultEventListenerEventList(tgtList[i], evtList);
        }
    }
    /**
     * 处理默认事件
     */
    function initDefaultEvent(){
        
        // 'scroll', 'resize'
        regriteDefaultEventListenerEventList(window, ['scroll', 'resize']);

        //link a
        var linkList = document.querySelectorAll('a');
        linkList.length && regriteDefaultEventListenerTargetList(linkList, 'click');

        // input: input textarea
        var inputs = document.querySelectorAll('input'),
            textarea = document.querySelectorAll('textarea');

        inputs.length && regriteDefaultEventListenerList(inputs, ['input', 'focus']);
        textarea.length && regriteDefaultEventListenerList(textarea, ['input', 'focus']);
    }
})(window);