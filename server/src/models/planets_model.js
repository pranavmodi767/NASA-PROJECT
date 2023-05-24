const { parse } = require("csv-parse");
const path = require("path");
const fs = require("fs");

const planets = require("./planets.mongo");

const isHabitablePlanet = (planet) =>
  planet["koi_disposition"] === "CONFIRMED" &&
  planet["koi_insol"] > 0.36 &&
  planet["koi_insol"] < 1.11 &&
  planet["koi_prad"] < 1.6;

function loadPlanetData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          savePlanet(data);
        }
      })
      .on("error", (error) => reject(error))
      .on("end", async () => {
        const countPlanetFound = (await getAllPlanets()).length;
        console.log(`${countPlanetFound} habitable candidates found... `);
        resolve();
      });
  });
}
async function savePlanet(planet) {
  try {
    await planets.updateOne(
      {
        keplerName: planet.kepler_name,
      },
      {
        keplerName: planet.kepler_name,
      },
      {
        upsert: true,
      }
    );
  } catch (e) {
    console.error(`Could not save a planet...${e}`);
  }
}

async function getAllPlanets() {
  return await planets.find(
    {},
    {
      "_id": 0,
      "__v": 0,
    }
  );
}
module.exports = {
  loadPlanetData,
  getAllPlanets,
};
