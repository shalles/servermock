var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    Mock = require('./mock.js'),
    utils = require('./utils.js'),
    exec = require('child_process').exec,
    plugin = require('./plugin.js');

function server(config) {
    var serverWWW,
        buildPath = process.cwd();

    var mock = new Mock(config.mock);

    function app(req, res) {
        var pathname = path.join(buildPath, url.parse(req.url).pathname),
            extname = path.extname(pathname).slice(1);

        if(!mock.mockResponse(mock.getMockData(pathname, extname), req, res, config)){
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

                            file = plugin.excute('fileContent', {
                                cnt: file, 
                                stat: fdStat, 
                                ext: extname, 
                                filepath: pathname,
                                mockpath: config.mock.pagepath,
                                getMockJsonData: mock.getMockJsonData
                            }) || file;

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
        exec('open http://127.0.0.1:' + config.port + config.main, function (error, stdout, stderr) {
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
