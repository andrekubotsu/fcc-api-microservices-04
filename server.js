const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

//connect to db
mongoose.connect(process.env.MONGO_URI);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// mongodb Schema and Model
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: { type: String, required: true, unique: true }
});

const UserModel = mongoose.model("UserModel", userSchema);

const exerciseSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

// body parser
app.use(bodyParser.urlencoded({ extended: true }));

// post new user
app.post("/api/exercise/new-user", (req, res) => {
  let username = req.body;
  const createAndSaveUser = user => {
    UserModel.create(user, (err, data) => {
      if (err) return res.json({ error: "invalid user" });
      res.json(data);
    });
  };
  createAndSaveUser(username);
});

// get all users saved on db
app.get("/api/exercise/users", (req, res) => {
  const listAll = UserModel.find({}, (err, data) => {
    // {} means all - filter
    if (err) return res.json({ error: "error!" });
    res.json(data);
  });
});



// post exercises
app.post(
  "/api/exercise/add",
  (req, res, next) => {
    // receive data from form
    let { userId, description, duration, date } = req.body;
    // check required fields

    if (userId && description && duration && duration >= 0) {
      next();
    } else {
      res.status(401).send("enter all fields properly");
    }
  },
  async (req, res) => {
    let { userId, description, duration, date } = req.body;

    date =
      date && Date.parse(date) >= 0
        ? new Date(date).toDateString()
        : new Date().toDateString();
    duration = Number(duration);

    const newExercise = new Exercise(req.body);

    let user = await UserModel.findById(userId);
    if (!user) return res.status(401).send("No User with user_id found");
    newExercise.save();
    res.json({
      username: user.username,
      description,
      duration,
      _id: user._id,
      date
    });
  }
);


// get user logs
app.get("/api/exercise/log", async (req, res) => {
  let { userId, to, limit } = req.query;
  const user = await UserModel.findById(userId);
  let exer = await Exercise.find({ userId: user._id }).select([
    "-userId",
    "-_id"
  ]);
  if (user && exer) {
    if (req.query.from && Date.parse(req.query.from) >= 0) {
      let f = new Date(req.query.from);
      exer = exer.filter(d => d.date.valueOf() >= f.valueOf());
    }
    if (to && Date.parse(to) >= 0) {
      let t = new Date(to);
      exer = exer.filter(d => d.date.valueOf() <= t.valueOf());
    }
    if (limit && Number(limit) < exer.length) {
      exer = exer.slice(0, Number(limit));
    }
    res.json({
      _id: user._id,
      username: user.username,
      count: exer.length,
      log: exer
    });
  }
});

//  post exercises and user logs from YudiKhan


// get log info
app.get("/api/exercise/log?userId&from&to&limit", (req, res) => {
  res.json("");
});
