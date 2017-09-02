'use strict';

import { ncall } from 'ninejs/core/deferredUtils'
import { NineJs } from 'ninejs/modules/ninejs-server'
import { default as CouchDB, CouchConnection, Database, ViewParameters } from 'ninejs-store/CouchDB'
import { create as createDb } from 'ninejs-store/couchdb/couchUtils'
import hashMethod from './hashMethod'
import designUsers from './design/users'


class AuthCouchDb {
	usersDb: string;
	storeConnection: CouchConnection;
	db: Database;
	hash: (username: string, password: string) => string;
	documentName: string;
	config: any;
	constructor (config: any, ninejs: NineJs, couchdb: CouchDB) {
		let couchdbConnectionName = (config.options || {}).couchDbConnection;
		let couchDbConnection = couchdb.connection(couchdbConnectionName);
		this.usersDb = ((config.options || {}).usersDb) || this.usersDb;
		this.storeConnection = couchDbConnection;
		this.db = this.storeConnection.database(this.usersDb);
		this.config = config;
	}




	async login (username: string, password: string, domain?: string) {
		/* jshint unused: true */
		if (domain) {
			username += '@' + domain;
		}
		let resp = await ncall<any>(this.db.view, this.db, this.documentName + '/active', { key: username, reduce: true, group: true });
		if ((resp.length === 0) || (resp.length > 1)) {
			return {result: 'failed'};
		}
		let data: any;
		if (Array.isArray(resp[0].value)) {
            data = resp[0].value[0];
		}
		else {
            data = resp[0].value;
		}
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
			return {result: 'failed'};
		}
	}
	async usersByPermission (permissions?: string[]): Promise<any> {
		let self = this,
			args: ViewParameters = { reduce: true };
		if (typeof(permissions) !== 'undefined') {
			args.keys = permissions;
			args.group = true;
		}
		try {
			let users = await ncall<any[]>(this.db.view, this.db, self.documentName + '/byPermissions', args);
			return users[0].value;
		}
		catch (err) {
			console.error(err);
			throw err;
		}
	}
	users () {
		return this.usersByPermission();
	}
	async permissions (): Promise<any> {
		try {
			let permissions = await	ncall<any[]>(this.db.view, this.db, this.documentName + '/permissions', {reduce: true, group: true});
			return permissions[0].value;
		}
		catch (err) {
			console.error(err);
			throw err;
		}
	}
	async init () {
		/* jshint unused: true */
		let	options = this.config.options || {},
			documentName = options.documentName || 'user',
			defaultUserName = options.defaultUserName || 'admin',
			defaultPassword = options.defaultPassword || 'password',
			defaultPermissions = options.defaultPermissions || ['administrator'],
			hash = hashMethod(options.hashMethod, options.hashEncoding);
		this.documentName = documentName;
		this.hash = hash;

		try {
			let dbExists = await ncall<boolean>(this.db.exists, this.db);
			if (!dbExists) {
				await createDb(this.db);
			}
			await designUsers(this.db, this.config);
			let user = await ncall<any[]>(this.db.view, this.db, documentName + '/active', { key: defaultUserName, reduce: true });
			if (user.length === 0) {
				console.log('ninejs/auth/impl (CouchDB): Creating user "' + defaultUserName + '" with password "' + defaultPassword + '".');
				await ncall(this.db.save, this.db, {
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
	}
	async getUser (username: string) {
		try {
			let data = await ncall<any[]>(this.db.view, this.db, this.documentName + '/active', { key: username, reduce: true });
			return data[0].value;
		} catch (err) {
			console.error(err);
			throw err;
		}
	}
}
AuthCouchDb.prototype.usersDb = 'users';
export default AuthCouchDb;