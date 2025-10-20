import * as WebSocket from 'websocket';
import { Server as HttpServer } from 'http';
import utils from './utils';

interface WebSocketConfig {
  open: boolean;
  port?: number;
  [key: string]: any;
}

interface Plugins {
  excute: (name: string, params: any) => any;
}

// 直接导出函数
export default function websocket(
  server: HttpServer, 
  config: WebSocketConfig, 
  plugins: Plugins, 
  hostname: string, 
  port: number
): void {
  const wsServer = new WebSocket.server({
    httpServer: server,
    autoAcceptConnections: false
  });
  
  // 连接池
  const connections: WebSocket.connection[] = [];
  
  // 检查协议版本
  function originIsAllowed(origin: string): boolean {
    // 这里可以添加更严格的源检查逻辑
    return true;
  }
  
  // 广播消息
  function broadcast(message: string): void {
    for (const connection of connections) {
      connection.sendUTF(message);
    }
  }
  
  // 处理连接请求
  wsServer.on('request', (request: WebSocket.request) => {
    if (!originIsAllowed(request.origin)) {
      request.reject();
      utils.log(utils.chalk.red(`WebSocket连接被拒绝: ${request.origin}`));
      return;
    }
    
    const connection = request.accept('echo-protocol', request.origin);
    connections.push(connection);
    
    utils.log(utils.chalk.green(`WebSocket连接已建立: ${connection.remoteAddress}`));
    
    // 发送欢迎消息
    connection.sendUTF(JSON.stringify({
      type: 'welcome',
      message: '连接成功',
      server: `${hostname}:${port}`
    }));
    
    // 处理消息
    connection.on('message', (message: WebSocket.Message) => {
      if (message.type === 'utf8') {
        utils.log(utils.chalk.green(`收到消息: ${message.utf8Data}`));
        
        // 通过插件处理消息
        const processResult = plugins.excute('wsmsg', {
          data: message.utf8Data
        });
        
        // 广播处理后的消息
        if (processResult) {
          broadcast(processResult);
        } else {
          // 简单回显
          connection.sendUTF(message.utf8Data);
        }
      }
    });
    
    // 处理连接关闭
    connection.on('close', (reasonCode: number, description: string) => {
      // 从连接池中移除
      const index = connections.indexOf(connection);
      if (index > -1) {
        connections.splice(index, 1);
      }
      
      utils.log(utils.chalk.yellow(`WebSocket连接已关闭: ${connection.remoteAddress}, 原因: ${reasonCode}, ${description}`));
    });
  });
  
  utils.log(utils.chalk.green(`WebSocket服务器已启动，监听端口: ${port}`));
}