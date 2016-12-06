var cron = require('node-cron');
var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var validate = require('../helpers/validate');

module.exports = function(app) {

  var getNewPrices = function(){

    console.log('getting new prices');

    var today = moment().startOf('day');

    app.models.product.find({
      where: {
        updatedAt: {
          lt: today.toDate()
        }
      },
      order: 'updatedAt DESC',
      limit: 5
    }, function(err, products){
      async.eachOfSeries(products, function(product, key, callback){

        if(validate(product, 'No product found', "PRODUCT_NOT_FOUND", 404, callback)){return;}
        if(validate(product.vendor, 'No vendor found', "PRODUCT_VENDOR_ERROR", 400, callback)){return;}
        if(validate(product.vendor_id, 'No vendor id found', "PRODUCT_VENDOR_ID_ERROR", 400, callback)){return;}

        app.models.product.addNewPrice(product.id, product.vendor, product.vendor_id, callback);

      }, function(err){
        if(err){
          console.log(err);
        }
        console.log('getting new prices - complete');
      });
    });

  }

  cron.schedule('1 */30 * * * *', getNewPrices);

};