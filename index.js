var fs = require('fs'),
    path = require('path'),
    utils = require('./lib/utils.js'),
    server = require('./lib/server.js');

var buildPath = process.cwd();
    

function servermock(config){
    var dft = {
        port: 80,
        protocol: 'http', //https\
        // key: "~/cert/cert.key",
        // cert: "~cert/cert.crt",
        "main": "",
        // mock请求
        mock:{
            datapath: "mock/",
            pagepath: "", //page mock data path, default same as page file with .json or ,mjson
            mockrc: ".mockrc", //相对mock datapath
            //ignore: [],
            regexurl: { //前面是regex new RegExp()
                // "/api/placesuggestion" : "placesuggestion.js", //走js 遵循cmd
                // "/api/placesuggestion" : "placesuggestion.json", //
                // "/api/placesuggestion" : "placesuggestion.mjson" //
            }
        },
    };

    config = utils.extend(true, dft, config);

    var mockpath = config.mock.datapath,
        pagepath = config.mock.pagepath,
        mockrc = config.mock.mockrc;

    config.mock.datapath = path.isAbsolute(mockpath) ? mockpath : path.resolve(buildPath, mockpath);
    config.mock.mockrc = path.isAbsolute(mockrc) ? mockrc : path.join(config.mock.datapath, mockrc);
    config.main = config.main[0] !== '\/' ? '\/' + config.main : config.main;
    config.mock.pagepath = pagepath && (path.isAbsolute(pagepath) ? pagepath: path.resolve(config.mock.datapath, pagepath));
    // console.log("-------mockrc\n", config.mock.datapath, '\n', mockrc, '\n', path.join(config.mock.datapath, mockrc));
    server(config);
}

module.exports = servermock;