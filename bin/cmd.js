var fs = require('fs'),
    path = require('path'),
    utils = require('../lib/utils.js');

var cwd = process.cwd();

var Command = function (){
    this.commands = {};
    this.load();
}

Command.prototype = {
    load: function (){
        var cmd, cmds = fs.readdirSync(path.join(__dirname, 'command'));
        for(var i = 0, len = cmds.length; i < len; i++){
            cmd = cmds[i].slice(0, -3);
            try{
                this.commands[cmd] = require(path.join(__dirname, 'command', cmds[i]));
                utils.log(utils.chalk.green('load command ' + cmd + ' success'));
            } catch(err){
                utils.log(utils.chalk.red('load command ' + cmd + ' error'), err);
            }
        }
    },
    parse: function (commands){
        var cmds = [];
        //for(var i = 0, len = commands.length; i < len; i++){
            cmds.push({
                name: commands[0],
                params: commands.slice(1)
            });
        //}
        
        return cmds;
    },
    excute: function(commands){
        var cmd, cmds = this.parse(commands);
        for(var i = 0, len = cmds.length; i < len; i++){
            cmd = cmds[i];
            this.commands[cmd.name](cmd.params);
        }  
    }
}

module.exports = Command;

