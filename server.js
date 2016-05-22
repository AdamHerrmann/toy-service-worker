'use strict';

const express     = require('express');
const compression = require('compression');
const fs          = require('fs');

express()
  .use(compression())
  .use(noCache)
  .use(logRequest)
  .use(express.static('.', {etag: false}))
  .get('/bundle', getBundle)
  .listen(8000)
;

function noCache(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache');
  next();
}

function logRequest(req, res, next) {
  console.log(req.originalUrl);
  next();
}

function getBundle(req, res) {
  Promise
    .all(req.query.files.split(',').map(readFile))
    .then((files) => res.json(files.reduce((res, file) => {
      res[file.path] = file.content;
      return res;
    }, {})))
  ;
}

function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, content) => err ? reject(err) : resolve({path, content}));
  });
}
