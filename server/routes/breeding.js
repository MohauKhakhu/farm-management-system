const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/breeding
 * @desc    Get all breeding records
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Breeding route is working',
      records: [] 
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
