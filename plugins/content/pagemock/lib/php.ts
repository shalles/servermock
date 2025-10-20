import * as fs from 'fs';
import * as path from 'path';

// 为phpjs创建类型声明和模拟实现
export interface PHPExtensions {
  is_null?: (val: any) => boolean;
  empty?: (val: any) => boolean;
  [key: string]: any;
}

// 创建模拟的php对象
const phpInstance: PHPExtensions = {
  is_null: function(val: any): boolean {
    return val === null || val === undefined;
  },
  empty: function(val: any): boolean {
    return !val;
  }
};

// 尝试导入phpjs，如果不存在则使用模拟对象
try {
  const phpjs = require('phpjs');
  Object.assign(phpInstance, phpjs);
} catch (e) {
  // phpjs模块不存在，继续使用模拟对象
}

export default phpInstance;