const { mongoose } = require('./mongoose/mongoose-connect');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const mainRouter = require('./routes/main/index');
const config = require('./config/vars');
const {socketInit} = require('./util/socket');
var app = express();

app.use('/uploads', express.static('uploads'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  // res.append('Access-Control-Allow-Origin', `${config['frontendURL']}`);
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE');
  res.append('Access-Control-Expose-Headers', 'x-auth');
  res.setHeader("Access-Control-Allow-Headers", "x-auth, content-type");
  next();
});

app.use('/api', mainRouter);

/**
 * Socket connection and listen single message event 
 */
//<--- start --->
const server = http.Server(app);
socketInit(server);
//<--- end --->

server.listen(process.env.PORT || 8080, (status) => {
  if (process.env.PORT) {
    console.log('Server up on the port ' + process.env.PORT);
  } else {
    console.log('Server up on the port ' + 8080);
  }
})

module.exports = { app };