/**
 * Callbacks 
 * author: shalles
 * email:shalles@163.com
 * create time: 2015.01.02
 * refer to jquery callbacks
 */

function validateFn(fn){
    return typeof fn === 'function';
}

function Callbacks(options) {
    this.list = []
}

Callbacks.prototype = {

    // Add a callback or a collection of callbacks to the list
    add: function (fn) {
        if(validateFn(fn)){
            this.list.push(fn);
        }else if(Object.prototype.toString.call(fn) === "[object Array]"){
            for(var i = 0, len = fn.length; i < len; i++){
                 arguments.callee.call(this, fn[i]);   
            }
        }

        return this;
    },

    // Remove a callback from the list
    remove: function (fn) {
        var list = this.list,
            idx;
        if(validateFn(fn)){
            idx = list.indexOf(fn);
            list.splice(idx, 1);
        }
        
        return this;
    },

    // Check if a given callback is in the list.
    has: function (fn) {
        return validateFn(fn) && (this.list.indexOf(fn) > -1);
    },

    // Remove all callbacks from the list
    empty: function () {
        if (this.list) {
            this.list = [];
        }
        return this;
    },

    // Call all callbacks with the given context and arguments
    fireWith: function (context, args) {
        var list = this.list;
        for(var i = 0, len; i < list.length; i++){
            list[i].apply(context, args.slice ? args.slice() : args);
        }
        
        return this;
    },

    // Call all the callbacks with the given arguments
    fire: function () {
        this.fireWith(this, arguments);
        return this;
    }
};

module.exports = Callbacks;