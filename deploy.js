
var Connection = require("ssh2"),
	minimist = require("minimist"),
	fs = require("fs");

function main() {
	// Main function
	var cli = minimist(process.argv.slice(2))
	keyExists = function(key) {
		return (cli[key] || underscore.contains(cli._, key));
		};
	var options = JSON.parse(fs.readFileSync(".deploy-config"));
	if (keyExists("init")) {
		console.log("Welcome to deploy! To start, let's set up some configuration.");
		process.stdin.resume();
		process.stdin.setEncoding("utf8");
		// get input
		}
	}

main();
