const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User, JobPost } = require('../models');
const { Op } = require('sequelize');

// @route   GET /api/jobs
// @desc    Get all job posts
// @access  Public
router.get('/', async (req, res) => {
  console.log('GET /api/jobs 요청 받음');
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
    
    // Filter by status (default to active only if provided)
    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = 'active';
    }
    
    console.log('jobs 쿼리 실행:', JSON.stringify(whereClause));
    
    // 쿼리 최적화: 필요한 필드만 선택하고 결과 제한
    const jobs = await JobPost.findAll({
      where: whereClause,
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'nickname', 'profileImage']
      },
      order: [['createdAt', 'DESC']],
      limit: 20 // 결과 수 제한
    });
    
    console.log(`${jobs.length}개의 jobs 찾음`);
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
  console.log(`GET /api/jobs/${req.params.id} 요청 받음`);
  try {
    const job = await JobPost.findByPk(req.params.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'nickname', 'profileImage', 'email']
      }
    });
    
    if (!job) {
      console.log(`Job post ${req.params.id} 찾을 수 없음`);
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    console.log(`Job post ${req.params.id} 찾음`);
    
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
// @access  Private (temporarily set to public for testing)
router.post('/', async (req, res) => {
  console.log('POST /api/jobs 요청 받음');
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
      console.log('필수 필드 누락');
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newJobPost = await JobPost.create({
      userId: 1, // 테스트용 사용자 ID 하드코딩 (실제로는 req.user.id를 사용)
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
    
    console.log(`Job post ${newJobPost.id} 생성됨`);
    
    const job = await JobPost.findByPk(newJobPost.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'nickname', 'profileImage']
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
  console.log(`PUT /api/jobs/${req.params.id} 요청 받음`);
  try {
    const job = await JobPost.findByPk(req.params.id);
    
    if (!job) {
      console.log(`Job post ${req.params.id} 찾을 수 없음`);
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    // Check if user owns this post
    if (job.userId.toString() !== req.user.id.toString()) {
      console.log('권한 없음');
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
    
    console.log(`Job post ${req.params.id} 업데이트됨`);
    
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
  console.log(`DELETE /api/jobs/${req.params.id} 요청 받음`);
  try {
    const job = await JobPost.findByPk(req.params.id);
    
    if (!job) {
      console.log(`Job post ${req.params.id} 찾을 수 없음`);
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    // Check if user owns this post
    if (job.userId.toString() !== req.user.id.toString()) {
      console.log('권한 없음');
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }
    
    await job.destroy();
    
    console.log(`Job post ${req.params.id} 삭제됨`);
    
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
  console.log(`PUT /api/jobs/${req.params.id}/status 요청 받음`);
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'filled', 'closed'].includes(status)) {
      console.log('잘못된 상태 값');
      return res.status(400).json({ message: 'Please provide a valid status' });
    }
    
    const job = await JobPost.findByPk(req.params.id);
    
    if (!job) {
      console.log(`Job post ${req.params.id} 찾을 수 없음`);
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    // Check if user owns this post
    if (job.userId.toString() !== req.user.id.toString()) {
      console.log('권한 없음');
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }
    
    job.status = status;
    await job.save();
    
    console.log(`Job post ${req.params.id} 상태 업데이트됨`);
    
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
  console.log(`GET /api/jobs/user/${req.params.userId} 요청 받음`);
  try {
    const jobs = await JobPost.findAll({
      where: {
        userId: req.params.userId,
        status: 'active' // Only show active posts
      },
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'nickname', 'profileImage']
      },
      order: [['createdAt', 'DESC']],
      limit: 20 // 결과 수 제한
    });
    
    console.log(`${jobs.length}개의 jobs 찾음`);
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
