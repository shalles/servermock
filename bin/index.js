#!/usr/bin/env node

var fs = require('fs'),
    Command = require('./cmd.js');
    
var cmds = process.argv.slice(2),
    command = new Command();

try{
    command.excute(cmds);
} catch(err){

    utils.log(utils.chalk.red('excute command error'), fs.readFileSync('../src/sm.config'));
}

