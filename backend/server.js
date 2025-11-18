require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const userRoutes = require('./routes/auth/userRoutes');
const authRoutes = require('./routes/auth/authRoutes');
const mlTestRoutes = require('./routes/mlTestRoutes');
// Import anomaly routes
const networkRoutes = require('./routes/anomaly/networkRoutes');
const emailRoutes = require('./routes/anomaly/emailRoutes');
const alertRoutes = require('./routes/anomaly/alertRoutes');
const monitorRoutes = require('./routes/monitorRoutes');

const app = express();

// Connect to MongoDB FIRST
connectDB();

// CORS Middleware
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());

// ✅ IMPORTANT: Monitor routes FIRST (no auth required for Python scripts)
app.use('/api', monitorRoutes);

// Auth routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// ML and anomaly routes (may have auth middleware)
app.use('/api/ml', mlTestRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/alerts', alertRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running and connected to MongoDB Atlas!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  
});
