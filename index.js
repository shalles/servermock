var os = require('os'),
    fs = require('fs'),
    path = require('path'),
    utils = require('./lib/utils.js'),
    server = require('./lib/server.js');

var buildPath = process.cwd();
    

function servermock(config){
    var dft = {
        port: 80,
        hostname: "127.0.0.1",
        protocol: 'http', //https\
        // key: "~/cert/cert.key",
        // cert: "~cert/cert.crt",
        websocket: {
            open: false
        },
        "main": ""
    };

    //自动获取IP并作为启动服务源
    if(config.hostname === "0.0.0.0"){
        var IP = os.networkInterfaces().en0
        for(var i = 0, len = IP.length; i < len; i++){
            if(IP[i].family === "IPv4"){
                config.hostname = IP[i].address;
                break;
            }
        }
    }

    config = utils.extend(true, dft, config);
    config.main = config.main && (config.main[0] !== '\/' ? '\/' + config.main : config.main);

    // 插件参数处理
    var pluginList = config.plugins = config.plugins instanceof Array ? config.plugins : [],
        plugins = {__userPluginList: []};

    for(var i = 0, len = pluginList.length; i < len; i++){
        var name = pluginList[i]['name'], open = pluginList[i]['open'];
        if(open && name){
            plugins.__userPluginList.push(name);
            plugins[name] = pluginList[i]['param'] || {};
        }
    }

    config.plugins = plugins;

    server(config);
}

module.exports = servermock;