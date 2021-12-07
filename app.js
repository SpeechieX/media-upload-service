require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const fileUploadRoutes = require("./routes/media");

const app = express();

const connectDB = require("./config/config");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: "false" }));
connectDB();

app.use(express.static(path.join(__dirname, "build")));

app.use("/api", fileUploadRoutes);

module.exports = app;
