var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", './AuthCouchDb', 'ninejs/modules/moduleDefine'], factory);
    }
})(function (require, exports) {
    'use strict';
    var AuthCouchDb_1 = require('./AuthCouchDb');
    var moduleDefine_1 = require('ninejs/modules/moduleDefine');
    exports.default = moduleDefine_1.define(['ninejs'], function (provide) {
        provide('ninejs/auth/impl', (config, ninejs) => {
            var log = ninejs.get('logger');
            log.info('ninejs/auth/impl (CouchDB) module starting');
            var auth = new AuthCouchDb_1.default(config, ninejs);
            return auth;
        });
    });
});
//# sourceMappingURL=module.js.map