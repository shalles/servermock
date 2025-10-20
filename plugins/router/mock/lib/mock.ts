import * as fs from 'fs';
import * as vm from 'vm';
import * as qs from 'querystring';
import * as url from 'url';
import * as path from 'path';
import * as mockjs from 'mockjs';

// 导入类型定义
export interface ServerConfig {
  port?: number;
  hostname?: string;
  protocol?: 'http' | 'https' | 'socket';
  [key: string]: any;
}

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

export interface MockOptions {
  __utils: Utils;
  datapath?: string;
  mockrc?: string;
  acao?: boolean;
  ignore?: string[];
  regexurl?: Record<string, string>;
}

export interface MockDataResult {
  cnt: string | undefined;
  type: string | undefined;
}

// 扩展URL类型，添加queryObj属性
export interface UrlWithQueryObj extends url.UrlWithStringQuery {
  queryObj?: Record<string, any>;
}

export interface ExtendedRequest extends http.IncomingMessage {
  parseUrl?: UrlWithQueryObj;
  wwwurl?: UrlWithQueryObj;
  queryObj?: Record<string, any>;
}

import * as http from 'http';

function clearJs(str: string): string {
  const reg = /("([^\\\"]*(\\.)?)*")|('([^\\\']*(\\.)?)*')|(\/{2,}.*?(\r|\n))|(\/\*(\n|.)*?\*\/)/g;
  return str.replace(reg, (word) => {
    return /^\/{2,}/.test(word) || /^\/\*/.test(word) ? "" : word;
  });
}

class MockData {
  private acao: boolean = false;
  private ignore: string[] = [];
  private mockItems: Array<{ reg: RegExp; data: string }> = [];

  constructor(opt: MockOptions) {
    utils = opt.__utils;
    // 创建默认配置，确保包含__utils
    const defaultOptions = {
      datapath: "mock",
      mockrc: ".mockrc",
      acao: true,
      ignore: ['html', 'js', 'css', 'jpg', 'png', 'gif'],
      regexurl: {}
    };
    // 合并配置，确保保留__utils
    const options = utils.extend(true, defaultOptions, opt);

    options.datapath = path.isAbsolute(options.datapath) 
      ? options.datapath 
      : path.join(process.cwd(), options.datapath);
    
    options.mockrc = path.isAbsolute(options.mockrc) 
      ? options.mockrc 
      : path.join(options.datapath, options.mockrc);

    this.init(options);
  }

  private init(opt: MockOptions): void {
    this.acao = opt.acao || true;
    this.ignore = opt.ignore || [];
    this.mockItems = this.convertRegexURL(opt.datapath || '', opt.regexurl || {});
    if (opt.mockrc) {
      this.initMockRandom(opt.mockrc);
    }
  }

  private initMockRandom(mockrcpath: string): void {
    utils.log(utils.chalk.green("plugin-mock mockrcpath:\n"), mockrcpath);
    
    const mockRandom = fs.existsSync(mockrcpath) 
      ? JSON.parse(clearJs(fs.readFileSync(mockrcpath, 'utf8'))) 
      : {};

    for (const i in mockRandom) {
      if (mockRandom.hasOwnProperty(i)) {
        const randomData: any = {};
        const name = i.toLowerCase();
        const list = name + 's';
        
        (function(key, listKey, nameKey) {
          randomData[listKey] = mockRandom[key];
          randomData[nameKey] = function(data: any) {
            return this.pick(this[listKey]);
          };
          
          mockjs.Random.extend(randomData);
          utils.log(utils.chalk.green("plugin-mock Random add:\n"), randomData);
        })(i, list, name);
      }
    }
  }

  private convertRegexURL(mockPath: string, regexurl: Record<string, string>): Array<{ reg: RegExp; data: string }> {
    const mockItems: Array<{ reg: RegExp; data: string }> = [];
    let j = 0;
    
    for (const i in regexurl) {
      if (regexurl.hasOwnProperty(i)) {
        mockItems[j++] = {
          reg: new RegExp(i),
          data: path.join(mockPath, regexurl[i])
        };
      }
    }
    
    return mockItems;
  }

  public getMockData(url: string, ext: string): MockDataResult {
    let cnt: string | undefined;
    let type: string | undefined;
    
    if (this.ignore.indexOf(ext) === -1) {
      for (const i in this.mockItems) {
        if (this.mockItems.hasOwnProperty(i)) {
          const item = this.mockItems[i];
          if (item.reg.test(url)) {
            try {
              cnt = clearJs(fs.readFileSync(item.data, 'utf8'));
              type = path.extname(item.data).slice(1);
            } catch (err) {
              utils.log(utils.chalk.red(`读取mock文件失败: ${item.data}`), err);
            }
            break;
          }
        }
      }
    }
    
    return { cnt, type };
  }

  public getMockJsonData(json: any): any {
    return mockjs.mock(json);
  }

  public mockResponse(data: MockDataResult, req: ExtendedRequest, res: http.ServerResponse, servConfig: ServerConfig): boolean {
    if (!data.cnt) return false;
    
    try {
      switch (data.type) {
        case 'mjson':
          if (this.acao) {
            res.setHeader("Access-Control-Allow-Origin", "*");
          }
          data.cnt = JSON.stringify(mockjs.mock(JSON.parse(data.cnt || '')), null, 4);
        case 'json':
          if (this.acao) {
            res.setHeader("Access-Control-Allow-Origin", "*");
          }
          res.writeHead(200, {
            'Content-Type': utils.MIME['json'] || 'application/json'
          });
          res.write(data.cnt);
          res.end();
          break;
        case 'js':
          // 扩展请求对象
          // 类型断言为我们扩展的UrlWithQueryObj类型
          req.parseUrl = req.wwwurl = url.parse(
            `${servConfig.protocol || 'http'}://${req.headers.host}${req.url}`
          ) as UrlWithQueryObj;
          
          const qstr = req.wwwurl.query ? qs.parse(req.wwwurl.query) : {};
          const query: Record<string, any> = {};
          
          for (const i in qstr) {
            if (qstr.hasOwnProperty(i)) {
              const $ = /(.+)\[(.+)\]/.exec(i);
              if ($) {
                if (!query[$[1]]) {
                  query[$[1]] = {};
                }
                query[$[1]][$[2]] = qstr[i];
              } else {
                query[i] = qstr[i];
              }
            }
          }
          
          req.queryObj = query;
          // 为wwwurl添加queryObj属性
          if (req.wwwurl) {
            (req.wwwurl as UrlWithQueryObj).queryObj = query;
          }
          
          // 执行JS mock脚本
          const scriptContent = `(${data.cnt})`;
          const scriptFn = vm.runInThisContext(scriptContent);
          scriptFn(req, res, require);
          break;
        default:
          utils.log(utils.chalk.yellow("mock 暂只支持.mjson .json .js文件"));
          res.end("mock 暂只支持.mjson .json .js文件");
      }
    } catch (e) {
      utils.log(utils.chalk.red("mock error: "), e);
    }
    
    return true;
  }
}

// 全局变量引用
let utils: Utils;

export default MockData;