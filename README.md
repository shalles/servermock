# servermock
node static server and mock data

###Install

```
sudo npm install servermock -g  

//启动命令(start)
servermock start

//or use as node module
npm install servermock --save
require('servermock')
```

###Config

sm.config josn file in the project root or start path

```json
{
    "port": 8080,
    "protocol": 'http or https', //https\
    "key": "~/cert/cert.key",
    "cert": "~cert/cert.crt",
    // mock请求
    "mock":{
        "datapath": "mock/",
        "mockrc": ".mockrc", //相对mock datapath
        "regexurl": { //前面是regex new RegExp()
            "/api/mockdata1" : "mockdata.js", //走js 遵循cmd
            "/api/mockdata1" : "mockdata.json", //
            "/api/mockdata" : "mockdata.mjson" //
        }
    },
}
```
**or**

```js
var servermock = require('servermock');
servermock(config); // or use default config
```

###Mock

support mockjson(.mjson) json(.json) function(req, res)(.js)

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

more [ http://mockjs.com/#语法规范 ] (http://mockjs.com/#语法规范)

**.mockrc自定义mockjson随机变量**

除了默认的还提供自定义随机变量(*.mjson)

```json
{
    "MCITY":["北京", "上海", "广州", "深圳", "贵阳", "厦门", "成都"],
    "MNAME": ["shalles", "东阳", "小明", "小梅", "乔治"]
}
```

more [ https://github.com/shalles/servermock/tree/master/test ](https://github.com/shalles/servermock/tree/master/test)
