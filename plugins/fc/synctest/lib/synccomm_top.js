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


    function classof(o) {
        return Object.prototype.toString.call(o).slice(8,-1);
    }

    function extend(){
        var iterator = {
            stack: [],
            reset: function(){
                stack = [];
            },
            watch:function(co, cb){ // co object or array
                if(this.stack.indexOf(co) > -1) return;
                this.stack.push(co), cb();
            }
        };

        function copy(to, from, deep){
            for(var i in from){
                var fi = from[i];
                if(!deep){
                    if(extendTest(fi, i)){
                        to[i] = fi;
                    }
                }else{
                    var classFI = classof(fi), 
                        isArr = classFI === 'Array', 
                        isObj = classFI === 'Object' || inArray(classFI, ['Touch', 'TouchList']);
                    if(isArr || isObj){
                        var tiC = classof(to[i]);

                        isArr ? tiC !== 'Array' && (to[i] = []) : 
                                tiC !== 'Object' && (to[i] = {});

                        iterator.watch(fi, function(){
                            copy(to[i], fi, deep);
                        })
                    }else{
                        if(extendTest(fi, i)){
                            to[i] = fi;
                        }
                    }
                }
            }
        }

        var re, len = arguments.length, deep, i = 0, extendTest;

        deep = arguments[i] === true ? (i++, true): false;
        re   = arguments[i++];
        extendTest = (typeof arguments[--len] === 'function') ? 
                arguments[len]: (len++, function(val){ return val !== undefined});

        for(i; i < len; i++){
            try{
                copy(re, arguments[i], deep);
            } catch(e){
                console.log('extend log: ', arguments[i]);
            }
            // if(classof(arguments[i]) === 'Object'){}
        }

        return re;
    }

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
        delay = operatDelay < delay ? delay : operatDelay;// do animation anything
        return function () {
            var self = this, cur = new Date(), args = arguments;
            clearTimeout(timer);
            start || (start = cur);
            // keep doing
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

        var ele, listeners, evt, selector = command.selector;
            
        if(inList({ele: selector, type: command.type}, notSendList)) return {};

        ele = selector === 'window' ? window : 
                selector === 'document' ? document : document.querySelector(selector);
        try{
            listeners = eventData[ele[eventDomID]][command.type];
        } catch(e){
            listeners = new Callbacks();
        }

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

        // command.event.__proto__ = Event.prototype
        console.log('parse:\t', command);

        //TODO: event add prototype | dom
        if(command.type.indexOf('touch') > -1){
            var touchObj = command.event['changedTouches'];
            if(touchObj){
                touchObj.item = function(i){
                    return touchObj[i]
                }
                command.event['targetTouches'] = command.event['touches'] = touchObj;
            }
        }

        return {
            event: command.event,
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

        command.event = {}, command.dom = [];

        function callback(val, i){
            if((val instanceof Node) || val === window){
                /[0-9]/.test(i) || 
                    command.dom.push({name: i, selector: selectToUnique(e[i])});
            } else if(typeof val === 'function' || /[A-Z]/.test(i[0])){

            }
            else {
                //command.event[i] = val;
                return true;
            }
            return false;
        }
        extend(true, command.event, e, callback);
                
        console.log('build:\t', e, command.event);

        console.log('build JSON:\t', JSON.stringify(command));

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
            extend(e, command.event);
            console.log('new event:\t', e);

            e.preventDefault();
            command.listeners && command.listeners.fire(e);
        }

        originAddEventListener.call(ele, type, listener, false);
        ele.dispatchEvent(event);
        ele.removeEventListener(type, listener);
    }

    var originAddEventListener, windowOriginAddEventListener, nodeOriginAddEventListener;

    if(window.EventTarget){
        originAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = __addEventListener;
    } else {
        windowOriginAddEventListener = Window.prototype.addEventListener;
        nodeOriginAddEventListener = Node.prototype.addEventListener;

        originAddEventListener = function(type, listener, useCapture){

            var addEvent = this instanceof Window ? 
                    windowOriginAddEventListener : nodeOriginAddEventListener;

            addEvent.call(this, type, listener, useCapture);
        } ;
        Window.prototype.addEventListener = Node.prototype.addEventListener = __addEventListener;
    }

    function __addEventListener(type, listener, useCapture) {
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
            try{
                (e.type === 'scroll2') ?
                    throttleScroll(this, e):
                    sendCommand(buildCommand(this, e));
            } catch(err){
                console.log(err);
            }
            listener.call(this, e);

            // console.log(e);
            // e.preventDefault();
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
