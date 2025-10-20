import * as fs from 'fs';
import * as vm from 'vm';
import * as qs from 'querystring';
import * as url from 'url';
import * as path from 'path';
import utils from './utils';
import type { MockOptions, MockItem } from '../types';
import MockJS from 'mockjs';

class MockData {
  private ignore: string[] = [];
  private mockItems: MockItem[] = [];
  
  constructor(opt?: MockOptions) {
    const defaultOptions: MockOptions = {
      datapath: path.join(process.cwd(), 'mock/'),
      mockrc: '.mockrc',
      ignore: ['html', 'js', 'css', 'jpg', 'png', 'gif'],
      regexurl: {}
    };
    
    const mergedOptions = utils.extend(true, defaultOptions, opt || {});
    this.init(mergedOptions);
  }
  
  private init(opt: MockOptions): void {
    this.ignore = opt.ignore || [];
    this.mockItems = this.convertRegexURL(opt.datapath || '', opt.regexurl || {});
    
    const mockrcPath = path.isAbsolute(opt.mockrc || '') 
      ? opt.mockrc 
      : path.join(opt.datapath || '', opt.mockrc || '');
    
    if (mockrcPath) {
      this.initMockRandom(mockrcPath);
    }
  }
  
  private initMockRandom(mockrcpath: string): void {
    try {
      const mockRandom = fs.existsSync(mockrcpath) 
        ? JSON.parse(fs.readFileSync(mockrcpath, 'utf8')) 
        : {};
      
      for (const key in mockRandom) {
        if (Object.prototype.hasOwnProperty.call(mockRandom, key)) {
          const randomData: any = {};
          const name = key.toLowerCase();
          const listName = `${name}s`;
          
          randomData[listName] = mockRandom[key];
          randomData[name] = function(this: any, data: any) {
            return this.pick(this[listName]);
          };
          
          MockJS.Random.extend(randomData);
        }
      }
    } catch (e) {
      utils.log(utils.chalk.red(`initMockRandom error: ${e}`));
    }
  }
  
  private convertRegexURL(mockPath: string, regexurl: Record<string, string>): MockItem[] {
    const mockItems: MockItem[] = [];
    let index = 0;
    
    for (const key in regexurl) {
      if (Object.prototype.hasOwnProperty.call(regexurl, key)) {
        mockItems[index++] = {
          reg: new RegExp(key),
          data: path.join(mockPath, regexurl[key])
        };
      }
    }
    
    return mockItems;
  }
  
  // 获取模拟数据
  getMockData(url: string, ext: string): { cnt: string | null; type: string | null } {
    let cnt: string | null = null;
    let type: string | null = null;
    
    if (this.ignore.indexOf(ext) === -1) {
      for (const item of this.mockItems) {
        if (item.reg.test(url)) {
          try {
            cnt = fs.readFileSync(item.data, 'utf8');
            type = path.extname(item.data).slice(1);
            break;
          } catch (e) {
            utils.log(utils.chalk.red(`read mock file error: ${item.data} - ${e}`));
          }
        }
      }
    }
    
    return { cnt, type };
  }
  
  // 获取模拟JSON数据
  getMockJsonData(json: any): any {
    return MockJS.mock(json);
  }
  
  // 模拟响应
  mockResponse(data: { cnt: string | null; type: string | null }, req: any, res: any, config: any): boolean {
    if (!data.cnt) return false;
    
    try {
      switch (data.type) {
        case 'mjson':
          // 处理mockjson格式
          const mockData = MockJS.mock(JSON.parse(data.cnt));
          data.cnt = JSON.stringify(mockData, null, 4);
          // 继续处理json格式
        case 'json':
          res.writeHead(200, {
            'Content-Type': utils.MIME['json']
          });
          res.write(data.cnt);
          res.end();
          break;
        case 'js':
          // 解析URL并提供给mock js文件
          req.wwwurl = url.parse(`${config.protocol}://${req.headers.host}${req.url}`);
          const qstr = req.wwwurl.query ? qs.parse(req.wwwurl.query) : {};
          const query: any = {};
          
          for (const key in qstr) {
            if (Object.prototype.hasOwnProperty.call(qstr, key)) {
              const match = /(.+)\[(.+)\]/.exec(key);
              if (match) {
                query[match[1]] = query[match[1]] || {};
                query[match[1]][match[2]] = qstr[key];
              } else {
                query[key] = qstr[key];
              }
            }
          }
          
          req.wwwurl.queryObj = query;
          
          // 执行JS文件
          const script = new vm.Script(`(${data.cnt})`);
          const func = script.runInThisContext();
          func(req, res, require);
          break;
        default:
          utils.log('mock 暂只支持.mjson .json .js文件');
          res.end('mock 暂只支持.mjson .json .js文件');
      }
      return true;
    } catch (e) {
      utils.log(utils.chalk.red(`mock error: ${e}`));
      return false;
    }
  }
}

export default MockData;