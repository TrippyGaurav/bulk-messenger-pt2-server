const express = require("express");
const puppeteer = require("puppeteer");
const healthCheckRoute = require("./src/routes/healthRoute");
const messengerRoute = require("./src/routes/messengerRoute");
const cors = require("cors");

const app = express();
app.use(cors());

app.use(express.json());
app.use("/api/", messengerRoute);
app.use("/", healthCheckRoute);

app.listen(3001, () => {
  console.log("Server is running");
});
