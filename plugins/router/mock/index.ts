import * as path from 'path';
import Mock from './lib/mock';

// 导入类型定义
export interface Utils {
  extend: (...args: any[]) => any;
  log: (...args: any[]) => void;
  chalk: {
    green: (text: string) => string;
    red: (text: string) => string;
    yellow: (text: string) => string;
  };
  MIME: Record<string, string>;
}

export interface ServerConfig {
  port?: number;
  hostname?: string;
  protocol?: 'http' | 'https' | 'socket';
  [key: string]: any;
}

export interface PluginConfig {
  __utils: Utils;
  __serverConfig?: ServerConfig;
  datapath?: string;
  mockrc?: string;
}

export interface Params {
  urlpathname: string;
  extname: string;
  req: any;
  res: any;
}

interface Plugin {
  excute: (params: Params) => any;
  init: (config: PluginConfig) => void;
  mock?: Mock;
}

const plugin: Plugin = {} as Plugin;
let serverConfig: ServerConfig = {};

plugin.excute = function(params: Params) {
  if (!plugin.mock) {
    return;
  }
  
  const mockData = plugin.mock.getMockData(params.urlpathname, params.extname);
  return plugin.mock.mockResponse(mockData, params.req, params.res, serverConfig);
};

plugin.init = function(config: PluginConfig) {
  serverConfig = config.__serverConfig || {};
  
  // 配置处理逻辑
  let resolvedConfig = { ...config };
  if (resolvedConfig.datapath && !path.isAbsolute(resolvedConfig.datapath)) {
    resolvedConfig.datapath = path.resolve(process.cwd(), resolvedConfig.datapath);
  }
  
  if (resolvedConfig.mockrc && resolvedConfig.datapath && !path.isAbsolute(resolvedConfig.mockrc)) {
    resolvedConfig.mockrc = path.join(resolvedConfig.datapath, resolvedConfig.mockrc);
  }
  
  plugin.mock = new Mock(resolvedConfig);
};

export default plugin;