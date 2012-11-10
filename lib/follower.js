
var serialize = function(obj) {
  return JSON.stringify(obj);
};

var deserialize = function(str) {
  return JSON.parse(str);
};


var Follower = function(db) {

  return {
    store: function(id, follower, cb) {
      db.put('/follower/' + id, serialize(follower), function(err) {
        cb(err, follower);
      });
    },

    load: function(id, cb) {
      db.get('/follower/' + id, function(err, data) {
        cb(err, deserialize(data));
      });
    }
  };
};

exports.Follower = Follower;
