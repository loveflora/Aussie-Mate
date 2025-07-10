const { VisaPostcode } = require('../models');
const { Op } = require('sequelize');

// @desc   Get all visa postcodes
// @route  GET /api/visa/postcodes
// @access Public
exports.getVisaPostcodes = async (req, res) => {
  try {
    const postcodes = await VisaPostcode.findAll({
      attributes: ['id', 'postcode', 'state', 'suburb', 'coordinates']
    });
    
    res.json({
      success: true,
      count: postcodes.length,
      data: postcodes
    });
  } catch (error) {
    console.error('Error fetching postcodes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching postcodes'
    });
  }
};

// @desc   Get visa postcode by id
// @route  GET /api/visa/postcodes/:id
// @access Public
exports.getVisaPostcodeById = async (req, res) => {
  try {
    const postcode = await VisaPostcode.findByPk(req.params.id);
    
    if (!postcode) {
      return res.status(404).json({
        success: false,
        message: 'Postcode not found'
      });
    }
    
    res.json({
      success: true,
      data: postcode
    });
  } catch (error) {
    console.error('Error fetching postcode:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching postcode'
    });
  }
};

// @desc   Get visa postcodes by number
// @route  GET /api/visa/postcodes/number/:postcodeNumber
// @access Public
exports.getVisaPostcodesByNumber = async (req, res) => {
  try {
    const postcodeNumber = req.params.postcodeNumber;
    const postcodes = await VisaPostcode.findAll({
      where: { postcode: postcodeNumber }
    });
    
    if (!postcodes.length) {
      return res.status(404).json({
        success: false,
        message: 'Postcode not found'
      });
    }
    
    res.json({
      success: true,
      count: postcodes.length,
      data: postcodes
    });
  } catch (error) {
    console.error('Error fetching postcode by number:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching postcode'
    });
  }
};

// @desc   Search visa postcodes by eligibility
// @route  GET /api/visa/postcodes/eligibility
// @access Public
exports.getVisaPostcodesByEligibility = async (req, res) => {
  try {
    const { whv417Regional, whv417Remote, visa491 } = req.query;
    
    const whereClause = {};
    
    // Add eligibility criteria to where clause
    if (whv417Regional === 'true') {
      whereClause.whv417RegionalEligible = true;
    }
    
    if (whv417Remote === 'true') {
      whereClause.whv417RemoteEligible = true;
    }
    
    if (visa491 === 'true') {
      whereClause.visa491Eligible = true;
    }
    
    // If no filters applied, return empty array (to avoid returning all postcodes)
    if (Object.keys(whereClause).length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    const postcodes = await VisaPostcode.findAll({
      where: whereClause,
      attributes: ['id', 'postcode', 'state', 'suburb', 'coordinates', 'polygonData', 
                  'whv417RegionalEligible', 'whv417RemoteEligible', 'visa491Eligible']
    });
    
    res.json({
      success: true,
      count: postcodes.length,
      data: postcodes
    });
  } catch (error) {
    console.error('Error searching postcodes by eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching postcodes'
    });
  }
};

// @desc   Get visa postcodes with polygons
// @route  GET /api/visa/postcodes/polygons
// @access Public
exports.getVisaPostcodesWithPolygons = async (req, res) => {
  try {
    const postcodes = await VisaPostcode.findAll({
      attributes: [
        'id', 
        'postcode', 
        'state', 
        'polygonData',
        'whv417RegionalEligible', 
        'whv417RemoteEligible', 
        'visa491Eligible'
      ],
      where: {
        polygonData: {
          [Op.not]: null
        }
      }
    });
    
    res.json({
      success: true,
      count: postcodes.length,
      data: postcodes
    });
  } catch (error) {
    console.error('Error fetching postcodes with polygons:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching postcodes with polygons'
    });
  }
};

// @desc   Search postcodes by state
// @route  GET /api/visa/postcodes/state/:state
// @access Public
exports.getVisaPostcodesByState = async (req, res) => {
  try {
    const state = req.params.state.toUpperCase();
    
    const postcodes = await VisaPostcode.findAll({
      where: { state },
      attributes: ['id', 'postcode', 'state', 'suburb', 'coordinates']
    });
    
    res.json({
      success: true,
      count: postcodes.length,
      data: postcodes
    });
  } catch (error) {
    console.error('Error fetching postcodes by state:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching postcodes by state'
    });
  }
};

// @desc   Check postcode eligibility
// @route  GET /api/visa/postcodes/check/:postcodeNumber
// @access Public
exports.checkPostcodeEligibility = async (req, res) => {
  try {
    const postcodeNumber = req.params.postcodeNumber;
    
    const postcode = await VisaPostcode.findOne({
      where: { postcode: postcodeNumber },
      attributes: [
        'id', 
        'postcode', 
        'state', 
        'suburb',
        'whv417RegionalEligible', 
        'whv417RemoteEligible', 
        'visa491Eligible',
        'visa190Eligible'
      ]
    });
    
    if (!postcode) {
      return res.status(404).json({
        success: false,
        message: 'Postcode not found'
      });
    }
    
    const eligibility = {
      postcode: postcode.postcode,
      suburb: postcode.suburb,
      state: postcode.state,
      eligibility: {
        whv417Regional: postcode.whv417RegionalEligible,
        whv417Remote: postcode.whv417RemoteEligible,
        visa491: postcode.visa491Eligible,
        visa190: postcode.visa190Eligible
      }
    };
    
    res.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    console.error('Error checking postcode eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking postcode eligibility'
    });
  }
};
