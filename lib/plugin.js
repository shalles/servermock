
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
        var pfi = pluginFiles[i];

        try{
            var file, fp = path.join(pluginPath, pfi, 'index.js'),
                userLoad = utils.inArray(pfi, configPlugins.__userPluginList);

            if(fs.existsSync(fp) && userLoad){
                //file = fs.readFileSync(fp).toString();
                //require(fp)
                plugin.register(require(fp), pType, pfi);
                
                utils.log(utils.chalk.green('plugin-' + pfi + ' registed success.'));
            } else if(!userLoad){
                utils.chalk.red('plugin-' + pfi + 'main file lose:') + fp;
            }
        } catch (err){
            utils.log(utils.chalk.red('plugin-' + pfi + ' error:'), err);
        }
    }
}

plugin.init = function(plugins){
    var userPluginPath, sysPluginPath, pluginDirList;

    console.log(utils.chalk.blue('plugins:\n'), plugins);

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