(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", './cradle'], factory);
    }
})(function (require, exports) {
    'use strict';
    var cradle_1 = require('./cradle');
    function mergeWithoutConflict(db, id, doc, callback, condition) {
        if ((id !== null) && (id !== undefined)) {
            id = id + '';
        }
        let myCallback = (err, data) => {
            if (err && err.error === 'conflict') {
                setTimeout(function () {
                    mergeWithoutConflict(db, id, doc, callback, condition);
                }, 50);
            }
            else {
                callback.apply(null, arguments);
            }
        };
        if ((id !== null) && (id !== undefined)) {
            db.get(id, function (err, data) {
                if (err) {
                    db.save(id, doc, myCallback);
                }
                else {
                    if (!condition || condition(data)) {
                        var merged = cradle_1.merge({}, data, doc);
                        merged['_rev'] = data['_rev'];
                        db.save(id, merged['_rev'], merged, myCallback);
                    }
                    else {
                        callback({ error: 'notUpdated', message: 'update condition not met' }, data);
                    }
                }
            });
        }
        else {
            delete doc._id;
            db.save(doc, myCallback);
        }
    }
    exports.mergeWithoutConflict = mergeWithoutConflict;
    function removeWithoutConflict(db, id, callback) {
        var myCallback = function (err, data) {
            if (err && err.error === 'conflict') {
                setTimeout(function () {
                    removeWithoutConflict(db, id, callback);
                }, 50);
            }
            else {
                if (callback) {
                    callback.apply(null, arguments);
                }
            }
        };
        db.get(id, function (err, data) {
            if (err) {
                console.log(err);
                myCallback.apply(null, arguments);
            }
            else {
                db.remove(id, data['_rev'], myCallback);
            }
        });
    }
    exports.removeWithoutConflict = removeWithoutConflict;
});
//# sourceMappingURL=couchUtils.js.map