const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI)

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Substantive part of my code begins here

const createuserSchema = new mongoose.Schema({
  username: String,
  log: []
});

let Createuser = mongoose.model('Createuser', createuserSchema);

app.post('/api/users', (req, res) => {
  const newUser = new Createuser({
    username: req.body.username
  });
  newUser.save((err, data) => {
    if (err) {
      return console.log(err)
    }
    return res.json({ username: data.username, _id: data.id })
  })
});

app.get('/api/users', (req, res) => {
  Createuser.find((err, data) => {
    if (err) {
      console.log(err);
    }
    let arrayUsers = [];
    for (let i = 0; i < data.length; i++) {
      let user = {};
      user._id = data[i]._id;
      user.username = data[i].username;
      arrayUsers.push(user);
    }
    res.send(arrayUsers);
  })
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let dateString = (new Date()).toDateString();
  if (req.body.date) {
    const date = req.body.date.split('-');
    const createDate = new Date(date[0], date[1] - 1, date[2])
    dateString = createDate.toDateString();
  }
  const newLog = {
    description: req.body.description,
    duration: Number(req.body.duration),
    date: dateString
  }
  Createuser.findById(req.params._id, (err, user) => {
    if (err) {
      console.log(err);
    }
    user.log.push(newLog);
    user.save((err, updatedUser) => {
      if (err) {
        console.log(err);
      }
      return res.json({ username: updatedUser.username, description: newLog.description, duration: newLog.duration, date: newLog.date, _id: updatedUser._id });
    })
  })
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  Createuser.findById(req.params._id, (err, user) => {
    if (err) {
      return console.log(err);
    }
    if (!from && !to && !limit) {
      return res.json({ username: user.username, count: user.log.length, _id: user._id, log: user.log });
    }

    let logNew = [];

    if (from && !to) {
      const fromArr = from.split('-');
      const fromDate = new Date(fromArr[0], fromArr[1] - 1, fromArr[2]);
      const fromSeconds = fromDate.getTime();
      for (let i = 0; i < user.log.length; i++) {
        let logDate = new Date(user.log[i].date);
        let logSeconds = logDate.getTime();
        if (logSeconds >= fromSeconds) {
          logNew.push(user.log[i]);
        }
      }
      if (!limit) {
        return res.json({ _id: user._id, username: user.username, from: from, count: logNew.length, log: logNew });
      } else {
        const slicedLogNew = logNew.slice(0, limit);
        return res.json({ _id: user._id, username: user.username, from: from, count: slicedLogNew.length, log: slicedLogNew });
      }
    } else if (!from && to) {
      const toArr = to.split('-');
      const toDate = new Date(toArr[0], toArr[1] - 1, toArr[2]);
      const toSeconds = toDate.getTime();
      for (let i = 0; i < user.log.length; i++) {
        let logDate = new Date(user.log[i].date);
        let logSeconds = logDate.getTime();
        if (logSeconds <= toSeconds) {
          logNew.push(user.log[i]);
        }
      }
      if (!limit) {
        return res.json({ _id: user._id, username: user.username, to: to, count: logNew.length, log: logNew });
      } else {
        const slicedLogNew = logNew.slice(0, limit);
        return res.json({ _id: user._id, username: user.username, to: to, count: slicedLogNew.length, log: slicedLogNew });
      }
    } else if (from && to) {
      const fromArr = from.split('-');
      const fromDate = new Date(fromArr[0], fromArr[1] - 1, fromArr[2]);
      const fromSeconds = fromDate.getTime();
      const toArr = to.split('-');
      const toDate = new Date(toArr[0], toArr[1] - 1, toArr[2]);
      const toSeconds = toDate.getTime();
      for (let i = 0; i < user.log.length; i++) {
        let logDate = new Date(user.log[i].date);
        let logSeconds = logDate.getTime();
        if (logSeconds >= fromSeconds && logSeconds <= toSeconds) {
          logNew.push(user.log[i]);
        }
      }
      if (!limit) {
        return res.json({ _id: user._id, username: user.username, from: from, to: to, count: logNew.length, log: logNew });
      } else {
        const slicedLogNew = logNew.slice(0, limit);
        return res.json({ _id: user._id, username: user.username, from: from, to: to, count: slicedLogNew.length, log: slicedLogNew });
      }
    } else {
      const slicedLog = user.log.slice(0, limit);
      return res.json({ username: user.username, count: slicedLog.length, _id: user._id, log: slicedLog });
    }
  })
});

// Substantive part of my code ends here

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
