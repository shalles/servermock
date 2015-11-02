var mock;

var Mock = function(param){
    var config = param.config;

    return !mock.mockResponse(mock.getMockData(pathname, extname), req, res, config)
}

Mock.init = function(config){
    var mock = new Mock(param.mock);
}

module.exports = Mock;