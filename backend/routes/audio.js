const express = require('express');
const router = express.Router();

router.post('/convert', (req, res) => {
  res.json({ message: 'Audio conversion coming soon' });
});

router.post('/compress', (req, res) => {
  res.json({ message: 'Audio compression coming soon' });
});

module.exports = router;
