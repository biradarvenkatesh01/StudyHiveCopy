const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true, // Har user ka Firebase ID unique hoga
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Har user ka email unique hoga
  },
}, {
  timestamps: true, // 'createdAt' aur 'updatedAt' fields automatically ban jaayengi
});

const User = mongoose.model('User', userSchema);

module.exports = User;