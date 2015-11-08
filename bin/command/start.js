var path = require('path'),
    utils = require('../../lib/utils.js'),
    servermock = require('../../index.js');

var cwd = process.cwd();

module.exports = function(params){
    var configPath = path.join(cwd, 'sm.config'),
        config = utils.readJson(configPath) || {};

    utils.log(utils.chalk.green('start with config\n'), config);

    servermock(config);
}