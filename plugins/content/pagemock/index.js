var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    mockjs = require('mockjs'),
    php = require('./lib/php.js'),
    vmjs = require('./lib/vm.js'),
    utils = require('../../../lib/utils'),
    plugin = {};


// console.log("enter into plugin")
plugin.excute = function(parmas){
    if (utils.inArray(parmas.ext, plugin._acceptExts)){
        // utils.log("file enter plugin and ext:" + parmas.ext, parmas.filepath);
        var jsonpath = plugin._basepath ? path.join(plugin._basepath,
                    path.basename(parmas.filepath).slice(0, - parmas.ext.length)) : 
                    parmas.filepath.slice(0, - parmas.ext.length),
            jsonData = plugin.getMockJsonData(jsonpath);

        var regx = /<\?(?:(?:php\s+echo)|=)\s*([^;]|[$\w_\d()? :]+);*\s*\?>/g;///<\?php\s+echo\s*([^;]|[$\w_\d()? :]+);*\s*\?>/;///<\?php\s+echo\s*([^;]|[$\w_\d]+);*\s*\?>/g;
        if(jsonData){
            utils.log(utils.chalk.green("page mock start with extname: ") + utils.chalk.yellow(parmas.ext));
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

plugin.getMockJsonData = function(jsonpath){
    try{
        return utils.readJson(jsonpath + 'json') || 
                mockjs.mock(utils.readJson(jsonpath + 'mjson') || {});
    } catch(err){
        utils.log(utils.chalk.red("plugin-pagemock parse mockdata file " + utils.chalk.yellow(jsonpath) + '.json or .mjson failed'), err);
    }
}

function initMockRandom(mockrcpath){
    mockrcpath = path.isAbsolute(mockrcpath) ? mockrcpath : 
                    path.resolve(plugin._basepath, mockrcpath);
    utils.log(utils.chalk.green("plugin-pagemock mockrcpath:\n"), mockrcpath)

    var mockRandom = fs.existsSync(mockrcpath) ? 
                        JSON.parse(fs.readFileSync(mockrcpath)) : {};

    for(var i in mockRandom){
        var randomData = {}, 
            name = i.toLowerCase(), 
            list = name + 's';
        (function(i, list, name){
            randomData[list] = mockRandom[i];
            randomData[name] = function(data){
                return this.pick(this[list]);
            }

            mockjs.Random.extend(randomData);
            utils.log(utils.chalk.green("plugin-pagemock Random add:\n"), randomData);
        })(i, list, name);
    }
}

plugin.init = function(config){
    plugin._basepath = config.basepath && path.resolve(process.cwd(), config.basepath);
    plugin._acceptExts = config.acceptExts || ['php', 'html', 'vm', 'jsp'];

    config.mockrc && initMockRandom(config.mockrc);
}

module.exports = plugin;