var fs = require('fs'),
    path = require('path'),
    readline = require('readline'),
    utils = require('../../lib/utils.js');

var cwd = process.cwd();


module.exports = function(params){
    if(fs.existsSync(path.join(cwd, 'sm.config'))){
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(utils.chalk.yellow('there is a sm.config file in you project, are you sure recover it?(y/n)'), function(answer) {
            // TODO: Log the answer in a database
            
            if(answer.toLowerCase() == 'n'){
                utils.log('init do nothing');
            }else {
                doInit();
            }
            rl.close();
        });
    } else {
        doInit();
    }
    function doInit(){
        var content = fs.readFileSync(path.join(__dirname, '../../src/init_sm.config'));
        var pkg = utils.readJson(path.join(__dirname, '../../package.json'));
        var comment = ' // servermock config file sm.config for version ' + pkg['version'] + '\n';
        
        content = comment + content;
        
        fs.writeFileSync(path.join(cwd, 'sm.config'), content);
        
        utils.log(utils.chalk.green("initialize successfully!"));
    }
}