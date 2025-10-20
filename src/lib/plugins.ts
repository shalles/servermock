import * as fs from 'fs';
import * as path from 'path';
import Callback from './callback';
import utils from './utils';
import { PluginInstance, RouterParams, ContentParams, WsMsgParams } from '../types';

interface PluginSystem {
  _router: Callback;
  _content: Callback;
  _wsmsg: Callback;
  _error: Callback;
  excute: (name: string, params: any) => any;
  register: (plu: PluginInstance, type: string, name: string) => any;
  init: (config: any) => any;
}

const plugin: PluginSystem = {
  _router: new Callback(),
  _content: new Callback(),
  _wsmsg: new Callback(),
  _error: new Callback(),
  
  // 执行插件
  excute(name: string, params: any): any {
    const plu = plugin[`_${name}` as keyof PluginSystem];
    try {
      plu && (plu as Callback).fire(params);
      return params.return;
    } catch (err) {
      utils.log(utils.chalk.red(`plugin-${name} error:`), err);
      return undefined;
    }
  },
  
  // 注册插件
  register(plu: PluginInstance, type: string, name: string): any {
    const backdata = plu.init(configPlugins[name]);
    
    switch (type) {
      case 'content':
        plugin._content.add((params: ContentParams) => {
          params.return = params.cnt = plu.excute(params) || params.cnt;
        });
        break;
      case 'router':
        plugin._router.add((params: RouterParams) => {
          params.return = plu.excute(params);
        });
        break;
      case 'wsmsg':
        plugin._wsmsg.add((params: WsMsgParams) => {
          params.return = params.data = plu.excute(params) || params.data;
        });
        break;
      default:
        (plugin[`_${type}` as keyof PluginSystem] as Callback)?.add(plu.excute);
        break;
    }
    
    return backdata;
  },
  
  // 初始化插件系统
  init(config: any): any {
    configPlugins = config;
    const pluginStartBase: Record<string, string> = {};
    const pluginBasePath = path.join(__dirname, '../../plugins');
    
    // 加载插件
    const pluginDirList = fs.readdirSync(pluginBasePath).filter(dir => {
      return fs.statSync(path.join(pluginBasePath, dir)).isDirectory();
    });
    
    const pluginsConfig = findCheckPlugins(pluginBasePath, pluginDirList);
    pluginsConfig.startbase = pluginStartBase;
    
    return pluginsConfig;
  }
};

// 全局配置
let configPlugins: any = {};
const gPluginTypeList = ['content', 'router', 'err', 'wsmsg'];

// 检查和加载插件
function findCheckPlugins(pluginBasePath: string, pluginDirList: string[]): any {
  const config: any = {};
  
  for (const pType of pluginDirList) {
    if (!utils.inArray(pType, gPluginTypeList)) {
      continue;
    }
    
    utils.extend(true, config, loadPlugins(pluginBasePath, pType));
  }
  
  return config;
}

// 加载指定类型的插件
function loadPlugins(pluginBasePath: string, pType: string): any {
  const pluginPath = path.join(pluginBasePath, pType);
  const pluginsConfig: any = {};
  
  try {
    const pluginFiles = fs.readdirSync(pluginPath);
    
    for (const pfi of pluginFiles) {
      try {
        const fp = path.join(pluginPath, pfi, 'index.js');
        const configPath = path.join(pluginPath, pfi, 'package.json');
        const userLoad = utils.inArray(pfi, configPlugins.__userPluginList || []);
        
        if (fs.existsSync(fp) && userLoad) {
          const plu = require(fp) as PluginInstance;
          const backdata = plugin.register(plu, pType, pfi);
          
          utils.log(utils.chalk.green(`plugin-${pfi} registed success.`));
          
          const pluServCfg = (utils.readJson(configPath) || {}).servermock || {};
          
          // 插件启动目录配置
          if (backdata && backdata.dirname && pluServCfg.startbasepath) {
            pluginStartBase[pfi] = path.join(backdata.dirname, pluServCfg.startbasepath);
          }
          
          utils.extend(true, pluginsConfig, pluServCfg);
        }
      } catch (err) {
        utils.log(utils.chalk.red(`plugin-${pfi} error:`), err);
      }
    }
  } catch (err) {
    utils.log(utils.chalk.red(`loadPlugins error: ${pluginPath} - ${err}`));
  }
  
  return pluginsConfig;
}

// 插件启动目录
const pluginStartBase: Record<string, string> = {};

export default plugin;