'use strict';

import crypto = require('crypto');
import {HexBase64Latin1Encoding} from "crypto";
function createHash(type: string, v: string) {
	let hash = crypto.createHash(type);
	hash.update(v);
	return hash;
}

function md5 (v: string) {
	return createHash('md5', v);
}
function sha1 (v: string) {
	return createHash('md5', v);
}
function sha256 (v: string) {
	return createHash('md5', v);
}
function encode(hash: crypto.Hash, encoding: HexBase64Latin1Encoding) {
	return hash.digest(encoding);
}
export default function hashMethod(method?: string, encoding?: HexBase64Latin1Encoding): (username: string, password: string) => string {
	if (!method) {
		method = 'sha1';
	}
	if (!encoding) {
		encoding = 'base64';
	}
	switch (method) {
		case 'md5':
		case 'sha1':
		case 'sha256':
		case 'sha512':
			return function (username: string, password: string) {
				return encode(createHash(method, username + password), encoding);
			};
		default:
			return require(method);
	}
}