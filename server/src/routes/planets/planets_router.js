const express = require("express");
const { httpGetAllPlanets } = require("./planets_controller");

const planetRouter = express.Router();
planetRouter.get("/", httpGetAllPlanets);

module.exports = planetRouter;
