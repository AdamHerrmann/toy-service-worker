(function() {
  'use strict';

  navigator.serviceWorker
    .register('/service-worker.js')
    .then(loadScripts)
    .catch(reportFailure)
  ;

  window.onload = function() {
    console.log('Finished Loading');
  };

  function loadScripts(reg) {
    get('/manifest.json')
      .then(function (res) {
        try {
          return JSON.parse(res);
        } catch (e) {
          console.log('Unable to parse manifest', res, e);
          throw e;
        }
      })
      .then(function (manifest) {
        return Promise.all(manifest.map(function(file) {
          return new Promise(function(resolve) {
            var script    = document.createElement('script');
            script.type   = 'text/javascript';
            script.src    = file;
            script.onload = resolve;
            document.body.appendChild(script);
          });
        }));
      })
      .then(function () {
        console.log('Finished loading scripts.  Bootstrap angular now.');
      })
    ;
  }

  function reportFailure(error) {
    console.log('Registration failed with ' + error);
  }

  function get(url) {
    return new Promise(function(resolve, reject) {
      var request = new XMLHttpRequest();
      request.open('GET', url);

      request.onload = function() {
        resolve(request.response);
      };

      request.onerror = function() {
        reject(Error('There was a network error.'));
      };

      request.send();
    });
  }

})();
