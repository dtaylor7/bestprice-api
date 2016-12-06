var _ = require('underscore');
var util = require('util'),
    OperationHelper = require('apac').OperationHelper;

var opHelper = new OperationHelper({
  awsId:     'AKIAJUDSJWLRD6APX6KA',
  awsSecret: '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',
  assocId:   'bestbuy05a-21',
  locale:    'UK'
});

var getBrowseNode = function(item){
  var currentNode = item.BrowseNodes.BrowseNode;
  currentNode = _.isArray(currentNode) ? _.first(currentNode) : currentNode;
  do{
    currentNode = currentNode.Ancestors.BrowseNode;
  }while(currentNode.Ancestors);

  if(!currentNode.BrowseNodeId){
    return undefined;
  }

  return {
    browseNodeId: currentNode.BrowseNodeId,
    name: currentNode.Name
  };
}

var Amazon = {
  search: function(searchTerm, cb){
    opHelper.execute('ItemSearch', {
      'SearchIndex': 'All',
      'Keywords': searchTerm,
      'ResponseGroup': 'ItemAttributes,Offers,Images,BrowseNodes',
      'Condition': 'New'
    }).then((response) => {

      if(!response.result.ItemSearchResponse){
        return cb("There was a problem with the response: " + JSON.stringify(response));
      }

      var results = _.map(response.result.ItemSearchResponse.Items.Item, function(item){

        var image_url;

        if(item.LargeImage){
          image_url = item.LargeImage.URL;
        }else if(item.ImageSet){
          image_url = item.ImageSet.LargeImage.URL;
        }

        return {
          vendor_id: item.ASIN,
          vendor: "amazon",
          title: item.ItemAttributes.Title,
          price: item.OfferSummary.LowestNewPrice ? item.OfferSummary.LowestNewPrice.Amount : 0,
          url: item.DetailPageURL,
          description: item.ItemAttributes.Feature,
          image_url: image_url,
          browseNode: getBrowseNode(item)
        };

      });

      cb(undefined, results);
    }).catch((err) => {
      cb(err);
    });
  },
  findById: function(product_id, cb){
    opHelper.execute('ItemLookup', {
      'ItemId': product_id,
      'ResponseGroup': 'ItemAttributes,Offers,Images',
      'Condition': 'New'
    }).then((response) => {

      if(!response.result.ItemLookupResponse){
        return cb("There was a problem with the response: " + JSON.stringify(response));
      }

      var item = response.result.ItemLookupResponse.Items.Item;

      var image_url;

      if(item.LargeImage){
        image_url = item.LargeImage.URL;
      }else if(item.ImageSet){
        image_url = item.ImageSet.LargeImage.URL;
      }

      var response = {
        vendor_id: item.ASIN,
        vendor: "amazon",
        title: item.ItemAttributes.Title,
        price: item.OfferSummary.LowestNewPrice ? item.OfferSummary.LowestNewPrice.Amount : 0,
        url: item.DetailPageURL,
        description: item.ItemAttributes.Feature,
        image_url: image_url
      };

      cb(undefined, response);
    }).catch((err) => {
      cb(err);
    });
  },
  getTopSellers: function(browseNodeId, cb){

    opHelper.execute('BrowseNodeLookup', {
      "ResponseGroup": "TopSellers",
      "BrowseNodeId": browseNodeId
    }).then((response) => {

      if(!response.result.BrowseNodeLookupResponse){
        return cb("There was a problem with the response: " + JSON.stringify(response));
      }

      var results = _.map(response.result.BrowseNodeLookupResponse.BrowseNodes.BrowseNode.TopSellers.TopSeller, function(item){

        return {
          vendor_id: item.ASIN,
          vendor: "amazon",
          title: item.Title
        };

      });

      cb(undefined, results);

    }).catch((err) => {
      cb(err);
    });
  },
  getRootBrowseNodeId: function(searchTerm, cb){

    opHelper.execute('ItemSearch', {
      'SearchIndex': 'All',
      'Keywords': searchTerm,
      'ResponseGroup': 'BrowseNodes',
      'Condition': 'New'
    }).then((response) => {

      if(!response.result.ItemSearchResponse){
        return cb("There was a problem with the response: " + JSON.stringify(response));
      }

      var nodes = [];

      var results = _.map(response.result.ItemSearchResponse.Items.Item, function(item){

        var currentNode = item.BrowseNodes.BrowseNode;

        currentNode = _.isArray(currentNode) ? _.first(currentNode) : currentNode;

        do{
          currentNode = currentNode.Ancestors.BrowseNode;
        }while(currentNode.Ancestors);

        return {
          browseNodeId: currentNode.BrowseNodeId,
          name: currentNode.Name
        };

      });

      cb(undefined, results);

    }).catch((err) => {

      cb(err);

    });
  }
};

module.exports = Amazon;






