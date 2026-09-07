const express = require('express');
const router = express.Router();

// Simple auth routes (placeholder)
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - coming soon' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - coming soon' });
});

router.get('/verify', (req, res) => {
  res.json({ message: 'Verify endpoint - coming soon' });
});

module.exports = router;