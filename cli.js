// deploy.js
// Rushy Panchal
// Licensed under GPL v2.0
// Part of the deployme package

var fs = require("fs");

var minimist = require("minimist"),
	prompt = require("prompt"),
	_ = require("underscore"),
	Deployer = require("./deployer");

// Global configuration

var INPUT_PROPERTIES= [
	{name: "host", description: "Host:".green},
	{name: "port", description: "Port:".green},
	{name: "username", description: "Username:".green},
	{name: "password", description: "Password:".green, hidden: true},
	{name: "localRoot", description: "Root Local Directory:".green},
	{name: "localDirectories", description: "Local directories:".green},
	{name: "localFiles", description: "Local files:".green},
	{name: "remoteRoot", description: "Root Remote Directory:".green}
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
	var cli = minimist(process.argv);
	command = function(key) {
		return (cli[key] || _.contains(cli._, key));
		};

	if (command("help")) {
		console.log("Welcome to deployme! This is a command-line-interface (CLI) tool \
to deploy mostly static content to servers, that would \
otherwise add too much bulk to a git repository.");
		console.log("\ndeployme's commands are listed below.\n");
		for (var key in HELP_DATA) {
			console.log("\t" + key.green + ": " + HELP_DATA[key]);
			}
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
		if (command("view")) {
			console.log(project.config);
			}
		else if (command("diff")) {
			project.connect().calculate();
			if (! project.toSync.syncCalculated) {
				project.once('sync-calculated', function () {
					console.log(project.toSync);
					project.close();
					process.exit();
					});
				}
			else {
				console.log(project.toSync);
				project.close();
				process.exit();
				}
			}
		else if (command("sync")) {
			project.run();
			project.once('done', function () {
				project.close();
				process.exit();
				});
			}
		else {
			console.log("Command not found!");
			}
		}
	}

function initializeProject(promptString) {
	// Initialize the project
	console.log(promptString);
	prompt.start();
	prompt.get(INPUT_PROPERTIES, function (err, result) {
		if (err) throw err;
		var config = {
			host: result.host,
			port: result.port,
			username: result.username,
			password: result.password,
			local: {
				root: result.localRoot,
				directories: _.map(result.localDirectories.split(", "), function (dirPath) {return "/" + dirPath}),
				files: result.localFiles.split(", ")
				},
			remote: {
				root: result.remoteRoot,
				}
			};

		fs.writeFileSync(".deploy-config", JSON.stringify(config));
		console.log("Deploy configuration file, " + project.configurationPath.green + ", created with the provided options.\nDone initializing project!");
		process.exit();
		});
	}

main();
