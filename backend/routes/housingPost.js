const express = require('express');
const router = express.Router();
const {
  getAllHousingPosts,
  getHousingPostById,
  createHousingPost,
  updateHousingPost,
  deleteHousingPost,
  searchHousingPosts,
  getHousingPostsByUser
} = require('../controllers/housingPost');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllHousingPosts);
router.get('/search', searchHousingPosts);
router.get('/user/:userId', getHousingPostsByUser);
router.get('/:id', getHousingPostById);

// Protected routes
router.post('/', protect, upload.array('images', 10), createHousingPost);
router.put('/:id', protect, upload.array('images', 10), updateHousingPost);
router.delete('/:id', protect, deleteHousingPost);

module.exports = router;
