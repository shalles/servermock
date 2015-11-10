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
    
    var name = src.slice(src.lastIndexOf('\/') + 1, -4),
        tmpPluginPath = path.join(tempPath, name),
        command = '';
    //组织命令 删除旧临时文件 load plugin 
    var time = '#';
    var timer = setInterval(function(){
        console.log(time+= '#');
    }, 1200);
    command += 'cd ' + tempPath + ' && ' + (fs.existsSync(tmpPluginPath) ? utils.cmd.rm + ' -rf * && ' : '') + 'git clone ' + src;
    utils.excute(command, function (stdout, stderr) {
        stdout && console.log(stdout), stderr && console.log(stderr);
        try{
            var pType = utils.readJson(path.join(tempPath, fs.readdirSync(tempPath)[0], 'package.json'))
                             .servermock.type.replace(/[^a-zA-Z]/ig, '');
        } catch (err){
            utils.log('plugin not define type in package.json servermock.type ' + src);
            return;
        }
        utils.log(utils.chalk.green('plugin ' + name + ' load success!'));
        
        var pluginTypePath = path.join(homeDir, '.servermock/plugins/', pType),
            pluginPath = path.join(pluginTypePath, name);
        utils.mkPath(pluginTypePath);

        command = (pluginPath !== '\/' && fs.existsSync(pluginPath) ? utils.cmd.rm + ' -rf ' + pluginPath + ' && ': '') + 
                            utils.cmd.mv + " -f " + tmpPluginPath + ' ' + pluginTypePath;
        utils.excute(command, function(stdout, stderr){
            clearInterval(timer);
            stdout && console.log(stdout), stderr && console.log(stderr);
            utils.log(utils.chalk.green('plugin ' + name + ' installed successfully!'));
        });
    }, utils.chalk.red("load pligins error\t"));

}