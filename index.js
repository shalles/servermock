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
        hostname: '127.0.0.1',
        protocol: 'http',
        websocket: {
            open: false
        },
        main: ''
    };
    
    (function () {
        //自动获取IP并作为启动服务源
        if(config.hostname === '0.0.0.0'){
            try{
                var NETs = os.networkInterfaces();
                for (var net in NETs) {
                    if (['lo', 'lo0'].indexOf(net) > -1) continue;
                    var IPs = NETs[net];
                    for (var i = 0, len = IPs.length; i < len; i++) {
                        if (IPs[i].family === 'IPv4') {
                            config.hostname = IPs[i].address;
                            return;
                        }
                    }
                }
            } catch(e){
                config.hostname = '127.0.0.1';
                utils.log(utils.chalk.yellow('please open your Wi-Fi and restert. now use default config server on 127.0.0.1'));
            }
        }
    })();
    
    // 插件参数处理
    function pluginInit(){
        var pluginList = config.plugins = config.plugins instanceof Array ? config.plugins : [],
            pluginsConfig, temp, serverConfig;
        
        if(!pluginList.length) return {};
        
        pluginsConfig = {__userPluginList: []};
        temp = utils.extend(true, {}, dft, config);
        serverConfig = {
            hostname: temp.hostname,
            port: temp.port,
            protocol: temp.protocol
        };
    
        for(var i = 0, len = pluginList.length; i < len; i++){
            var plu = pluginList[i], name = plu.name, open = plu.open;
            if(open && name){
                pluginsConfig.__userPluginList.push(name);
                pluginsConfig[name] = plu.param || {};
                pluginsConfig[name].__serverConfig = serverConfig;
                pluginsConfig[name].__utils = utils;
            }
        }
        // 注册并初始化插件配置返回插件的server配置
        return pluginList.length ? plugins.init(pluginsConfig) : {};
    }
    
    var pluginNeed = pluginInit();
    // 用户配置 > 插件的server配置 > default
    config = utils.extend(true, dft, pluginNeed, config);

    var startParam;
    try{
        startParam = config.main.split('=');
        if(startParam[0] === '@plugin' && pluginNeed.startbase){
            buildPath = pluginNeed.startbase[startParam[1]];
            config.main = 'index.html';
        }
    } catch(err){
        throw Error('plugin-' + startParam[1] + ' start faild');
    }

    config.main = config.main && (config.main[0] !== '\/' ? '\/' + config.main : config.main);

    server(config, buildPath, plugins);
}

module.exports = servermock;