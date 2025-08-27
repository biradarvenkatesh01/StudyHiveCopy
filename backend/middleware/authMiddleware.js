const admin = require('firebase-admin');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  // Check karo ki header me "Authorization" hai aur woh "Bearer" se shuru hota hai
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Token ko header se nikalo ('Bearer ' ke baad wala part)
      token = req.headers.authorization.split(' ')[1];

      // Token ko Firebase se verify karo
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Firebase UID se user ko hamare MongoDB se dhoondo
      // aur uski details req object me daal do taaki aage use kar sakein
      req.user = await User.findOne({ firebaseUid: decodedToken.uid }).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found in our database.' });
      }

      next(); // Sab theek hai, ab agle function par jaao
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };