// project.js
// Rushy Panchal
// Licensed under the GPL v2.0
// Part of the deployme package

var fs = require("fs"),
	Connection = require("ssh2"),
	underscore = require("underscore");

/*
* Creates a new project object
* @param configPath - path of the configuration file (defaults to ".deploy-config")
* @return Project object
*/
function Project(configPath) {
	var configPath = configPath || ".deploy-config";
	this.configurationPath = configPath;
	this.lastExecuted = "";
	this.completedEvents = [];
	this.handlers = {};
	this.settings = {};
	this.toSync = {
		remoteAdd: [],
		remoteRemove: []
		};
	this.connection = null;
	this.server = null;
	return this;
	}

/*
* Bind a handler to when an event finishes executing
* @param event (optional) - Event name to handle (generally, this is the name of an executed asynchronous function)
* @note If the event name is excluded
* @param eventHandler (optional) - function to call when the event finishes executing (if excluded, this will call all of the handlers)
* @note The eventHandler is passed a single argument: the current Project object
*/
Project.prototype.done = function(event, eventHandler) {
	if (typeof event == "function") { // first argument is a function, so it is implied that the event is the last executed one
		var eventHandler = event;
		var event = this.lastExecuted;
		}
	if (eventHandler && event) {
		if (underscore.contains(this.completedEvents, event)) // event already completed, so call the handler
			eventHandler(this);
		else {
			if (event in this.handlers) 
				this.handlers[event].push(eventHandler);
			else
				this.handlers[event] = new Array(eventHandler);
			}
		}
	else if (event) { // only the event name was provided
		if (event in this.handlers) {
			for (var index = 0; index < this.handlers[event].length; index++) {
				this.handlers[event][index](this);
				}
			this.handlers[event] = []; // remove the waiting handlers because they are finished
			this.completedEvents.push(event); // event is completed :)
			}
		}
	else // no arguments, so call the lastExecuted's done function
		this.done(this.lastExecuted);
	return this;
	}

/*
* Create a new project from a set of options
* @param options.host - Host name of the remote server
* @param options.port - Port to use when connecting to the remote server
* @param options.username - Username to login with
* @param options.password - Password to login to the server
* @param callback (optional) - A callback function when the initialization is complete (this.done is preferred)
*/
Project.prototype.create = function(options, callback) {
	var functionName = "create";
	if (underscore.contains(this.completedEvents, functionName))
		throw functionName + " has already completely executed!";
	this.lastExecuted = functionName;
	callback ? this.done(callback): null;
	var projectObj = this;
	fs.writeFile(this.configurationPath, JSON.stringify(options), function (err) {
		if (err) throw err;
		projectObj.settings = options;
		console.log("Deploy configuration file, " + projectObj.configurationPath.green + ", created with the provided options.");
		projectObj.done(functionNames);
		});
	return this;
	};

/*
* Loads the project initialize
* @param callback (optional) -  A callback function for when the initialization is complete (this.done is preferred)
*/
Project.prototype.initialize = function(callback) {
	var functionName = "initialize";
	if (underscore.contains(this.completedEvents, functionName))
		throw functionName + " has already completely executed!";
	this.lastExecuted = functionName;
	var projectObj = this;
	callback ? this.done(callback): null;
	fs.readFile(this.configurationPath, "utf8", function(err, data) {
		if (err) throw err;
		var settings = JSON.parse(data);
		projectObj.settings = settings;
		projectObj.connection = new Connection();
		projectObj.connection.on('ready', function () {
			 projectObj.connection.sftp(function (err, sftp) {
			 	if (err) throw err;
			 	projectObj.server = sftp;
			 	projectObj.done('connect');
			 	});
			}).connect({
				host: settings.host,
				port: settings.port,
				username: settings.username,
				password: settings.password
				});
		projectObj.done(functionName);
		});
	return this;
	}

/*
* Checks the directory for changes
* @param callback (optional) - A callback function for when the check is completed
*/
Project.prototype.checkChanges = function(callback) {
	var functionName = "checkChanges";
	if (underscore.contains(this.completedEvents, functionName))
		throw functionName + " has already completely executed!";
	this.lastExecuted = functionName;
	var projectObj = this;
	callback ? this.done(callback): null;
	if (! this.server) // server connection not yet established
		throw "Server SFTP connection has not yet been established. Please use Project.done('connection', callback) to wait for the connection.";
	else if (this.toSync.remoteAdd || this.toSync.remoteRemove)
		throw "Currently syncing. Use Project.done('sync', callback) to wait for the sync to finish.";
	var localRoots = this.settings.localRoots, remoteRoots = this.settings.remoteRoots;

	for (var index = localRoots.length -1; index >= 0; index++) {
		var localPath = localRoots[index], remotePath =remoteRoots[index];
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
						project.done(functionName);
					});
				});
			}(this, index == 0);
		}
	}

module.exports = Project;
