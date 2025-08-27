// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const admin = require('firebase-admin'); // <-- ADD THIS

// --- ADD THIS SECTION TO INITIALIZE FIREBASE ADMIN ---
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// ---------------------------------------------------------

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ... (app.use(express.json()); ke baad)

app.get('/', (req, res) => {
  res.send('Hello from the Study Hive Backend!');
});

// --- ADD THIS LINE TO REGISTER THE AUTH ROUTE ---
app.use('/api/auth', require('./routes/authRoutes'));

// ... (app.use('/api/auth', ...) ke baad)

// --- ADD THIS LINE TO REGISTER THE STUDY GROUP ROUTE ---
app.use('/api/groups', require('./routes/studyGroupRoutes'));

// ... (app.use('/api/groups', ...) ke baad)

// --- ADD THIS LINE TO REGISTER THE AI ROUTE ---
app.use('/api/ai', require('./routes/aiRoutes.js'));

// ... (PORT definition se pehle)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});