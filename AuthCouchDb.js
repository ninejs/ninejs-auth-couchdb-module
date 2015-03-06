'use strict';
var deferredUtils = require('ninejs/core/deferredUtils'),
	crypto = require('crypto'),
	AuthCouchDb,
	cradle = require('cradle'),
	usersDb = 'users';
AuthCouchDb = function(config, module) {
	var db,
		CradleConnection = cradle.Connection,
		storeConfig = config.storeConfig,
		storeConnection = new CradleConnection(storeConfig.host, storeConfig.port, storeConfig),
		logger = module.getUnit('ninejs').get('logger');
	function hash(src) {
		var md5sum = crypto.createHash('md5');
		md5sum.update(src);
		return md5sum.digest('hex');
	}
	usersDb = ((config.options || {}).usersDb) || usersDb;
	db = storeConnection.database(usersDb);
	this.login = function(username, password, domain) {
		/* jshint unused: true */
		var def = deferredUtils.defer();
		if (domain) {
			username += '@' + domain;
		}
		db.view('user/active', { key: username, reduce: true }, function (err, resp) {
			if (err) {
				def.reject(err);
			}
			else {
				if ((resp.length === 0) || (resp.length > 1)) {
					def.resolve({result: 'failed'});
				}
				var data = resp[0].value;
				if (password && data.active && data.username === username && data.password === hash(password)) {
					data.result = 'success';
					delete data.password;
					def.resolve(data);
				}
				else {
					def.resolve({result: 'failed'});
				}
			}
		});
		return def.promise;
	};
	function init() {
		/* jshint unused: true */
		var createUser = false;

		var getUserDefer = deferredUtils.defer();
		createUser = getUserDefer.promise;
		db.view('user/active', { key: 'admin', reduce: true }, function (err, user) {
			if (err) {
				getUserDefer.resolve(false);
			}
			else {
				getUserDefer.resolve(user.length === 0);
			}
		});

		deferredUtils.when(createUser, function(createUser) {
			if (createUser) {
				logger.info('ninejs/auth/impl (CouchDB): Creating user "admin" with password "password".');
				db.save('admin', {
					type: 'user',
					username: 'admin',
					password: hash('password'),
					active: true,
					permissions: [
						'administrator'
					]
				}, {
					index: {
						username: 'admin'
					}
				}).then(function () {
					logger.info('ninejs/auth/impl (riak): user "admin" created successfully.');
				}, function (err) {
					logger.info(err);
				});
			}
		});
	}
	function getUser(username) {
		var def = deferredUtils.defer();
		db.view('user/active', { key: username, reduce: true }, function(err, data) {
			if (err) {
				logger.info('ninejs/auth/impl (CouchDB): ' + err);
			}
			else {
				def.resolve(data[0].value);
			}
		});
		return def.promise;
	}
	this.init = init;
	this.getUser = getUser;
};
module.exports = AuthCouchDb;