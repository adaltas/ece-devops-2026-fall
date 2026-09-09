var redis = require("redis");
const configure = require('./configure')

const config = configure()
var db = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  retry_strategy: () => {
    return new Error("Retry time exhausted")
  }
})

process.on('SIGINT', function() {
  db.quit(() => {
      console.log("\nRedis disconnected. Server stopped.");
      process.exit(0);
    });
});

module.exports = db
