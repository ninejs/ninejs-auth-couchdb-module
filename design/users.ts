'use strict';
import {Logger} from 'ninejs/modules/ninejs-server';
import {Database} from '../cradle';

import { all, defer, PromiseType } from 'ninejs/core/deferredUtils'
import { merge } from '../cradle'
import { mergeWithoutConflict } from '../couchUtils'
import hashMethod from '../hashMethod'

let	emit: any; //just to pass linter

function getUserDesignDocument (config: any) {
	var documentName = config.documentName || 'user';
	return {
		'_id': '_design/' + documentName,
		'language': 'javascript',
		'views': {
			'active': {
				'map': function (doc: any) {
					if ((doc.type === 'user') && (doc.active)) {
						emit(doc.username, doc);
					}
					else if (doc.type === 'updateUser') {
						emit(doc.username, doc);
					}
				}.toString(),
				'reduce': function (keys: any, values: any, reReduce: boolean) {
					/* jshint unused: true */
					function isArray(v: any) {
						return Object.prototype.toString.call(v) === '[object Array]';
					}

					var r = values.sort(function (a: any, b: any) {
						if ((a.created || 0) < (b.created || 0)) {
							return -1;
						}
						else {
							return 1;
						}
					}).reduce(function (state: any, next: any) {
						if (next.type === 'user') {
							return next;
						}
						else if (next.type === 'updateUser') {
							var added = next.add || {},
								updated = next.update || {},
								deleted = next.delete || {},
								p: string,
								arr: any[],
								arrPushI = function (i: any) {
									arr.push(i);
								},
								deleteReduce = function (state: any, next: any) {
									return state.filter(function (i: any) {
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
								var p: string;
								for (p in updated) {
									if (updated.hasOwnProperty(p)) {
										state[p] = updated[p];
									}
								}
							})();
							(function () {
								var p: string;
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
					}, {created: -1});
					return reReduce ? [r] : r;
				}.toString()
			},
			'byPermissions': {
				'map': function (doc: any) {
					if (doc.type === 'user') {
						(doc.permissions || []).forEach (function (p: string) {
							emit(p, { username: doc.username, created: doc.created, add: true });
						});
					}
					else if (doc.type === 'updateUser') {
						((doc.add || {}).permissions || []).forEach (function (p: string) {
							emit(p, { username: doc.username, created: doc.created, add: true });
						});
						((doc.delete || {}).permissions || []).forEach (function (p: string) {
							emit(p, { username: doc.username, created: doc.created, add: false });
						});
					}
				}.toString(),
				'reduce': function (keys: any, values: any, reReduce: boolean) {
					/* jshint unused: true */
					function isArray(v: any) {
						return Object.prototype.toString.call(v) === '[object Array]';
					}

					var r = values.sort(function (a: any, b: any) {
						if ((a.created || 0) < (b.created || 0)) {
							return -1;
						}
						else {
							return 1;
						}
					}).reduce(function (state: any, next: any) {
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
					return Object.keys(r).filter (function (k) { return r[k] > 0; });
				}.toString()
			},
			'permissions': {
				'map': function (doc: any) {
					if (doc.type === 'user') {
						(doc.permissions || []).forEach (function (p: string) {
							emit(null, p);
						});
					}
					else if (doc.type === 'updateUser') {
						((doc.add || {}).permissions || []).forEach (function (p: string) {
							emit(null, p);
						});
						//((doc.delete || {}).permissions || []).forEach (function (p) {
						//	emit(null, p);
						//});
					}
				}.toString(),
				'reduce': function (keys: any, values: any, reReduce: boolean) {
					/* jshint unused: true */
					var r: any = {};
					values.forEach(function (v: string) {
						r[v] = true;
					});
					return Object.keys(r);
				}.toString()
			}
		}
	};
}

function differ(existing: any, data: any) {
	if ((existing._id === data._id) && (existing.language === data.language)) {
		return Object.keys(data.views).some(function(viewKey) {
			var existingView = existing.views[viewKey],
				dataView = data.views[viewKey];
			if (!existingView) {
				return true;
			}
			return Object.keys(dataView).some(function(propKey) {
				return dataView[propKey] !== existingView[propKey];
			});
		});
	} else {
		return false;
	}
}

export default function checkDb(db: Database, log: Logger, config: any, justCreated?: boolean) {
	var userDefer = defer(),
		createdDefer = defer(),
		config = config || {},
		options = config.options || {},
		documentName = options.documentName || 'user',
		defaultUserName = options.defaultUserName || 'admin',
		defaultPassword = options.defaultPassword || 'password',
		hash = hashMethod(options.hashMethod, options.hashEncoding);
	if (!justCreated) {
		createdDefer.resolve(true);
	}
	else {
		log.info('Creating auth\'s default user \"' + defaultUserName  + '\" with password \"' + defaultPassword + '\"');
		mergeWithoutConflict(db, undefined, {
			type: 'user',
			username: defaultUserName,
			password: hash(defaultUserName, defaultPassword),
			active: true
		}, function(err: Error) {
			if (err) {
				log.error(err);
				createdDefer.reject(err);
			} else {
				createdDefer.resolve(true);
			}
		});
	}
	let user = getUserDesignDocument (config);

	db.get('_design/' + documentName, function(err: any, data: any) {
		if (err) {
			log.info('Attempting to reconstruct _design/' + documentName);
			mergeWithoutConflict(db, '_design/' + documentName, user, function(err: any) {
				if (err) {
					log.error(err);
					userDefer.reject(err);
				} else {
					userDefer.resolve(true);
				}
			});
		} else {
			if (differ(data, user)) {
				log.info('Updating _design/' + documentName);
				mergeWithoutConflict(db, '_design/' + documentName, merge({}, data, user), function(err: any) {
					if (err) {
						userDefer.reject(err);
						log.info(err);
					} else {
						userDefer.resolve(true);
					}
				});
			} else {
				userDefer.resolve(true);
			}
		}
	});

	return all([userDefer.promise, createdDefer.promise]);
}