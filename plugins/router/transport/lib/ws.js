var wsServer = 'ws://{{ origin }}',
    websocket = new WebSocket(wsServer);

websocket.onopen = function(evt) {
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