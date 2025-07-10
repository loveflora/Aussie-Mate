const express = require('express');
const router = express.Router();
const {
  getAllCommunityPosts,
  getCommunityPostById,
  createCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  addComment,
  deleteComment,
  toggleLike,
  searchCommunityPosts,
  getCommunityPostsByUser
} = require('../controllers/communityPost');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllCommunityPosts);
router.get('/search', searchCommunityPosts);
router.get('/user/:userId', getCommunityPostsByUser);
router.get('/:id', getCommunityPostById);

// Protected routes
router.post('/', protect, upload.array('images', 5), createCommunityPost);
router.put('/:id', protect, upload.array('images', 5), updateCommunityPost);
router.delete('/:id', protect, deleteCommunityPost);

// Comment routes
router.post('/:id/comments', protect, addComment);
router.delete('/comments/:commentId', protect, deleteComment);

// Like routes
router.post('/:id/like', protect, toggleLike);

module.exports = router;
