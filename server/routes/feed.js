const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/feed
 * @desc    Get all feed records
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'FEED route is working',
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
 * @route   POST /api/feed
 * @desc    Create a new feed record
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    res.status(201).json({ 
      success: true, 
      message: 'feed created successfully' 
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
