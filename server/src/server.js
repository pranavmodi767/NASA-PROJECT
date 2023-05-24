const http = require("http");

require("dotenv").config();

const app = require("./app");

const { mongoConnect } = require("./services/mongo");
const { loadPlanetData } = require("./models/planets_model");
const { loadLaunchData } = require("./models/launches_model");

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

async function startServer() {
  await mongoConnect();
  await loadPlanetData();
  await loadLaunchData();

  server.listen(PORT, () => {
    console.log(`\x1b[32m Listening on port ${PORT} \x1b[0m`);
  });
}
startServer();
