var WebSocketServer = require('websocket').server,
    utils = require('./utils.js');
    
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
        push: function(name, key, data){
            var store = this.store;
            store = store[name] || (store[name] = {});
            store = store[key] || (store[key] = []);
            store.push(data);
        },
        del: function(name, key, key2){
            var store = this.store[name] || {};
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
            utils.log(utils.chalk.red('[websocket connection from origin ' + utils.chalk.cyan(request.origin) + ' rejected].'));
            return;
        }
        var param = request.resource || '',
            paramsObj = {},
            params = param.slice(param.indexOf('?') + 1).split('&');
        for(var i = 0, len = params.length; i < len; i++){
            var pi = params[i].split('=');
            paramsObj[pi[0]] = pi[1];
        }
        if(!paramsObj.appname) {
            request.reject();
            utils.log(utils.chalk.red('[websocket connection from anonymous application with origin ' + utils.chalk.cyan(request.origin) + ' rejected].'));
            return;
        }
        var connection = request.accept(acceptProtocols, request.origin);
        utils.log(utils.chalk.green('[websocket connection accepted ' + connection.remoteAddress + '->' + connection.socket._idleStart + '].'));
        
        connection.__appname = paramsObj.appname;
        clientStore.push(connection.__appname, request.origin, connection);

        connection.on('message', function(message) {
            var appname = connection.__appname;
            if (message.type === 'utf8') {
                var data = message.utf8Data;

                utils.log(utils.chalk.green('[server received a message]'));
                if(data.length > maxsize){
                    utils.log(utils.chalk.red('but to big out of maxsize ' + utils.chalk.cyan(data.length - maxsize)));
                    return;
                }
                config.debug && utils.log(data);
                
                //TODO: 保持消息的纯粹 from 放到插件中实现
                var dataFrom = connection.remoteAddress + '->' + connection.socket._idleStart;

                var store = clientStore.store[appname];
                
                // 在回调前处理插件 保证数据正确性
                data = plugins.excute('wsmsg', {
                    host: host,
                    post: post,
                    data: data, 
                    curCli: connection, 
                    cliList: store
                }) || data;

                try{
                    var type = typeof callback;

                    callback && (data = 
                                type === 'function' && callback(data, connection, clientList) ||
                                type === 'string' && (new Function('data', 'curCli', 'cliList',
                                callback))(data, connection, clientList) || data);
                } catch(e){
                    utils.log(utils.chalk.green("[websocket callback error]:", e));
                }

                if(broadcast){
                    utils.log(utils.chalk.green('[server broadcast a message]'));

                    for(var o in store){
                        // utils.log(utils.chalk.green("origin: ", o, request.origin, store))
                        if(sameOrigin && o !== request.origin) continue;

                        var cliList = store[o];
                        for(var i in cliList){

                            var sockCli = cliList[i];
                            (meTome || sockCli !== connection) && (function(sockCli, data){
                                
                                sockCli.sendUTF(data, function() {

                                    var dataTo = sockCli.remoteAddress + '->' + sockCli.socket._idleStart;
                                    utils.log(utils.chalk.green('[' + utils.chalk.yellow(dataFrom) + ' send a message to ' + utils.chalk.yellow(dataTo)+ ']'), config.debug && data || '');
                                });
                            })(sockCli, data);
                        }
                    }
                }
            }
            else if (message.type === 'binary') {
                utils.log(utils.chalk.green('[websocket server received binary message of ' + message.binaryData.length + ' bytes]'));
                connection.sendBytes(message.binaryData);
            }
        });
        connection.on('close', function(reasonCode, description) {
            utils.log(utils.chalk.green('socket client ' + connection.remoteAddress + "->" + connection.socket._idleStart + ' disconnected.'));
            clientStore.del(connection.__appname, request.origin, connection);
            //connection.unmount();
        });
    });
};
