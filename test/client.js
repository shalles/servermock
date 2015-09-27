var net = require('net');
var client = new net.Socket();
var host = '127.0.0.1',
    port = 8880;

client.connect(port, host, function() {

    console.log('CONNECTED TO: ' + host + ':' + port);
    // 建立连接后立即向服务器发送数据，服务器将收到这些数据 
    //client.write('I am shalles');

});


process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
    var chunk = process.stdin.read() || '';
    client.write(chunk);
});

process.stdin.on('end', function() {
    process.stdout.write('stdin end!');
});

// 为客户端添加“data”事件处理函数
// data是服务器发回的数据
client.on('data', function(data) {

    console.log("" + data);

    // 完全关闭连接
    //client.destroy();

});

// 为客户端添加“close”事件处理函数
client.on('close', function() {
    console.log('Connection closed');
});

client.on('error', function(err) {
    console.log('client error: ', err);
});

// var client = net.connect({
//         host: '127.0.0.1',
//         port: 8880
//     },
//     function() { //'connect' listener
//         console.log('connected to server!');
//         client.write('world!\r\n');
//     });
// client.on('data', function(data) {
//     console.log(data.toString());
//     client.end();
// });
// client.on('end', function() {
//     console.log('disconnected from server');
// });

// client.on('error', function(err) {
//     console.log('server error: ', err);
// });

// client.end('hello shalles');