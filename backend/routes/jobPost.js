const express = require('express');
const router = express.Router();
const {
  getAllJobPosts,
  getJobPostById,
  createJobPost,
  updateJobPost,
  deleteJobPost,
  searchJobPosts,
  getJobPostsByUser
} = require('../controllers/jobPost');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllJobPosts);
router.get('/search', searchJobPosts);
router.get('/user/:userId', getJobPostsByUser);
router.get('/:id', getJobPostById);

// Protected routes
router.post('/', protect, upload.array('images', 5), createJobPost);
router.put('/:id', protect, upload.array('images', 5), updateJobPost);
router.delete('/:id', protect, deleteJobPost);

module.exports = router;
