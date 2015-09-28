
var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    utils = require('./utils'),
    Callback = require('./callback.js');

var plugin = {
    fileContent: new Callback(),
    wsMessage: new Callback(),
    whenError: new Callback()
}

var gPluginList = ['fc', 'err', 'ws-msg'];

plugin.excute = function(name, parmas){
    plugin[name] && plugin[name].fire(parmas);
    //parmas.ext==='html' && utils.log("parmas.cnt", parmas.cnt);
    return parmas.cnt;
}

plugin.register = function(func, name){
    // (function(func){
    switch(name){
        case 'fc':
            plugin.fileContent.add(function(parmas){
                parmas.cnt = func(parmas) || parmas.cnt;
            });
            break;
        default:
            break;
    }
    // })(func);
}


var sandbox = {
    utils: utils,
    vm: vm
}

function initPlugins(){
    var userPluginPath,
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
function findCheckPlugins(pluginBasePath, pluginDirList){
    for(var i in pluginDirList){
        var pType = pluginDirList[i];
        if(!utils.inArray(pType, gPluginList)){
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

            if(fs.existsSync(fp)){
                //file = fs.readFileSync(fp).toString();
                //require(fp)
                plugin.register(require(fp), pType);
                
                utils.log('插件注册成功: ', fp);
            } else{
                throw new Error("插件主文件不存在\n" + fp);
            }
        } catch (err){
            utils.log("error: plugin error:", err);
        }
    }
}

initPlugins();

module.exports = plugin;