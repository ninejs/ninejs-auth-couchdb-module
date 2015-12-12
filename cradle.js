(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    'use strict';
    let cradle = require('cradle');
    exports.Connection = cradle.Connection;
    function merge(...args) {
        return cradle.merge(...args);
    }
    exports.merge = merge;
});
//# sourceMappingURL=cradle.js.map