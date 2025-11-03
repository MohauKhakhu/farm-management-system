const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/iot
 * @desc    Get all iot records
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'IOT route is working',
      data: [] 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/iot
 * @desc    Create a new iot record
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    res.status(201).json({ 
      success: true, 
      message: 'iot created successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;
