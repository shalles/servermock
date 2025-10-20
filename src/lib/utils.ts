import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import chalk from 'chalk';
import { Utils } from '../types';

// MIME类型映射
const MIME: Record<string, string> = {
  'html': 'text/html',
  'xml': 'text/xml',
  'js': 'application/javascript',
  'css': 'text/css',
  'json': 'application/json',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'gif': 'image/gif',
  'ico': 'image/x-icon',
  'svg': 'image/svg+xml',
  'woff': 'application/font-woff',
  'woff2': 'application/font-woff2',
  'ttf': 'application/font-truetype',
  'eot': 'application/vnd.ms-fontobject',
  'txt': 'text/plain',
  'md': 'text/markdown'
};

const utils: Utils = {
  chalk,
  MIME,
  
  // 日志输出
  log: (...args: any[]) => {
    console.log(...args);
  },
  
  // 扩展对象
  extend: <T extends object>(deep: boolean, target: T, ...sources: object[]): T => {
    if (!sources.length) return target;
    
    const source = sources.shift();
    if (source === undefined) return target;
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = (source as any)[key];
        if (deep && typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue)) {
          if (!(key in target)) Object.assign(target, { [key]: {} });
          utils.extend(deep, (target as any)[key], sourceValue);
        } else if (sourceValue !== undefined) {
          (target as any)[key] = sourceValue;
        }
      }
    }
    
    return utils.extend(deep, target, ...sources);
  },
  
  // 检查数组中是否包含某元素
  inArray: (item: any, array: any[]): boolean => {
    return array.indexOf(item) > -1;
  },
  
  // 读取JSON文件
  readJson: (path: string): any => {
    try {
      const data = fs.readFileSync(path, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      utils.log(chalk.red(`readJson error: ${path}`, e));
      return null;
    }
  },
  
  // 在数组中查找对象
  findObjectInArray: (array: any[], key: string, value: any): any => {
    for (let i = 0, len = array.length; i < len; i++) {
      if (array[i][key] === value) {
        return array[i];
      }
    }
    return null;
  },
  
  // 渲染页面
  renderPage: (pagePath: string, data: any): string => {
    try {
      const template = fs.readFileSync(path.join(__dirname, pagePath), 'utf8');
      return template.replace(/\$\{(\w+)\}/g, (match, key) => {
        return data[key] || '';
      });
    } catch (e) {
      utils.log(chalk.red(`renderPage error: ${pagePath}`, e));
      return '';
    }
  },
  
  // 时间格式化
  timeFormat: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },
  
  // 执行命令
  excute: (command: string, callback: (stdout: string, stderr: string) => void): void => {
    childProcess.exec(command, (err, stdout, stderr) => {
      if (err) {
        utils.log(chalk.red(`exec error: ${command}`, err));
      }
      callback(stdout, stderr);
    });
  },
  
  // 获取对象类型
  classof: (obj: any): string => {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
  }
};

export default utils;