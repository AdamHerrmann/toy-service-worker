function VersionedCache(version, manifest) {
  this.cacheKey = 'static-files-v' + version;
  this.manifest = manifest;
}

VersionedCache.STATUS_OK = {status: 200, statusText: 'OK'};

VersionedCache.prototype.install = function(event) {
  event.waitUntil(this.initializeCache());
};

VersionedCache.prototype.initializeCache = function() {
  return caches
    .open(this.cacheKey)
    .then(function (cache) {
      // Load the manifest into the cache.
      var manifestBlob = new Blob([JSON.stringify(this.manifest)], {type: 'application/json'});
      var manifestPut  = cache.put('manifest.json', new Response(manifestBlob, VersionedCache.STATUS_OK));

      // try to find the next version's files in the existing caches.
      var updateCache  = Promise
        .all(this.manifest.map(function (req) {
          return caches.match(req).then(function (res) { return {req: req, res: res}; });
        }))
        .then(function(files) {
          var missing = [];
          var updates = [];

          files.forEach(function (file) {
            if (file.res) {
              updates.push(cache.put(file.req, file.res));
            }
            else {
              missing.push(encodeURIComponent(file.req));
            }
          })

          if (missing.length) {
            updates.push(this.getBundle(cache, missing));
          }

          return Promise.all(updates);
        }.bind(this))
      ;

      return Promise.all([manifestPut, updateCache]);
    }.bind(this))
  ;
}

VersionedCache.prototype.getBundle = function(cache, files) {
  return fetch(new Request('/bundle?files=' + files.join(',')))
    .then(function (res) { return res.json(); })
    .then(function (files) {
      return Promise.all(Object.keys(files).map(function(path) {
        var blob = new Blob([files[path]], {type: 'text/javascript'});
        return cache.put(path, new Response(blob, VersionedCache.STATUS_OK));
      }))
    })
  ;
};


// VersionedCache.prototype.initializeCache = function() {
//   return caches
//     .open(this.cacheKey)
//     .then(function (cache) {
//       var manifestBlob = new Blob([JSON.stringify(this.manifest)], {type: 'application/json'});
//       var manifestInit = {status: 200, statusText: 'OK'};
//       var load         = this.manifest.map(function(req) {
//         return this.loadRequest(req).then(function (res) { return cache.put(req, res); });
//       }.bind(this));

//       load.push(cache.put('manifest.json', new Response(manifestBlob, manifestInit)));
//       return Promise.all(load);
//     }.bind(this))
//   ;
// }

VersionedCache.prototype.activate = function(event) {
  console.log('Activating')
  event.waitUntil(this.removePreviousCaches());
};

VersionedCache.prototype.removePreviousCaches = function() {
  return caches.keys().then(function (keys) {
    return Promise.all(keys.map(function(key) {
      return (key === this.cacheKey) || caches.delete(key);
    }.bind(this)));
  }.bind(this));
}

VersionedCache.prototype.fetch = function(event) {
  event.respondWith(this.loadRequest(event.request));
};

VersionedCache.prototype.loadRequest = function(req) {
  return caches.match(req).then(function(res) { return res || fetch(req); });
};

VersionedCache.prototype.loadExistingFiles = function() {
  return Promise.all(Object.keys(this.manifest).map(function (req) {
    return caches.match()
  }))
};
