'use strict';
import Auth from './AuthCouchDb'
import { define } from 'ninejs/modules/moduleDefine'
import Module from 'ninejs/modules/Module'
export default define(['ninejs'], function (provide) {
	provide('ninejs/auth/impl', (config, ninejs) => {
		var log = ninejs.get('logger');
		log.info('ninejs/auth/impl (CouchDB) module starting');
		var auth = new Auth(config, ninejs);
		return auth;
	});
});