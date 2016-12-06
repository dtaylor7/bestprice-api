var cron = require('node-cron');
var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var validate = require('../helpers/validate');
var Amazon = require('../services/Amazon');

var productsInEachCategory = {
  "Electronics & Photo": "Samsung 4k tv"
};

module.exports = function(app) {

  // get browser nodes for given searches in "productsInEachCategory"
  var getBrowserNodes = function(cb){

    async.mapSeries(productsInEachCategory, function(product, callback){
      Amazon.getRootBrowseNodeId(product, function(err, browserNodes){
        if(err){
          return callback(err);
        }
        async.eachSeries(browserNodes, function(browserNode, callback){
          if(!browserNode.name){
            return callback();
          }
          app.models.browse_node.upsertWithWhere({name: browserNode.name}, browserNode, callback);
        }, callback);
      });
    }, cb);

  };

  var getTopSellers = function(){

    app.models.browse_node.findOne({
      order: 'updatedAt ASC'
    }, function(err, browseNode){

      Amazon.getTopSellers(browseNode.browseNodeId, function(err, items){

        if(err){
          console.log(err)
        }

        async.eachSeries(items, function(product_data, callback){
          app.models.product.findOrCreate(product_data, function(err, product){
            app.models.product.addNewPrice(product.id, product.vendor, product.vendor_id, callback);
          });
        }, function(err){

          if(err){
            return console.log(err);
          }

          console.log('done updating browseNode', browseNode.name, ', added', items.length, 'products');
          browseNode.updateAttribute('updatedAt', new Date().getTime(), function(){});

        });

      });

    });

  };

  cron.schedule('1 1 12 * * *', getTopSellers);

};
