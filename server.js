const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const { Schema, model } = require('mongoose')

const userSchema = new Schema({
  username: { type: String }
})

const excerciseSchema = new Schema({
  description: { type: String },
  duration: { type: Number },
  username: { type: String },
  date: { type: String },
  parsedDate: { type: Date }
})

const logSchema = new Schema({
  count: { type: Number },
  username: { type: String },
  log: [{
    description: { type: String },
    duration: { type: Number },
    date: { type: String }
  }]
})

const User = new model('User', userSchema)
const Excercise = new model('Excercise', excerciseSchema)
const Log = new model('Log', logSchema)

app.post('/api/users', async (req, res) => {
  let user = new User({ username: req.body.username })
  await user.save()

  return res.send(user)
})

app.get('/api/users', async (req, res) => {
  let users = await User.find()

  return res.send(users)
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  let user = await User.findById(req.params._id)

  // let date = req.body.date ? new Date(req.body.date) : new Date()
  // console.log(date.toDateString())
  // console.log(date.getDate())
  // console.log(date.getUTCDate())

  let exercise = new Excercise({
    username: user.username,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString(),
    parsedDate: req.body.date ? new Date(req.body.date) : new Date()
  })

  let logExists = await Log.findOne({ username: user.username })

  if (!logExists) {

    let log = new Log({
      count: 1,
      username: user.username,
      log: [{
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      }]
    })
    await log.save()

  } else {

    let newCount = logExists.count + 1
    let logArray = logExists.log
    logArray.push({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date
    })

    await logExists.update({ count: newCount, log: logArray })
  }

  await exercise.save()
  return res.send({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
  })
})

app.get('/api/users/:_id/logs', async (req, res) => {
  let user = await User.findById(req.params._id)

  let params = { username: user.username }
  if (req.query.from && req.query.to) params.parsedDate = { "$gte": new Date(req.query.from), "$lte": new Date(req.query.to) }

  console.log(params)

  let exercises = await Excercise.find(params).select('-__v').select('-_id').select('-parsedDate').limit(req.query.limit)
  // let logs = await Log.find({ username: user.username, created: { "$gte": "2016-01-01T00:00:00.000Z", "$lte": "2016-10-10T06:28:37.146Z" } }).select('-__v').select(' -log._id').limit(req.query.limit)
  // 
  return res.send({
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log: exercises
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
