deployme
==========

An automated tool to deploy untracked files to servers (such as images) through the use of SFTP.

## Installation
### npm
The Node-package-manager (npm) is the recommended way to install `deployme`. To install via `npm`, run `npm install deployme -g`. The `-g` parameter specifies that the package should be installed globally, which is recommended for nearly every use case.

In addition, there are a few other varieties to installing via `npm`:
```bash
# install through this GitHub repository
npm install panchr/deployme -g

# Install directly through GitHub
npm install https://github.com/panchr/node-deployme.git -g

```

### git
To install via git, run these commands in your terminal of choice:

```bash
git clone https://github.com/panchr/node-deployme.git
cd node-deployme
```

Now, you can directly access the CLI (Command Line Interface) by using `./bin/cli`.
Again, I highly recommend using `npm` instead.

---

## Configuration
The CLI tool uses the default configuration file, `.deploy-config`. To generate a standard configuration file, run `deployme init`.
This will generate the configuration file in the current directory.

*Note: `deployme` will search for a `.deploy-config` file in any of the parent directories of the current working directory. So, it is possible to run the tool in any subdirectory of a project.*

The configuration options are stored as standard JSON.

|name|description|type|default value|
|----|-----------|----|-------------|
|host|The host name of the server|String|"localhost"
|port|Port to connect to the server with|int|22
|username|The username to connect with|String|"root"
|password|The password of the above user|String|""
|local|An object of local configuration|Object|{}
|local.root|The local root of the files to sync|String|"."
|local.directories|The local directories to sync|Array|[]
|local.files|The local files to sync **(not supported yet)**|Array|[]
|remote|An object of remote configuration|Object|{}
|remote.root|The remote root to sync to|String|"/"

For example, here is a sample configuration file:
```json
{
	"host": "myserver.io",
	"port": 22,
	"username": "panchr",
	"password": "v3rys3cure",
	"local": {
		"root": "static",
		"directories": ["images", "icons"],
		"files": ["myfavicon.ico", "secure.js"]
	},
	"remote": {
		"root": "/var/www/site"
	}
}
```

## Usage
`deployme` comes with a few useful commands:
- [init](#init)
- [reset](#reset)
- [help](#help)
- [diff](#diff)
- [sync](#sync)
- [local](#local)
- [remote](#remote)

### init
This is the initialization script. To use it, run `deployme init`. It will walk you through the setup of the main configuration file, `.deploy-config`.

### reset
Reset is very similar to `init`. In fact, it provides the same functionality but allows you to override previous options. It is invoked via `deployme reset`.

### help
To get a list of commands and what they do, use `deployme help`.

### diff
To see what the files that need to be synced, run `deployme diff`.

### sync
Finally, `deployme sync` will calculate the required changes to be synced and then upload the appropriate files to the remote server.

### local
`deployme local` provides a series of subcommands that allows you to configure the local settings of the syncer:

|Subcommand|Argument|Description|Example|
|----------------|------------|-------------|----------|
|`root`|path|Set the local root path to the file path|`deployme local root /static`|
|`add`|path|Add a local path to be synced|`deployme local add /test`|
|`add`|glob pattern|Add matching local paths to be synced|`deployme local add *.css`|
|`remove`|path|Remove a local path from being synced|`deployme local remove mystyle.css`|
|`remove`|glob pattern|Remove matching local paths from being synced|`deployme local remove test/*`|

### remote
`deployme remote` only provides one command so far, but more will be added soon. Each subcommand allows you to configure the remote settings of the syncer:

|Subcommand|Argument|Description|Example|
|----------------|------------|-------------|----------|
|`root`|filepath|Set the remote root path to "filepath"|`deployme remote root /var/www/static`|
