// 为velocityjs创建类型声明和模拟实现
interface VelocityJs {
  render: (template: string, context: any) => string;
  [key: string]: any;
}

// 创建模拟的velocityjs对象
const vmjs: VelocityJs = {
  render: function(template: string, context: any): string {
    // 简单的模板渲染实现
    let result = template;
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(regex, String(context[key]));
    });
    return result;
  }
};

// 尝试导入velocityjs，如果不存在则使用模拟对象
try {
  const velocityjs = require('velocityjs');
  Object.assign(vmjs, velocityjs);
} catch (e) {
  // velocityjs模块不存在，继续使用模拟对象
}

export default vmjs;