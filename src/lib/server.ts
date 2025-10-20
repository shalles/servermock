import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import utils from './utils';
import urlencode from 'urlencode';
import websocket from './websocket';
import { ServerConfig } from '../types';

// 代理请求配置接口s
interface ProxyRequestOptions extends http.RequestOptions {
  href?: string;
}

// 代理请求函数
function proxyRequest(opt: ProxyRequestOptions, response: http.ServerResponse, isHttp: boolean): void {
  function cbProxy(res: http.IncomingMessage): void {
    response.writeHead(res.statusCode || 500, res.headers);
    res.on('end', () => {
      utils.log(utils.chalk.green(opt.href || ''), ' ', res.statusCode);
    });
    
    res.pipe(response);
  }
  
  const request = isHttp ? http.request : https.request;
  request(opt, cbProxy)
    .on('error', (e: Error) => {
      utils.log(utils.chalk.red(`error to connect: ${opt.href}`));
      response.end(`error to connect: ${opt.href}`);
    })
    .end();
}

// 服务器主函数
function server(config: ServerConfig, buildPath: string, plugins: any): http.Server {
  let serverWWW: http.Server | https.Server;
  
  // 应用处理函数
  function app(req: http.IncomingMessage, res: http.ServerResponse): void {
    const reqUrl = url.parse(req.url || '');
    
    // 代理处理
    if (config.proxy && reqUrl.hostname && reqUrl.hostname !== config.hostname) {
      // 不需要给 url 对象添加 headers 属性，直接在代理请求时传递
      switch (reqUrl.protocol) {
        case 'http:':
        case 'https:':
          proxyRequest(reqUrl as ProxyRequestOptions, res, reqUrl.protocol === 'http:');
          break;
        default:
          break;
      }
      return;
    }
    
    // 路径处理
    const pathname = path.join(buildPath, reqUrl.pathname || '');
    const extname = path.extname(pathname).slice(1);
    const decodedPathname = urlencode.decode(pathname);
    
    // 插件路由处理
    const routerResult = plugins.excute('router', {
      res,
      req,
      urlpathname: reqUrl.pathname || '',
      pathname: decodedPathname,
      extname
    });
    
    if (!routerResult) {
      // 规范化路径
      const normalizedPath = decodedPathname[decodedPathname.length - 1] === '/' 
        ? decodedPathname.slice(0, -1) 
        : decodedPathname;
      
      config.log && console.log(utils.chalk.green(normalizedPath));
      
      // 检查文件是否存在
      const exists = fs.existsSync(normalizedPath);
      if (exists) {
        const fdStat = fs.statSync(normalizedPath);
        
        // 目录处理
        if (fdStat.isDirectory()) {
          fs.readdir(normalizedPath, (err, files) => {
            if (err) {
              utils.log(utils.chalk.red(String(err)));
                res.end('load error');
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            
            let html = '';
            for (const file of files) {
              const stat = fs.statSync(path.resolve(normalizedPath, file));
              const isFolder = stat.isDirectory();
              const href = file + (isFolder ? '/' : '');
              html += `<li><span>${utils.timeFormat(stat.mtime)}</span><a href="${href}" class="iconfont${isFolder ? ' folder' : ''}">${file}</a></li>`;
            }
            
            res.end(utils.renderPage('../../src/folder.html', { filelist: html }));
          });
        } else {
          // 文件处理
          fs.readFile(normalizedPath, 'binary', (err, fileContent) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end(err.message);
              return;
            }
            
            const contentType = utils.MIME[extname] || 'text/plain';
            res.writeHead(200, { 'Content-Type': contentType });
            
            // 插件内容处理
            const processedContent = plugins.excute('content', {
              cnt: fileContent,
              stat: fdStat,
              ext: extname,
              filepath: normalizedPath
            });
            
            res.write(processedContent || fileContent, 'binary');
            res.end();
          });
        }
      } else {
        // 404 处理
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(utils.renderPage('../../src/404.html', normalizedPath));
      }
    }
  }
  
  // 根据协议创建服务器
  const protocol = config.protocol?.toLowerCase() || 'http';
  if (protocol === 'https') {
    try {
      if (!config.key || !config.cert) {
        throw new Error('启动https需要key和cert证书');
      }
      
      const opt = {
        key: fs.readFileSync(config.key),
        cert: fs.readFileSync(config.cert)
      };
      
      serverWWW = https.createServer(opt, app);
    } catch (err) {
      utils.log(utils.chalk.red('启动https需要key和cert证书'), err);
      // 降级到HTTP
      serverWWW = http.createServer(app);
    }
  } else if (protocol === 'socket') {
    // Socket模式
    require('./socket')(config);
    serverWWW = http.createServer(app);
  } else {
    // 默认HTTP模式
    serverWWW = http.createServer(app);
  }
  
  // 服务器监听事件
  serverWWW.on('listening', () => {
    utils.log(utils.chalk.green('server服务已启动, 按' + utils.chalk.yellow(' ctrl+c ') + '退出服务'));
    
    if (config.main) {
      const command = `open http://${config.hostname}:${config.port}${config.main}`;
      utils.excute(command, (stdout, stderr) => {
        utils.log(utils.chalk.green('auto ') + utils.chalk.yellow(command), '');
      });
    } else {
      utils.log(
        utils.chalk.green(`启动port: ${config.port}`), 
        '\n请在浏览器中打开',
        utils.chalk.yellow(` http://${config.hostname}${config.port == 80 ? '' : (':' + config.port)}`), 
        ' 或',
        utils.chalk.cyan('\n在配置文件sm.config中指定"main"(启动时自动打开的文件)')
      );
    }
  });
  
  // 错误处理
  serverWWW.on('error', (e: NodeJS.ErrnoException) => {
    switch (e.code) {
      case 'EACCES':
        utils.log(utils.chalk.red('权限不足，请使用sudo'));
        break;
      case 'EADDRINUSE':
        utils.log(utils.chalk.cyan(String(config.port || 80)) + utils.chalk.red(' 端口已被占用， 请使用其他端口'));
        break;
      default:
        utils.log(utils.chalk.red(`服务器启动错误: ${e}`));
    }
    process.exit(1);
  });
  
  // WebSocket支持
  if (config.websocket?.open) {
    websocket(serverWWW, config.websocket, plugins, config.hostname || 'localhost', config.port || 80);
  }
  
  // 开始监听
  return serverWWW.listen(config.port || 80, config.hostname === 'localhost' ? undefined : config.hostname);
}

export default server;