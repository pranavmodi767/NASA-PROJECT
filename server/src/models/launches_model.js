const axios = require("axios");

const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";
const DEFAULT_FLIGHT_NUMBER = 100;
const launches = new Map();

// const launch = {
//   flightNumber: 100,
//   mission: "keplet Exploration X",
//   rocket: "Explorer IS1",
//   launchDate: new Date("December 27,2023"),
//   target: "Kepler-442 b",
//   customers: ["ZTM", "NASA"],
//   upcoming: true,
//   success: true,
// };

// saveLaunch(launch);
// launches.set(launch.flightNumber, launch);

const getLatestFlightNumber = async () => {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");
  if (!latestLaunch.flightNumber) return DEFAULT_FLIGHT_NUMBER;
  else return latestLaunch.flightNumber;
};

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

const existLaunchWithId = async (launchId) =>
  await findLaunch({ flightNumber: launchId });

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find(
      {},
      {
        _id: 0,
        __v: 0,
      }
    )
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });
  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );
}
async function populateLaunches() {
  console.log("Downloading launches data...");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem downloading launch data...");
    throw new Error("Launch Data download failed");
  }
  const launchDocs = response.data.docs;

  for (const launchDoc of launchDocs) {
    const payload = launchDoc["payloads"];
    const customers = payload.flatMap(() => payload["customers"]);

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers: customers,
    };
    console.log(`${launch.flightNumber} ${launch.mission}`);
    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });
  if (firstLaunch) {
    console.log("Launch data already exist");
  } else {
    await populateLaunches();
  }
}

async function scheduleNewLaunch(launch) {
  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["ztm", "NASA"],
    flightNumber: newFlightNumber,
  });
  await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.acknowledged === true && aborted.modifiedCount === 1;
  // const abortedLaunch = launches.get(launchId);
  // abortedLaunch.upcoming = false;
  // abortedLaunch.success = false;
  // return abortedLaunch;
}

module.exports = {
  scheduleNewLaunch,
  existLaunchWithId,
  loadLaunchData,
  abortLaunchById,
  getAllLaunches,
};
