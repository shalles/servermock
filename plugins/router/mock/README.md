## Mock

### Directory

`sm.config` 中配置

```js
{
    plugins[{
        "name": "mock",
        "open": true,
        "param": {
            "datapath": "mock/",    // 相对于sm.config所在目录 可用绝对路径
            "mockrc": ".mockrc",    // 相对mock datapath 可用绝对路径
            "ignore": ["html", "jpg", "png", "gif"], // mock检测忽略的文件扩展
            "regexurl": {           //前面是regex new RegExp()正则匹配请求的url
                "api/mockdata.do": "mockdata.mjson",
                "/api/mockdatafile1.do" : "mockdatafile.js", //走js 遵循cmd
                "/api/mockdatafile2.do" : "mockdatafile.json", //
                "/api/mockdatafile3" : "mockdatafile.mjson" //
            }
        }
    }]
}
```

路径相对于启动servermock start的目录
--mock/ <br>
----.mockrc <br>
----mockdata.js <br>
----mockdata.json <br>
----mockdata.mjson <br>
----... <br>
--src <br>
--sm.config <br>

### mock数据文件

提供 mockjson(.mjson)、json(.json)、function(req, res)(.js)三种格式mock

#### .js

```js
function(req, res, require){
    // 提供了下面数据可供更加动态的数据mock

    // req.headers: { 
    //    host: '127.0.0.1:8080',
    //    connection: 'keep-alive',
    //    accept: 'application/json, text/javascript, */*; q=0.01',
    //    'x-requested-with': 'XMLHttpRequest',
    //    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
    //    referer: 'http://127.0.0.1:8080/src/export/pages/app-1.html',
    //    'accept-encoding': 'gzip, deflate, sdch',
    //    'accept-language': 'zh-CN,zh;q=0.8,en;q=0.6,tr;q=0.4,ja;q=0.2',
    //    cookie: '_ga=GA1.1.412069457.1440574551',
    //    'ra-ver': '3.0.7',
    //    'ra-sid': 'D397FW#5-20150603-021623-afsadf-asfew' 
    // }
    // req.method: 'GET',
    // req.parseUrl: { 
    //     protocol: 'http:',
    //     slashes: true,
    //     auth: null,
    //     host: '127.0.0.1:8080',
    //     port: '8080',
    //     hostname: '127.0.0.1',
    //     hash: null,
    //     search: '?city=%E5%8C%97%E4%&query=d',
    //     query: 'city=%E5%8C%97%E4%&query=d',
    //     pathname: '/api/placesuggestion',
    //     path: '/api/placesuggestion?city=%E5%8C%97%E4%&query=d',
    //     href: 'http://127.0.0.1:8080/api/placesuggestion?city=%E5%8C%97%E4%&query=d' 
    //     // = req.queryObj
    //     queryObj:{ 
    //         city: '北京市',
    //         query: 'd' 
    //     }
    // }

    // 对.js .css等重定向等
    // res.statusCode = 302;
    // res.setHeader("Location", "http://127.0.0.1:8088" + req.url);
    // res.end();
    console.log(require('fs'))
    console.log("req:", req);

    var data = {"errno":0,"data":[1,2,3,4,5,6,7,8,'a','b','c','d']};
    data['data'] = data['data'].slice(Math.random(1)*8)
    
    res.end(JSON.stringify(data)); //response.write(); response.end()
}
```

#### .json

```json
{
    "errno": 0,
    "data": [
        {
            "id": 1,
            "name": "shalles"
        },{
            "id": 2,
            "name": "shalles2"
        },{
            "id": 3,
            "name": "shalles3"
        }
    ]
}

```

#### .mjson

```js
{
    "errno": 0,
    "data|1-10": [{
        "uid|0-1000": 1,
        "name": "@MNAME",
        "age|10-99": 0,
        "city": "@MCITY"
    }]
}

```

**mjson的数据生成**<br>
如：<br>

1. `data|1-10` 随机生成 [1, 10]之间的value， value是数组就生成有[1，10]个元素的数组， value是数字(任意) -> [1,10]间的数字， value是字符串 -> [1, 10]个该字符串叠加<br>

2. 随机数组占位符 MNAME 在 .mockrc文件中配置 "MNAME": ["shalles", "东阳", "小明", "小梅", "乔治"]，可与1叠加使用，即有`token|3-3: @MNAME` 数组中给定的元素随机3个组合的字符串<br>

更多语法规范，请参考 [ http://mockjs.com/#语法规范 ] (http://mockjs.com/#语法规范)

**.mockrc自定义mockjson随机变量**

除了默认的还提供自定义随机变量(*.mjson)

```json
{
    "MCITY":["北京", "上海", "广州", "深圳", "贵阳", "厦门", "成都"],
    "MNAME": ["shalles", "东阳", "小明", "小梅", "乔治"]
}
```

### test file

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>servermock test demo</title>
</head>
<body>
    <h2>show servermock server and mock data commond+R or F5 refresh this page</h2>
    <div id="msg"></div>
    <script src="./zepto.min.js"></script>
    <script>
        $.ajax({
            url: '/com/api/mockdata.do',
            dataType: 'json',
            success:function(data){
                if(data['errno'] === 0){
                    msg.innerHTML = JSON.stringify(data["data"]);
                    console.log(data["data"])
                }
            },
            error:function(data){
                alert('error' + JSON.stringify(data));
            }
        })
    </script>
</body>
</html>
```

**[test demo](https://github.com/shalles/servermock/tree/master/test)**