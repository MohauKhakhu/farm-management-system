const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/blockchain
 * @desc    Get all blockchain records
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'BLOCKCHAIN route is working',
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
 * @route   POST /api/blockchain
 * @desc    Create a new blockchain record
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    res.status(201).json({ 
      success: true, 
      message: 'blockchain created successfully' 
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
