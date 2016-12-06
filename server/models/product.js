var app = require('../server');
var async = require('async');
var disableModelMethods = require('../helpers/disableModelMethods');
var _ = require('underscore');
var Amazon = require('../services/Amazon');

module.exports = function(Product) {

  disableModelMethods(Product);

  Product.addNewPrice = function(product_id, vendor, vendor_id, cb){

    Amazon.findById(vendor_id, function(err, product_data){

      if(err){
        return cb(err);
      }

      Product.findById(product_id, function(err, product){

        if(err){
          return cb(err);
        }

        if(!product){
          return cb('Product ID not found');
        }

        // update product with any data retrieved from amazon
        product.updateAttributes(product_data, function(err, data){});

        app.models.price.create({
          product_id: product.id,
          price: product_data.price
        }, function(err, price){

          if(err){
            return cb(err);
          }

          product.updateAttribute('updatedAt', new Date().getTime(), function(err, product){
            cb(err, product);
          });

        });

      });

    });

  };

  Product.search = function(search_term, cb){
    return Amazon.search(search_term, function(err, items){
      if(err){
        return cb(err);
      }

      async.eachSeries(items, function(item, callback){
        if(!item.browseNode){
          return callback();
        }
        app.models.browse_node.upsertWithWhere({name: item.browseNode.name}, item.browseNode, callback);
      }, function(){
        cb(err, items);
      });

    });
  };

  Product.remoteMethod(
    'search',
    {
      http: {verb: 'GET'},
      description: "Search for product",
      accepts: [
        {arg: 'search_term', type: 'string', required: true}
      ],
      returns: {
        arg: 'products',
        root: true,
        type: 'array'
      }
    }
  );

  Product.track = function(vendor, vendor_id, user_email, cb){

    Amazon.findById(vendor_id, function(err, product_data){

      Product.findOrCreate(product_data, function(err, product){

        app.models.price.create({
          product_id: product.id,
          price: product_data.price
        }, function(err, price){

        });

        if(user_email){

          app.models.user.findOrCreate({
            email: user_email
          }, function(err, user){

            app.models.user_product.findOrCreate({
              product_id: product.id,
              user_id: user.id
            }, function(err, user_product){
              cb(err, product);
            });

          });

        }else{
          cb(err, product)
        }

      });

    });

  };

  Product.remoteMethod(
    'track',
    {
      http: {verb: 'POST', path: '/track'},
      description: "Track a product",
      accepts: [
        {arg: 'vendor', type: 'string', required: true},
        {arg: 'vendor_id', type: 'string', required: true},
        {arg: 'user_email', type: 'string'}
      ],
      returns: {arg: 'products', root: true, type: 'object'}
    }
  );

  Product.trackedByEmail = function(email, cb){

    app.models.User.findOne({
      where: {
        email: email
      },
      include: {
        'products': 'prices'
      }
    }, function(err, resp){

      if(err){
        return cb(err);
      }

      if(!resp){
        var error = new Error("Not found");
        error.code = 404;
        return cb(error);
      }

      cb(undefined, resp.__data.products);

    });

  };

  Product.remoteMethod(
    'trackedByEmail',
    {
      http: {verb: 'GET', path: '/trackByEmail/:email'},
      description: "Find tracked products by email",
      accepts: {arg: 'email', type: 'string', required: true},
      returns: {arg: 'products', root: true, type: 'array'}
    }
  );

  Product.trackedByIds = function(ids, cb){

    Product.find({
      where: {
        id: { inq: ids }
      },
      include: 'prices'
    }, function(err, resp){

      if(err){
        return cb(err);
      }

      if(!resp){
        var error = new Error("Not found");
        error.code = 404;
        return cb(error);
      }

      cb(undefined, resp);

    });

  };

  Product.remoteMethod(
    'trackedByIds',
    {
      http: {verb: 'GET', path: '/trackedByIds/:ids'},
      description: "Find tracked products by ids",
      accepts: {arg: 'ids', type: 'array', required: true},
      returns: {arg: 'products', root: true, type: 'array'}
    }
  );

  Product.popularTracked = function(cb){

    Product.find({
      include: 'prices'
    }, function(err, resp){

      if(err){
        return cb(err);
      }

      cb(undefined, resp);

    });

  };

  Product.remoteMethod(
    'popularTracked',
    {
      http: {verb: 'GET', path: '/popular'},
      description: "Find popular tracked products",
      returns: {arg: 'products', root: true, type: 'array'}
    }
  );

};