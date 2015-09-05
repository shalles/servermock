var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    Mock = require('./mock.js'),
    utils = require('./utils.js'),
    exec = require('child_process').exec;

function server(config) {
    var serverWWW,
        buildPath = process.cwd();

    var mock = new Mock(config.mock);

    function app(req, res) {
        var pathname = path.join(buildPath, url.parse(req.url).pathname),
            extname = path.extname(pathname).slice(1);

        if(!mock.mockResponse(mock.getMockData(pathname, extname), req, res)){
            // console.log("---------come in");

            pathname[pathname.length - 1] === '\/' && (pathname = pathname.slice(0, -1));
            console.log(pathname);

            var stats = fs.statSync(pathname);
            // 返回样式自定义目录
            if(stats.isDirectory()){
                fs.readdir(pathname, function(err, files){
                    if(err){
                        console.log(err);
                        res.end('load error', err);
                        return;
                    }
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ServerMock</title><style>body{text-align:center;} a{float:left; width:200px; height:30px; text-align:left; color:#f60;line-height: 30px;} a:hover{text-shadow: 8px 2px 5px;} .folder{color:#6f0;}</style></head><body><h1 style="box-shadow: #999 1px 1px 20px;">servermock</h1><div style="padding-left:10%; box-shadow: #ddd 1px 1px 20px; overflow:hidden;"><a style="color: #06f;" href="../">后退</a>';
                    for(var i = 0, len = files.length; i < len; i++){
                        console.log("files[", i, "]: ", files[i])
                        var isFolder = fs.statSync(path.resolve(pathname,files[i])).isDirectory();
                        var href = files[i] + (isFolder ? "/": "");
                        html += '<a href="' + href + (isFolder ? '" class="folder"' : '') + '">' + files[i] + '</a>'
                    }
                    html += "</div></body></html>";
                    // console.log('-------------files:\n', html);
                    res.end(html);
                })
            }else{
                fs.exists(pathname, function(exists) {
                    if (exists) {

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

                                res.write(file, 'binary');
                                res.end();
                            }

                        })
                    } else {
                        res.writeHead(404, {'Content-Type': 'text/plain'});
                        res.write("404 找不到文件： " + pathname);

                        res.end();
                    }
                })
            }
        }
    }
    // https 需要证书
    if (config.protocol.toLowerCase === 'https') {
        var opt = {
            key: fs.readFileSync(config.key),
            cert: fs.readFileSync(config.cert)
        }

        serverWWW = https.createServer(opt, app);
    }
    // default http
    else {
        serverWWW = http.createServer(app);
    }
    serverWWW.on("listening", function() {
        console.log("server服务已启动, 按ctrl+c退出服务")
        exec('open http://127.0.0.1:' + config.port, function (error, stdout, stderr) {
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

    return serverWWW.listen(config.port);
}

module.exports = server;
