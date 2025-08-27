const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/userModel'); // User model import karein

// Route: POST /api/auth/google-signin
// Description: Google Sign-in se user ko register/login karein
router.post('/google-signin', async (req, res) => {
  // Frontend se ID token header me aayega
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  try {
    // Token ko Firebase se verify karein
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, name, email } = decodedToken;

    // Check karein ki user hamare database me pehle se hai ya nahi
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Agar user naya hai, toh use database me create karein
      user = await User.create({
        firebaseUid: uid,
        name: name,
        email: email,
      });
      console.log('New user created in DB:', user);
    } else {
      console.log('User found in DB:', user);
    }

    // Frontend ko user ki details bhejein
    res.status(200).json(user);

  } catch (error) {
    console.error('Error in Google Sign-in:', error);
    res.status(401).json({ message: 'Authentication failed. Invalid token.' });
  }
});

module.exports = router;