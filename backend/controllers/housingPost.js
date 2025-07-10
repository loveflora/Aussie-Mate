const { HousingPost, User } = require('../models');
const { Op } = require('sequelize');

// @desc   Get all housing posts
// @route  GET /api/housing
// @access Public
exports.getAllHousingPosts = async (req, res) => {
  try {
    const { 
      state, 
      type, 
      minPrice, 
      maxPrice, 
      rooms, 
      gender,
      petsAllowed,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const whereClause = { status: 'active' };
    
    // Add filters if provided
    if (state) whereClause.state = state;
    if (type) whereClause.type = type;
    if (rooms) whereClause.rooms = rooms;
    if (gender) whereClause.genderPreference = gender;
    if (petsAllowed) whereClause.petsAllowed = petsAllowed === 'true';
    
    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.weeklyPrice = {};
      if (minPrice) whereClause.weeklyPrice[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.weeklyPrice[Op.lte] = parseFloat(maxPrice);
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const housingPosts = await HousingPost.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname']
        }
      ]
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(housingPosts.count / limit);
    
    res.json({
      success: true,
      count: housingPosts.count,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit)
      },
      data: housingPosts.rows
    });
  } catch (error) {
    console.error('Error fetching housing posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching housing posts'
    });
  }
};

// @desc   Get housing post by ID
// @route  GET /api/housing/:id
// @access Public
exports.getHousingPostById = async (req, res) => {
  try {
    const housingPost = await HousingPost.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'email']
        }
      ]
    });
    
    if (!housingPost) {
      return res.status(404).json({
        success: false,
        message: 'Housing post not found'
      });
    }
    
    // Increment views count
    housingPost.views = housingPost.views + 1;
    await housingPost.save();
    
    res.json({
      success: true,
      data: housingPost
    });
  } catch (error) {
    console.error('Error fetching housing post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching housing post'
    });
  }
};

// @desc   Create new housing post
// @route  POST /api/housing
// @access Private
exports.createHousingPost = async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      address,
      suburb,
      state,
      postcode,
      weeklyPrice,
      bond,
      availableFrom,
      minimumStay,
      maximumStay,
      rooms,
      genderPreference,
      petsAllowed,
      amenities,
      contactEmail,
      contactPhone,
      contactKakaoId
    } = req.body;
    
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authorized'
      });
    }
    
    // Process uploaded images if any
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Parse location coordinates if provided
    let coordinates = null;
    if (req.body.latitude && req.body.longitude) {
      coordinates = {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      };
    }
    
    // Parse amenities if provided as JSON string
    let parsedAmenities = amenities;
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = amenities.split(',').map(item => item.trim());
      }
    }
    
    // Create housing post
    const housingPost = await HousingPost.create({
      userId: req.user.id,
      title,
      type,
      description,
      address,
      suburb,
      state,
      postcode,
      coordinates,
      weeklyPrice: parseFloat(weeklyPrice),
      bond: bond ? parseFloat(bond) : null,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      minimumStay: minimumStay || null,
      maximumStay: maximumStay || null,
      rooms: parseInt(rooms) || 1,
      genderPreference: genderPreference || 'any',
      petsAllowed: petsAllowed === 'true',
      amenities: parsedAmenities || [],
      contactEmail,
      contactPhone,
      contactKakaoId,
      images,
      status: 'active',
      views: 0
    });
    
    res.status(201).json({
      success: true,
      data: housingPost
    });
  } catch (error) {
    console.error('Error creating housing post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating housing post'
    });
  }
};

// @desc   Update housing post
// @route  PUT /api/housing/:id
// @access Private
exports.updateHousingPost = async (req, res) => {
  try {
    const housingPost = await HousingPost.findByPk(req.params.id);
    
    if (!housingPost) {
      return res.status(404).json({
        success: false,
        message: 'Housing post not found'
      });
    }
    
    // Check if user is the owner of the housing post
    if (housingPost.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this housing post'
      });
    }
    
    // Fields to update
    const {
      title,
      type,
      description,
      address,
      suburb,
      state,
      postcode,
      weeklyPrice,
      bond,
      availableFrom,
      minimumStay,
      maximumStay,
      rooms,
      genderPreference,
      petsAllowed,
      amenities,
      contactEmail,
      contactPhone,
      contactKakaoId,
      status
    } = req.body;
    
    // Update fields if provided
    if (title) housingPost.title = title;
    if (type) housingPost.type = type;
    if (description) housingPost.description = description;
    if (address) housingPost.address = address;
    if (suburb) housingPost.suburb = suburb;
    if (state) housingPost.state = state;
    if (postcode) housingPost.postcode = postcode;
    if (weeklyPrice) housingPost.weeklyPrice = parseFloat(weeklyPrice);
    if (bond) housingPost.bond = parseFloat(bond);
    if (availableFrom) housingPost.availableFrom = new Date(availableFrom);
    if (minimumStay) housingPost.minimumStay = minimumStay;
    if (maximumStay) housingPost.maximumStay = maximumStay;
    if (rooms) housingPost.rooms = parseInt(rooms);
    if (genderPreference) housingPost.genderPreference = genderPreference;
    if (petsAllowed !== undefined) housingPost.petsAllowed = petsAllowed === 'true';
    if (contactEmail) housingPost.contactEmail = contactEmail;
    if (contactPhone) housingPost.contactPhone = contactPhone;
    if (contactKakaoId) housingPost.contactKakaoId = contactKakaoId;
    if (status) housingPost.status = status;
    
    // Parse amenities if provided as JSON string
    if (amenities) {
      let parsedAmenities = amenities;
      if (typeof amenities === 'string') {
        try {
          parsedAmenities = JSON.parse(amenities);
        } catch (e) {
          parsedAmenities = amenities.split(',').map(item => item.trim());
        }
      }
      housingPost.amenities = parsedAmenities;
    }
    
    // Parse location coordinates if provided
    if (req.body.latitude && req.body.longitude) {
      housingPost.coordinates = {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      };
    }
    
    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      
      // If keepExistingImages is true, append new images to existing ones
      if (req.body.keepExistingImages === 'true') {
        housingPost.images = [...housingPost.images, ...newImages];
      } else {
        housingPost.images = newImages;
      }
    }
    
    // Save updated housing post
    await housingPost.save();
    
    res.json({
      success: true,
      data: housingPost
    });
  } catch (error) {
    console.error('Error updating housing post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating housing post'
    });
  }
};

// @desc   Delete housing post
// @route  DELETE /api/housing/:id
// @access Private
exports.deleteHousingPost = async (req, res) => {
  try {
    const housingPost = await HousingPost.findByPk(req.params.id);
    
    if (!housingPost) {
      return res.status(404).json({
        success: false,
        message: 'Housing post not found'
      });
    }
    
    // Check if user is the owner of the housing post
    if (housingPost.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this housing post'
      });
    }
    
    // Delete housing post
    await housingPost.destroy();
    
    res.json({
      success: true,
      message: 'Housing post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting housing post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting housing post'
    });
  }
};

// @desc   Search housing posts
// @route  GET /api/housing/search
// @access Public
exports.searchHousingPosts = async (req, res) => {
  try {
    const { query, state, type, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    const whereClause = {
      status: 'active',
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { address: { [Op.like]: `%${query}%` } },
        { suburb: { [Op.like]: `%${query}%` } }
      ]
    };
    
    // Add filters if provided
    if (state) whereClause.state = state;
    if (type) whereClause.type = type;
    
    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.weeklyPrice = {};
      if (minPrice) whereClause.weeklyPrice[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.weeklyPrice[Op.lte] = parseFloat(maxPrice);
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const housingPosts = await HousingPost.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname']
        }
      ]
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(housingPosts.count / limit);
    
    res.json({
      success: true,
      count: housingPosts.count,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit)
      },
      data: housingPosts.rows
    });
  } catch (error) {
    console.error('Error searching housing posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching housing posts'
    });
  }
};

// @desc   Get housing posts by user
// @route  GET /api/housing/user/:userId
// @access Public
exports.getHousingPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const housingPosts = await HousingPost.findAndCountAll({
      where: {
        userId,
        status: 'active'
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname']
        }
      ]
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(housingPosts.count / limit);
    
    res.json({
      success: true,
      count: housingPosts.count,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit)
      },
      data: housingPosts.rows
    });
  } catch (error) {
    console.error('Error fetching user housing posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user housing posts'
    });
  }
};
