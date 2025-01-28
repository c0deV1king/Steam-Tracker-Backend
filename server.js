const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const port = process.env.PORT;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

connection.connect((eer) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Successfully connected to database!');
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});