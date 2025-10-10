require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/auth/userRoutes');
const authRoutes = require('./routes/auth/authRoutes');
const mlTestRoutes = require('./routes/mlTestRoutes');
// Import anomaly routes
const networkRoutes = require('./routes/anomaly/networkRoutes');
const emailRoutes = require('./routes/anomaly/emailRoutes');
const alertRoutes = require('./routes/anomaly/alertRoutes');

// Register anomaly routes

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/ml', mlTestRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/alerts', alertRoutes);



// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);   // user-related routes
app.use('/api/auth', authRoutes);    // login, register, token routes

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running and connected to MongoDB Atlas!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

