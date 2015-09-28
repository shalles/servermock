var WebSocketServer = require('websocket').server;
var MAXSIZE = 1024 * 1024 * 10,
    acceptProtocols = null; //

module.exports = function(server, config){
    var maxsize = config.maxsize || MAXSIZE,
        encoding = config.encoding || 'utf8',
        callback = config.callback,
        meTome = config.meTome || false,
        originReg = config.originReg || "",
        broadcast = config.broadcast || true;

    var clientList = [];

    var wsServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });
     
    function originIsAllowed(origin) {
        if(new RegExp(originReg).test(origin)){
            return false;
        }
      // put logic here to detect whether the specified origin is allowed. 
      return true;
    }
     
    wsServer.on('request', function(request) {
        if (!originIsAllowed(request.origin)) {
          // Make sure we only accept requests from an allowed origin 
          request.reject();
          console.log('[websocket connection from origin ' + request.origin + ' rejected].');
          return;
        }
        
        var connection = request.accept(acceptProtocols, request.origin);
        console.log('[websocket connection accepted].');

        clientList.push(connection);

        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                var data = message.utf8Data;

                console.log('[websocket server received message');
                if(data.length > maxsize){
                    console.log('but to big out of maxsize ' + (data.length - maxsize)+ ']');
                    return;
                }
                console.log(']: ' + message.utf8Data);

                try{
                    callback && new funciton(data, connection, callback);
                } catch(e){
                    console.log("[websocket callback error]: \n", e);
                }
                // broadcast && connection.write(data, function() {
                //     console.log('[connection broadcast one data]');
                // });

                if(broadcast){
                    console.log('[websocket server broadcast one data]');
                    for(var i in clientList){
                        var sockCli = clientList[i];
                        (meTome || sockCli !== connection) && (function(sockCli, data){
                            var dataFrom = connection.remoteAddress + ':' + connection.socket._idleStart;// + ':\n' + data
                            sockCli.sendUTF(dataFrom + ':\n' + data, function() {
                                var dataTo = sockCli.remoteAddress + ':' + sockCli.socket._idleStart;
                                console.log('[' + dataFrom + ' send a message to ' + dataTo + ']:\n', data);
                            });
                        })(sockCli, data);
                    }
                }
            }
            else if (message.type === 'binary') {
                console.log('[websocket server received binary message of ' + message.binaryData.length + ' bytes]');
                connection.sendBytes(message.binaryData);
            }
        });
        connection.on('close', function(reasonCode, description) {
            console.log('websocket client ' + connection.remoteAddress + ' disconnected.');
            clientList.splice(clientList.indexOf(connection), 1);
            //connection.unmount();
        });
    });
};
