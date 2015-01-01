// project.js
// Rushy Panchal
// Licensed under the GPL v2.0
// Part of the deployme package

var fs = require("fs"),
	Connection = require("ssh2");

module.exports = {
	initialize: function(options) {
		// Initialize a deployment script
		fs.writeFile(".deploy-config", JSON.stringify(options), function (err) {
			if (err) throw err;
			console.log("Deploy configuration file, " + ".deploy-config".green + " , created with the provided options.");
			});
		}
	};
