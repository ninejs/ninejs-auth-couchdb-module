var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "ninejs/core/deferredUtils", "ninejs-store/couchdb/couchUtils", "./hashMethod", "./design/users"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    const deferredUtils_1 = require("ninejs/core/deferredUtils");
    const couchUtils_1 = require("ninejs-store/couchdb/couchUtils");
    const hashMethod_1 = require("./hashMethod");
    const users_1 = require("./design/users");
    class AuthCouchDb {
        constructor(config, ninejs, couchdb) {
            let couchdbConnectionName = (config.options || {}).couchDbConnection;
            let couchDbConnection = couchdb.connection(couchdbConnectionName);
            this.usersDb = ((config.options || {}).usersDb) || this.usersDb;
            this.storeConnection = couchDbConnection;
            this.db = this.storeConnection.database(this.usersDb);
            this.config = config;
        }
        login(username, password, domain) {
            return __awaiter(this, void 0, void 0, function* () {
                if (domain) {
                    username += '@' + domain;
                }
                let resp = yield deferredUtils_1.ncall(this.db.view, this.db, this.documentName + '/active', { key: username, reduce: true });
                if ((resp.length === 0) || (resp.length > 1)) {
                    return { result: 'failed' };
                }
                let data = resp[0].value;
                if (password && data.active && data.username === username && data.password === this.hash(username, password)) {
                    data.result = 'success';
                    this.db.save({
                        type: 'loginAttempt',
                        username: data.username,
                        loginDate: new Date(),
                        result: 'success'
                    }, function () {
                    });
                    delete data.password;
                    return data;
                }
                else {
                    this.db.save({
                        type: 'loginAttempt',
                        username: username,
                        loginDate: new Date(),
                        result: 'failed'
                    }, function () {
                    });
                    return { result: 'failed' };
                }
            });
        }
        usersByPermission(permissions) {
            return __awaiter(this, void 0, void 0, function* () {
                let self = this, args = { reduce: true };
                if (typeof (permissions) !== 'undefined') {
                    args.keys = permissions;
                    args.group = true;
                }
                try {
                    let users = yield deferredUtils_1.ncall(this.db.view, this.db, self.documentName + '/byPermissions', args);
                    return users[0].value;
                }
                catch (err) {
                    console.error(err);
                    throw err;
                }
            });
        }
        users() {
            return this.usersByPermission();
        }
        permissions() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let permissions = yield deferredUtils_1.ncall(this.db.view, this.db, this.documentName + '/permissions', { reduce: true, group: true });
                    return permissions[0].value;
                }
                catch (err) {
                    console.error(err);
                    throw err;
                }
            });
        }
        init() {
            return __awaiter(this, void 0, void 0, function* () {
                let options = this.config.options || {}, documentName = options.documentName || 'user', defaultUserName = options.defaultUserName || 'admin', defaultPassword = options.defaultPassword || 'password', defaultPermissions = options.defaultPermissions || ['administrator'], hash = hashMethod_1.default(options.hashMethod, options.hashEncoding);
                this.documentName = documentName;
                this.hash = hash;
                try {
                    let dbExists = yield deferredUtils_1.ncall(this.db.exists, this.db);
                    if (!dbExists) {
                        yield couchUtils_1.create(this.db);
                    }
                    yield users_1.default(this.db, this.config);
                    let user = yield deferredUtils_1.ncall(this.db.view, this.db, documentName + '/active', { key: defaultUserName, reduce: true });
                    if (user.length === 0) {
                        console.log('ninejs/auth/impl (CouchDB): Creating user "' + defaultUserName + '" with password "' + defaultPassword + '".');
                        yield deferredUtils_1.ncall(this.db.save, this.db, {
                            type: 'user',
                            username: defaultUserName,
                            password: hash(defaultUserName, defaultPassword),
                            active: true,
                            created: (new Date()).getTime(),
                            permissions: defaultPermissions
                        });
                        console.log('ninejs/auth/impl (CouchDB): user "' + defaultUserName + '" created successfully.');
                    }
                    return true;
                }
                catch (err) {
                    console.error(err);
                    throw err;
                }
            });
        }
        getUser(username) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let data = yield deferredUtils_1.ncall(this.db.view, this.db, this.documentName + '/active', { key: username, reduce: true });
                    return data[0].value;
                }
                catch (err) {
                    console.error(err);
                    throw err;
                }
            });
        }
    }
    AuthCouchDb.prototype.usersDb = 'users';
    exports.default = AuthCouchDb;
});
//# sourceMappingURL=AuthCouchDb.js.map