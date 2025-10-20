import * as fs from 'fs';
import * as path from 'path';
import utils from '../../lib/utils';

/**
 * 初始化命令处理函数
 * @param params 命令行参数
 */
function initCommand(params: string[]): void {
  const cwd = process.cwd();
  const configPath = path.join(cwd, 'sm.config');
  
  // 检查是否已存在配置文件
  if (fs.existsSync(configPath)) {
    utils.log(utils.chalk.red('sm.config 配置文件已存在！'));
    return;
  }
  
  // 默认配置
  const defaultConfig = {
    "port": 8080,
    "hostname": "localhost",
    "protocol": "http",
    "websocket": {
      "open": false
    },
    "main": "index.html",
    "log": true,
    "plugins": []
  };
  
  try {
    // 写入配置文件
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    utils.log(utils.chalk.green(`配置文件已创建: ${configPath}`));
    utils.log('默认配置:');
    utils.log(defaultConfig);
    
    // 创建 mock 目录
    const mockDir = path.join(cwd, 'mock');
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir);
      utils.log(utils.chalk.green(`mock 目录已创建: ${mockDir}`));
      
      // 创建示例 mock 数据
      const exampleMock = {
        "code": 200,
        "message": "success",
        "data": {
          "list": [
            {
              "id": 1,
              "name": "示例数据"
            }
          ]
        }
      };
      
      fs.writeFileSync(
        path.join(mockDir, 'example.json'),
        JSON.stringify(exampleMock, null, 2),
        'utf8'
      );
      
      utils.log(utils.chalk.green('示例 mock 数据已创建'));
    }
  } catch (err) {
    utils.log(utils.chalk.red(`初始化失败: ${err}`));
  }
}

export default initCommand;