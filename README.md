THINGS YOU WILL LEARN

linux - cron and rsync

production pm2

cross platform rsyn and robocopy

WORK IN PROGRESS

npm init -y

nohup node backup.js > /dev/null &

sudo gedit /etc/systemd/logind.conf

HandleLidSwitch=ignore – do nothing.

https://crontab.guru/#0_3_*__\__

I imagine like many other people out there, I have quite a few assorted documents and photos that are rather important to me. Although I know I have at least one copy of these locally and I use Dropbox as cloud storage, I'll admit I don't meet the coveted [3-2-1 backup strategy](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/) requirements.

Over the holiday I received a new 4TB hard drive and with it, a renewed interest in backing up my data (at least the important stuff like pictures of my kids and financial records; even in the worst case scenario I could probably replace my Star Trek TNG bluray rips).

So with that in mind, I decided to combine it with an exercise that dives a bit further than I usually go into the Node.js ecosystem. 

This tutorial is the result of that exploration, and the result is a little tool for synchronizing backup copies of any directory on your machine. As a bonus we're going to configure it to support Linux, Mac and Windows.

```bash
npm init -y
```

Next we install the three dependency libraries for the project:

```bash
npm install cron rsync dotenv
```

Here's what each one is used for:

- **cron**: Will allow us to schedule the backup at specific intervals. This package uses a Javascript implementation of the _cron_ syntax and not the actual _cron_ daemon meaning we don't need to worry about OS compatibility issues with this package.

- **rsync**: This will handle the copying and syncing of files for us. This package _does_ use the actual `rsync` program installed on the user's machine so we will have to manage compatibility within our Node.js app for this one.

- **dotenv**: Allows us to read `.env` files from our project directory. This will let us include our personal directory paths and also our private Discord webhook without sharing that data in the git repo. Users who clone the project can provide their own values.

Let's create a Javascript file called `backup.js` and get the absolute basics working:

`backup.js`

```js
const CronJob = require("cron").CronJob;
const Rsync = require("rsync");

// Equivalent to writing `rsync -a example-source/ example-destination/` on terminal
rsync = new Rsync()
  // The -a flag means "archive" to say we are copying the full directory not just a file
  .flags("a")
  .source("example-source/")
  .destination("example-destination/");

const job = new CronJob(
  // Run this function once every minute
  // To learn more about this cron string visit the below link
  // https://crontab.guru/#*_*_*_*_*
  "* * * * *",
  () => {
    rsync.execute((error, code, cmd) => {
      // List of rsync status codes
      // https://stackoverflow.com/a/20738063
      console.log("backup completed with status code: " + code);
    });
  },
  null,
  true,
  // Replace with your time zone
  // https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a
  "America/Toronto"
);

// Begin the cronjob
job.start();
```

Before the script has been run (note the empty `example-destination` directory)

![Backup Before](https://res.cloudinary.com/dqse2txyi/image/upload/r_20,bo_2px_solid_darkgrey/v1640672226/blogs/node-backup/backup-before_q0ndw5.png)

After the script has run once:

![Backup After](https://res.cloudinary.com/dqse2txyi/image/upload/r_20,bo_2px_solid_darkgrey/v1640672226/blogs/node-backup/backup-after_licaio.png)

Things are looking good, we have a once-every-minute interval backup of our `example-source` directory to our `example-destination` directory.  At this point you could replace those directory strings with whatever folders you like.  

Let's make it easier to customize for those who are downloading and using our tool by adding `dotenv` package to read `.env` files as part of the configuration.

If you've already followed the tutorial you have the `dotenv` package installed with NPM so it's just a matter of importing it.  Before we do let's create the `.env` file.  Make sure to note that is `.env` with a starting `.` (to indicate hidden files):

`.env`
```env
SOURCE_DIR="example-source/"
DESTINATION_DIR="example-destination/"
CRON_STRING="* * * * *"
```

Now we can update our code to read from that file.  We just have to `require` the `dotenv` package at the top of our code:

`backup.js`
```js
require("dotenv").config();
const CronJob = require("cron").CronJob;
const Rsync = require("rsync");

// Equivalent to writing `rsync -a example-source/ example-destination/` on terminal
rsync = new Rsync()
  // The -a flag means "archive" to say we are copying the full directory not just a file
  .flags("a")
  // Reads from the `.env` file in the project directory
  .source(process.env.SOURCE_DIR)
  .destination(process.env.DESTINATION_DIR);

const job = new CronJob(
  // Run this function once every minute
  // To learn more about this cron string visit the below link
  // https://crontab.guru/#*_*_*_*_*
  process.env.CRON_STRING,
  () => {
    rsync.execute((error, code, cmd) => {
      // List of rsync status codes
      // https://stackoverflow.com/a/20738063
      console.log("backup completed with status code: " + code);
    });
  },
  null,
  true,
  // Replace with your time zone
  // https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a
  "America/Toronto"
);

// Begin the cronjob
job.start();
```

When we run `node backup.js` again we get the same result, but this time our source and destination directories are being read from the `.env` file.  This will make it easier for users to add their own source/destination directories and cron string when they download the tool.

It also improves privacy as we will be adding `.env` to our `.gitignore` file so the directories that I choose to copy on my machine will not be included in the git repository for this project.

In fact, let's do that now.  If you're creating this project for yourself you'll want to be able to commit it to your remote git host, so run:

```bash
git init
```

Then create a `.gitignore` file in the root directory with:

`.gitignore`
```gitignore
node_modules
.env
```

We exclude `.env` for reasons mentioned above, and `node_modules` since it will be re-created by running `npm install` for anyone who uses our project.

Excellent!  You now have a great little tool that works great on Linux and Mac... but what about Windows?

I realized recently that basically all the development work I do exists inside a Unix environment.  Even though I do 100% of my daily development on Windows 11 with [WSL2](https://docs.microsoft.com/en-us/windows/wsl/compare-versions) I'm still doing everything inside a native installing of ubuntu despite logging into Windows each day.  

I honestly don't even know how to use `cmd` or PowerShell... but if the majority of my personal stuff (photos and documents) are stored on Windows, maybe this is a good opportunity for me to learn?

I like learning new things.  I challenge myself: what do I need to do to get this working on Windows?

Turns out it was surprisingly easy.

## Cross Platform

The big challenge here is [rsync](https://en.wikipedia.org/wiki/Rsync).  As you can see from that link, `rsync` is a Unix copying tool that will be natively available on most Linux and mac environments, but not Windows.

The `rsync` package on NPM is simply a wrapper around the tool installed on your OS, so running our `backup.js` in PowerShell gives us an error.  The error is that the `rsync` program does not exist.

Here's the really cool thing though: not only does Windows have a very _similar_ tool with a similar API called [robocopy](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy), the `rsync` NPM package allows us to chain a method called `executable()` that takes a string.

That string is the name of the copying tool we want to use.  

It defaults to `rsync`, but we can provide it with any name we want.  

We can check what OS the program is running on with `process.platform` which will return `win32` as a string when running on Windows.  

Let's update `backup.js`:

`backup.js`
```js
require("dotenv").config();
const CronJob = require("cron").CronJob;
const Rsync = require("rsync");

// process.platform will be:
// Windows: win32
// Mac: darwin
// Ubuntu: linux
const syncProgram = process.platform === "win32" ? "robocopy" : "rsync";

// Equivalent to writing `rsync -a example-source/ example-destination/` on terminal
rsync = new Rsync()
  .executable(syncProgram)
  // The -a flag means "archive" to say we are copying the full directory not just a file
  .flags("a")
  // Reads from the `.env` file in the project directory
  .source(process.env.SOURCE_DIR)
  .destination(process.env.DESTINATION_DIR);

const job = new CronJob(
  // Run this function once every minute
  // To learn more about this cron string visit the below link
  // https://crontab.guru/#*_*_*_*_*
  process.env.CRON_STRING,
  () => {
    rsync.execute((error, code, cmd) => {
      // List of rsync status codes
      // https://stackoverflow.com/a/20738063
      console.log("backup completed with status code: " + code);
    });
  },
  null,
  true,
  // Replace with your time zone
  // https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a
  "America/Toronto"
);

// Begin the cronjob
job.start();
```

Notice the changes above.  I did a chaeck against `process.platform` and if it returns `win32` we set the executable copy program to `robocopy` instead of `rsync` which will allow it to run on Windows.

Lucky for us the syntax for `robocopy` is exactly the same as `rsync`:

```bash
robocopy <source> <destination>
```

This means we don't have to change anything else about the way our program already works, the NPM package will call the program exactly the same way, just using `robocopy` instead of `rsync` when we are on Windows.  

We're now ready to try it out.  In order to get the project files on Windows, I'm going to push them to Github and then clone them on by Windows filesystem.

So here's what I do: [I push this project to Github](https://github.com/alexeagleson/template-node-backup-directory).  Then I open PowerShell.  

I am a PowerShell noob, but I'm doing my best.

Turns out I don't even have `git` or `node` installed on Windows so I'm not going to get very far here.  

First I need to [download git](https://git-scm.com/download/win) so I can clone the project, then I need to [download node](https://nodejs.org/en/download/) so I can run it.

Once downloaded and installed I can run both these commands in PowerShell and get valid output:

```
PS C:\Users\ME> git --version
git version 2.34.1.windows.1

PS C:\Users\ME> node --version
v16.13.1
```

Now that everything is set I can `git clone MY_PROJECT_URL` and then `cd` into that directory and run:

```bash
npm install
```

Before I can run the project though I need to create the `.env` file since I did not include it in the repo for privacy reasons:

`.env`
```env
SOURCE_DIR="example-source/"
DESTINATION_DIR="example-destination/"
CRON_STRING="* * * * *"
```

Finally now in PowerShell in the project directory i run:

```bash
node backup.js
```

And my result:

Before the script has been run on Windows (note the empty `example-destination` directory)

![Backup Before](https://res.cloudinary.com/dqse2txyi/image/upload/r_20,bo_2px_solid_darkgrey/v1640676104/blogs/node-backup/windows-backup-before_poxfzp.png)

After the script has run once on Windows:

![Backup After](https://res.cloudinary.com/dqse2txyi/image/upload/r_20,bo_2px_solid_darkgrey/v1640676104/blogs/node-backup/windows-backup-after_ziq2ck.png)

Note the status code doesn't necessarily match up with the `rsync` status codes, but the result is correct: the copying process was successful.

So that's really cool.  You now have a tool that will copy the contents of one directory to another on an interval of your choice.  Right now we have it setup to run every minute which is pretty overkill, but thanks to tools like [crontab guru](https://crontab.guru/) it's easy to create exactly the interval you want.

For example I only need to backup my directory once a week, so I'm going to set it to run [at 3am every Sunday](https://crontab.guru/#0_3_*_*_0).

XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

## Discord

`baskup.js`
```js
require("dotenv").config();
const CronJob = require("cron").CronJob;
const Rsync = require("rsync");
const https = require("https");

// This will make it easier to find your process
// when using the `pstree -p` command
process.title = "node-backup-script";

const options = {
  hostname: "discord.com",
  path: `/api/webhooks/${process.env.WEBHOOK_ID}`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

// process.platform will be:
// Windows: win32
// Mac: darwin
// Ubuntu: linux
const syncProgram = process.platform === "win32" ? "robocopy" : "rsync";

// Equivalent to writing `rsync -a example-source/ example-destination/` on terminal
rsync = new Rsync()
  .executable(syncProgram)
  // The -a flag means "archive" to say we are copying the full directory not just a file
  .flags("a")
  // Reads from the `.env` file in the project directory
  .source(process.env.SOURCE_DIR)
  .destination(process.env.DESTINATION_DIR);

const job = new CronJob(
  // Run this function once every minute
  // To learn more about this cron string visit the below link
  // https://crontab.guru/#*_*_*_*_*
  process.env.CRON_STRING,
  () => {
    rsync.execute((error, code, cmd) => {

      // Send the request to Discord with the configured options
      const req = https.request(options, (res) => {
        // do nothing with Discord response
      });

      let result;
      if (error) {
        // List of rsync status codes
        // https://stackoverflow.com/a/20738063
        result = `Code ${code} ${error?.message}`;
      } else {
        result = "Backup complete";
      }

      // Discord requires a { content: string } shape for posting messages
      req.write(
        JSON.stringify({
          content: result,
        })
      );

      req.end();
    });
  },
  null,
  true,
  // Replace with your time zone
  // https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a
  "America/Toronto"
);

// Begin the cronjob
job.start();
```

![Discord Bot](https://res.cloudinary.com/dqse2txyi/image/upload/bo_2px_solid_darkgrey/v1640678608/blogs/node-backup/discord-bot_ebyx5w.png)

(Yes it really is 3 a.m. my baby is sick so I'm staying up listening for her and writing blogs, such is my reality)

So we've now handled most of the major features required for this project:

* Creating a backup of one directory to another
* Support for scheduled riming of backups
* Cross platform support

The main question that remains is... how are we going to keep this running all the time?  If we simply use `node backup.js` the process is going to stop as soon as we close our terminal.  We are going to need a better solution.  

Enter `pm2`

## Running the Process in the Background

Before we get into [pm2](https://pm2.keymetrics.io/) which is going to be our final solution, we'll quickly learn about how you can actually do this on Unix based systems without installing anything using `nohup` (which stands for "no hang-up").  

You can find out if you system supports `nohup` with:

```bash
nohup --version
```

```
$ nohup --version
nohup (GNU coreutils) 8.30
```

If you get a version number successfully then this next step should work for you.

```bash
nohup node backup.js &
```

The leading `nohup` will tell your system that even when your session ends you don't want the process to stop, and the final trailing `&` symbol means to run it as a background [daemon](https://en.wikipedia.org/wiki/Daemon_(computing)) process.  

You will likely get an output that looks like:

```
[1] 7604
```

After running the command.  This is the `process ID` of your node program.  If for any reason you lose track of it you can find it again with this command:

```bash
pstree -p
```

You'll get output showing all the processes running on your system with their IDs.  If you notice in the `backup.js` code example above we used `process.title` and gave it a string value of `node-backup-script`.  

This helps find and identify the process ID when we use the `pstree -p` command:

![Pstree Output](https://res.cloudinary.com/dqse2txyi/image/upload/bo_2px_solid_darkgrey/v1640679514/blogs/node-backup/pstree_clntnk.png)

Notice the `node-backup-sc(7604)` in there showing the same PID that we were given when the script started, and also the `title` value we set with `process.title` to make it easier to find and identify.

Since we can no longer simply `ctrl+C` to cancel the node script execution, we have to do something different.  We have to kill the process by referencing the PID directly.  

To do that you can run:

```bash
kill -9 YOUR_PID
```

Where `YOUR_PID` is the ID that is given on your machine.  In my example above it's 7604.  The `-9` tells it to override anything that might stop or intercept a system kill signal, you want to end the program no matter what.

So the `nohup` option will work will for Unix systems that support it as long as they are running 24/7, the process will keep running.  There are a couple of issues with it though:

* If your program crashes, `nohup` will not reboot it
* This solution is Unix specific and will not work on Windows

So how do we create a solution that will run 24/7, will reboot on crash, and supports cross-platform?  That's what [pm2](https://pm2.keymetrics.io/) is for.

```bash
npm install -g pm2
```

This command will work on any OS that has NPM installed (Linux, Mac or Windows).  After installing you'll be able to verify it is available with:

```bash
pm2 --version
```

To begin the process just run:

```bash
pm2 start backup.js
```

![PM@ Start](https://res.cloudinary.com/dqse2txyi/image/upload/bo_2px_solid_darkgrey/v1640680969/blogs/node-backup/pm2_thc0br.png)

So now the process is running in the background and will keep running even if you close your terminal, and will reboot on crash.  

You can view the running process anytime with `pm2 list` and you can stop it with `pm2 stop backup` where "backup" is the name of the process.

Unfortunately this will not survive a full system reboot.  Configuring `pm2` to start with your app automatically on reboot is beyond the scope of this tutorial, however there are very good instructions on how to handle it if you would like to do so for [Unix based systems](https://pm2.keymetrics.io/docs/usage/startup/) and [Windows](https://github.com/jessety/pm2-installer).

With `pm2` you can now keep this running on an old laptop, or on your own cloud server like a $5 monthly [Digital Ocean Droplet](https://www.digitalocean.com/products/droplets/) for example.  