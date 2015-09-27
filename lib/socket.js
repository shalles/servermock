var net = require('net');
var MAXSIZE = 1024 * 1024 * 2;

/**
 * [Socket description]
 * @param {[type]} config 
 * {
 *     host: 127.0.0.1,
 *     port: 8880,
 *     family: 4,
 *     encoding: 'utf8',
 *     maxsize: 1024*1024*2,
 *     broadcast: true,
 *     callback: function(clientdata, socket){}
 * }
 */
function Socket(config) {
    var host = config.host || '127.0.0.1',
        port = config.port || 8880,
        maxsize = config.maxsize || MAXSIZE,
        encoding = config.encoding || 'utf8',
        callback = config.callback,
        broadcast = config.broadcast || true;

    var clientList = [];

    var server = net.createServer(function(socket) {
            // var socket = new net.Socket();

            // socket.connect({
            //     host: config.host || '127.0.0.1',
            //     port: config.port || 8880,
            //     //family: config.family || 4
            // });
            console.log('[socket connected successfully]: ', socket.remoteAddress + ':' + socket.remotePort);
            
            clientList.push(socket);

            socket.setEncoding(encoding);

            socket.on('lookup', function() {
                console.log('[create socket]');
            });

            socket.on('connect', function(sock) {
                console.log('[socket connected successfully]: ', sock.remoteAddress + ':' + sock.remotePort);
            });

            socket.on('data', function(data) {
                //data = socket.remoteAddress + '|' + socket.remotePort + ':\n' + data;
                //console.log('socket get data:\n', data);

                callback && callback(data, socket);

                // broadcast && socket.write(data, function() {
                //     console.log('[socket broadcast one data]');
                // });

                if(broadcast){
                    console.log('[socket broadcast one data]');
                    for(var i in clientList){
                        var sock = clientList[i];
                        (sock !== socket) && (function(sock, data){
                            var dataFrom = socket.remoteAddress + ':' + socket.remotePort;// + ':\n' + data
                            sock.write(dataFrom + ':\n' + data, function() {
                                var dataTo = sock.remoteAddress + ':' + sock.remotePort;
                                console.log('[' + dataFrom + ' send a message to ' + dataTo + ']:\n', data);
                            });
                        })(sock, data);
                    }
                }
                //socket.end();
            });

            socket.on('end', function() {
                console.log('end');
            });

            socket.on('drain', function() {
                console.log('drain');
            });

            socket.on('error', function(err) {
                console.log('[socket error]: ', err)
            });

            socket.on('close', function() {
                clientList.splice(clientList.indexOf(socket), 1);
                socket.destroy();
                console.log('[client closed]');

            });

            socket.write('hello\r\n');
            //socket.pipe(socket);
            //console.log(socket);
        })
        .listen(port, host, function() { //'listening' listener
            console.log('server bound: ', host, ':', port);
        })
        .on('connection', function(){
            console.log('[new socket connection], count: ', clientList.length);
        })
        .on('error', function(err){
            console.log('[server error]:', err);
            if (err.code == 'EADDRINUSE') {
                console.log('Address in use, retrying...');
                setTimeout(function() {
                    server.close();
                    server.listen(PORT, HOST);
                }, 1000);
            }
        })
        .on('close', function(){
            console.log('[server closed]');
        })

}

module.exports = Socket;