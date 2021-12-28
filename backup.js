require("dotenv").config();
const Rsync = require("rsync");
const https = require("https");

process.title = "node-backup-script";

const options = {
  hostname: process.env.WEBHOOK_HOST,
  path: process.env.WEBHOOK_PATH,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

const rsync = new Rsync()
  .flags("a")
  .source(process.env.SOURCE_DIR)
  .destination(process.env.DESTINATION_DIR);

const CronJob = require("cron").CronJob;

const job = new CronJob(
  process.env.CRON_STRING,
  () => {
    rsync.execute((error, code, cmd) => {
      const req = https.request(options, (res) => {
        // do nothing with Discord response
      });

      let result;
      if (error) {
        result = `Code ${code} ${error?.message}`;
      } else {
        result = "Backup complete";
      }

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
  "America/Toronto"
);

job.start();
