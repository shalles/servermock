import * as net from 'net';
import utils from './utils';
import { ServerConfig } from '../types';

function socket(config: ServerConfig): net.Server {
  const server = net.createServer((socket) => {
    // 客户端连接
    utils.log(utils.chalk.green(`客户端已连接: ${socket.remoteAddress}:${socket.remotePort}`));
    
    // 发送欢迎消息
    socket.write('欢迎连接到Socket服务器\r\n');
    
    // 处理数据接收
    socket.on('data', (data) => {
      const message = data.toString().trim();
      utils.log(utils.chalk.green(`收到数据: ${message}`));
      
      // 简单回显
      socket.write(`服务器收到: ${message}\r\n`);
      
      // 退出命令
      if (message.toLowerCase() === 'exit') {
        socket.write('再见!\r\n');
        socket.end();
      }
    });
    
    // 处理连接关闭
    socket.on('end', () => {
      utils.log(utils.chalk.yellow(`客户端已断开连接`));
    });
    
    // 处理错误
    socket.on('error', (err) => {
      utils.log(utils.chalk.red(`Socket错误: ${err.message}`));
    });
  });
  
  // 服务器监听
  server.listen(config.port, config.hostname, () => {
    utils.log(utils.chalk.green(`Socket服务器已启动，监听端口: ${config.port}`));
    utils.log(utils.chalk.green(`可以使用 telnet ${config.hostname} ${config.port} 进行连接`));
  });
  
  // 服务器错误
  server.on('error', (err) => {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'EADDRINUSE') {
      utils.log(utils.chalk.red(`端口 ${config.port} 已被占用`));
    } else if (error.code === 'EACCES') {
      utils.log(utils.chalk.red('权限不足，请使用sudo'));
    } else {
      utils.log(utils.chalk.red(`服务器错误: ${err.message}`));
    }
    process.exit(1);
  });
  
  return server;
}

export default socket;