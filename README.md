# servermock

## Install

```shell
$ sudo npm install servermock -g

```
** or **

```shell
# as a node_module like require('servermock')(config)
$ npm install servermock -save //--save-dev

```

## Usage

** start servermock **

```shell
$ servermock start # or sm start
# params(you can config your sm.config):
# -p 8089（port）
# -i index.html (auto start the index.html page use your default browser)
# -n auto (auto fetch your wifi or wlan ip)
# @p synctest (synctest is the plugin name)

```

** servermock init **

```shell
$ servermock init  # or sm init
# init will generate a sm.config file in current path

```

** servermock plugin **

```shell
$ servermock plugin # or sm plugin
# params
# [intall | delete] | [-i | -d] [git repository]
servermock plugin intall https://github.com/shalles/synctest.git
# or
servermock plugin -i https://github.com/shalles/synctest.git

```

## Config

start root path/sm.config

```js
{
    "port": 8080, // start port default 80 unix need sudo
    "hostname": "0.0.0.0", // if set '0.0.0.0' auto fecth IPv4
    "protocol": "http", //https
    //"key": "~/cert/cert.key", // if protocol set to https
    //"cert": "~cert/cert.crt", // if protocol set to https
    "main": "./index.html", // auto start the index.html page use your default browser. default do nothing
    // plugins 
    "plugins":[{
        "name": "mock",
        "open": true,
        "param": {
            "datapath": "mock/", // default process.cwd()/mock/
            "mockrc": ".mockrc", // relative to mock datapath. certainly, you can use absolute path. default process.cwd()/mock/.mockrc
            "ignore": ["html", "jpg", "png", "gif"], // ignore file extname
            "acao": true, //Access-Control-Allow-Origin default:true
            "regexurl": { //patch mock url to local mock file.  support regular expression, use new RegExp(path)
                "com/api/mockdata.do": "mockdata.mjson",
                "/static/webapp/src/": "filemock.js",
                "/api/1placesuggestion" : "placesuggestion.js", //走js 遵循cmd
                "/api/1placesuggestion" : "placesuggestion.json", //
                "/api/placesuggestion" : "placesuggestion.mjson" //
            }
        }
    },{
        "name": "pagemock",
        "open": true,
        "param": {
            "basepath": "mock/page", //"", //default: same path with page
            "mockrc": "../.mockrc", // relative to mock basepath. certainly, you can use absolute path or share same .mockrc file with plugin mock such process.cwd()/mock/.mockrc
            "acceptExts": ["php", "html", "vm"] //listen page extname
        }
    },{
        // need install, such servermock plugin -i https://github.com/shalles/synctest.git
        // synchronous the operation with multiple instances in different devices
        "name": "synctest", 
        "open": true,
        "param": {
            //vpn: "192.168.1.6",
            "exts": ["html", "php", "vm"]
        }
    }]
}
```

1. `sm.config` support simple comments "//";<br>
2. plugin on/off free;<br>
3. `protocol`:启动server服务的协议支持`http/https`， 当为https是需要传入key和cert两个证书文件;<br>
4. main提供的话会在start的时候`启动浏览器打开服务`，不提供则不打开;

更多配置使用请看对应插件 

[ **mock readme** ](https://github.com/shalles/servermock/blob/master/plugins/router/mock/README.md)   

[ **pagemock readme** ](https://github.com/shalles/servermock/blob/master/plugins/content/pagemock/README.md)    

[ **synctest readme** ](https://github.com/shalles/synctest/blob/master/README.md)

#### webpack(dev-server)中使用Demo

```js
// 在dev-server启动后或之前加入
config.mock = {
    port: 8880, // 启动端口 默认80 unix系需要sudo
    hostname: 'localhost', // 当为0.0.0.0时自动获取当前IPv4
    protocol: 'http',
    plugins: [{
      name: 'mock',
      open: true,
      param: {
        datapath: 'mock/',
        mockrc: '.mockrc', // 相对mock datapath 可用绝对路径
        regexurl: {
          'api/getabc': 'getabc.js',
          'api/getabc2': 'getabc2.json',
          'api/getabc3': 'getabc3.mjson',
        }
      }
    }]
}
require('servermock')(config.mock)

// 配置代理
proxyTable: {
  "/api": {
    target: "http://localhost:8880", // 指向mock的server
    pathRewrite: {"^/api" : ""},
    changeOrigin: true,
    secure: false
  },
}

// 对应目录
// getabc.js -> 项目启动目录/mock/getabc.js


```

## Plugin

#### 插件安装/删除

```js
//安装删除插件
servermock plugin [intall | delete] | [-i | -d] [git repository]
//如:
servermock plugin intall https://github.com/shalles/synctest.git
//或
servermock plugin -i https://github.com/shalles/synctest.git
```

#### Plugin List

1. [ **mock配置请参考**](https://github.com/shalles/servermock/blob/master/plugins/router/mock/README.md)  `default`<br>
2. [ **pagemock配置请参考** ](https://github.com/shalles/servermock/blob/master/plugins/content/pagemock/README.md)  `default`<br>
3. [ **synctest配置请参考** ](https://github.com/shalles/synctest/blob/master/README.md)  `need install`<br>
4. ...

#### How To

1. 主要实现两个方法`init` 和 `excute`;<br>
2. init的时候可以拿到用户配置sm.config中serverConfig的一些配置和servermock [utils.js](https://github.com/shalles/servermock/blob/master/lib/utils.js)提供的一些使用方法具体可以看源码，虽然写的很差但会慢慢优化。 主要提倡用utils.log; <br>
3. 目前提供了两个插件口`content`和`router` 并在excute的时候提供不同的参数和返回值;<br>
4. 在`package.json`中配置需要servermock提供的支持;

**如下以synctest为例**

synctest的主要实现原理 <br>   
1. 监听页面的事件->编辑事件信息;<br>
2. 用servermock提供的websocket功能将编辑的事件信息广播到链接的其他设备的打开的页面监听client端;<br>
3. 在接收到事件信息后解析并重构事件;<br>
4. 触发该事件;<br>
5. 循环

a）. 要在页面监听事件就需要向servermock启动的服务的页面文件中插入脚本，在servemock中属于content类插件即如下package.json中`"type"`为`"content"`;<br>
b）. 需要用到servermock的websocket功能则需要配置websocket的信息这是正对servermock配置的，且高于默认配置，低于用户配置;<br>
c）. 注意:servermock以文件的目录名位插件名，主目录下必须包含主文件`index.js`和`package.json`, package.json与node同用，插件使用node module加载 因此写起来和node语法无异

**package.json**

```js
    "servermock": {
        "type": "content",
        //"startbasepath": "./", 需要使用启动命令的插件  如 servermock start -p 8800 @p transport
        "websocket": {
            "open": true,
            "maxsize": 10240,
            "encoding": "utf8",
            "originReg": "",
            "sameOrigin": true,
            "broadcast": true,
            "mTm": false
        }
    },
```

**index.js**

```js
var utils,
    origin,
    protocol,
    acceptExtname,
    plugin = {},
    path = require('path');

plugin.excute = function (params){
    
    if(utils.inArray(params.ext, acceptExtname)){
        utils.log('[synctest loading]');
        // do something
        return params.cnt;
    }
}

plugin.init = function(config){
    var serverConfig = config.__serverConfig; // sm.config中的部分配置信息
    
    utils = config.__utils; //utils.js
    acceptExtname = config.exts || ['html', 'htm'];
    origin = (config.vpn || serverConfig.hostname) + ":" + serverConfig.port;
    protocol = serverConfig.protocol

    /* 使用@p 插件启动参数的插件可能需要传入一些参数
    return {
        dirname: __dirname
    }
    */
}

module.exports = plugin;
```


**content 与 router下 config**

两个类型的插件在init提供相同的config参数，即`__utils`, `__serverConfig`;

**content下的params**

```js
//当前请求
plugins.excute('router', {
    res: res,           //response mock插件拦截匹配的req，然后res返回mock数据
    req: req,           //request
    pathname: pathname, //请求的文件路径
    extname: extname    //请求的文件扩展
});
```

**router下的params**

```js
// 当前请求
plugins.excute('content', {
    cnt: fileContent,   // 请求匹配文件内容
    stat: fdStat,       // 请求匹配文件的stat信息
    ext: extname,       // 请求匹配文件的扩展
    filepath: pathname  // 请求匹配文件的物理路径
})
```

**目录结构**

[详情参考实例synctest](https://github.com/shalles/synctest)

**[more see the test demo](https://github.com/shalles/servermock/tree/master/test)**
