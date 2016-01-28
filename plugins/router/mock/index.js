var path = require('path'),
    Mock = require('./lib/mock.js'),
    plugin = {},
    serverConfig;

plugin.excute = function(params){

    return plugin.mock.mockResponse(
            plugin.mock.getMockData(params.urlpathname, params.extname), 
                params.req, params.res, serverConfig);
};

plugin.init = function(config){
    var mockrc = config.mockrc,
        mockpath = config.datapath;

    serverConfig = config.__serverConfig || {};
    config.datapath = path.isAbsolute(mockpath) ? mockpath : path.resolve(process.cwd(), mockpath);
    config.mockrc = path.isAbsolute(mockrc) ? mockrc : path.join(config.datapath, mockrc);
    //config.mock.pagepath = pagepath && (path.isAbsolute(pagepath) ? pagepath: path.resolve(config.mock.datapath, pagepath));

    plugin.mock = new Mock(config);
};

module.exports = plugin;
