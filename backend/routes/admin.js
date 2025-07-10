const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  User, 
  CommunityPost, 
  JobPost, 
  HousingPost, 
  MarketplaceItem,
  TravelListing, 
  MeetupRegistration,
  VisaConsultation,
  Report
} = require('../models');

// All routes in this file are protected and require admin authorization
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/users
// @desc    Get all users with filtering options
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { status, role, search, sortBy, order, page = 1, limit = 20 } = req.query;
    let whereClause = {};
    let orderClause = [['createdAt', 'DESC']];
    
    // Filter by status
    if (status) {
      whereClause.status = status;
    }
    
    // Filter by role
    if (role) {
      whereClause.role = role;
    }
    
    // Search by name or email
    if (search) {
      whereClause.$or = [
        { name: { $like: `%${search}%` } },
        { email: { $like: `%${search}%` } }
      ];
    }
    
    // Custom sorting
    if (sortBy) {
      orderClause = [[sortBy, order === 'asc' ? 'ASC' : 'DESC']];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['password'] }
    });
    
    res.json({
      users: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalUsers: count
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details by ID
// @access  Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user status or role
// @access  Admin
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow admins to modify other admins
    if (user.role === 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ message: 'Cannot modify another admin user' });
    }
    
    const { status, role } = req.body;
    
    // Update fields
    const updatedFields = {};
    
    if (status) {
      updatedFields.status = status;
    }
    
    if (role) {
      updatedFields.role = role;
    }
    
    await user.update(updatedFields);
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow admins to delete other admins
    if (user.role === 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ message: 'Cannot delete another admin user' });
    }
    
    await user.destroy();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/reports
// @desc    Get all reported content with filtering
// @access  Admin
router.get('/reports', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    let whereClause = {};
    
    // Filter by status
    if (status) {
      whereClause.status = status;
    }
    
    // Filter by content type
    if (type) {
      whereClause.contentType = type;
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Report.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });
    
    res.json({
      reports: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalReports: count
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/reports/:id
// @desc    Update report status (resolve, reject, etc.)
// @access  Admin
router.put('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    const { status, adminNote } = req.body;
    
    // Update report
    await report.update({
      status,
      adminNote,
      handledBy: req.user.id,
      handledAt: new Date()
    });
    
    // If we're resolving the report and taking action on the content
    if (status === 'resolved' && req.body.action === 'remove') {
      // Handle different content types
      switch (report.contentType) {
        case 'post':
          await CommunityPost.destroy({ where: { id: report.contentId } });
          break;
        case 'job':
          await JobPost.destroy({ where: { id: report.contentId } });
          break;
        case 'housing':
          await HousingPost.destroy({ where: { id: report.contentId } });
          break;
        case 'marketplace':
          await MarketplaceItem.destroy({ where: { id: report.contentId } });
          break;
        case 'travel':
          await TravelListing.destroy({ where: { id: report.contentId } });
          break;
        default:
          break;
      }
    }
    
    res.json({ message: 'Report updated successfully', report });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts of various entities
    const userCount = await User.count();
    const activeUserCount = await User.count({ where: { status: 'active' } });
    const postCount = await CommunityPost.count();
    const jobCount = await JobPost.count();
    const housingCount = await HousingPost.count();
    const marketplaceCount = await MarketplaceItem.count();
    const travelCount = await TravelListing.count();
    const pendingReports = await Report.count({ where: { status: 'pending' } });
    
    // Get recent signups (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentSignups = await User.count({
      where: {
        createdAt: {
          $gte: oneWeekAgo
        }
      }
    });
    
    // Get most active users
    const mostActiveUsers = await User.findAll({
      attributes: ['id', 'name', 'avatar', 'email', [
        /* This would be a SQL query to count posts or activities */
        /* Simplified for the route file */
        'COUNT(CommunityPosts.id)', 'postCount'
      ]],
      include: [
        {
          model: CommunityPost,
          attributes: []
        }
      ],
      group: ['User.id'],
      order: [[sequelize.literal('postCount'), 'DESC']],
      limit: 5
    });
    
    // Recent activity
    const recentActivity = {
      posts: await CommunityPost.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        }
      }),
      reports: await Report.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    };
    
    res.json({
      counts: {
        users: userCount,
        activeUsers: activeUserCount,
        posts: postCount,
        jobs: jobCount,
        housing: housingCount,
        marketplace: marketplaceCount,
        travel: travelCount,
        pendingReports
      },
      recentSignups,
      mostActiveUsers,
      recentActivity
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/content/:type
// @desc    Get content by type for moderation
// @access  Admin
router.get('/content/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    let model, includeOptions;
    
    // Set model and includes based on content type
    switch (type) {
      case 'posts':
        model = CommunityPost;
        includeOptions = {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        };
        break;
      case 'jobs':
        model = JobPost;
        includeOptions = {
          model: User,
          as: 'employer',
          attributes: ['id', 'name', 'avatar']
        };
        break;
      case 'housing':
        model = HousingPost;
        includeOptions = {
          model: User,
          as: 'landlord',
          attributes: ['id', 'name', 'avatar']
        };
        break;
      case 'marketplace':
        model = MarketplaceItem;
        includeOptions = {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'avatar']
        };
        break;
      case 'travel':
        model = TravelListing;
        includeOptions = {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        };
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }
    
    let whereClause = {};
    
    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }
    
    const { count, rows } = await model.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: includeOptions
    });
    
    res.json({
      items: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/content/:type/:id
// @desc    Update content status (approve, reject, etc.)
// @access  Admin
router.put('/content/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status, adminNote } = req.body;
    
    let model;
    
    // Set model based on content type
    switch (type) {
      case 'posts':
        model = CommunityPost;
        break;
      case 'jobs':
        model = JobPost;
        break;
      case 'housing':
        model = HousingPost;
        break;
      case 'marketplace':
        model = MarketplaceItem;
        break;
      case 'travel':
        model = TravelListing;
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }
    
    const content = await model.findByPk(id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Update content
    await content.update({
      status,
      adminNote
    });
    
    res.json({ message: 'Content updated successfully', content });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/content/:type/:id
// @desc    Delete content
// @access  Admin
router.delete('/content/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    let model;
    
    // Set model based on content type
    switch (type) {
      case 'posts':
        model = CommunityPost;
        break;
      case 'jobs':
        model = JobPost;
        break;
      case 'housing':
        model = HousingPost;
        break;
      case 'marketplace':
        model = MarketplaceItem;
        break;
      case 'travel':
        model = TravelListing;
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }
    
    const content = await model.findByPk(id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Delete content
    await content.destroy();
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
