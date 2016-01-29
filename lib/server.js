var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    utils = require('./utils.js'),
    urlcode = require('urlencode'),
    websocket = require('./websocket.js');


function proxyRequest(opt, response, isHttp){
    function cbProxy(res){
        response.writeHead(res.statusCode, res.headers);
        res.on('end', function(){
            utils.log(utils.chalk.green(opt.href), " ", res.statusCode);
        });

        res.pipe(response);
    }
    (isHttp ? http : https)
        .request(opt, cbProxy)
        .on('error', function(e){
            utils.log(utils.chalk.red("error to connect: " + opt.href));
            response.end("error to connect: " + opt.href);
        })
        .end();
}

function server(config, buildPath, plugins) {
    var serverWWW;

    function app(req, res) {
        var reqUrl = url.parse(req.url);
        if(config.proxy && reqUrl.hostname && reqUrl.hostname !== config.hostname){
            reqUrl.headers = req.headers;
            switch(reqUrl.protocol){
                case 'http:':
                case 'https:':
                    proxyRequest(reqUrl, res, reqUrl.protocol === 'http:');
                    break;
                default:
                    break;
            }
            return;
        }
        var pathname = path.join(buildPath, reqUrl.pathname),
            extname = path.extname(pathname).slice(1);
        pathname = urlcode.decode(pathname);

        var router = plugins.excute('router', {
            res: res,
            req: req,
            urlpathname: reqUrl.pathname,
            pathname: pathname,
            extname: extname
        });

        if(!router){

            pathname = (pathname[pathname.length - 1] === '\/') ? pathname.slice(0, -1) : pathname;
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
                            var stat = fs.statSync(path.resolve(pathname,files[i]));
                            var isFolder = stat.isDirectory();
                            var href = files[i] + (isFolder ? "/": "");
                            html += '<li><span>' + utils.timeFormat(stat.mtime) + '</span><a href="' + href +
                                     '" class="iconfont' + (isFolder ? ' folder' : '') + '">' + files[i] + '</a></li>';
                        }
                        // console.log('-------------files:\n', html);
                        res.end(utils.renderPage('../src/folder.html', {filelist: html}));
                    });
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
                    });
                }
            } else {
                res.writeHead(404, {'Content-Type': 'text/html'});

                res.end(utils.renderPage('../src/404.html', pathname));
            }
        }
    }

    var protocol = config.protocol.toLowerCase();
    // https 需要证书
    if (protocol === 'https') {
        try{
            var opt = {
                key: fs.readFileSync(config.key),
                cert: fs.readFileSync(config.cert)
            };

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
        utils.log(utils.chalk.green('server服务已启动, 按' + utils.chalk.yellow(' ctrl+c ') + '退出服务'));
        if(config.main){
            var command = 'open http://' + config.hostname + ':' + config.port + config.main;
            utils.excute(command, function (stdout, stderr) {
               utils.log(utils.chalk.green('auto ') + utils.chalk.yellow(command),'');
            });
        }else{
            utils.log(utils.chalk.green('启动port: ' + config.port), '\n请在浏览器中打开',
                    utils.chalk.yellow(' http://' + config.hostname + (config.port == 80 ? '': (':' + config.port))), ' 或',
                    utils.chalk.cyan('\n在配置文件sm.config中指定"main"(启动时自动打开的文件)'));
        }
            
    });
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
