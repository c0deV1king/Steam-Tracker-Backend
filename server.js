const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const connection = require("./db/config");
const port = process.env.PORT;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

connection();

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});