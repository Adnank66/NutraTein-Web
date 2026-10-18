const connectToDatabase = require('./mongodb');

module.exports = connectToDatabase;
module.exports.connectToDatabase = connectToDatabase;
module.exports.default = connectToDatabase;
module.exports.mongoose = connectToDatabase.mongoose;
