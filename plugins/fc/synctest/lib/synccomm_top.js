(function(window){
    window.__synctest = {};

    var eventData = {},
        eventID = 0,
        eventDomID = 'synccommand_' + new Date().getTime(),
        notSendList = [{ 
            ele: ['window', 'document'],
            type:['DOMContentLoaded', 'load']
        }];
    

    var wsServer = 'ws://{{ origin }}',
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
     * refer to jquery callbacks not all
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
     * common
     */

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

    function buildCurrentEventObject(evt, tgt){
        evt.target = tgt;

        return evt;
    }

    function selectToUnique(ele){
        var selectList = [];

        function select(ele){
            if(!ele){
                return selectList;
            } else if(ele === window){
                selectList.push('window');
            } else if(ele === window.document){
                selectList.push('document');
            } else if(ele === document.body){
                selectList.push('body');
            } else {
                if(ele.id){
                    selectList.push('#' + ele.id);
                    return selectList;
                }
                if(ele.classList && ele.classList.length){
                    selectList.push('.' + ele.classList.toString().split(' ').join('.'));
                } else {
                    selectList.push(ele.tagName);
                }
                select(ele.parentElement);
            }
        }
        
        select(ele);

        return selectList.reverse().join('>');
    }

    function throttlePlus(fn, delay, operatDelay) {
        var timer, start;
        delay = operatDelay < delay ? delay : operatDelay;//必须让动画播放完
        return function () {
            var self = this, cur = new Date(), args = arguments;
            clearTimeout(timer);
            start || (start = cur);
            //超时后直接执行保持连贯
            if (operatDelay <= cur - start) {
                fn.apply(self, args);
                start = cur;
            }
            else {
                timer = setTimeout(function () {
                    fn.apply(self, args)
                }, delay);
            }
        }
    }

    var throttleScroll = throttlePlus(function(self, e){
        sendCommand(buildCommand(self, e));
    }, 150, 200);

    function parseCommand(command) {
        command = JSON.parse(command);

        var ele, listeners, evt = {}, selector = command.selector;
            
        if(inList({ele: selector, type: command.type}, notSendList)) return {};

        ele = selector === 'window' ? window : document.querySelector(selector); 
        listeners = eventData[ele[eventDomID]][command.type];

        buildCurrentEventObject(evt, ele);

        // TODO: add more
        switch(command.type){
            case 'input': 
                ele.value = command.value;
                break;
            case 'focus':
                ele.focus();
                break;
            case 'scroll':
                ele.scrollTop ? 
                    (ele.scrollTop = command.scrollTop, ele.scrollLeft = command.scrollLeft) :
                    window.scrollTo(command.scrollLeft, command.scrollTop);
                break;
            case 'click': 
                if(ele.tagName && ele.tagName.toLowerCase() === "a"){
                    ele.href.indexOf("javascript") === -1 && (location.href = ele.href);
                }
                break;
            default:
                break;
        }

        switch(ele.tagName && ele.tagName.toLowerCase()){
            case 'input': 
                ele.value = command.value;
                break;

            default:
                break;
        }

        return {
            event: evt,
            type: command.type,
            ele: ele,
            listeners: listeners
        }
    }

    function buildCommand(self, e) {

        var ele = self, // e.currentTarget,
            // TODO: recognize more detail to root or select by ID -f
            selector = selectToUnique(ele);

        var command = {
            selector: selector,
            type: e.type
        };

        // TODO: add more
        switch(e.type){
            case 'input': 
                command.value = ele.value;
                break;
            case 'scroll':
                command.scrollTop = ele.scrollTop || scrollY;
                command.scrollLeft = ele.scrollLeft || scrollX;
                break;

            default:
                break;
        }

        switch(ele.tagName && ele.tagName.toLowerCase()){
            case 'input': 
                command.value = ele.value;
                break;

            default:
                break;
        }

        console.log(command);

        return JSON.stringify(command);
    }

    function sendCommand(command) {

        command !== '' && (websocket.readyState === 1) && websocket.send(command);
    }

    function excuteCommand(command) {
        var ele, type, event, listener;

        if(!(ele = command.ele)) return;
        
        type = "__synctest_event",
        event = new Event(type);
        listener = function(e){
            e.preventDefault();
            command.listeners && command.listeners.fire(e);
        }
        originAddEventListener.call(ele, type, listener);
        ele.dispatchEvent(event);
        ele.removeEventListener(type, listener);
    }

    var originAddEventListener = EventTarget.prototype.addEventListener;

    window.addEventListener =
        EventTarget.prototype.addEventListener = function(type, listener, useCapture) {
            var self = this;

            self[eventDomID] || (self[eventDomID] = ++eventID);

            ((eventData[eventID] || (eventData[eventID] = {}))[type] ||
                (eventData[eventID][type] = new Callbacks())).add(
                function(e) {
                    // e.preventDefault();
                    listener.call(self, e);
                }
            );

            var callback = function(e) {

                (e.type === 'scroll2') ?
                    throttleScroll(this, e):
                    sendCommand(buildCommand(this, e));

                listener.call(this, e);

                e.preventDefault();
            }

            originAddEventListener.call(self, type, callback, useCapture);
        }


    function rewriteDefaultEventListener(target, evt) {
        target.addEventListener(evt, function(e) {
            console.log(evt, e);
        }, false)
    }

    function rewriteDefaultEventListenerTargetList(tgtList, evt) {
        for (var i = 0, len = tgtList.length; i < len; i++) {
            rewriteDefaultEventListener(tgtList[i], evt);
        }
    }

    function rewriteDefaultEventListenerEventList(target, evtList) {
        for (var i = 0, len = evtList.length; i < len; i++) {
            rewriteDefaultEventListener(target, evtList[i]);
        }
    }

    function rewriteDefaultEventListenerList(tgtList, evtList) {
        for (var i = 0, len = tgtList.length; i < len; i++) {
            rewriteDefaultEventListenerEventList(tgtList[i], evtList);
        }
    }
    
    function initDefaultEvent(){
        
        // 'scroll', 'resize'
        rewriteDefaultEventListenerEventList(window, ['scroll', 'resize']);

        //link a
        var linkList = document.querySelectorAll('a');
        linkList.length && rewriteDefaultEventListenerTargetList(linkList, 'click');

        // input: input textarea
        var inputs = document.querySelectorAll('input'),
            textarea = document.querySelectorAll('textarea');

        inputs.length && rewriteDefaultEventListenerList(inputs, ['input', 'focus']);
        textarea.length && rewriteDefaultEventListenerList(textarea, ['input', 'focus']);
    }
})(window);
