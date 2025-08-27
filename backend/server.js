// backend/server.js (Final Code for Deployment)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const admin = require('firebase-admin');

// --- UPDATED THIS SECTION FOR DEPLOYMENT ---
// Check karo ki environment variable set hai ya nahi
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Agar local par chala rahe hain, toh file se load karo
    try {
        const serviceAccount = require('./config/serviceAccountKey.json');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error('serviceAccountKey.json not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env variable for deployment.');
        process.exit(1);
    }
} else {
    // Agar deploy kiya hai, toh environment variable se load karo
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
}
// ---------------------------------------------

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Study Hive Backend is Live!');
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/studyGroupRoutes'));
app.use('/api/ai', require('./routes/aiRoutes.js'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});