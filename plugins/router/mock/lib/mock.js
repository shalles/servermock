var fs = require('fs'),
    vm = require('vm'),
    qs = require('querystring'),
    url = require('url'),
    path = require('path'),
    mockjs = require('mockjs'),
    utils;

function MockData(opt){
    utils = opt.__utils;
    opt = utils.extend(true, {
        datapath: path.join(process.cwd() + "mock/"),
        mockrc: ".mockrc", //相对mock datapath
        ignore: ['html', 'js', 'css', 'jpg', 'png', 'gif'],
        regexurl: { //前面是regex new RegExp()
        }
    }, opt);

    this.init(opt);
}

MockData.prototype = {
    init: function(opt){        
        this.ignore = opt.ignore;
        this.mockItems = this.convertRegexURL(opt.datapath, opt.regexurl);
        this.initMockRandom(path.isAbsolute(opt.mockrc)? opt.mockrc : path.join(opt.datapath, opt.mockrc));
    },
    initMockRandom: function(mockrcpath){
        utils.log(utils.chalk.green("plugin-mock mockrcpath:\n"), mockrcpath)
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
                
                mockjs.Random.extend(randomData);
                utils.log(utils.chalk.green("plugin-mock Random add:\n"), randomData)
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
        if(this.ignore.indexOf(ext) === -1){
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
    getMockJsonData: function(json){
        return mockjs.mock(json);
    },
    // mock response 用mock data 响应服务
    mockResponse: function(data, req, res, servConfig){
        if(!data.cnt) return false;
        // utils.log(utils.chalk.green("----------ajax json:\n", data.type));
        try{
            switch(data.type){
                case 'mjson': //处理mockjson
                    //utils.log(utils.chalk.green(mockjs.mock(JSON.parse(data.cnt))))
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
                    // 将分解好的url给mock用户*.js 
                    // 只能拦截所起服务下的mock 跨域的不能拦截需用fiddler或charles之类的代理到servermock所起服务下
                    req.wwwurl = url.parse(servConfig.protocol + '://' + req.headers.host + req.url);
                    var qstr = req.wwwurl.query ? qs.parse(req.wwwurl.query) : {},
                        query = {};
                    for(var i in qstr){
                        var $ = /(.+)\[(.+)\]/.exec(i);
                        // utils.log(utils.chalk.green("$: ", $));
                        $ ? (query[$[1]] || (query[$[1]] = {})) && (query[$[1]][$[2]] = qstr[i]):
                            query[i] = qstr[i];  
                    }
                    // utils.log(utils.chalk.green("qstr: ", qstr));
                    //extname === 'html' && utils.log(utils.chalk.green(req, '\n\n\n\n', req.wwwurl))
                    req.wwwurl.queryObj = query;
                    //utils.log(utils.chalk.green('----------mock js func:\n', data.cnt.toString()));
                    vm.runInThisContext('(' + data.cnt + ')')(req, res);
                    break;
                default:
                    utils.log(utils.chalk.yellow("mock 暂只支持.mjson .json .js文件"));
                    res.end("mock 暂只支持.mjson .json .js文件");
            }
        } catch(e){
            utils.log(utils.chalk.red("mock error: "), e);
        }
        return true;
    }

}

module.exports = MockData;