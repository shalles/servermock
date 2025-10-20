// 服务器配置接口
export interface ServerConfig {
  port?: number;
  hostname?: string;
  protocol?: 'http' | 'https' | 'socket';
  websocket?: {
    open: boolean;
    [key: string]: any;
  };
  main?: string;
  log?: boolean;
  proxy?: boolean;
  key?: string;
  cert?: string;
  plugins?: PluginConfig[];
  [key: string]: any;
}

// 插件配置接口
export interface PluginConfig {
  name: string;
  open: boolean;
  param?: any;
}

// 插件实例接口
export interface PluginInstance {
  init: (config: any) => any;
  excute: (params: any) => any;
}

// 请求响应参数接口
export interface RouterParams {
  req: any;
  res: any;
  urlpathname: string;
  pathname: string;
  extname: string;
  return?: any;
}

export interface ContentParams {
  cnt: any;
  stat: any;
  ext: string;
  filepath: string;
  return?: any;
}

export interface WsMsgParams {
  data: any;
  return?: any;
}

// Mock数据配置接口
export interface MockOptions {
  datapath?: string;
  mockrc?: string;
  ignore?: string[];
  regexurl?: Record<string, string>;
}

// Mock项接口
export interface MockItem {
  reg: RegExp;
  data: string;
}

// 工具函数接口
export interface Utils {
  log: (...args: any[]) => void;
  chalk: {
    green: (text: string) => string;
    red: (text: string) => string;
    yellow: (text: string) => string;
    cyan: (text: string) => string;
  };
  extend: <T extends object>(deep: boolean, target: T, ...sources: object[]) => T;
  inArray: (item: any, array: any[]) => boolean;
  readJson: (path: string) => any;
  findObjectInArray: (array: any[], key: string, value: any) => any;
  renderPage: (pagePath: string, data: any) => string;
  timeFormat: (date: Date) => string;
  excute: (command: string, callback: (stdout: string, stderr: string) => void) => void;
  MIME: Record<string, string>;
  classof: (obj: any) => string;
}