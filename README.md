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

**.mjson**

```js

```

**.mockrc**

```json
{
    "MCITY":["北京", "上海", "广州", "深圳", "贵阳", "厦门", "成都"],
    "MNAME": ["shalles", "东阳", "小明", "小梅", "乔治"]
}
```

detail look [  ]()
