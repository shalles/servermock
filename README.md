# servermock
node static server and mock data

**version `1.1.4`** <br>
增加多设备同步测试功能 

操作一个设备多个设备同步操作事件 

**version `1.1.1`** <br>
支持websocket

**version `1.0.15`** <br>
fix 中文 path

**version `1.0.14`** <br>
增加pagemock data file config

**version `1.0.11`** <br>
+增加插件支持 support plugin <br>
+pagemock plugin <br>
pagemock now support: <br>
most velocity template grammar <br>  
bits of php grammar like

```php
<?php echo is_null($variable)? "": "<em>".$variable. "</em>元"; ?>
<?php  echo $var; ?>
...
```

support most function, variable and bits of logic expression

## Install

```shell
sudo npm install servermock -g  

//启动命令(start)
servermock start

//or use as node module
npm install servermock --save
require('servermock')
```

## Config

sm.config josn file in the project root or start path

```js
{
    "port": 8080,
    "hostname": "0.0.0.0", //default 127.0.0.1 if 0.0.0.0 auto get IPv4
    "protocol": "http", //https
    "key": "~/cert/cert.key", // if https
    "cert": "~cert/cert.crt", // for https
    "websocket": {
        "open": true, //default:false
        "maxsize": 10485760, //10M default: 10M
        "encoding": "utf8", //default: 'utf8'
        "callback": "console.log('outside: ', data); return 'get data ' + data;", //function string
        "originReg": "127.0.0.1", //new RegExp 服务接受原正则匹配 default:""
        "broadcast": true, // 是否广播 default:true
        "mTm": true, //是否广播到自己 default:false
        "synctest": {
            "open": true, //开启多设备同步调试 
            //"vpn": "192.168.1.6", // 默认使用server hostname
            "exts": ["html", "php", "vm"] //需要同步测试的页面扩展
        }
    },
    "main": "index.html", // relative to root such http://127.0.0.1:8080/index.html
    // mock请求
    "mock":{
        "datapath": "mock/",
        "pagepath": "", //page mock data path, default same as page file with .json or .mjson
        "mockrc": ".mockrc", //如果不是绝对路径则相对mock datapath
        "ignore": ["jpg", "png", "gif", "html", "js", "css"], //default value
        "regexurl": { //前面是regex new RegExp()
            "/api/mockdata1" : "mockdata.js", //走js 遵循cmd
            "/api/mockdata1" : "mockdata.json", //json数据返回
            "/api/mockdata" : "mockdata.mjson" //mockjson数据返回
        }
    },
}
```
支持单行注释 多行注释暂不支持
support simple line comments

protocol: http/https <br>
when https you should give the value of key and cert

mock.datapath is the mock data root <br>
mock.pagepath is page mock data path, default same as page file with .json or .mjson extname<br>
mock.regexurl{name:value} <br>
name: match mock url, support regex <br>
value: match data file path relative datapath

**Directory**

builddir or start server directory
--mock/ <br>
----.mockrc <br>
----mockdata.js <br>
----mockdata.json <br>
----mockdata.mjson <br>
----... <br>
--src <br>
--sm.config <br>


**or**

```js
var servermock = require('servermock');
servermock(config); // or use default config
```

### Mock

support mockjson(.mjson) json(.json) function(req, res)(.js)

**.js**


```js
function(req, res){
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
    // req.wwwurl: { 
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
    //     queryObj:{ 
    //         city: '北京市',
    //         query: 'd' 
    //     }
    // }
    // 对.js .css等重定向等
    // res.statusCode = 302;
    // res.setHeader("Location", "http://127.0.0.1:8088" + req.url);
    // res.end();
    console.log("req:", req);
    //console.log("res:", res);
    var data = {"errno":0,"data":[1,2,3,4,5,6,7,8,'a','b','c','d']};
    data['data'] = data['data'].slice(Math.random(1)*8)
    
    res.end(JSON.stringify(data)); //response.write(); response.end()
}
```

**.json**

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

**.mjson**

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
generate<br>
data [1, 10]<br>
uid betoween 0 and 1000<br>
age betoween 10 and 99<br>
random MNAME in .mockrc "MNAME": ["shalles", "东阳", "小明", "小梅", "乔治"]<br>
so name is one of ["shalles", "东阳", "小明", "小梅", "乔治"], so as city

more [ http://mockjs.com/#语法规范 ] (http://mockjs.com/#语法规范)

**.mockrc自定义mockjson随机变量**

除了默认的还提供自定义随机变量(*.mjson)

```json
{
    "MCITY":["北京", "上海", "广州", "深圳", "贵阳", "厦门", "成都"],
    "MNAME": ["shalles", "东阳", "小明", "小梅", "乔治"]
}
```

**test file**

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


## page mock

**Directory**

builddir <br>
... <br>
--pagedir <br>
----page1.php <br>
----page1.json / page1.mjson <br>
----page2.vm <br>
----page2.json / page2.mjson <br>
----... <br>
--... <br>

*such*

page1.php

```php
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PHP page</title>
</head>
<body>
    <div><span>name:</span> <?php $name ?></div>
    <div><span>age:</span> <?php $age; ?></div>
    <?php echo "show your info";?>
    <br>
    <?php echo is_null($show): "default": $show;?>
    <div>
        <?php echo is_null($variable)? "": "<em>".$variable. "</em>元"; ?>
    </div>
</body>
</html>
```
page1.json

```json
{
    "$name": "shalles",
    "$age": 18,
    "show": null
}
```

page1.mjson

```json
{
    "name": "shalles",
    "age|18-20": 18,
    "show|0-1": "I will support php, python, jsp and so on"
}
```

## Plugin

```js
$ mkdir ~/.servermock/plugins
$ cd ~/.servermock/plugins
$ mkdir fc (or ... now just support fc) 
$ cd fc
$ mkdir yourplugin
$ cd yourplugin
$ vim index.js
```
**plugin pagemock**

```js
var fs = require('fs'),
    vm = require('vm'),
    path = require('path'),
    utils = require('../../../lib/utils'),
    php = require('./lib/php.js'),
    vmjs = require('./lib/vm.js');

// console.log("enter into plugin")
module.exports = function(parmas){
    //do something    
    //
    //parms ={
    //    cnt: file, //string
    //    stat: fdStat, //stat
    //    ext: extname, //string such js html
    //    config: config // object
    //    filepath: pathname, //string
    //    mockpath: config.mock, //object
    //    getMockJsonData: mock.getMockJsonData //function parma is mockjson data return common json
    //                                          //such parmas.getMockJsonData(utils.readJson(jsonpath + 'mjson') || {})
    //}
    //return parms.cnt
}
```
plugin example [ https://github.com/shalles/servermock/tree/master/plugins/fc/pagemock ](https://github.com/shalles/servermock/tree/master/plugins/fc/pagemock)

## more look test demo 

[ https://github.com/shalles/servermock/tree/master/test ](https://github.com/shalles/servermock/tree/master/test)
