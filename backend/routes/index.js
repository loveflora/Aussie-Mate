const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const visaPostcodeRoutes = require('./visaPostcode');
const jobPostRoutes = require('./jobPost');

// Mount routes
router.use('/auth', authRoutes);
router.use('/visa/postcodes', visaPostcodeRoutes);
router.use('/jobs', jobPostRoutes);

// Base API route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to AussieMate API',
    version: '1.0.0'
  });
});

module.exports = router;
