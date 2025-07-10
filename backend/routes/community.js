const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  User, 
  CommunityPost, 
  Like, 
  Comment, 
  CommunityCategory, 
  CommunityResource 
} = require('../models');

// @route   GET /api/community/categories
// @desc    Get all community categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await CommunityCategory.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/posts
// @desc    Get all community posts with filtering and pagination
// @access  Public
router.get('/posts', async (req, res) => {
  try {
    const { 
      category, 
      sortBy = 'createdAt', 
      order = 'desc', 
      page = 1, 
      limit = 10,
      search 
    } = req.query;
    
    let whereClause = {};
    let orderClause = [[sortBy, order.toUpperCase()]];
    
    // Add category filter if provided
    if (category) {
      whereClause.categoryId = category;
    }
    
    // Add search filter if provided
    if (search) {
      whereClause.$or = [
        { title: { $like: `%${search}%` } },
        { content: { $like: `%${search}%` } }
      ];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    const { count, rows } = await CommunityPost.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: CommunityCategory,
          as: 'category'
        },
        {
          model: Like,
          as: 'postLikes',
          attributes: ['id', 'userId']
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id']
        }
      ]
    });
    
    // Format posts to include like and comment counts
    const formattedPosts = rows.map(post => ({
      ...post.toJSON(),
      likeCount: post.postLikes?.length || 0,
      commentCount: post.comments?.length || 0
    }));
    
    res.json({
      posts: formattedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/posts/:id
// @desc    Get a community post by ID
// @access  Public
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: CommunityCategory,
          as: 'category'
        },
        {
          model: Like,
          as: 'postLikes',
          attributes: ['id', 'userId']
        },
        {
          model: Comment,
          as: 'comments',
          include: {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          }
        }
      ]
    });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment view count
    post.views += 1;
    await post.save();
    
    // Format post to include like and comment counts
    const formattedPost = {
      ...post.toJSON(),
      likeCount: post.postLikes?.length || 0,
      commentCount: post.comments?.length || 0
    };
    
    res.json(formattedPost);
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/community/posts
// @desc    Create a new community post
// @access  Private
router.post('/posts', protect, async (req, res) => {
  try {
    const { title, content, categoryId, tags, image } = req.body;
    
    // Basic validation
    if (!title || !content || !categoryId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if category exists
    const category = await CommunityCategory.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const post = await CommunityPost.create({
      userId: req.user.id,
      title,
      content,
      categoryId,
      tags: tags || [],
      image,
      views: 0
    });
    
    // Get complete post with associations
    const newPost = await CommunityPost.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: CommunityCategory,
          as: 'category'
        }
      ]
    });
    
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/community/posts/:id
// @desc    Update a community post
// @access  Private
router.put('/posts/:id', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }
    
    const { title, content, categoryId, tags, image } = req.body;
    
    // Update the post
    const updatedPost = await post.update({
      title: title || post.title,
      content: content || post.content,
      categoryId: categoryId || post.categoryId,
      tags: tags || post.tags,
      image: image !== undefined ? image : post.image,
      updatedAt: new Date()
    });
    
    // Get complete post with associations
    const formattedPost = await CommunityPost.findByPk(updatedPost.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: CommunityCategory,
          as: 'category'
        }
      ]
    });
    
    res.json(formattedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/community/posts/:id
// @desc    Delete a community post
// @access  Private
router.delete('/posts/:id', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }
    
    // Delete related likes and comments first (cascade delete may be set up in models)
    await Like.destroy({ where: { postId: post.id } });
    await Comment.destroy({ where: { postId: post.id } });
    
    // Delete the post
    await post.destroy();
    
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/community/posts/:id/like
// @desc    Like a community post
// @access  Private
router.post('/posts/:id/like', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if already liked
    const existingLike = await Like.findOne({
      where: {
        postId: post.id,
        userId: req.user.id
      }
    });
    
    if (existingLike) {
      return res.status(400).json({ message: 'Post already liked' });
    }
    
    // Create like
    const like = await Like.create({
      postId: post.id,
      userId: req.user.id
    });
    
    res.status(201).json(like);
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/community/posts/:id/like
// @desc    Unlike a community post
// @access  Private
router.delete('/posts/:id/like', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Find like
    const like = await Like.findOne({
      where: {
        postId: post.id,
        userId: req.user.id
      }
    });
    
    if (!like) {
      return res.status(400).json({ message: 'Post not liked yet' });
    }
    
    // Delete like
    await like.destroy();
    
    res.json({ message: 'Post unliked' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/community/posts/:id/comments
// @desc    Comment on a community post
// @access  Private
router.post('/posts/:id/comments', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Create comment
    const comment = await Comment.create({
      postId: post.id,
      userId: req.user.id,
      content
    });
    
    // Get comment with user data
    const newComment = await Comment.findByPk(comment.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    });
    
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error commenting on post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/community/comments/:id
// @desc    Update a comment
// @access  Private
router.put('/comments/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author
    if (comment.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this comment' });
    }
    
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Update comment
    await comment.update({
      content,
      updatedAt: new Date()
    });
    
    // Get updated comment with user data
    const updatedComment = await Comment.findByPk(comment.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    });
    
    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/community/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/comments/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author
    if (comment.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }
    
    // Delete comment
    await comment.destroy();
    
    res.json({ message: 'Comment removed' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/resources
// @desc    Get community resources
// @access  Public
router.get('/resources', async (req, res) => {
  try {
    const { category } = req.query;
    let whereClause = {};
    
    if (category) {
      whereClause.category = category;
    }
    
    const resources = await CommunityResource.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json(resources);
  } catch (error) {
    console.error('Error getting resources:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/community/resources
// @desc    Add a community resource
// @access  Private (Admin only)
router.post('/resources', protect, async (req, res) => {
  try {
    // Check if user is an admin (using auth middleware)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add resources' });
    }
    
    const { title, description, link, category, imageUrl } = req.body;
    
    if (!title || !description || !link || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const resource = await CommunityResource.create({
      title,
      description,
      link,
      category,
      imageUrl,
      addedBy: req.user.id
    });
    
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/trending
// @desc    Get trending community posts
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    // Get posts from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const posts = await CommunityPost.findAll({
      where: {
        createdAt: {
          $gte: oneWeekAgo
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: CommunityCategory,
          as: 'category'
        },
        {
          model: Like,
          as: 'postLikes',
          attributes: ['id']
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id']
        }
      ],
      limit: 10
    });
    
    // Calculate trending score based on views, likes, and comments
    const trendingPosts = posts.map(post => {
      const likeCount = post.postLikes?.length || 0;
      const commentCount = post.comments?.length || 0;
      const viewCount = post.views || 0;
      
      // Simple trending score formula
      const trendingScore = viewCount + (likeCount * 2) + (commentCount * 3);
      
      return {
        ...post.toJSON(),
        likeCount,
        commentCount,
        trendingScore
      };
    });
    
    // Sort by trending score
    trendingPosts.sort((a, b) => b.trendingScore - a.trendingScore);
    
    res.json(trendingPosts);
  } catch (error) {
    console.error('Error getting trending posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/user/:userId
// @desc    Get posts by a specific user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await CommunityPost.findAndCountAll({
      where: {
        userId: req.params.userId
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: CommunityCategory,
          as: 'category'
        },
        {
          model: Like,
          as: 'postLikes',
          attributes: ['id']
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id']
        }
      ]
    });
    
    // Format posts
    const formattedPosts = rows.map(post => ({
      ...post.toJSON(),
      likeCount: post.postLikes?.length || 0,
      commentCount: post.comments?.length || 0
    }));
    
    res.json({
      posts: formattedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count
    });
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
