var leveldb = require('leveldb');

exports.start = function(path, cb) {
  leveldb.open(path, {create_if_missing: true}, cb);
};
