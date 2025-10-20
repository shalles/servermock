type CallbackFunction = (params: any) => void;

class Callback {
  private callbacks: CallbackFunction[] = [];
  
  // 添加回调函数
  add(callback: CallbackFunction): void {
    if (typeof callback === 'function') {
      this.callbacks.push(callback);
    }
  }
  
  // 触发所有回调函数
  fire(params: any): void {
    for (const callback of this.callbacks) {
      callback(params);
    }
  }
  
  // 清除所有回调函数
  clear(): void {
    this.callbacks = [];
  }
  
  // 获取回调函数数量
  count(): number {
    return this.callbacks.length;
  }
}

export default Callback;