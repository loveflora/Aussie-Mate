const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User, HousingPost } = require('../models');

// @route   GET /api/housing
// @desc    Get all housing posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, state, status, minPrice, maxPrice, bedrooms, suburb } = req.query;
    let whereClause = {};
    
    // Filter by type if provided
    if (type && ['rent', 'share', 'wanted'].includes(type)) {
      whereClause.type = type;
    }
    
    // Filter by state if provided
    if (state) {
      whereClause.state = state;
    }
    
    // Filter by suburb if provided
    if (suburb) {
      whereClause.suburb = suburb;
    }
    
    // Filter by bedrooms if provided
    if (bedrooms) {
      whereClause.bedrooms = parseInt(bedrooms);
    }
    
    // Filter by price range if provided
    if (minPrice) {
      whereClause.price = { ...whereClause.price, $gte: parseFloat(minPrice) };
    }
    
    if (maxPrice) {
      whereClause.price = { ...whereClause.price, $lte: parseFloat(maxPrice) };
    }
    
    // Filter by status (default to available only)
    whereClause.status = status || 'available';
    
    const housings = await HousingPost.findAll({
      where: whereClause,
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(housings);
  } catch (error) {
    console.error('Error getting housing posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/housing/:id
// @desc    Get housing post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const housing = await HousingPost.findByPk(req.params.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar', 'email']
      }
    });
    
    if (!housing) {
      return res.status(404).json({ message: 'Housing post not found' });
    }
    
    // Increment view count
    housing.views += 1;
    await housing.save();
    
    res.json(housing);
  } catch (error) {
    console.error('Error getting housing post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/housing
// @desc    Create a new housing post
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      address,
      coordinates,
      state,
      suburb,
      postcode,
      price,
      bond,
      availableFrom,
      minStay,
      bedrooms,
      bathrooms,
      furnished,
      preferredGender,
      petsAllowed,
      utilities,
      amenities,
      images,
      contactMethod,
      contactDetails
    } = req.body;
    
    // Basic validation
    if (!title || !type || !description || !address || !state || !suburb || !postcode || !price || !availableFrom || !minStay || !bedrooms || !bathrooms || !images) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newHousingPost = await HousingPost.create({
      userId: req.user.id,
      title,
      type,
      description,
      address,
      coordinates,
      state,
      suburb,
      postcode,
      price,
      bond,
      availableFrom,
      minStay,
      bedrooms,
      bathrooms,
      furnished: furnished || false,
      preferredGender: preferredGender || 'any',
      petsAllowed: petsAllowed || false,
      utilities,
      amenities,
      images,
      contactMethod: contactMethod || 'chat',
      contactDetails,
      status: 'available'
    });
    
    const housing = await HousingPost.findByPk(newHousingPost.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    });
    
    res.status(201).json(housing);
  } catch (error) {
    console.error('Error creating housing post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/housing/:id
// @desc    Update housing post
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const housing = await HousingPost.findByPk(req.params.id);
    
    if (!housing) {
      return res.status(404).json({ message: 'Housing post not found' });
    }
    
    // Check if user owns this post
    if (housing.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }
    
    const {
      title,
      type,
      description,
      address,
      coordinates,
      state,
      suburb,
      postcode,
      price,
      bond,
      availableFrom,
      minStay,
      bedrooms,
      bathrooms,
      furnished,
      preferredGender,
      petsAllowed,
      utilities,
      amenities,
      images,
      contactMethod,
      contactDetails,
      status
    } = req.body;
    
    // Update the fields
    const updatedFields = {
      title,
      type,
      description,
      address,
      coordinates,
      state,
      suburb,
      postcode,
      price,
      bond,
      availableFrom,
      minStay,
      bedrooms,
      bathrooms,
      furnished,
      preferredGender,
      petsAllowed,
      utilities,
      amenities,
      images,
      contactMethod,
      contactDetails,
      status
    };
    
    // Filter out undefined values
    Object.keys(updatedFields).forEach(key => 
      updatedFields[key] === undefined && delete updatedFields[key]
    );
    
    await housing.update(updatedFields);
    
    res.json(housing);
  } catch (error) {
    console.error('Error updating housing post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/housing/:id
// @desc    Delete housing post
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const housing = await HousingPost.findByPk(req.params.id);
    
    if (!housing) {
      return res.status(404).json({ message: 'Housing post not found' });
    }
    
    // Check if user owns this post
    if (housing.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }
    
    await housing.destroy();
    
    res.json({ message: 'Housing post removed' });
  } catch (error) {
    console.error('Error deleting housing post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/housing/:id/status
// @desc    Update housing post status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['available', 'pending', 'leased'].includes(status)) {
      return res.status(400).json({ message: 'Please provide a valid status' });
    }
    
    const housing = await HousingPost.findByPk(req.params.id);
    
    if (!housing) {
      return res.status(404).json({ message: 'Housing post not found' });
    }
    
    // Check if user owns this post
    if (housing.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }
    
    housing.status = status;
    await housing.save();
    
    res.json(housing);
  } catch (error) {
    console.error('Error updating housing status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/housing/user/:userId
// @desc    Get housing posts by user ID
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const housings = await HousingPost.findAll({
      where: {
        userId: req.params.userId,
        status: 'available' // Only show available listings
      },
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(housings);
  } catch (error) {
    console.error('Error getting user housing posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
