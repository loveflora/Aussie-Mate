const express = require('express');
const router = express.Router();
const {
  getVisaPostcodes,
  getVisaPostcodeById,
  getVisaPostcodesByNumber,
  getVisaPostcodesByEligibility,
  getVisaPostcodesWithPolygons,
  getVisaPostcodesByState,
  checkPostcodeEligibility
} = require('../controllers/visaPostcode');

// All visa postcode routes are public since they're used for the public visa checker

// Get all postcodes (basic info)
router.get('/', getVisaPostcodes);

// Get specific postcode by ID
router.get('/:id', getVisaPostcodeById);

// Get postcodes by number
router.get('/number/:postcodeNumber', getVisaPostcodesByNumber);

// Search postcodes by eligibility criteria
router.get('/eligibility', getVisaPostcodesByEligibility);

// Get postcodes with polygon data for map display
router.get('/polygons', getVisaPostcodesWithPolygons);

// Get postcodes by state
router.get('/state/:state', getVisaPostcodesByState);

// Check eligibility for a specific postcode
router.get('/check/:postcodeNumber', checkPostcodeEligibility);

module.exports = router;
