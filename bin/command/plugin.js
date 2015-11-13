var fs = require('fs'),
    path = require('path'),
    utils = require('../../lib/utils.js');

var plugin = {
    intall: function(params){
        var src = params[0];
        if(!src || src == '\/' || src.slice(-4) !== '.git'){
            utils.log(utils.chalk.red('参数错误\n'),
                "pligin install|-i [git repository] ",
                "eg. servermock plugin -i https://github.com/shalles/synctest.git"
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
        command += 'cd ' + tempPath + ' && ' + (fs.existsSync(tmpPluginPath) ? utils.cmd.rm + tempPath + ' && ' : '') + ' git clone ' + src;
        try{
            utils.excute(command, function (stdout, stderr) {
                stdout && console.log(stdout), stderr && console.log(stderr);
                try{
                    var pType = utils.readJson(path.join(tempPath, fs.readdirSync(tempPath)[0], 'package.json'))
                                    .servermock.type.replace(/[^a-zA-Z]/ig, '');
                } catch (err){
                    throw Error('plugin ' + name + ' not define type in package.json servermock.type ' + src);
                    return;
                }
                // utils.log(utils.chalk.green('plugin ' + name + ' load success!'));
                
                var pluginTypePath = path.join(homeDir, '.servermock/plugins/', pType),
                    pluginPath = path.join(pluginTypePath, name);
                utils.mkPath(pluginTypePath);
                
                // 移动到指定类型的插件包 删除已有同名插件
                command = (pluginPath !== '\/' && fs.existsSync(pluginPath) ? utils.cmd.rm + pluginPath + ' && ': '') + 
                                    utils.cmd.mv + tmpPluginPath + ' ' + pluginTypePath;
                utils.excute(command, function(stdout, stderr){
                    command = 'cd ' + pluginPath + ' && npm install';
                    time = '#';
                    utils.excute(command, function(stdout, stderr){
                        clearInterval(timer);
                        stdout && console.log(stdout), stderr && console.log(stderr);
                        utils.log(utils.chalk.green('plugin ' + name + ' installed successfully!'));
                    });
                    
                    utils.log(utils.chalk.green('plugin ' + name + ' load success!'));
                    stdout && console.log(stdout), stderr && console.log(stderr);
                });
            }, utils.chalk.red('load plugin ' + name + ' error\t'));
        } catch(err){
            clearInterval(timer);
            utils.log(err);
        }
    }
}

plugin['-i'] = plugin.intall;
plugin['-d'] = plugin.delete;

module.exports = function(params){
    var cmd = params[0];
    params = params.slice(1);
    if(!plugin[cmd]){
        utils.log('参数错误', 
            '\nplugin [command]',
            '\ninstall\t\tinstall servermock plugin 通过指定一个 git repository path',
            '\ndelete\t\tdelete 用户的一个 servermock plugin from .servermock/plugins'
        );
        return;
    }
    
    plugin[cmd](params);
}