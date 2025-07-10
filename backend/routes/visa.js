const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User, VisaType, VisaConsultation } = require('../models');

// @route   GET /api/visa/types
// @desc    Get all visa types
// @access  Public
router.get('/types', async (req, res) => {
  try {
    const visaTypes = await VisaType.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json(visaTypes);
  } catch (error) {
    console.error('Error getting visa types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/visa/types/:id
// @desc    Get visa type details
// @access  Public
router.get('/types/:id', async (req, res) => {
  try {
    const visaType = await VisaType.findByPk(req.params.id);
    
    if (!visaType) {
      return res.status(404).json({ message: 'Visa type not found' });
    }
    
    res.json(visaType);
  } catch (error) {
    console.error('Error getting visa type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/visa/filter
// @desc    Filter visa types by criteria
// @access  Public
router.get('/filter', async (req, res) => {
  try {
    const { purpose, duration, eligibility } = req.query;
    let whereClause = {};
    
    if (purpose) {
      whereClause.purpose = purpose;
    }
    
    if (duration) {
      whereClause.duration = duration;
    }
    
    if (eligibility) {
      whereClause.eligibility = { $like: `%${eligibility}%` };
    }
    
    const visaTypes = await VisaType.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
    
    res.json(visaTypes);
  } catch (error) {
    console.error('Error filtering visa types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/visa/consultation
// @desc    Request visa consultation
// @access  Private
router.post('/consultation', protect, async (req, res) => {
  try {
    const {
      visaTypeId,
      consultationType,
      preferredDate,
      preferredTime,
      message,
      contactMethod
    } = req.body;
    
    // Basic validation
    if (!visaTypeId || !consultationType || !preferredDate || !preferredTime || !contactMethod) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if visa type exists
    const visaType = await VisaType.findByPk(visaTypeId);
    if (!visaType) {
      return res.status(404).json({ message: 'Visa type not found' });
    }
    
    const consultation = await VisaConsultation.create({
      userId: req.user.id,
      visaTypeId,
      consultationType,
      preferredDate,
      preferredTime,
      message,
      contactMethod,
      status: 'pending'
    });
    
    res.status(201).json({
      id: consultation.id,
      message: 'Consultation request submitted successfully'
    });
  } catch (error) {
    console.error('Error requesting consultation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/visa/consultation
// @desc    Get user's visa consultations
// @access  Private
router.get('/consultation', protect, async (req, res) => {
  try {
    const consultations = await VisaConsultation.findAll({
      where: { userId: req.user.id },
      include: {
        model: VisaType,
        as: 'visaType'
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(consultations);
  } catch (error) {
    console.error('Error getting consultations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/visa/consultation/:id
// @desc    Get visa consultation details
// @access  Private
router.get('/consultation/:id', protect, async (req, res) => {
  try {
    const consultation = await VisaConsultation.findByPk(req.params.id, {
      include: {
        model: VisaType,
        as: 'visaType'
      }
    });
    
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    
    // Check if consultation belongs to user
    if (consultation.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this consultation' });
    }
    
    res.json(consultation);
  } catch (error) {
    console.error('Error getting consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/visa/consultation/:id
// @desc    Update visa consultation request
// @access  Private
router.put('/consultation/:id', protect, async (req, res) => {
  try {
    const consultation = await VisaConsultation.findByPk(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    
    // Check if consultation belongs to user
    if (consultation.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this consultation' });
    }
    
    // Only allow updating if status is 'pending'
    if (consultation.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot modify consultation that has been processed' });
    }
    
    const {
      visaTypeId,
      consultationType,
      preferredDate,
      preferredTime,
      message,
      contactMethod
    } = req.body;
    
    // Update the fields
    const updatedFields = {
      visaTypeId,
      consultationType,
      preferredDate,
      preferredTime,
      message,
      contactMethod
    };
    
    // Filter out undefined values
    Object.keys(updatedFields).forEach(key => 
      updatedFields[key] === undefined && delete updatedFields[key]
    );
    
    await consultation.update(updatedFields);
    
    res.json(consultation);
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/visa/consultation/:id
// @desc    Cancel visa consultation request
// @access  Private
router.delete('/consultation/:id', protect, async (req, res) => {
  try {
    const consultation = await VisaConsultation.findByPk(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    
    // Check if consultation belongs to user
    if (consultation.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized to cancel this consultation' });
    }
    
    // Only allow cancelling if status is 'pending'
    if (consultation.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel consultation that has been processed' });
    }
    
    await consultation.destroy();
    
    res.json({ message: 'Consultation request cancelled' });
  } catch (error) {
    console.error('Error cancelling consultation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/visa/eligibility
// @desc    Check visa eligibility (basic info only)
// @access  Public
router.get('/eligibility', async (req, res) => {
  try {
    const { nationality, age, purpose, duration } = req.query;
    
    // Basic validation
    if (!nationality || !purpose) {
      return res.status(400).json({ message: 'Please provide nationality and purpose' });
    }
    
    // This would typically involve more complex logic or an external API
    // For now, return simplified guidance based on query parameters
    
    let eligibleVisas = await VisaType.findAll({
      where: {
        purpose: purpose
      }
    });
    
    // Filter results based on provided criteria
    if (eligibleVisas.length > 0) {
      res.json({
        eligible: true,
        visaTypes: eligibleVisas,
        message: 'These visa types may be suitable for your situation. Please consult with a migration expert for personalized advice.'
      });
    } else {
      res.json({
        eligible: false,
        message: 'No matching visa types found for your criteria. Please consult with a migration expert for personalized advice.'
      });
    }
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
