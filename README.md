# servermock
node static server and mock data

### Install

```
sudo npm install servermock -g  

//启动命令(start)
servermock start

//or use as node module
npm install servermock --save
require('servermock')
```

### Config

sm.config josn file in the project root or start path

```json
{
    "port": 8080,
    "protocol": "http", //https
    "key": "~/cert/cert.key",
    "cert": "~cert/cert.crt",
    // mock请求
    "mock":{
        "datapath": "mock/",
        "mockrc": ".mockrc", //如果不是绝对路径则相对mock datapath
        "regexurl": { //前面是regex new RegExp()
            "/api/mockdata1" : "mockdata.js", //走js 遵循cmd
            "/api/mockdata1" : "mockdata.json", //json数据返回
            "/api/mockdata" : "mockdata.mjson" //mockjson数据返回
        }
    },
}
```
sm.config标准json  使用时去掉文件中去掉注释

the file is standard json widthout comment <br>
protocol: http/https <br>
when https you should give the value of key and cert

mock.datapath is the mock data root <br>
mock.regexurl{name:value} <br>
name: match mock url, support regex <br>
value: match data file path relative datapath



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
    console.log("req:", req);
    console.log("res:", res);
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

### more please look the test demo 

[ https://github.com/shalles/servermock/tree/master/test ](https://github.com/shalles/servermock/tree/master/test)
