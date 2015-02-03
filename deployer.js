// deployme.js
// Rushy Panchal
// Syncs multiple folders to a remote directory

var EventEmitter = require("events").EventEmitter,
	_ = require("underscore"),
	Connection = require("ssh2");

var fs = require("fs"),
	path = require("path"),
	util = require("util");

var emitter = new EventEmitter();

/**
* The Sync object allows you to control upstream deployment
* @class Sync
* @constructor
* @param {String} path filepath of the configuration file
*/
function Sync(path) {
	this.configurationPath = path;
	this.config = null;
	this.connection = null;
	this.sftp = null;
	this.status = {
		syncCalculated: false,
		syncCompleted: false,
		stepsCompleted: 0,
		filesCompleted: 0
		}
	this.toSync = {
		remoteAdd: {},
		remoteUpdate: {},
		remoteDelete: [],
		};
	}

util.inherits(Sync, EventEmitter);

/**
* Initialize the sync object and load the configuration
* @return {Sync} the current object for method chaining
*/
Sync.prototype.initialize = function() {
	// Initialize the syncer
	if (this.config == null) {
		this.config = JSON.parse(fs.readFileSync(this.configurationPath));
		}
	return this;
	}

/**
* Initialize the sync object and load the configuration
* @return {Sync} the current object for method chaining
*/
Sync.prototype.save = function() {
	// Save the configuration
	if (this.config) {
		fs.writeFileSync(this.configurationPath, JSON.stringify(this.config));
		}
	return this;
	}

/**
* Connect to the server, calculate changes, and the sync the changes
* @return {Sync} the current object for method chaining
*/
Sync.prototype.run = function() {
	// Run the syncing process
	return this.connect().calculate().sync();
	}

/**
* Connect to the remote server
* @return {Sync} the current object for method chaining
*/
Sync.prototype.connect = function() {
	// Connect to the server
	if (this.connection == null) {
		var syncer = this;
		this.connection = new Connection();

		this.connection.connect({
			host: this.config.host,
			port: this.config.port,
			username: this.config.username,
			password: this.config.password
			});

		this.connection.once('ready', function() {
			syncer.emit('connection-ready');
			syncer.connection.sftp(function (err, sftp) {
				if (err) throw err;
				syncer.sftp = sftp;
				console.log("Connected: " + syncer.config.username + "@" + syncer.config.host + ":" + syncer.config.port);
				syncer.emit('sftp-ready');
				syncer.emit('ready');
				});
			});

		this.once('done', function () {
			syncer.close()
			});
		}

	return this;
	}

/**
* Close the server connection
* @return {Sync} the current object for method chaining
*/
Sync.prototype.close = function() {
	// Close the server install
	if (this.connection) {
		this.connection.end();
		this.connection = null;
		this.sftp = null;
		}
	return this;
	}

/**
* Calculate the changes to be synced
* @return {Sync} the current object for method chaining
*/
Sync.prototype.calculate = function () {
	// Calculate the changes to be synced
	if (! this.status.syncCalculated) {
		var syncer = this;
		if (this.sftp == null) {
			this.once('ready', function() {
				syncer.calculate();
				});
			}
		else {
			var totalSteps = this.config.local.directories.length;
			this.on('sync-step', function () {
				if (++syncer.status.stepsCompleted == totalSteps) {
					syncer.status.syncCalculated = true;
					syncer.emit('sync-calculated');
					}
				});
			for (var index = 0; index < totalSteps; index++) {
				var relativeLocal = this.config.local.directories[index];
				var localPath = this.config.local.root + relativeLocal;
				var remotePath = this.config.remote.root + relativeLocal;
				calculateSyncDir(this, localPath, remotePath);
				}
			}
		}

	return this;
	}

/**
* Sync the changes to the server
* @return {Sync} the current object for method chaining
*/
Sync.prototype.sync = function() {
	// Sync with the database
	var syncer = this;
	if (this.sftp == null) {
		this.once('ready', function () { // once the connection is ready, we can proceed
			syncer.sync();
			});
		}
	else if (! this.status.syncCalculated) {
		this.once('sync-calculated', function () { // once the sync is calculated, we can proceed
			syncer.sync();
			});
		}
	else if (! this.status.syncCompleted) { // sync all files
		syncFiles(this, this.sftp, this.toSync);
		}
	return this;
	}

/**
* Calculate the sync changes required for a given directory
* @param {Sync} syncer Sync object to use
* @param {String} localPath local path to check for changes
* @param {String} remotePath remote path to check for changes
*/
function calculateSyncDir(syncer, localPath, remotePath) {
	// Calculate the sync for one directory
	var sftp = syncer.sftp;
	fs.readdir(localPath, function (err, localFiles) {
		if (err) throw err;
		console.log("\tLocal directory " + localPath + " read!");
		sftp.readdir(remotePath, function (err, remoteFiles) {
			var calculateDifferences = function (remoteFiles) {
				console.log("\tRemote directory " + remotePath + " read!");
				var  remoteFilenames = _.map(remoteFiles, function (item) {return item.filename});
				var toAdd = _.difference(localFiles, remoteFilenames);
				var mayUpdate = _.intersection(localFiles, remoteFilenames);
				var toDelete = _.map(_.difference(remoteFilenames, localFiles), function (path) {return remotePath + "/" + path});
				var remoteMapping = _.object(remoteFilenames, remoteFiles);

				for (var fileIndex = 0; fileIndex < toAdd.length; fileIndex++) {
					var fileName = toAdd[fileIndex];
					var localFilePath = localPath + "/" + fileName;
					var remoteFilePath = remotePath + "/" + fileName;
					syncer.toSync.remoteAdd[localFilePath] = remoteFilePath;
					}
				for (var fileIndex = 0; fileIndex < mayUpdate.length; fileIndex++) {
					var fileName = mayUpdate[fileIndex];
					var localFilePath = localPath + "/" + fileName;
					var remoteFilePath = remotePath + "/" + fileName;
					var localMtime = fs.statSync(localFilePath).mtime.getTime() / 1000;
					var remoteMTime = remoteMapping[fileName].attrs.mtime;
					if (localMtime > remoteMTime) {
						syncer.toSync.remoteUpdate[localFilePath] = remoteFilePath;
						}
					}
				syncer.toSync.remoteDelete = syncer.toSync.remoteDelete.concat(toDelete);
				syncer.emit('sync-step');
				}

			if (err == "Error: No such file") { // if path doesn't exist, make it and try again
				sftp.mkdir(remotePath, function (err) {
					if (err) throw err;
					console.log("Remote directory, " + remotePath + " created");
					sftp.readdir(remotePath, function (err, remoteFiles) {
						if (err) throw err;
						calculateDifferences(remoteFiles);
						})
					});
				}
			else if (err) throw err;
			calculateDifferences(remoteFiles);
			});
		});
	}

/**
* Sync the files to the server
* @param {EventEmitter} emitter an object that supports async event missions
* @param {ssh2.SFTP} sftp the SFTP object
* @param {Sync} sync the Sync object
*/
function syncFiles(emitter, sftp, sync) {
	// Syncs files to the server
	console.log("\n\tStarting File Sync...");
	var totalLength = Object.keys(sync.remoteAdd).length + Object.keys(sync.remoteUpdate).length + sync.remoteDelete.length;
	if (totalLength == 0) {
		console.log("\t\tLocal and remote directories already synced!");
		emitter.emit('done');
		}

	emitter.on('sync-file', function () {
		if (++emitter.status.filesCompleted == totalLength) {
			emitter.status.sync = true;
			emitter.emit('done');
			}
		});

	for (var localPath in sync.remoteAdd) {
		var remotePath = sync.remoteAdd[localPath];
		(function (localPath, remotePath) {
			sftp.fastPut(localPath, remotePath, function (err) {
				if (err) throw err;
				console.log("\t\tLocal: " + localPath + " --> " + remotePath);
				emitter.emit('sync-file');
				});
			}(localPath, remotePath));
		}

	for (var index = 0; index < sync.remoteDelete.length; index++) {
		var remotePath = sync.remoteDelete[index];
		(function (remotePath) {
			sftp.unlink(remotePath, function (err) {
				if (err) throw err;
				console.log("\t\tRemote: " + remotePath + " deleted.");
				emitter.emit('sync-file');
				});
			}(remotePath));
		}

	for (var localPath in sync.remoteUpdate) {
		var remotePath = sync.remoteUpdate[localPath];
		(function (localPath, remotePath) {
			sftp.unlink(remotePath, function (err) {
				if (err) throw err;
				console.log("\t\tRemote: " + remotePath + " deleted.");
				sftp.fastPut(localPath, remotePath, function (err) {
					if (err) throw err;
					console.log("\t\tLocal: " + localPath + " --> " + remotePath);
					emitter.emit('sync-file');
					});
				});
			}(localPath, remotePath));
		}
	}

/**
* Main method, which uses the default .deploy-config file
* @return {Sync} the Sync object
*/
function main() {
	// Main function
	var syncer = new Sync(".deploy-config");
	syncer.run();
	syncer.once('done', function () {
		process.exit();
		});
	return syncer;
	}

if (require.main === module) {
	main();
	}
else {
	module.exports = Sync;
	}
