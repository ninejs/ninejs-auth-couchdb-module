(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./AuthCouchDb", "ninejs/modules/moduleDefine"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    const AuthCouchDb_1 = require("./AuthCouchDb");
    const moduleDefine_1 = require("ninejs/modules/moduleDefine");
    exports.default = moduleDefine_1.define(['ninejs', 'ninejs/store/couchdb'], function (provide) {
        provide('ninejs/auth/impl', (config, ninejs, couchdb) => {
            var log = ninejs.get('logger');
            log.info('ninejs/auth/impl (CouchDB) module starting');
            var auth = new AuthCouchDb_1.default(config, ninejs, couchdb);
            return auth;
        });
    });
});
//# sourceMappingURL=module.js.map