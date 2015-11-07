var path = require('path'),
    Mock = require('./lib/mock.js'),
    plugin = {};

plugin.excute = function(param){

    return plugin.mock.mockResponse(
            plugin.mock.getMockData(param.pathname, param.extname), 
                param.req, param.res, param.config);
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