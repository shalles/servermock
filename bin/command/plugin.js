var fs = require('fs'),
    path = require('path'),
    utils = require('../../lib/utils.js');

module.exports = function(params){
    var src = params[0];
    if(!src){
        utils.log(utils.chalk.red('缺少参数\n'),
            "pligin [git repository]"
        );
        return;
    }

    var homeDir = utils.getUserDir();
    var tempPath = path.join(homeDir, ".servermock/plugins_temp");

    utils.mkPath(tempPath);
    
    var name = src.slice(src.lastIndexOf('\/'), -4),
        tmpPluginPath = path.join(tempPath, name),
        command = '';
    //组织命令 删除旧临时文件 load plugin 
    command += 'cd ' + tempPath + ' && ' + (fs.existsSync(tmpPluginPath) ? 'rm -rf * && ' : '') + 'git clone ' + src;
    utils.excute(command, function (stdout, stderr) {
        var pType;
        try{
            pType = utils.readJson(path.join(tempPath, fs.readdirSync(tempPath)[0], 'package.json')).servermock.type;
        } catch (err){
            utils.log('plugin not define type in package.json servermock.type ' + src);
            return;
        }
        
        var pluginPath = path.join(homeDir, '.servermock/plugins/', pType);
        utils.mkPath(pluginPath);

        command = "mv -f " + tmpPluginPath + ' ' + pluginPath;
        utils.excute(command, function(stdout, stderr){

            utils.log(utils.chalk.green('plugin load success!'));
        }, utils.chalk.red("load pligins error\t"))
    }, utils.chalk.red("load pligins error\t"));

}