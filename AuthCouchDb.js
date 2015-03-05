'use strict';
var deferredUtils = require('ninejs/core/deferredUtils'),
	crypto = require('crypto'),
	AuthCouchDb,
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
		var def = deferredUtils.defer(),
			self = this,
			bucket = db.bucket(usersDb);
		if (domain) {
			username += '@' + domain;
		}
		bucket.objectsFromIndex('username', username).then (function (resp) {
			if ((resp.data.length === 0) || (resp.data.length > 1)) {
				def.resolve({ result: 'failed' });
			}
			var data = resp.data[0];
			if (password && data.active && data.username === username && data.password === hash(password)) {
				data.result = 'success';
				def.resolve(data);
			}
			else {
				def.resolve({ result: 'failed' });
			}
		}, function (err) {
			def.reject(err);
		});
		return def.promise;
	};
	function init() {
		/* jshint unused: true */
		var createUser = false;

		var getUserDefer = deferredUtils.defer();
		createUser = getUserDefer.promise;
		bucket.keysFromIndex('username', 'admin')
			.then (function (resp) {
				getUserDefer.resolve(resp.data.length === 0);// resp.data === null);
			}, function (/* err */) {
				getUserDefer.resolve(false);
			});

		deferredUtils.when(createUser, function(createUser) {
			if (createUser) {
				logger.info('ninejs/auth/impl (CouchDB): Creating user "admin" with password "password".');
				bucket.save('admin', {
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
		db.get(username, function(err, data) {
			if (err) {
				logger.info('ninejs/auth/impl (CouchDB): ' + err);
			}
			else {
				def.resolve(data);
			}
		});
		return def.promise;
	}
	this.init = init;
	this.getUser = getUser;
};
module.exports = AuthCouchDb;