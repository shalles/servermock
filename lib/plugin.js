
var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    utils = require('./utils'),
    Callback = require('./callback.js');

var plugin = {
    fileContent: new Callback(),
    whenError: new Callback()
}
plugin.excute = function(name, parmas){
    plugin[name] && plugin[name].fire(parmas);
    //parmas.ext==='html' && utils.log("parmas.cnt", parmas.cnt);
    return parmas.cnt;
}

plugin.register = function(func){
    // (function(func){
    plugin.fileContent.add(function(parmas){
        parmas.cnt = func(parmas) || parmas.cnt;
    })
    // })(func);
}

var pluginPath = path.join(__dirname, '../plugins');
var pluginFiles = fs.readdirSync(pluginPath);
var sandbox = {
    utils: utils,
    vm: vm
}
for(var i in pluginFiles){
    try{
        var file, fp = path.join(pluginPath, pluginFiles[i], 'index.js');

        if(fs.existsSync(fp)){
            file = fs.readFileSync(fp).toString();
            //require(fp)
            plugin.register(require(fp));
        }
    } catch (err){
        utils.log("error: plugin error:", err);
    }
}

module.exports = plugin;