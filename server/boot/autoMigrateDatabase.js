var debug = require('debug')('autoUpdate');

module.exports = function(app) {
  var path = require('path');
  var models = require(path.resolve(__dirname, '../model-config.json'));
  var datasources = require(path.resolve(__dirname, '../datasources.json'));
  var async = require('async');

  function autoUpdateAll() {
    async.eachOfSeries(Object.keys(models), function(key, value, callback) {
      if (typeof models[key].dataSource == 'undefined' || typeof datasources[models[key].dataSource] == 'undefined' || models[key].dataSource != 'postgres') {
        return callback();
      }
      app.models[key].count(function(err, count) {

        if ((err || !count) || process.env.NODE_ENV === 'test') {

          app.dataSources[models[key].dataSource].automigrate(key, function(err) {
            // console.log(key, ': added sample data');
            try {
              var data = require(__dirname + '/seed-data/' + key);
              if (data && app.models[key]) {
                app.models[key].create(data, function(err) {
                  // console.log(key, ': added sample data');
                  if (err) {
                    // console.log(err, data);
                  }
                  callback();
                });
              } else {
                callback();
              }
            } catch (e) {
              // console.log(e);
              callback();
            }
          });

        } else {

          app.dataSources[models[key].dataSource].autoupdate(key, function(err) {
            // console.log(err);
            if (err) throw err;
            callback();
          });

        }

      });
    }, function() {
      // console.log('Migrating tables complete.');
      // if test start tests after databases are populated
      if (process.env.NODE_ENV === 'test') {

        setTimeout(function() {
          run();
        }, 2000);

      }
    });
  }

  autoUpdateAll();

};