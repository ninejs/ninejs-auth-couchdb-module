'use strict';
import Auth from './AuthCouchDb'
import { define } from 'ninejs/modules/moduleDefine'
import Module from 'ninejs/modules/Module'
import CouchDB from 'ninejs-store/CouchDB'
import { NineJs } from 'ninejs/modules/ninejs-server'
export default define(['ninejs', 'ninejs/store/couchdb'], function (provide) {
	provide('ninejs/auth/impl', (config: any, ninejs: NineJs, couchdb: CouchDB) => {
		var log = ninejs.get('logger');
		log.info('ninejs/auth/impl (CouchDB) module starting');
		var auth = new Auth(config, ninejs, couchdb);
		return auth;
	});
});