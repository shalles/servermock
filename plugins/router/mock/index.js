var path = require('path'),
    Mock = require('./lib/mock.js'),
    plugin = {};

plugin.excute = function(params){

    return plugin.mock.mockResponse(
            plugin.mock.getMockData(params.pathname, params.extname), 
                params.req, params.res, params.config);
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