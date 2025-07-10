const { JobPost, User } = require('../models');
const { Op } = require('sequelize');

// @desc   Get all job posts
// @route  GET /api/jobs
// @access Public
exports.getAllJobPosts = async (req, res) => {
  try {
    const { state, jobType, visaRequirements, page = 1, limit = 10 } = req.query;
    const whereClause = { status: 'active' };
    
    // Add filters if provided
    if (state) whereClause.state = state;
    if (jobType) whereClause.jobType = jobType;
    if (visaRequirements) whereClause.visaRequirements = visaRequirements;
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const jobPosts = await JobPost.findAndCountAll({
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
    const totalPages = Math.ceil(jobPosts.count / limit);
    
    res.json({
      success: true,
      count: jobPosts.count,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit)
      },
      data: jobPosts.rows
    });
  } catch (error) {
    console.error('Error fetching job posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job posts'
    });
  }
};

// @desc   Get job post by ID
// @route  GET /api/jobs/:id
// @access Public
exports.getJobPostById = async (req, res) => {
  try {
    const jobPost = await JobPost.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'email']
        }
      ]
    });
    
    if (!jobPost) {
      return res.status(404).json({
        success: false,
        message: 'Job post not found'
      });
    }
    
    // Increment views count
    jobPost.views = jobPost.views + 1;
    await jobPost.save();
    
    res.json({
      success: true,
      data: jobPost
    });
  } catch (error) {
    console.error('Error fetching job post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job post'
    });
  }
};

// @desc   Create new job post
// @route  POST /api/jobs
// @access Private
exports.createJobPost = async (req, res) => {
  try {
    const {
      title,
      jobType,
      companyName,
      position,
      description,
      location,
      state,
      salary,
      workSchedule,
      visaRequirements,
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
    
    // Create job post
    const jobPost = await JobPost.create({
      userId: req.user.id,
      title,
      jobType,
      companyName,
      position,
      description,
      location,
      state,
      coordinates,
      salary,
      workSchedule,
      visaRequirements,
      contactEmail,
      contactPhone,
      contactKakaoId,
      images,
      status: 'active'
    });
    
    res.status(201).json({
      success: true,
      data: jobPost
    });
  } catch (error) {
    console.error('Error creating job post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating job post'
    });
  }
};

// @desc   Update job post
// @route  PUT /api/jobs/:id
// @access Private
exports.updateJobPost = async (req, res) => {
  try {
    const jobPost = await JobPost.findByPk(req.params.id);
    
    if (!jobPost) {
      return res.status(404).json({
        success: false,
        message: 'Job post not found'
      });
    }
    
    // Check if user is the owner of the job post
    if (jobPost.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this job post'
      });
    }
    
    // Fields to update
    const {
      title,
      jobType,
      companyName,
      position,
      description,
      location,
      state,
      salary,
      workSchedule,
      visaRequirements,
      contactEmail,
      contactPhone,
      contactKakaoId,
      status
    } = req.body;
    
    // Update fields if provided
    if (title) jobPost.title = title;
    if (jobType) jobPost.jobType = jobType;
    if (companyName) jobPost.companyName = companyName;
    if (position) jobPost.position = position;
    if (description) jobPost.description = description;
    if (location) jobPost.location = location;
    if (state) jobPost.state = state;
    if (salary) jobPost.salary = salary;
    if (workSchedule) jobPost.workSchedule = workSchedule;
    if (visaRequirements) jobPost.visaRequirements = visaRequirements;
    if (contactEmail) jobPost.contactEmail = contactEmail;
    if (contactPhone) jobPost.contactPhone = contactPhone;
    if (contactKakaoId) jobPost.contactKakaoId = contactKakaoId;
    if (status) jobPost.status = status;
    
    // Parse location coordinates if provided
    if (req.body.latitude && req.body.longitude) {
      jobPost.coordinates = {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      };
    }
    
    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      
      // If keepExistingImages is true, append new images to existing ones
      if (req.body.keepExistingImages === 'true') {
        jobPost.images = [...jobPost.images, ...newImages];
      } else {
        jobPost.images = newImages;
      }
    }
    
    // Save updated job post
    await jobPost.save();
    
    res.json({
      success: true,
      data: jobPost
    });
  } catch (error) {
    console.error('Error updating job post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating job post'
    });
  }
};

// @desc   Delete job post
// @route  DELETE /api/jobs/:id
// @access Private
exports.deleteJobPost = async (req, res) => {
  try {
    const jobPost = await JobPost.findByPk(req.params.id);
    
    if (!jobPost) {
      return res.status(404).json({
        success: false,
        message: 'Job post not found'
      });
    }
    
    // Check if user is the owner of the job post
    if (jobPost.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this job post'
      });
    }
    
    // Delete job post
    await jobPost.destroy();
    
    res.json({
      success: true,
      message: 'Job post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting job post'
    });
  }
};

// @desc   Search job posts
// @route  GET /api/jobs/search
// @access Public
exports.searchJobPosts = async (req, res) => {
  try {
    const { query, state, jobType, page = 1, limit = 10 } = req.query;
    
    const whereClause = {
      status: 'active',
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { companyName: { [Op.like]: `%${query}%` } },
        { position: { [Op.like]: `%${query}%` } }
      ]
    };
    
    // Add filters if provided
    if (state) whereClause.state = state;
    if (jobType) whereClause.jobType = jobType;
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const jobPosts = await JobPost.findAndCountAll({
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
    const totalPages = Math.ceil(jobPosts.count / limit);
    
    res.json({
      success: true,
      count: jobPosts.count,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit)
      },
      data: jobPosts.rows
    });
  } catch (error) {
    console.error('Error searching job posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching job posts'
    });
  }
};

// @desc   Get job posts by user
// @route  GET /api/jobs/user/:userId
// @access Public
exports.getJobPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const jobPosts = await JobPost.findAndCountAll({
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
    const totalPages = Math.ceil(jobPosts.count / limit);
    
    res.json({
      success: true,
      count: jobPosts.count,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit)
      },
      data: jobPosts.rows
    });
  } catch (error) {
    console.error('Error fetching user job posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user job posts'
    });
  }
};
