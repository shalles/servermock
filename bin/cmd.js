#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    servermock = require('../index.js');

var cmd = process.argv[2],
    cwd = process.cwd();

if(cmd == 'start'){
    var config,
        configPath = path.join(cwd, 'sm.config');

    config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath)): {};
    console.log('--------------------servermock start-------------------\n',
                '===config===\n', 
                config);

    servermock(config);
} else {
    console.log('--------------------servermock-------------------\n',
                '$ servermock start 启动\n', 
                'git: https://github.com/shalles/servermock/\n',
                '===配置文件===build path下.smrc文件, 格式如下:\n', 
                {
                    "port": 8080,
                    "protocol": "http or https", //https\
                    "key": "~/cert/cert.key",
                    "cert": "~cert/cert.crt",
                    // mock请求
                    "mock":{
                        "datapath": "mock/",
                        "mockrc": ".mockrc", //相对mock datapath
                        "regexurl": { //前面是regex new RegExp()
                            "/api/placesuggestion" : "placesuggestion.js", //走js 遵循cmd
                            "/api/placesuggestion" : "placesuggestion.json", //
                            "/api/placesuggestion" : "placesuggestion.mjson" //
                        }
                    },
                });
}
