module.exports = function(condition, message, code, status, cb, value){

  if(!condition){
    var error = new Error(message);
    error.status = status;
    error.message = message;
    error.statusCode = status;
    error.code = code;
    if(value){
      error.value = value;
    }
    if(cb){
      cb(error);
    }
    return error;
  }

};