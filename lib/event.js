var crypto = require('crypto');

var serialize = function(obj) {
  return JSON.stringify(obj);
};

var deserialize = function(str) {
  return JSON.parse(str);
};

var create_hash = function(str) {
  var hash = crypto.createHash('sha1');
  hash.update(str)
  return hash.digest('hex');
}

var Event = function(db) {

  return {
    create: function(ev, cb) {
      ev.id = Math.ceil(Math.random() * Math.pow(10, 12));

      ev.users.forEach(function(user) {
        user.hash = create_hash(user.id +
                                user.scree_name +
                                process.env.HASH_SALT);
      });

      ev.owner.hash = create_hash(ev.owner.id +
                               ev.owner.scree_name +
                               process.env.HASH_SALT);

      db.put('/event/' + ev.id, serialize(ev), function(err) {
        cb(err, ev);
      });
    },

    update: function(ev, cb) {
       db.put('/event/' + ev.id, serialize(ev), function(err) {
         cb(err, ev);
       });
    },

    retreive: function(id, cb) {
      db.get('/event/' + id, function(err, data) {
        //console.dir(deserialize(data));
        cb(err, deserialize(data));
      });
    }
  };
};

exports.Event = Event;
