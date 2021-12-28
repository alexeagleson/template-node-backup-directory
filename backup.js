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
