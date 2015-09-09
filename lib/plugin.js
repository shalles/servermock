
var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    utils = require('./utils'),
    Callback = require('./callback.js');

var php = require('./plugin/php.js'),
    vmjs = require('./plugin/vm.js');

var plugin = {
    fileContent: new Callback(),
    whenError: new Callback()
}
plugin.excute = function(name, parmas){
    plugin[name] && plugin[name].fire(parmas);
    //parmas.ext==='html' && utils.log("parmas.cnt", parmas.cnt);
    return parmas.cnt;
}

plugin.fileContent.add(function(parmas){
    utils.log("file enter plugin and ext:" + parmas.ext, parmas.filepath);
    if (['php', 'html', 'vm', 'jsp'].indexOf(parmas.ext) > -1){

        //log("handle file", parmas.filepath);
        var jsonpath = path.normalize(parmas.filepath.slice(0, - parmas.ext.length) + 'json'),
            jsonData = utils.readJson(jsonpath);

        var regx = /<\?(?:(?:php\s+echo)|=)\s*([^;]|[$\w_\d()? :]+);*\s*\?>/g;///<\?php\s+echo\s*([^;]|[$\w_\d()? :]+);*\s*\?>/;///<\?php\s+echo\s*([^;]|[$\w_\d]+);*\s*\?>/g;

        switch(parmas.ext){
            case 'vm':
                jsonData && (parmas.cnt = vmjs.render(parmas.cnt, jsonData));
                break;
            case 'jsp':
                break;
            case 'php':
            case 'html':
            default:
                regx = /<\?(?:(?:php\s+echo)|=)\s*([^;]|[$\w_\d()? :]+);*\s*\?>/g;
                if(jsonData){
                    // var phpCode = '<? php \n\t';
                    // for(var i in jsonData){
                    //     phpCode += i + ' = "' + jsonData[i] + '";\n\t'
                    // }
                    // phpCode += '\n?>'

                    //utils.log("php", JSON.stringify(php));
                    
                    var sandbox = utils.extend(php, jsonData, true);
                    parmas.cnt = parmas.cnt.replace(regx, function($0, $1){
                        var re;
                        utils.log("match: " + $1);

                        re = (/^\$[\w_]+/.test($1) && jsonData[$1] === undefined) ? '':
                                vm.runInNewContext($1, sandbox);
                        return re;
                    });
                }
                break;
        }
    }
})

module.exports = plugin;