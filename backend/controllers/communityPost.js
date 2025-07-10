const { CommunityPost, User, Comment, Like } = require('../models');
const { Op } = require('sequelize');

// @desc   Get all community posts
// @route  GET /api/community
// @access Public
exports.getAllCommunityPosts = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const whereClause = { status: 'active' };
    
    // Add category filter if provided
    if (category) whereClause.category = category;
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const communityPosts = await CommunityPost.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'profileImage']
        },
        {
          model: Comment,
          as: 'comments',
          separate: true,
          attributes: ['id', 'content'],
          limit: 3
        },
        {
          model: Like,
          as: 'likes',
          attributes: ['id', 'userId']
        }
      ],
      distinct: true
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(communityPosts.count / limit);
    
    res.json({
      success: true,
      count: communityPosts.count,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit)
      },
      data: communityPosts.rows.map(post => ({
        ...post.toJSON(),
        commentCount: post.comments.length,
        likeCount: post.likes.length
      }))
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching community posts'
    });
  }
};

// @desc   Get community post by ID
// @route  GET /api/community/:id
// @access Public
exports.getCommunityPostById = async (req, res) => {
  try {
    const communityPost = await CommunityPost.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'profileImage']
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'nickname', 'profileImage']
            }
          ],
          order: [['createdAt', 'ASC']]
        },
        {
          model: Like,
          as: 'likes',
          attributes: ['id', 'userId']
        }
      ]
    });
    
    if (!communityPost) {
      return res.status(404).json({
        success: false,
        message: 'Community post not found'
      });
    }
    
    // Increment views count
    communityPost.views = communityPost.views + 1;
    await communityPost.save();
    
    res.json({
      success: true,
      data: {
        ...communityPost.toJSON(),
        commentCount: communityPost.comments.length,
        likeCount: communityPost.likes.length
      }
    });
  } catch (error) {
    console.error('Error fetching community post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching community post'
    });
  }
};

// @desc   Create new community post
// @route  POST /api/community
// @access Private
exports.createCommunityPost = async (req, res) => {
  try {
    const {
      title,
      content,
      category
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
    
    // Create community post
    const communityPost = await CommunityPost.create({
      userId: req.user.id,
      title,
      content,
      category,
      images,
      status: 'active',
      views: 0
    });
    
    // Fetch the created post with user data
    const createdPost = await CommunityPost.findByPk(communityPost.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'profileImage']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: createdPost
    });
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating community post'
    });
  }
};

// @desc   Update community post
// @route  PUT /api/community/:id
// @access Private
exports.updateCommunityPost = async (req, res) => {
  try {
    const communityPost = await CommunityPost.findByPk(req.params.id);
    
    if (!communityPost) {
      return res.status(404).json({
        success: false,
        message: 'Community post not found'
      });
    }
    
    // Check if user is the owner of the community post
    if (communityPost.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this community post'
      });
    }
    
    // Fields to update
    const {
      title,
      content,
      category,
      status
    } = req.body;
    
    // Update fields if provided
    if (title) communityPost.title = title;
    if (content) communityPost.content = content;
    if (category) communityPost.category = category;
    if (status && req.user.isAdmin) communityPost.status = status;
    
    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      
      // If keepExistingImages is true, append new images to existing ones
      if (req.body.keepExistingImages === 'true') {
        communityPost.images = [...communityPost.images, ...newImages];
      } else {
        communityPost.images = newImages;
      }
    }
    
    // Save updated community post
    await communityPost.save();
    
    res.json({
      success: true,
      data: communityPost
    });
  } catch (error) {
    console.error('Error updating community post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating community post'
    });
  }
};

// @desc   Delete community post
// @route  DELETE /api/community/:id
// @access Private
exports.deleteCommunityPost = async (req, res) => {
  try {
    const communityPost = await CommunityPost.findByPk(req.params.id);
    
    if (!communityPost) {
      return res.status(404).json({
        success: false,
        message: 'Community post not found'
      });
    }
    
    // Check if user is the owner of the community post
    if (communityPost.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this community post'
      });
    }
    
    // Delete community post
    await communityPost.destroy();
    
    res.json({
      success: true,
      message: 'Community post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting community post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting community post'
    });
  }
};

// @desc   Add comment to community post
// @route  POST /api/community/:id/comments
// @access Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { id } = req.params;
    
    // Check if community post exists
    const communityPost = await CommunityPost.findByPk(id);
    if (!communityPost) {
      return res.status(404).json({
        success: false,
        message: 'Community post not found'
      });
    }
    
    // Create comment
    const comment = await Comment.create({
      content,
      userId: req.user.id,
      commentableId: id,
      commentableType: 'CommunityPost'
    });
    
    // Fetch the created comment with user data
    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'profileImage']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: createdComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
};

// @desc   Delete comment from community post
// @route  DELETE /api/community/comments/:commentId
// @access Private
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Check if comment exists
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user is the owner of the comment or post
    const post = await CommunityPost.findByPk(comment.commentableId);
    if (comment.userId !== req.user.id && post.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }
    
    // Delete comment
    await comment.destroy();
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
};

// @desc   Like or unlike community post
// @route  POST /api/community/:id/like
// @access Private
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if community post exists
    const communityPost = await CommunityPost.findByPk(id);
    if (!communityPost) {
      return res.status(404).json({
        success: false,
        message: 'Community post not found'
      });
    }
    
    // Check if user already liked the post
    const existingLike = await Like.findOne({
      where: {
        userId: req.user.id,
        likeableId: id,
        likeableType: 'CommunityPost'
      }
    });
    
    if (existingLike) {
      // Unlike the post
      await existingLike.destroy();
      res.json({
        success: true,
        message: 'Post unliked successfully',
        liked: false
      });
    } else {
      // Like the post
      await Like.create({
        userId: req.user.id,
        likeableId: id,
        likeableType: 'CommunityPost'
      });
      res.json({
        success: true,
        message: 'Post liked successfully',
        liked: true
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
};

// @desc   Search community posts
// @route  GET /api/community/search
// @access Public
exports.searchCommunityPosts = async (req, res) => {
  try {
    const { query, category, page = 1, limit = 10 } = req.query;
    
    const whereClause = {
      status: 'active',
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { content: { [Op.like]: `%${query}%` } }
      ]
    };
    
    // Add category filter if provided
    if (category) whereClause.category = category;
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const communityPosts = await CommunityPost.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'profileImage']
        },
        {
          model: Comment,
          as: 'comments',
          separate: true,
          attributes: ['id']
        },
        {
          model: Like,
          as: 'likes',
          attributes: ['id']
        }
      ],
      distinct: true
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(communityPosts.count / limit);
    
    res.json({
      success: true,
      count: communityPosts.count,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit)
      },
      data: communityPosts.rows.map(post => ({
        ...post.toJSON(),
        commentCount: post.comments.length,
        likeCount: post.likes.length
      }))
    });
  } catch (error) {
    console.error('Error searching community posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching community posts'
    });
  }
};

// @desc   Get community posts by user
// @route  GET /api/community/user/:userId
// @access Public
exports.getCommunityPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const communityPosts = await CommunityPost.findAndCountAll({
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
          attributes: ['id', 'nickname', 'profileImage']
        },
        {
          model: Comment,
          as: 'comments',
          separate: true,
          attributes: ['id']
        },
        {
          model: Like,
          as: 'likes',
          attributes: ['id']
        }
      ],
      distinct: true
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(communityPosts.count / limit);
    
    res.json({
      success: true,
      count: communityPosts.count,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit)
      },
      data: communityPosts.rows.map(post => ({
        ...post.toJSON(),
        commentCount: post.comments.length,
        likeCount: post.likes.length
      }))
    });
  } catch (error) {
    console.error('Error fetching user community posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user community posts'
    });
  }
};
