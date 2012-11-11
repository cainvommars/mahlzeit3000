var Session = function(req) {

  return {
    get : function(key) {
      if (! req.session.hasOwnProperty(key))
        return null;

      return req.session[key];
    },
    set : function(key, value) {
      req.session[key] = value;
    }
  }
};

module.exports = Session;
