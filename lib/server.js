var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    utils = require('./utils.js'),
    urlcode = require('urlencode'),
    websocket = require('./websocket.js'),
    exec = require('child_process').exec;

function server(config, plugins) {
    var serverWWW,
        buildPath = process.cwd();

    function app(req, res) {
        var pathname = path.join(buildPath, url.parse(req.url).pathname),
            extname = path.extname(pathname).slice(1);
        pathname = urlcode.decode(pathname);

        var router = plugins.excute('router', {
            res: res,
            req: req,
            pathname: pathname,
            extname: extname
        });

        if(!router){
            // console.log("---------come in");

            pathname[pathname.length - 1] === '\/' && (pathname = pathname.slice(0, -1));
            console.log(utils.chalk.green(pathname));

            var exists = fs.existsSync(pathname);
            if (exists) {

                var fdStat = fs.statSync(pathname);
                // 返回样式自定义目录
                if(fdStat.isDirectory()){
                    fs.readdir(pathname, function(err, files){
                        if(err){
                            utils.log(utils.chalk.red(err));
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
                    fs.readFile(pathname, 'binary', function(err, fileContent) {

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

                            // 容错在plugins中实现
                            fileContent = plugins.excute('content', {
                                cnt: fileContent, 
                                stat: fdStat, 
                                ext: extname, 
                                filepath: pathname
                            }) || fileContent;

                            res.write(fileContent, 'binary');
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

    var protocol = config.protocol.toLowerCase;
    // https 需要证书
    if (protocol === 'https') {
        try{
            var opt = {
                key: fs.readFileSync(config.key),
                cert: fs.readFileSync(config.cert)
            }

            serverWWW = https.createServer(opt, app);
        } catch(err){
            utils.log(utils.chalk.red("启动https需要key和cert证书"), err);
        }
    }
    else if(protocol === 'socket'){
        require('./socket.js')(config);
    }
    // default http
    else {
        serverWWW = http.createServer(app);
    }
    serverWWW.on("listening", function() {
        utils.log(utils.chalk.green("server服务已启动, 按ctrl+c退出服务"));
        var command = 'open http://' + config.hostname + ':' + config.port + config.main;
        config.main && exec(command, function (error, stdout, stderr) {
           console.log(stdout);
           utils.log(utils.chalk.yellow(command));
        });
    })
    serverWWW.on('error', function(e) {
        switch (e.code) {
            case 'EACCES':
                utils.log(utils.chalk.red("权限不足，请使用sudo"));
                break;
            case 'EADDRINUSE':
                utils.log(utils.chalk.cyan(config.port) + utils.chalk.red(" 端口已被占用， 请使用其他端口"));
                break;
        }
        process.exit(1);
    });

    // websocket
    if(config.websocket.open){
        websocket(serverWWW, config.websocket, plugins, config.hostname, config.port);
    }

    return serverWWW.listen(config.port, (config.hostname === "127.0.0.1"? "": config.hostname));
}

module.exports = server;
