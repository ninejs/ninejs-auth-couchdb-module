/*
 * ninejs grunt configuration file
 */
function exports(grunt) {
	'use strict';

	var tsfiles = ['**/*.ts', '!node_modules/**/*.ts', '!**/*.d.ts'],
		Q = require('kew');

	require('load-grunt-tasks')(grunt);
	// Project configuration.
	grunt.initConfig({
		ts: {
			default : {
				tsconfig: './tsconfig.json',
				options: {
					"compiler": "./node_modules/typescript/bin/tsc"
				}
			}
		},
		tsd: {

		}
	});

	grunt.loadNpmTasks('grunt-globaltsd');
	grunt.registerTask('tsd','Install TypeScript definitions', function() {
		var done = this.async(),
			command = 'node',
			path = require('path'),
			cliPath = path.resolve(__dirname, 'node_modules', 'tsd', 'build', 'cli.js');

		var childProcess = require('child_process'),
			defer = Q.defer();
		var tsdProcess = childProcess.spawn(command, [cliPath, 'install'], { stdio: 'inherit' });
		tsdProcess.on('exit', function(/*code*/) {
			defer.resolve();
		});
		defer.promise.then(function () {
			done();
		});
	});
	// Default task.
	grunt.registerTask('default', ['tsd', 'ts']);

}

module.exports = exports;