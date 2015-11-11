#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    utils = require('../lib/utils.js'),
    Command = require('./cmd.js');
    
var cmds = process.argv.slice(2),
    command = new Command();

try{
    command.excute(cmds);
} catch(err){

    utils.log(utils.chalk.red('excute command error\n\tservermock [ command][ param1][ param2]'));
    for(var i in command.commands){
        console.log('servermock ' + i + ' ...');
    }
    console.log('and the ' + utils.chalk.yellow('sm.config') + ' file like this ',
        fs.readFileSync(path.join(__dirname, '../src/sm.config')).toString(),
        'more see https://github.com/shalles/servermock/tree/master readme.md');
}

