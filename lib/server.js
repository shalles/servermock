var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    utils = require('./utils.js'),
    urlcode = require('urlencode'),
    websocket = require('./websocket.js'),
    exec = require('child_process').exec,
    plugins = require('./plugin.js');

function server(config) {
    var serverWWW,
        buildPath = process.cwd();

    // 注册并初始化插件配置
    plugins.init(config.plugins);

    function app(req, res) {
        var pathname = path.join(buildPath, url.parse(req.url).pathname),
            extname = path.extname(pathname).slice(1);
        pathname = urlcode.decode(pathname);

        var router = plugins.excute('router', {
            config: config,
            res: res,
            req: req,
            pathname: pathname,
            extname: extname
        });

        if(!router){
            // console.log("---------come in");

            pathname[pathname.length - 1] === '\/' && (pathname = pathname.slice(0, -1));
            console.log(pathname);

            var exists = fs.existsSync(pathname);
            if (exists) {

                var fdStat = fs.statSync(pathname);
                // 返回样式自定义目录
                if(fdStat.isDirectory()){
                    fs.readdir(pathname, function(err, files){
                        if(err){
                            console.log(err);
                            res.end('load error', err);
                            return;
                        }
                        res.writeHead(200, {'Content-Type': 'text/html'});

                        var html = '';

                        for(var i = 0, len = files.length; i < len; i++){
                            var isFolder = fs.statSync(path.resolve(pathname,files[i])).isDirectory();
                            var href = files[i] + (isFolder ? "/": "");
                            html += '<a href="' + href + (isFolder ? '" class="folder"' : '') + '">' + files[i] + '</a>'
                        }
                        // console.log('-------------files:\n', html);
                        res.end(utils.renderPage('../src/folder.html', {filelist: html}));
                    })
                }else{
                    fs.readFile(pathname, 'binary', function(err, file) {

                        if (err) {
                            res.writeHead(500, {
                                'Content-Type': 'text/plain'
                            });

                            res.end(err);
                        } else {
                            var contentType = utils.MIME[extname];

                            res.writeHead(200, {
                                'Content-Type': contentType
                            });

                            //utils.log('file s', file);
                            try{
                                file = plugins.excute('content', {
                                    cnt: file, 
                                    stat: fdStat, 
                                    ext: extname, 
                                    filepath: pathname,
                                    config: config
                                }) || file;
                            } catch(e){
                                console.log("servermock plugin error: ", e);
                            }
                            //extname === 'html' && utils.log('file', JSON.stringify(file));

                            res.write(file, 'binary');
                            res.end();
                        }
                    })
                }
            } else {
                res.writeHead(404, {'Content-Type': 'text/html'});

                res.end(utils.renderPage('../src/404.html', pathname));
            }
        }
    }

    var protocol = config.protocol.toLowerCase
    // https 需要证书
    if (protocol === 'https') {
        var opt = {
            key: fs.readFileSync(config.key),
            cert: fs.readFileSync(config.cert)
        }

        serverWWW = https.createServer(opt, app);
    }
    else if(protocol === 'socket'){
        require('./socket.js')(config);
    }
    // default http
    else {
        serverWWW = http.createServer(app);
    }
    serverWWW.on("listening", function() {
        console.log("server服务已启动, 按ctrl+c退出服务")
        config.main && exec('open http://' + config.hostname + ':' + config.port + config.main, function (error, stdout, stderr) {
           console.log(stdout);
        });
    })
    serverWWW.on('error', function(e) {
        switch (e.code) {
            case 'EACCES':
                console.log("权限不足，请使用sudo");
                break;
            case 'EADDRINUSE':
                console.log(config.port + " 端口已被占用， 请使用其他端口");
                break;
        }
        process.exit(1);
    });

    // websocket
    if(config.websocket.open){
        websocket(serverWWW, config.websocket, config.hostname, config.port);
    }

    return serverWWW.listen(config.port, (config.hostname === "127.0.0.1"? "": config.hostname));
}

module.exports = server;
