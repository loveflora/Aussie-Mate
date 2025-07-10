const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User, Meetup, MeetupRegistration, MeetupCategory } = require('../models');

// @route   GET /api/meetups
// @desc    Get all meetups
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, date, location, search } = req.query;
    let whereClause = {};
    
    // Filter by category if provided
    if (category) {
      whereClause.categoryId = category;
    }
    
    // Filter by date if provided
    if (date) {
      // Format: YYYY-MM-DD
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    // Filter by location if provided
    if (location) {
      whereClause.location = { $like: `%${location}%` };
    }
    
    // Search by title or description
    if (search) {
      whereClause.$or = [
        { title: { $like: `%${search}%` } },
        { description: { $like: `%${search}%` } }
      ];
    }
    
    const meetups = await Meetup.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: MeetupCategory,
          as: 'category'
        }
      ],
      order: [['date', 'ASC']]
    });
    
    res.json(meetups);
  } catch (error) {
    console.error('Error getting meetups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meetups/categories
// @desc    Get all meetup categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await MeetupCategory.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error getting meetup categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meetups/:id
// @desc    Get meetup by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'avatar', 'email']
        },
        {
          model: MeetupCategory,
          as: 'category'
        },
        {
          model: MeetupRegistration,
          as: 'registrations',
          include: {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          }
        }
      ]
    });
    
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }
    
    // Increment view count
    meetup.views += 1;
    await meetup.save();
    
    res.json(meetup);
  } catch (error) {
    console.error('Error getting meetup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/meetups
// @desc    Create a new meetup
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      address,
      categoryId,
      capacity,
      cost,
      image,
      requirements
    } = req.body;
    
    // Basic validation
    if (!title || !description || !date || !time || !location || !categoryId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newMeetup = await Meetup.create({
      organizerId: req.user.id,
      title,
      description,
      date,
      time,
      location,
      address,
      categoryId,
      capacity: capacity || null,
      cost: cost || 0,
      image,
      requirements,
      views: 0
    });
    
    const meetup = await Meetup.findByPk(newMeetup.id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: MeetupCategory,
          as: 'category'
        }
      ]
    });
    
    res.status(201).json(meetup);
  } catch (error) {
    console.error('Error creating meetup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/meetups/:id
// @desc    Update meetup
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const meetup = await Meetup.findByPk(req.params.id);
    
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }
    
    // Check if user is the organizer
    if (meetup.organizerId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this meetup' });
    }
    
    const {
      title,
      description,
      date,
      time,
      location,
      address,
      categoryId,
      capacity,
      cost,
      image,
      requirements,
      status
    } = req.body;
    
    // Update the fields
    const updatedFields = {
      title,
      description,
      date,
      time,
      location,
      address,
      categoryId,
      capacity,
      cost,
      image,
      requirements,
      status
    };
    
    // Filter out undefined values
    Object.keys(updatedFields).forEach(key => 
      updatedFields[key] === undefined && delete updatedFields[key]
    );
    
    await meetup.update(updatedFields);
    
    const updatedMeetup = await Meetup.findByPk(meetup.id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: MeetupCategory,
          as: 'category'
        }
      ]
    });
    
    res.json(updatedMeetup);
  } catch (error) {
    console.error('Error updating meetup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/meetups/:id
// @desc    Delete meetup
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const meetup = await Meetup.findByPk(req.params.id);
    
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }
    
    // Check if user is the organizer
    if (meetup.organizerId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this meetup' });
    }
    
    await meetup.destroy();
    
    res.json({ message: 'Meetup removed' });
  } catch (error) {
    console.error('Error deleting meetup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/meetups/:id/register
// @desc    Register for a meetup
// @access  Private
router.post('/:id/register', protect, async (req, res) => {
  try {
    const meetup = await Meetup.findByPk(req.params.id);
    
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }
    
    // Check if meetup is at capacity
    if (meetup.capacity) {
      const registrationCount = await MeetupRegistration.count({
        where: { meetupId: meetup.id }
      });
      
      if (registrationCount >= meetup.capacity) {
        return res.status(400).json({ message: 'Meetup is at full capacity' });
      }
    }
    
    // Check if user is already registered
    const existingRegistration = await MeetupRegistration.findOne({
      where: {
        meetupId: meetup.id,
        userId: req.user.id
      }
    });
    
    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this meetup' });
    }
    
    // Register for the meetup
    const { attendees, notes } = req.body;
    
    await MeetupRegistration.create({
      meetupId: meetup.id,
      userId: req.user.id,
      attendees: attendees || 1,
      notes
    });
    
    res.json({ message: 'Successfully registered for the meetup' });
  } catch (error) {
    console.error('Error registering for meetup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/meetups/:id/register
// @desc    Cancel meetup registration
// @access  Private
router.delete('/:id/register', protect, async (req, res) => {
  try {
    const registration = await MeetupRegistration.findOne({
      where: {
        meetupId: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    await registration.destroy();
    
    res.json({ message: 'Registration cancelled' });
  } catch (error) {
    console.error('Error cancelling meetup registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meetups/user/:userId
// @desc    Get meetups organized by a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const meetups = await Meetup.findAll({
      where: {
        organizerId: req.params.userId
      },
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: MeetupCategory,
          as: 'category'
        }
      ],
      order: [['date', 'ASC']]
    });
    
    res.json(meetups);
  } catch (error) {
    console.error('Error getting user meetups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meetups/registered
// @desc    Get meetups the authenticated user is registered for
// @access  Private
router.get('/registered', protect, async (req, res) => {
  try {
    const registrations = await MeetupRegistration.findAll({
      where: {
        userId: req.user.id
      },
      include: {
        model: Meetup,
        as: 'meetup',
        include: [
          {
            model: User,
            as: 'organizer',
            attributes: ['id', 'name', 'avatar']
          },
          {
            model: MeetupCategory,
            as: 'category'
          }
        ]
      }
    });
    
    // Extract just the meetup data
    const meetups = registrations.map(reg => reg.meetup);
    
    res.json(meetups);
  } catch (error) {
    console.error('Error getting registered meetups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
