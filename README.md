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

## Usage
`deployme` comes with a few useful commands:
- [init](#init)
- [reset](#reset)
- [help](#help)
- [diff](#diff)
- [sync](#sync)

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
