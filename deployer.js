// project.js
// Rushy Panchal
// Licensed under the GPL v2.0
// Part of the deployme package

var fs = require("fs"),
	Connection = require("ssh2"),
	underscore = require("underscore"),
	emitter = require("events").EventEmitter;

/*
* Creates a new project object
* @param configPath - path of the configuration file (defaults to ".deploy-config")
* @return Project object
*/
function Project(configPath) {
	var configPath = configPath || ".deploy-config";
	this.configurationPath = configPath;
	this.settings = {};
	this.toSync = {
		remoteAdd: [],
		remoteRemove: []
		};
	this.connection = null;
	this.server = null;
	emitter.call(this);
	return this;
	}

Project.prototype.__proto__ = emitter.prototype; // Allow all emitter objects to exist for this as well

/*
* Create a new project from a set of options
* @param options.host - Host name of the remote server
* @param options.port - Port to use when connecting to the remote server
* @param options.username - Username to login with
* @param options.password - Password to login to the server
* @param callback (optional) - A callback function when the initialization is complete (this.on is preferred)
* @return The current Project object
*/
Project.prototype.create = function(options, callback) {
	var functionName = "create";
	callback ? this.on(functionName, callback): null;
	var projectObj = this;
	fs.writeFile(this.configurationPath, JSON.stringify(options), function (err) {
		if (err) throw err;
		projectObj.settings = options;
		projectObj.emit(functionName);
		});
	return this;
	};

/*
* Loads the project initialize
* @param callback (optional) -  A callback function for when the initialization is complete (this.on is preferred)
* @return The current Project object
* @event initialize - when the settings have been loaded (but NOT when the server is connected)
* @event connect - when the SFTP server has been successfully connected to
*/
Project.prototype.initialize = function(callback) {
	var functionName = "initialize";
	callback ? this.on(functionName, callback): null;
	var projectObj = this;
	fs.readFile(this.configurationPath, "utf8", function(err, data) {
		if (err) throw err;
		var settings = JSON.parse(data);
		projectObj.settings = settings;
		projectObj.connection = new Connection();
		projectObj.connection.on('ready', function () {
			 projectObj.connection.sftp(function (err, sftp) {
			 	if (err) throw err;
			 	projectObj.server = sftp;
			 	projectObj.emit('connect');
			 	});
			}).connect({
				host: settings.host,
				port: settings.port,
				username: settings.username,
				password: settings.password
				});
		projectObj.emit(functionName);
		});
	return this;
	}

/*
* Checks the directory for changes
* @param callback (optional) - A callback function for when the check is completed
* @return The current Project object
* @event checkChanges - when the function has completely finished executing; this makes Project.toSync available
*/
Project.prototype.checkChanges = function(callback) {
	var functionName = "checkChanges";
	callback ? this.on(functionName, callback): null;
	var projectObj = this;
	if (! this.server) // server connection not yet established
		throw "Server SFTP connection has not yet been established. Please use Project.on('connection', callback) to wait for the connection.";
	else if (this.toSync.remoteAdd.length > 0 || this.toSync.remoteRemove.length > 0)
		throw "Currently syncing. Use Project.on('sync', callback) to wait for the sync to finish.";
	var localRoots = this.settings.localRoots, remoteRoots = this.settings.remoteRoots;
	for (var index = localRoots.length -1; index >= 0; index--) {
		var localPath = localRoots[index], remotePath =remoteRoots[index];
		console.log(index);
		function asyncHelper(project, lastItem) {
			project.server.readdir(remotePath, function (err, remoteList) {
				if (err) throw err;
				var remoteList = underscore.map(remoteList, function (file) {
					return file.filename;
					});
				fs.readdir(localPath, function (err, localList) {
					if (err) throw err;
					var newUploads = underscore.difference(localList, remoteList);
					var toDelete = underscore.difference(remoteList, localList);
					project.toSync.remoteAdd = project.toSync.remoteAdd.concat(newUploads);
					project.toSync.remoteRemove = project.toSync.remoteRemove.concat(toDelete);
					if (lastFile)
						console.log("emitting " + functionName);
						project.emit(functionName);
					});
				});
			}(this, index == 0);
		}
	return this;
	}

module.exports = Project;
