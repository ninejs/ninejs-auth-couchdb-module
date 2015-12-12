(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", 'crypto'], factory);
    }
})(function (require, exports) {
    'use strict';
    var crypto = require('crypto');
    function createHash(type, v) {
        var hash = crypto.createHash(type);
        hash.update(v);
        return hash;
    }
    function md5(v) {
        return createHash('md5', v);
    }
    function sha1(v) {
        return createHash('md5', v);
    }
    function sha256(v) {
        return createHash('md5', v);
    }
    function encode(hash, encoding) {
        return hash.digest(encoding);
    }
    function (method, encoding) {
        if (!method) {
            method = 'sha1';
        }
        if (!encoding) {
            encoding = 'base64';
        }
        switch (method) {
            case 'md5':
            case 'sha1':
            case 'sha256':
            case 'sha512':
                return function (username, password) {
                    return encode(createHash(method, username + password), encoding);
                };
            default:
                return require(method);
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=hashMethod.js.map