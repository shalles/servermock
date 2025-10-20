import * as os from 'os';
import * as path from 'path';
import utils from './lib/utils';
import server from './lib/server';
import plugins from './lib/plugins';
import { ServerConfig } from './types';

/**
 * servermock 主函数
 * @param config 服务器配置
 */
function servermock(config: ServerConfig): void {
  const defaultConfig: ServerConfig = {
    port: 80,
    hostname: 'localhost',
    protocol: 'http',
    websocket: {
      open: false
    },
    main: ''
  };
  
  // 自动获取IP
  (() => {
    if (config.hostname === '0.0.0.0') {
      try {
        const NETs = os.networkInterfaces();
        for (const net in NETs) {
          if (net === 'lo' || net === 'lo0') continue;
          
          const IPs = NETs[net];
          if (!IPs) continue;
          
          for (const ipInfo of IPs) {
            if (ipInfo.family === 'IPv4') {
              config.hostname = ipInfo.address;
              return;
            }
          }
        }
      } catch (e) {
        config.hostname = 'localhost';
        utils.log(utils.chalk.yellow('please open your Wi-Fi and restart. now use default config server on localhost'));
      }
    }
  })();
  
  // 插件参数处理
  function pluginInit(): ServerConfig {
    const pluginList = config.plugins = Array.isArray(config.plugins) ? config.plugins : [];
    if (!pluginList.length) return {};
    
    const pluginsConfig: any = { __userPluginList: [] };
    const temp: any = utils.extend(true, {}, defaultConfig, config);
    
    const serverConfig = {
      hostname: temp.hostname,
      port: temp.port,
      protocol: temp.protocol
    };
    
    for (const plu of pluginList) {
      const name = plu.name;
      const open = plu.open;
      
      if (open && name) {
        pluginsConfig.__userPluginList.push(name);
        pluginsConfig[name] = plu.param || {};
        pluginsConfig[name].__serverConfig = serverConfig;
        pluginsConfig[name].__utils = utils;
      }
    }
    
    // 注册并初始化插件配置返回插件的server配置
    return pluginList.length ? plugins.init(pluginsConfig) : {};
  }
  
  // 合并配置
  const pluginNeed = pluginInit();
  config = utils.extend(true, defaultConfig, pluginNeed, config);
  
  // 处理主页面配置
  let buildPath = process.cwd();
  let startParam: string[];
  
  try {
    if (config.main) {
      startParam = config.main.split('=');
      if (startParam[0] === '@plugin' && pluginNeed.startbase) {
        buildPath = pluginNeed.startbase[startParam[1]];
        config.main = 'index.html';
      }
    }
  } catch (err) {
    throw new Error('plugin start failed');
  }
  
  // 规范化主页面路径
  if (config.main && config.main[0] !== '/') {
    config.main = '/' + config.main;
  }
  
  // 启动服务器
  server(config, buildPath, plugins);
}

export default servermock;