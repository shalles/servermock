var path = require('path'),
    Mock = require('./lib/mock.js'),
    plugin = {};

plugin.excute = function(param){
    var config = param.config;

    return !plugin.mock.mockResponse(
            mock.getMockData(param.pathname, param.extname), 
                param.req, param.res, config);
}

plugin.init = function(config){
    var mockrc = config.mockrc,
        mockpath = config.datapath;
        
    config.datapath = path.isAbsolute(mockpath) ? mockpath : path.resolve(process.cwd(), mockpath);
    config.mockrc = path.isAbsolute(mockrc) ? mockrc : path.join(config.datapath, mockrc);
    //config.mock.pagepath = pagepath && (path.isAbsolute(pagepath) ? pagepath: path.resolve(config.mock.datapath, pagepath));

    plugin.mock = new Mock(config);
}

module.exports = plugin;