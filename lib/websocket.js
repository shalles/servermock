var WebSocketServer = require('websocket').server;
    
var MAXSIZE = 1024 * 1024 * 10,
    acceptProtocols = null; //

module.exports = function(server, config, plugins, host, post){
    var maxsize = config.maxsize || MAXSIZE,
        encoding = config.encoding || 'utf8',
        callback = config.callback,
        meTome = config.mTm || false,
        originReg = config.originReg || "",
        sameOrigin = config.sameOrigin || true,
        broadcast = config.broadcast || true;

    var clientStore = {
        store: {},
        push: function(key, data){
            var store = this.store;
            store[key] || (store[key] = []);
            store[key].push(data);
        },
        del: function(key, key2){
            var store = this.store;
            store[key] && store[key].splice(store[key].indexOf(key2), 1);
        }
    };
    var clientList = [];

    var wsServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });
     
    function originIsAllowed(origin) {
        if(new RegExp(originReg).test(origin)){
            return true;
        }
      // put logic here to detect whether the specified origin is allowed. 
      return false;
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

        clientStore.push(request.origin, connection);

        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                var data = message.utf8Data;

                console.log('[websocket server received message');
                if(data.length > maxsize){
                    console.log('but to big out of maxsize ' + (data.length - maxsize)+ ']');
                    return;
                }
                console.log(']: ' + message.utf8Data);
                
                //TODO: 保持消息的纯粹 from 放到插件中实现
                var dataFrom = connection.remoteAddress + '->' + connection.socket._idleStart;

                
                // 在回调前处理插件 保证数据正确性
                try{
                    data = plugin.excute('wsMessage', {
                        host: host,
                        post: post,
                        data: data, 
                        curCli: connection, 
                        cliList: clientStore.store
                    }) || data;
                } catch(e){
                    console.log("servermock plugin error: ", e);
                }

                try{
                    var type = typeof callback;

                    callback && (data = 
                                type === 'function' && callback(data, connection, clientList) ||
                                type === 'string' && (new Function('data', 'curCli', 'cliList',
                                callback))(data, connection, clientList) || data);
                } catch(e){
                    console.log("[websocket callback error]: \n", e);
                }

                if(broadcast){
                    console.log('[websocket server broadcast one data]');
                    var store = clientStore.store;

                    for(var o in store){
                        // console.log("origin: ", o, request.origin, store)
                        if(sameOrigin && o !== request.origin) continue;

                        var cliList = store[o];
                        for(var i in cliList){

                            var sockCli = cliList[i];
                            (meTome || sockCli !== connection) && (function(sockCli, data){
                                
                                sockCli.sendUTF(data, function() {

                                    var dataTo = sockCli.remoteAddress + '->' + sockCli.socket._idleStart;
                                    console.log('[' + dataFrom + ' send a message to ' + dataTo + ']:\n', data);
                                });
                            })(sockCli, data);
                        }
                    }
                }
            }
            else if (message.type === 'binary') {
                console.log('[websocket server received binary message of ' + message.binaryData.length + ' bytes]');
                connection.sendBytes(message.binaryData);
            }
        });
        connection.on('close', function(reasonCode, description) {
            console.log('websocket client ' + connection.remoteAddress + "->" + connection.socket._idleStart + ' disconnected.');
            clientStore.del(request.origin, connection)
            //connection.unmount();
        });
    });
};
