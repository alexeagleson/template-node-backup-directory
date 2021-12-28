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

Let's create a Javscript file called `backup.js` and get the absolute basics working:

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

## Cross Platform