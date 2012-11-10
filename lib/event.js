var serialize = function(obj) {
  return JSON.stringify(obj);
};

var deserialize = function(str) {
  return JSON.parse(str);
};

var Event = function(db) {

  return {
    create: function(ev, cb) {
      ev.id = Math.ceil(Math.random() * Math.pow(10, 12));

      db.put('/event/' + ev.id, serialize(ev), function(err) {
        cb(err, ev);
      });
    },

    retreive: function(id, cb) {
      db.get('/event/' + id, function(err, data) {
        console.dir(deserialize(data));
        cb(err, deserialize(data));
      });
    }
  };
};

exports.Event = Event;
