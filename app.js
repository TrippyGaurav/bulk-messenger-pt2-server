const express = require("express");
const healthCheckRoute = require("./src/routes/healthRoute");
const messengerRoute = require("./src/routes/messengerRoute");

require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/", messengerRoute);
app.use("/", healthCheckRoute);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
