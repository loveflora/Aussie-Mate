const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User, JobPost } = require('../models');
const { Op } = require('sequelize');

// @route   GET /api/jobs
// @desc    Get all job posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, state, status } = req.query;
    let whereClause = {};
    
    // Filter by type if provided
    if (type && ['hiring', 'seeking'].includes(type)) {
      whereClause.type = type;
    }
    
    // Filter by state if provided
    if (state) {
      whereClause.state = state;
    }
    
    // Filter by status (default to active only)
    whereClause.status = status || 'active';
    
    const jobs = await JobPost.findAll({
      where: whereClause,
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(jobs);
  } catch (error) {
    console.error('Error getting job posts:', error);
    return res.status(500).json({ 
      message: 'Server error fetching jobs', 
      error: error.message 
    });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await JobPost.findByPk(req.params.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar', 'email']
      }
    });
    
    if (!job) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    // Increment view count
    job.views += 1;
    await job.save();
    
    return res.json(job);
  } catch (error) {
    console.error('Error getting job post:', error);
    return res.status(500).json({ 
      message: 'Server error fetching job post', 
      error: error.message 
    });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job post
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      type,
      title,
      companyName,
      position,
      description,
      location,
      coordinates,
      state,
      salary,
      workDays,
      workHours,
      experienceRequired,
      jobDetails,
      visaRequirements,
      contactMethod,
      contactDetails,
      images,
      externalLink
    } = req.body;
    
    // Basic validation
    if (!title || !companyName || !position || !description || !location || !state) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newJobPost = await JobPost.create({
      userId: req.user.id,
      type,
      title,
      companyName,
      position,
      description,
      location,
      coordinates,
      state,
      salary,
      workDays,
      workHours,
      experienceRequired: experienceRequired || false,
      jobDetails,
      visaRequirements,
      contactMethod: contactMethod || 'email',
      contactDetails,
      images,
      externalLink,
      status: 'active'
    });
    
    const job = await JobPost.findByPk(newJobPost.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    });
    
    return res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job post:', error);
    return res.status(500).json({ 
      message: 'Server error creating job post', 
      error: error.message 
    });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update job post
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const job = await JobPost.findByPk(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    // Check if user owns this post
    if (job.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }
    
    const {
      type,
      title,
      companyName,
      position,
      description,
      location,
      coordinates,
      state,
      salary,
      workDays,
      workHours,
      experienceRequired,
      jobDetails,
      visaRequirements,
      contactMethod,
      contactDetails,
      images,
      externalLink,
      status
    } = req.body;
    
    // Update the fields
    const updatedFields = {
      type,
      title,
      companyName,
      position,
      description,
      location,
      coordinates,
      state,
      salary,
      workDays,
      workHours,
      experienceRequired,
      jobDetails,
      visaRequirements,
      contactMethod,
      contactDetails,
      images,
      externalLink,
      status
    };
    
    // Filter out undefined values
    Object.keys(updatedFields).forEach(key => 
      updatedFields[key] === undefined && delete updatedFields[key]
    );
    
    await job.update(updatedFields);
    
    return res.json(job);
  } catch (error) {
    console.error('Error updating job post:', error);
    return res.status(500).json({ 
      message: 'Server error updating job post', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete job post
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await JobPost.findByPk(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    // Check if user owns this post
    if (job.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }
    
    await job.destroy();
    
    return res.json({ message: 'Job post removed' });
  } catch (error) {
    console.error('Error deleting job post:', error);
    return res.status(500).json({ 
      message: 'Server error deleting job post', 
      error: error.message 
    });
  }
});

// @route   PUT /api/jobs/:id/status
// @desc    Update job post status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'filled', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Please provide a valid status' });
    }
    
    const job = await JobPost.findByPk(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    // Check if user owns this post
    if (job.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }
    
    job.status = status;
    await job.save();
    
    return res.json(job);
  } catch (error) {
    console.error('Error updating job status:', error);
    return res.status(500).json({ 
      message: 'Server error updating job status', 
      error: error.message 
    });
  }
});

// @route   GET /api/jobs/user/:userId
// @desc    Get job posts by user ID
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const jobs = await JobPost.findAll({
      where: {
        userId: req.params.userId,
        status: 'active' // Only show active posts
      },
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      },
      order: [['createdAt', 'DESC']]
    });
    
    return res.json(jobs);
  } catch (error) {
    console.error('Error getting user job posts:', error);
    return res.status(500).json({ 
      message: 'Server error fetching user job posts', 
      error: error.message 
    });
  }
});

module.exports = router;
