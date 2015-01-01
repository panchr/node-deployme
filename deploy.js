// deploy.js
// Rushy Panchal
// Licensed under GPL v2.0
// Part of the deployme package

var fs = require("fs"),
	minimist = require("minimist"),
	prompt = require("prompt"),
	underscore = require("underscore"),
	project = require("./project");

// Global configuration

var INPUT_PROPERTIES= [
	{name: "host", description: "Host:".green},
	{name: "port", description: "Port:".green},
	{name: "username", description: "Username:".green},
	{name: "password", description: "Password:".green, hidden: true}
	];

var HELP_DATA = {
	"help": "Displays the help data",
	"init": "Initialize the deploy script configuration",
	"edit": "Edit the configuration script",
	"reset": "Delete the configuration and start over"
	}

prompt.message = "";
prompt.delimiter = "";

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
		}
	else if (command("init")) {
		initializeProject("Welcome to deployme! To start, let's set up some configuration.");
		}
	else if (command("edit")) {
		console.log(cli);
		}
	else if (command("view")) {
		var config = JSON.parse(fs.readFileSync(".deploy-config"));
		console.log(config);
		}
	else if (command("reset")) {
		initializeProject("Reseting current configuration and restarting project.");
		}
	else {
		console.log("Command not found!");
		}
	}

function initializeProject(promptString) {
	// Initialize the project
	console.log(promptString);
	prompt.start();
	prompt.get(INPUT_PROPERTIES, function (err, result) {
		if (err) throw err;
		project.initialize(result);
		});
	}

main();
