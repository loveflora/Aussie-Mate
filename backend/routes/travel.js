const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User, TravelListing, TravelRecommendation } = require('../models');

// @route   GET /api/travel
// @desc    Get all travel listings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { destination, departureDate, returnDate, priceRange, type } = req.query;
    let whereClause = {};
    
    // Filter by destination if provided
    if (destination) {
      whereClause.destination = destination;
    }
    
    // Filter by type if provided
    if (type) {
      whereClause.type = type;
    }
    
    // Filter by dates if provided
    if (departureDate) {
      whereClause.departureDate = { $gte: new Date(departureDate) };
    }
    
    if (returnDate) {
      whereClause.returnDate = { $lte: new Date(returnDate) };
    }
    
    // Filter by price range if provided
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      if (min) whereClause.price = { ...whereClause.price, $gte: parseFloat(min) };
      if (max) whereClause.price = { ...whereClause.price, $lte: parseFloat(max) };
    }
    
    const listings = await TravelListing.findAll({
      where: whereClause,
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(listings);
  } catch (error) {
    console.error('Error getting travel listings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/travel/:id
// @desc    Get travel listing by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await TravelListing.findByPk(req.params.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar', 'email']
      }
    });
    
    if (!listing) {
      return res.status(404).json({ message: 'Travel listing not found' });
    }
    
    // Increment view count
    listing.views += 1;
    await listing.save();
    
    res.json(listing);
  } catch (error) {
    console.error('Error getting travel listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/travel
// @desc    Create a new travel listing
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      destination,
      departureLocation,
      departureDate,
      returnDate,
      price,
      capacity,
      details,
      images,
      contactMethod
    } = req.body;
    
    // Basic validation
    if (!title || !description || !type || !destination || !departureDate || !price) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newListing = await TravelListing.create({
      userId: req.user.id,
      title,
      description,
      type,
      destination,
      departureLocation,
      departureDate,
      returnDate,
      price,
      capacity,
      details,
      images,
      contactMethod: contactMethod || 'chat',
      status: 'active',
      views: 0
    });
    
    const listing = await TravelListing.findByPk(newListing.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    });
    
    res.status(201).json(listing);
  } catch (error) {
    console.error('Error creating travel listing:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/travel/:id
// @desc    Update travel listing
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const listing = await TravelListing.findByPk(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Travel listing not found' });
    }
    
    // Check if user owns this listing
    if (listing.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this listing' });
    }
    
    const {
      title,
      description,
      type,
      destination,
      departureLocation,
      departureDate,
      returnDate,
      price,
      capacity,
      details,
      images,
      contactMethod,
      status
    } = req.body;
    
    // Update the fields
    const updatedFields = {
      title,
      description,
      type,
      destination,
      departureLocation,
      departureDate,
      returnDate,
      price,
      capacity,
      details,
      images,
      contactMethod,
      status
    };
    
    // Filter out undefined values
    Object.keys(updatedFields).forEach(key => 
      updatedFields[key] === undefined && delete updatedFields[key]
    );
    
    await listing.update(updatedFields);
    
    res.json(listing);
  } catch (error) {
    console.error('Error updating travel listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/travel/:id
// @desc    Delete travel listing
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await TravelListing.findByPk(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Travel listing not found' });
    }
    
    // Check if user owns this listing
    if (listing.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this listing' });
    }
    
    await listing.destroy();
    
    res.json({ message: 'Travel listing removed' });
  } catch (error) {
    console.error('Error deleting travel listing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/travel/recommendations
// @desc    Get travel recommendations
// @access  Public
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await TravelRecommendation.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting travel recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/travel/user/:userId
// @desc    Get travel listings by user ID
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const listings = await TravelListing.findAll({
      where: {
        userId: req.params.userId,
        status: 'active' // Only show active listings by default
      },
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(listings);
  } catch (error) {
    console.error('Error getting user travel listings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
