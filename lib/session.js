var Session = function(req) {

  return {
    get : function(key) {
      if (! req.session.hasOwnProperty(key))
        return null;

      return req.session[key];
    },
    getAndRemove : function(key) {
      if (! req.session.hasOwnProperty(key))
        return null;
      
      var val = req.session[key];
      delete req.session[key];
      return val;
    },
    set : function(key, value) {
      req.session[key] = value;
    }
  }
};

module.exports = Session;
