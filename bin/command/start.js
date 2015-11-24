var path = require('path'),
    utils = require('../../lib/utils.js'),
    servermock = require('../../index.js');

var cwd = process.cwd();

module.exports = function(params){
    var configPath = path.join(cwd, 'sm.config'),
        config = utils.readJson(configPath) || {};
    
    console.log("params: ", params);
    var i = 0;
    while(params[i]){
        switch(params[i++]){
            case '-p':
                var port = parseInt(params[i++]);

                if(!isNaN(port) && port > 0 && port < 65536){
                    config.port = port;
                }
                break;
            case '-i':
                config.main = params[i++] || 'index.html';
                break;
            case '@p':
                var plu = params[i++], pluConfig;
                if(!plu){
                    throw Error('param error: please specify a plugin name to start');
                }
                config.main = '@plugin=' + plu;
                config.plugins = utils.classof(config.plugins) === 'Array' ? config.plugins : [];
                pluConfig = (pluConfig = utils.findObjectInArray(
                                         config.plugins, 'name', plu)) ? pluConfig : {'name': plu};

                pluConfig.open = true;
                config.plugins.push(pluConfig);
                break;
            default: 
                break;
        }
    }

    utils.log(utils.chalk.green('start with config\n'), config);

    servermock(config);
};