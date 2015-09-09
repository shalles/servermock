var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    utils = require('../../lib/utils'),
    php = require('./lib/php.js'),
    vmjs = require('./lib/vm.js');


console.log("enter into plugin")
module.exports = function(parmas){
    utils.log("file enter plugin and ext:" + parmas.ext, parmas.filepath);
    if (['php', 'html', 'vm', 'jsp'].indexOf(parmas.ext) > -1){

        //log("handle file", parmas.filepath);
        var jsonpath = parmas.mockpath ? path.join(parmas.mockpath, 
                            path.basename(parmas.filepath).slice(0, - parmas.ext.length)) : 
                            parmas.filepath.slice(0, - parmas.ext.length),
            jsonData = utils.readJson(jsonpath + 'json') || parmas.getMockJsonData(utils.readJson(jsonpath + 'mjson') || {});

        var regx = /<\?(?:(?:php\s+echo)|=)\s*([^;]|[$\w_\d()? :]+);*\s*\?>/g;///<\?php\s+echo\s*([^;]|[$\w_\d()? :]+);*\s*\?>/;///<\?php\s+echo\s*([^;]|[$\w_\d]+);*\s*\?>/g;
        if(jsonData){
            utils.log("page mock start with extname: ", parmas.ext);
            switch(parmas.ext){
                case 'vm':
                    //parmas.cnt = 
                    return vmjs.render(parmas.cnt, jsonData);
                    break;
                case 'jsp':
                    break;
                case 'php':
                case 'html':
                default:
                    var sandbox = utils.extend(php, jsonData, true);
                    //regx = /<\?(?:(?:php\s+echo)|=)\s*([^;]|[$\w_\d()? :"'\[\]\(\)]+);*\s*\?>/g;
                    //regx = /<\?(?:(?:php\s+echo)|=)\s*([^;]|[\S ]+);*\s*\?>/g;
                    regx = /<\?(?:(?:php\s+echo)|=)\s*(.+);*\s*\?>/g;

                    //parmas.cnt = 
                    return parmas.cnt.replace(regx, function($0, $1){
                        var re;
                        // utils.log("match: " + $1);

                        $1 = $1.replace(/"\s*(\.)\s*(\$[\w\d_]+)\s*(?:(\.)\s*")*/g, function($0, $1, $2, $3){
                            // utils.log('" + ' + $2 + ($3 ? ' + "': ''))
                            return '" + ' + $2 + ($3 ? ' + "': '');
                        });

                        var match = $1.match(/\$[\w_]+/g);
                        for(var i in match){
                            var mi = match[i];
                            sandbox[mi] === undefined && (sandbox[mi] = '');
                        }
                        
                        // utils.log("convert match", $1);
                        try{
                            re = vm.runInNewContext($1, sandbox);
                        } catch(err){
                            utils.log(err);
                        }
                        return re;
                    });
                    // console.log(parmas.cnt)
                    break;
            }
        }
    }
}