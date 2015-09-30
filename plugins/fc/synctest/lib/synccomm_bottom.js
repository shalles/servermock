
setTimeout(function() {
    /**
     * 处理默认事件
     */
    // 'scroll', 'resize'
    window.__synctest.regriteDefaultEventListenerEventList(window, ['scroll', 'resize']);

    //link a
    var linkList = document.querySelectorAll('a');
    linkList.length && window.__synctest.regriteDefaultEventListenerTargetList(linkList, 'click');

    // input: input textarea
    var inputs = document.querySelectorAll('input'),
        textarea = document.querySelectorAll('textarea');

    inputs.length && window.__synctest.regriteDefaultEventListenerList(inputs, ['input', 'focus']);
    textarea.length && window.__synctest.regriteDefaultEventListenerList(textarea, ['input', 'focus']);

}, 100);