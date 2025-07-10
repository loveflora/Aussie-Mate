const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User, MarketplaceItem } = require('../models');
const { Op } = require('sequelize');

// @route   GET /api/marketplace
// @desc    Get all marketplace items
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, condition, minPrice, maxPrice, state } = req.query;
    let whereClause = {};
    
    // Filter by category if provided
    if (category) {
      whereClause.category = category;
    }
    
    // Filter by condition if provided
    if (condition) {
      whereClause.condition = condition;
    }
    
    // Filter by state if provided
    if (state) {
      whereClause.state = state;
    }
    
    // Filter by price range if provided
    if (minPrice || maxPrice) {
      whereClause.price = {};
      
      if (minPrice) {
        whereClause.price[Op.gte] = parseFloat(minPrice);
      }
      
      if (maxPrice) {
        whereClause.price[Op.lte] = parseFloat(maxPrice);
      }
    }
    
    // By default, only show available items
    whereClause.status = whereClause.status || 'available';
    
    const items = await MarketplaceItem.findAll({
      where: whereClause,
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      },
      order: [['createdAt', 'DESC']]
    });
    
    return res.json(items);
  } catch (error) {
    console.error('Error getting marketplace items:', error);
    return res.status(500).json({ 
      message: 'Server error fetching marketplace items', 
      error: error.message 
    });
  }
});

// @route   GET /api/marketplace/:id
// @desc    Get marketplace item by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const item = await MarketplaceItem.findByPk(req.params.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar', 'email']
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Increment view count
    item.views += 1;
    await item.save();
    
    res.json(item);
  } catch (error) {
    console.error('Error getting marketplace item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/marketplace
// @desc    Create a new marketplace item
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      price,
      images,
      location,
      state,
      contactMethod,
      contactDetails
    } = req.body;
    
    // Basic validation
    if (!title || !description || !category || !condition || !price || !images || !location || !state) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newItem = await MarketplaceItem.create({
      userId: req.user.id,
      title,
      description,
      category,
      condition,
      price,
      images,
      location,
      state,
      contactMethod: contactMethod || 'chat',
      contactDetails,
      status: 'available',
      views: 0
    });
    
    const item = await MarketplaceItem.findByPk(newItem.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    });
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating marketplace item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/marketplace/:id
// @desc    Update marketplace item
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const item = await MarketplaceItem.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user owns this item
    if (item.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this item' });
    }
    
    const {
      title,
      description,
      category,
      condition,
      price,
      images,
      location,
      state,
      contactMethod,
      contactDetails,
      status
    } = req.body;
    
    // Update the fields
    const updatedFields = {
      title,
      description,
      category,
      condition,
      price,
      images,
      location,
      state,
      contactMethod,
      contactDetails,
      status
    };
    
    // Filter out undefined values
    Object.keys(updatedFields).forEach(key => 
      updatedFields[key] === undefined && delete updatedFields[key]
    );
    
    await item.update(updatedFields);
    
    res.json(item);
  } catch (error) {
    console.error('Error updating marketplace item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/marketplace/:id
// @desc    Delete marketplace item
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await MarketplaceItem.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user owns this item
    if (item.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this item' });
    }
    
    await item.destroy();
    
    res.json({ message: 'Marketplace item removed' });
  } catch (error) {
    console.error('Error deleting marketplace item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/marketplace/:id/status
// @desc    Update marketplace item status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['available', 'pending', 'sold'].includes(status)) {
      return res.status(400).json({ message: 'Please provide a valid status' });
    }
    
    const item = await MarketplaceItem.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user owns this item
    if (item.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this item' });
    }
    
    item.status = status;
    await item.save();
    
    res.json(item);
  } catch (error) {
    console.error('Error updating marketplace item status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/marketplace/user/:userId
// @desc    Get marketplace items by user ID
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const items = await MarketplaceItem.findAll({
      where: {
        userId: req.params.userId,
        status: 'available' // Only show available items by default
      },
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(items);
  } catch (error) {
    console.error('Error getting user marketplace items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
