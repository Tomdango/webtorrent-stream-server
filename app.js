const createError = require('http-errors');
const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
  res.header(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Authorization, Origin, Accept'
  );
  next();
});

app.set('view engine', 'ejs');
app.use('/', indexRouter);
app.use('/api', apiRouter);

app.options((req, res) => {
  res.sendStatus(200);
});

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
