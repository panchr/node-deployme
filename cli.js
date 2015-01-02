// deploy.js
// Rushy Panchal
// Licensed under GPL v2.0
// Part of the deployme package

var fs = require("fs"),
	minimist = require("minimist"),
	prompt = require("prompt"),
	underscore = require("underscore"),
	Deployer = require("./deployer");

// Global configuration

var INPUT_PROPERTIES= [
	{name: "host", description: "Host:".green},
	{name: "port", description: "Port:".green},
	{name: "username", description: "Username:".green},
	{name: "password", description: "Password:".green, hidden: true},
	{name: "localRoots", description: "Root Local Directories:".green},
	{name: "remoteRoots", description: "Root Remote Directories:".green}
	];

var HELP_DATA = {
	"help": "Displays the help data",
	"init": "Initialize the deploy script configuration",
	"edit": "Edit the configuration script",
	"reset": "Delete the configuration and start over"
	}

prompt.message = "";
prompt.delimiter = "";

var project = new Deployer(".deploy-config");

function main() {
	// Main function
	var cli = minimist(process.argv.slice(2))
	command = function(key) {
		return (cli[key] || underscore.contains(cli._, key));
		};

	if (command("help")) {
		console.log("Welcome to deployme! This is a command-line-interface (CLI) tool \
to deploy mostly static content to servers, that would \
otherwise add too much bulk to a git repository.");
		console.log("\ndeployme's commands are listed below.\n");
		for (var key in HELP_DATA) {
			console.log("\t" + key.green + ": " + HELP_DATA[key]);
			}
		process.exit();
		}
	else if (command("init")) {
		initializeProject("Welcome to deployme! To start, let's set up some configuration.\
Delimit the list of local and remote lists with commas. The lengths of each should be equal.");
		}
	else if (command("reset")) {
		initializeProject("Reseting current configuration and restarting project.");
		}
	else {
		project.initialize(); // load configuration and connect to the server

		if (command("edit")) {
			console.log(cli);
			}
		else if (command("view")) {
			project.on('initialize', function() {
				console.log(project.settings);
				process.exit();
				});
			}
		else if (command("diff")) {
			project.on('connect', function() {
				project.checkChanges();
				project.on('checkChanges', function() {
					console.log(project.toSync);
					process.exit();
					});
				});
			}
		else {
			console.log("Command not found!");
			process.exit();
			}
		}
	}

function initializeProject(promptString) {
	// Initialize the project
	console.log(promptString);
	prompt.start();
	prompt.get(INPUT_PROPERTIES, function (err, result) {
		if (err) throw err;
		result.localRoots = result.localRoots.split(", ");
		result.remoteRoots = result.remoteRoots.split(", ");
		if (result.localRoots.length != result.remoteRoots.length) throw "Remote and local roots must have the same number of elements";
		project.create(result);
		project.on('create', function() {
			console.log("Deploy configuration file, " + project.configurationPath.green + ", created with the provided options.\nDone initializing project!");
			process.exit();
			});
		});
	}

main();
