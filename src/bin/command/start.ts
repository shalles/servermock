import * as path from 'path';
import utils from '../../lib/utils';
import servermock from '../../index';
import { ServerConfig } from '../../types';

/**
 * 启动命令处理函数
 * @param params 命令行参数
 */
function startCommand(params: string[]): void {
  const cwd = process.cwd();
  const configPath = path.join(cwd, 'sm.config');
  const config: ServerConfig = utils.readJson(configPath) || {};
  
  utils.log('params: ', params);
  
  // 解析命令行参数
  for (let i = 0; i < params.length; i++) {
    switch (params[i++]) {
      case '-p':
        // 端口配置
        const port = parseInt(params[i]);
        if (!isNaN(port) && port > 0 && port < 65536) {
          config.port = port;
        }
        break;
      case '-i':
        // 主页配置
        config.main = params[i] || 'index.html';
        break;
      case '-n':
        // 主机名配置
        if (params[i] === 'auto') {
          config.hostname = '0.0.0.0';
        } else {
          config.hostname = params[i];
        }
        break;
      case '-py':
        // 代理模式
        config.proxy = true;
        break;
      case '@p':
        // 插件模式
        const plu = params[i];
        if (!plu) {
          throw new Error('param error: please specify a plugin name to start');
        }
        
        config.main = '@plugin=' + plu;
        config.plugins = Array.isArray(config.plugins) ? config.plugins : [];
        
        let pluConfig = utils.findObjectInArray(config.plugins, 'name', plu);
        if (!pluConfig) {
          pluConfig = { name: plu, open: true };
          config.plugins.push(pluConfig);
        } else {
          pluConfig.open = true;
        }
        break;
      default:
        // 未知参数
        i--; // 回退索引
        utils.log(
          utils.chalk.red(`param ${utils.chalk.cyan(params[i])} is not supported will be ignore`),
          '\n-p\tport. such -p 8080',
          '\n-i\tindex file. such -i view/index.html',
          '\n-n\thostname. such -n auto(auto IP)',
          '\n-py\tproxy. such -py(start proxy module)',
          '\n@p\tstart plugin. such @p transport'
        );
        break;
    }
  }
  
  utils.log(utils.chalk.green('start with config\n'), config);
  
  // 启动服务器
  servermock(config);
}

export default startCommand;