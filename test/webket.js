var wsServer = 'ws://localhost:8089';
var websocket = new WebSocket(wsServer);
websocket.onopen = function(evt) {
    console.log('[socket open]', evt)
};
websocket.onclose = function(evt) {
    console.log('[socket closed]', evt)
};
websocket.onmessage = function(evt) {
    opt.innerHTML += evt.data;
};
websocket.onerror = function(evt) {
    console.log('[socket error]', evt)
};

ipt.onkeyup = function(e) {
    if (e.keyCode === 13) {
        websocket.send(ipt.value);
    }
}