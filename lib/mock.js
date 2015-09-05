var fs = require('fs'),
    vm = require('vm'),
    url = require('url'),
    path = require('path'),
    utils = require('./utils.js'),
    mockjs = require('mockjs');

function MockData(opt){
    opt = utils.extend({
        datapath: path.join(process.cwd() + "mock/"),
        mockrc: ".mockrc", //相对mock datapath
        regexurl: { //前面是regex new RegExp()
        }
    }, opt);

    this.init(opt);
}

MockData.prototype = {
    init: function(opt){
        this.mockItems = this.convertRegexURL(opt.datapath, opt.regexurl);
        this.initMockRandom(path.isAbsolute(opt.mockrc)? opt.mockrc : path.join(opt.datapath, opt.mockrc));
    },
    initMockRandom: function(mockrcpath){
        console.log("-------mockrcpath:\n", mockrcpath)
        var mockRandom = fs.existsSync(mockrcpath) ? 
                            JSON.parse(fs.readFileSync(mockrcpath)) : {};

        for(var i in mockRandom){
            var randomData = {}, 
                name = i.toLowerCase(), 
                list = name + 's';
            (function(i, list, name){
                randomData[list] = mockRandom[i];
                randomData[name] = function(data){
                    return this.pick(this[list]);
                }
                console.log(randomData);
                mockjs.Random.extend(randomData);
                console.log("-------Random add:\n", randomData)
            })(i, list, name);
        }
    },
    convertRegexURL: function(mockPath, regexurl){
        var mockItems = {}, j = 0;
        for(var i in regexurl){
            mockItems[j++] = {
                reg: new RegExp(i),
                data: path.join(mockPath, regexurl[i]) 
            }
        }
        return mockItems;
    },
    // @parma url:当前请求的url, 
    // @parma ext:当前请求的后缀，用于过滤一些不需要mock的文件
    // @return {cnt, ext} cnt:mock数据文件的原始内容, ext: mock类型
    getMockData: function(url, ext){
        var cnt, type, mockItems = this.mockItems;
        if(['html', 'js', 'css', 'jpg', 'png', 'gif'].indexOf(ext) === -1){
            for(var i in mockItems){
                var item = mockItems[i];
                if(item.reg.test(url)){
                    cnt = fs.readFileSync(item.data);
                    type = path.extname(item.data).slice(1);
                    break;
                }
            }
        }
        return {cnt: cnt, type: type};
    },
    // mock response 用mock data 响应服务
    mockResponse: function(data, req, res){
        if(!data.cnt) return false;
        // console.log("----------ajax json:\n", data.type);
        switch(data.type){
            case 'mjson': //处理mockjson
                console.log(mockjs.mock(JSON.parse(data.cnt)))
                data.cnt = JSON.stringify(mockjs.mock(JSON.parse(data.cnt)), null, 4);
            case 'json':
                res.writeHead(200, {
                    'Content-Type': utils.MIME['json']
                });
                res.write(data.cnt);
                res.end();
                break;
            case 'js':
                //data = new vm.script(data[0]);
                console.log('----------mock js func:\n', data.cnt.toString());
                vm.runInThisContext('(' + data.cnt + ')')(req, res);
                break;
            default:
                console.log("mock 暂只支持.mjson .json .js文件");
                res.end("mock 暂只支持.mjson .json .js文件");
        }
        return true;
    }

}


module.exports = MockData;