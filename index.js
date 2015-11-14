var os = require('os'),
    fs = require('fs'),
    path = require('path'),
    utils = require('./lib/utils.js'),
    server = require('./lib/server.js'),
    plugins = require('./lib/plugins.js');

var buildPath = process.cwd();
    

function servermock(config){
    var dft = {
        port: 80,
        hostname: "127.0.0.1",
        protocol: 'http',
        websocket: {
            open: false
        },
        main: ""
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

    config.main = config.main && (config.main[0] !== '\/' ? '\/' + config.main : config.main);

    // 插件参数处理
    function pluginInit(){
        var pluginList = config.plugins = config.plugins instanceof Array ? config.plugins : [],
            pluginsConfig, temp, serverConfig;
        
        if(!pluginList.length) return {};
        
        pluginsConfig = {__userPluginList: []},
        temp = utils.extend(true, {}, dft, config),
        serverConfig = {
            hostname: temp.hostname,
            port: temp.port,
            protocol: temp.protocol
        };
    
        for(var i = 0, len = pluginList.length; i < len; i++){
            var name = pluginList[i]['name'], open = pluginList[i]['open'];
            if(open && name){
                pluginsConfig.__userPluginList.push(name);
                pluginsConfig[name] = pluginList[i]['param'] || {};
                pluginsConfig[name].__serverConfig = serverConfig;
                pluginsConfig[name].__utils = utils;
            }
        }
        // 注册并初始化插件配置返回插件的server配置
        return pluginList.length ? plugins.init(pluginsConfig) : {};
    }
    
    // 用户配置 > 插件的server配置 > default
    config = utils.extend(true, dft, pluginInit(), config);

    server(config, plugins);
}

module.exports = servermock;