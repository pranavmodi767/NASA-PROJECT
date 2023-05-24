const express = require("express");

const planetRouter = require("./planets/planets_router");
const launchesRouter = require("./launches/launches_router");

const api = express.Router();

api.use("/launches", launchesRouter);
api.use("/planets", planetRouter);

module.exports = api;
