'use strict';
import { merge, Database } from './cradle'

export function mergeWithoutConflict(db: Database, id: string, doc: any, callback: (err: any, data: any) => void, condition?: (data: any) => boolean) {
	if ((id !== null) && (id !== undefined)) {
		id = id + '';
	}
	let myCallback = (err: any, data: any) => {
		if (err && err.error === 'conflict') {
			setTimeout(function() {
				mergeWithoutConflict(db, id, doc, callback, condition);
			}, 50);
		}
		else {
			callback.apply(null, arguments);
		}
	};
	if ((id !== null) && (id !== undefined)) {
		db.get(id, function(err, data) {
			if (err) {
				db.save(id, doc, myCallback);
			}
			else {
				if (!condition || condition(data)) {
					var merged = merge({}, data, doc);
					merged['_rev'] = data['_rev'];
					db.save(id,
						merged['_rev'],
						merged,
						myCallback);
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

export function removeWithoutConflict(db: Database, id: string, callback: (err: any, data: any) => void) {
	var myCallback = function(err: any, data: any) {
		if (err && err.error === 'conflict') {
			//console.log('update conflicted, retrying');
			setTimeout(function() {
				removeWithoutConflict(db, id, callback);
			}, 50);
		}
		else {
			if (callback) {
				callback.apply(null, arguments);
			}
		}
	};
	db.get(id, function(err, data) {
		if (err) {
			console.log(err);
			myCallback.apply(null, arguments);
		}
		else {
			db.remove(id, data['_rev'], myCallback);
		}
	});
}


