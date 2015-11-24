
var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    utils = require('./utils'),
    Callback = require('./callback.js');

var plugin = {
    _router: new Callback(),
    _content: new Callback(),
    _wsmsg: new Callback(),
    _error: new Callback()
}

var pluginStartBase = {},
    gPluginTypeList = ['content', 'router', 'err', 'wsmsg'],
    configPlugins;

plugin.excute = function(name, params){
    var plu = plugin['_' + name];
    try{
        plu && plu.fire(params);
        return params.return;
    } catch (err){
        utils.log(utils.chalk.red('plugin-' + name + ' error:'), err);
    }
};

plugin.register = function(plu, type, name){
    var backdata = plu.init(configPlugins[name]);
    switch(type){
        case 'content':
            plugin._content.add(function(params){
                params.return = params.cnt = plu.excute(params) || params.cnt;
            });
            break;
        case 'router':
            plugin._router.add(function(params){
                params.return = plu.excute(params);
            });
            break;
        case 'wsmsg':
            plugin._router.add(function(params){
                params.return = params.data = plu.excute(params) || params.data;
            });
            break;
        default:
            plugin['_' + type].add(plu.excute);
            break;
    }
    return backdata;
}

function findCheckPlugins(pluginBasePath, pluginDirList){
    var config = {};
    for(var i in pluginDirList){
        var pType = pluginDirList[i];

        if(!utils.inArray(pType, gPluginTypeList)){
            continue;
        }

        utils.extend(true, config, loadPlugins(pluginBasePath, pType));
    }
    return config;
}

function loadPlugins(pluginBasePath, pType){
    var pluginPath = path.join(pluginBasePath, pType),
        pluginFiles = fs.readdirSync(pluginPath),
        pluginsConfig = {};

    for(var i in pluginFiles){
        var pfi = pluginFiles[i];

        try{
            var fp = path.join(pluginPath, pfi, 'index.js'),
                pluServCfg,
                configPath = path.join(pluginPath, pfi, 'package.json'),
                userLoad = utils.inArray(pfi, configPlugins.__userPluginList);

            if(fs.existsSync(fp) && userLoad){
                var backdata = plugin.register(require(fp), pType, pfi);
                
                utils.log(utils.chalk.green('plugin-' + pfi + ' registed success.'));

                pluServCfg = (utils.readJson(configPath) || {}).servermock || {};

                // 插件启动目录root 规定当前目录为'./' 不提倡支架在插件当前目录下 直接start/ 即启动start/index.html
                backdata && backdata.dirname && pluServCfg['startbasepath'] && 
                    (pluginStartBase[pfi] = path.join(backdata.dirname, pluServCfg['startbasepath']));

                utils.extend(true, pluginsConfig, pluServCfg);

            } else if(!userLoad){
                utils.chalk.red('plugin-' + pfi + 'main file lose:') + fp;
            }
        } catch (err){
            utils.log(utils.chalk.red('plugin-' + pfi + ' error:'), err);
        }
    }
    return pluginsConfig;
}

plugin.init = function(plugins){
    var userPluginPath, sysPluginPath, pluginDirList, config = {};

    console.log(utils.chalk.blue('plugins:\n'), plugins);

    configPlugins = plugins;
    sysPluginPath = path.join(__dirname, '../plugins'),
    pluginDirList = fs.readdirSync(sysPluginPath);

    utils.extend(true, config, findCheckPlugins(sysPluginPath, pluginDirList));

    // user plugins
    userPluginPath = path.join(utils.getUserDir(), '.servermock/plugins');
    if(fs.existsSync(userPluginPath)){
        pluginDirList = fs.readdirSync(userPluginPath);
        utils.extend(true, config, findCheckPlugins(userPluginPath, pluginDirList));
    }
    
    // 目前只开放一个socket配置供插件开发者配置
    // TODO: 处理开发者配置参数覆盖的问题
    return {
        startbase: pluginStartBase,
        websocket: config.websocket
    };
}

module.exports = plugin;