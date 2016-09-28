var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var redSchema = new mongoose.Schema({
  trust: Number,
  happy: Number,
  gender: String,
  age: Number,
  color: String,
  img: String,
  created_at: Date,
  updated_at: Date
});

redSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});

module.exports = mongoose.model('Red', redSchema);
