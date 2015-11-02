
var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    utils = require('./utils'),
    Callback = require('./callback.js');

var plugin = {
    router: new Callback(),
    content: new Callback(),
    wsmsg: new Callback(),
    error: new Callback()
}

var gPluginTypeList = ['content', 'router', 'err', 'wsmsg'],
    configPlugins;

plugin.excute = function(name, parmas){
    try{
        plugin[name] && plugin[name].fire(parmas);
        return parmas.cnt;
    } catch (err){
        console.log("servermock plugin-" + name + " error log：", err);
    }
}

plugin.register = function(plu, type, name){
    plu.init(configPlugins[name]);
    (function(plu){
        switch(type){
            case 'content':
                plugin.content.add(function(parmas){
                    parmas.return = plu.func(parmas) || parmas.cnt;
                });
                break;
            case 'router':
                plugin.router.add(function(parmas){
                    parmas.return = plu.func(parmas);
                });
                break;
            default:
                plugin[type].add(func);
                break;
    }})(plu);
}

function findCheckPlugins(pluginBasePath, pluginDirList){
    for(var i in pluginDirList){
        var pType = pluginDirList[i];
        if(!utils.inArray(pType, gPluginTypeList)){
            continue;
        }

        loadPlugins(pluginBasePath, pType);
    }
}
function loadPlugins(pluginBasePath, pType){
    var pluginPath = path.join(pluginBasePath, pType),
        pluginFiles = fs.readdirSync(pluginPath);

    for(var i in pluginFiles){
        try{
            var file, fp = path.join(pluginPath, pluginFiles[i], 'index.js');

            if(fs.existsSync(fp) && utils.inArray(i, configPlugins.__userluginList)){
                //file = fs.readFileSync(fp).toString();
                //require(fp)
                plugin.register(require(fp), pType, i);
                
                utils.log('plugin-' + i + ' registed success.');
            } else{
                throw new Error('plugin-' + i + 'main file lose\n' + fp);
            }
        } catch (err){
            utils.log('plugin-' + i + ' error:', err);
        }
    }
}

plugin.init = function(plugins){
    var userPluginPath, sysPluginPath, pluginDirList;

    configPlugins = plugins;
    sysPluginPath = path.join(__dirname, '../plugins'),
    pluginDirList = fs.readdirSync(sysPluginPath);

    findCheckPlugins(sysPluginPath, pluginDirList);

    // user plugins
    userPluginPath = path.join(utils.getUserDir(), '.servermock/plugins');
    if(fs.existsSync(userPluginPath)){
        pluginDirList = fs.readdirSync(userPluginPath);
        findCheckPlugins(userPluginPath, pluginDirList);
    }
}

module.exports = plugin;