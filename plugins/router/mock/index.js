var mock;

var Mock = function(param){
    var config = param.config;

    return !mock.mockResponse(mock.getMockData(pathname, extname), req, res, config)
}

Mock.init = function(config){
    var mockpath = config.mock.datapath,
        mockrc = config.mock.mockrc;
        
    config.mock.datapath = path.isAbsolute(mockpath) ? mockpath : path.resolve(buildPath, mockpath);
    config.mock.mockrc = path.isAbsolute(mockrc) ? mockrc : path.join(config.mock.datapath, mockrc);
    //config.mock.pagepath = pagepath && (path.isAbsolute(pagepath) ? pagepath: path.resolve(config.mock.datapath, pagepath));

    var mock = new Mock(param.mock);
}

module.exports = Mock;