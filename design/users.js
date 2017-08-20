(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "ninejs/core/deferredUtils", "ninejs-store/couchdb/couchUtils"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    const deferredUtils_1 = require("ninejs/core/deferredUtils");
    const couchUtils_1 = require("ninejs-store/couchdb/couchUtils");
    let emit;
    function getUserDesignDocument(config) {
        let documentName = config.documentName || 'user';
        return {
            '_id': '_design/' + documentName,
            'language': 'javascript',
            'views': {
                'active': {
                    'map': function (doc) {
                        if ((doc.type === 'user') && (doc.active)) {
                            emit(doc.username, doc);
                        }
                        else if (doc.type === 'updateUser') {
                            emit(doc.username, doc);
                        }
                    }.toString(),
                    'reduce': function (keys, values, reReduce) {
                        function isArray(v) {
                            return Object.prototype.toString.call(v) === '[object Array]';
                        }
                        var r = values.sort(function (a, b) {
                            if ((a.created || 0) < (b.created || 0)) {
                                return -1;
                            }
                            else {
                                return 1;
                            }
                        }).reduce(function (state, next) {
                            if (next.type === 'user') {
                                return next;
                            }
                            else if (next.type === 'updateUser') {
                                var added = next.add || {}, updated = next.update || {}, deleted = next.delete || {}, p, arr, arrPushI = function (i) {
                                    arr.push(i);
                                }, deleteReduce = function (state, next) {
                                    return state.filter(function (i) {
                                        return i !== next;
                                    });
                                };
                                for (p in added) {
                                    if (added.hasOwnProperty(p)) {
                                        if (isArray(added[p])) {
                                            arr = state[p] || [];
                                            added[p].forEach(arrPushI);
                                            state[p] = arr;
                                        }
                                        else {
                                            state[p] = added[p];
                                        }
                                    }
                                }
                                (function () {
                                    var p;
                                    for (p in updated) {
                                        if (updated.hasOwnProperty(p)) {
                                            state[p] = updated[p];
                                        }
                                    }
                                })();
                                (function () {
                                    var p;
                                    for (p in deleted) {
                                        if (isArray(deleted[p])) {
                                            state[p] = deleted[p].reduce(deleteReduce, state[p]);
                                        }
                                        else {
                                            delete state[p];
                                        }
                                    }
                                })();
                                return state;
                            }
                            else {
                                return state;
                            }
                        }, { created: -1 });
                        return reReduce ? [r] : r;
                    }.toString()
                },
                'byPermissions': {
                    'map': function (doc) {
                        if (doc.type === 'user') {
                            (doc.permissions || []).forEach(function (p) {
                                emit(p, { username: doc.username, created: doc.created, add: true });
                            });
                        }
                        else if (doc.type === 'updateUser') {
                            ((doc.add || {}).permissions || []).forEach(function (p) {
                                emit(p, { username: doc.username, created: doc.created, add: true });
                            });
                            ((doc.delete || {}).permissions || []).forEach(function (p) {
                                emit(p, { username: doc.username, created: doc.created, add: false });
                            });
                        }
                    }.toString(),
                    'reduce': function (keys, values, reReduce) {
                        function isArray(v) {
                            return Object.prototype.toString.call(v) === '[object Array]';
                        }
                        var r = values.sort(function (a, b) {
                            if ((a.created || 0) < (b.created || 0)) {
                                return -1;
                            }
                            else {
                                return 1;
                            }
                        }).reduce(function (state, next) {
                            if (next.add) {
                                if (!state[next.username]) {
                                    state[next.username] = 0;
                                }
                                state[next.username] += 1;
                            }
                            else {
                                if (!state[next.username]) {
                                    state[next.username] = 0;
                                }
                                state[next.username] -= 1;
                            }
                            return state;
                        }, {});
                        return Object.keys(r).filter(function (k) { return r[k] > 0; });
                    }.toString()
                },
                'permissions': {
                    'map': function (doc) {
                        if (doc.type === 'user') {
                            (doc.permissions || []).forEach(function (p) {
                                emit(null, p);
                            });
                        }
                        else if (doc.type === 'updateUser') {
                            ((doc.add || {}).permissions || []).forEach(function (p) {
                                emit(null, p);
                            });
                        }
                    }.toString(),
                    'reduce': function (keys, values, reReduce) {
                        var r = {};
                        values.forEach(function (v) {
                            r[v] = true;
                        });
                        return Object.keys(r);
                    }.toString()
                }
            }
        };
    }
    function differ(existing, data) {
        if ((existing._id === data._id) && (existing.language === data.language)) {
            return Object.keys(data.views).some(function (viewKey) {
                let existingView = existing.views[viewKey], dataView = data.views[viewKey];
                if (!existingView) {
                    return true;
                }
                return Object.keys(dataView).some(function (propKey) {
                    return dataView[propKey] !== existingView[propKey];
                });
            });
        }
        else {
            return false;
        }
    }
    function checkDb(db, config) {
        let userDefer = deferredUtils_1.defer(), _config = config || {}, options = _config.options || {}, documentName = options.documentName || 'user';
        let user = getUserDesignDocument(_config);
        db.get('_design/' + documentName, function (err, data) {
            if (err) {
                console.log('Attempting to reconstruct _design/' + documentName);
                couchUtils_1.mergeWithoutConflict(db, '_design/' + documentName, user, function (err) {
                    if (err) {
                        console.error(err);
                        userDefer.reject(err);
                    }
                    else {
                        userDefer.resolve(true);
                    }
                });
            }
            else {
                if (differ(data, user)) {
                    console.log('Updating _design/' + documentName);
                    couchUtils_1.mergeWithoutConflict(db, '_design/' + documentName, couchUtils_1.merge({}, data, user), function (err) {
                        if (err) {
                            userDefer.reject(err);
                            console.error(err);
                        }
                        else {
                            userDefer.resolve(true);
                        }
                    });
                }
                else {
                    userDefer.resolve(true);
                }
            }
        });
        return userDefer.promise;
    }
    exports.default = checkDb;
});
//# sourceMappingURL=users.js.map