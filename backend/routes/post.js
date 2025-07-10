const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User, CommunityPost, Comment, Like } = require('../models');

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const posts = await CommunityPost.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id']
        },
        {
          model: Like,
          as: 'postLikes',
          attributes: ['id', 'userId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(posts);
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: Comment,
          as: 'comments',
          include: {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          }
        },
        {
          model: Like,
          as: 'postLikes',
          attributes: ['id', 'userId']
        }
      ]
    });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const newPost = await CommunityPost.create({
      title,
      content,
      userId: req.user.id,
      categoryId
    });
    
    // Get the post with user info
    const post = await CommunityPost.findByPk(newPost.id, {
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    });
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    const post = await CommunityPost.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check user
    if (post.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (categoryId) post.categoryId = categoryId;
    
    await post.save();
    
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check user
    if (post.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await post.destroy();
    
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if the post has already been liked by this user
    const existingLike = await Like.findOne({
      where: {
        postId: req.params.id,
        userId: req.user.id
      }
    });
    
    if (existingLike) {
      return res.status(400).json({ message: 'Post already liked' });
    }
    
    // Create a new like
    await Like.create({
      postId: req.params.id,
      userId: req.user.id
    });
    
    res.json({ message: 'Post liked' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id/like
// @desc    Unlike a post
// @access  Private
router.delete('/:id/like', protect, async (req, res) => {
  try {
    // Find the like
    const like = await Like.findOne({
      where: {
        postId: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!like) {
      return res.status(400).json({ message: 'Post has not been liked by this user' });
    }
    
    // Remove the like
    await like.destroy();
    
    res.json({ message: 'Post unliked' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
