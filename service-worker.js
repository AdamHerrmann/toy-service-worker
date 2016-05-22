'use strict';

var VERSION  = 16;
var MANIFEST = [
  'content.js',
  'a.js',
  'b.js',
  'c.js',
  'd.js',
];

importScripts('./versioned-cache.js');

var cache = new VersionedCache(VERSION, MANIFEST);
this.addEventListener('install',  cache.install.bind(cache));
this.addEventListener('activate', cache.activate.bind(cache));
this.addEventListener('fetch',    cache.fetch.bind(cache));
