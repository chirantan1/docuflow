const express = require('express');
const router = express.Router();

router.post('/word-to-pdf', (req, res) => {
  res.json({ message: 'Word to PDF coming soon' });
});

router.post('/excel-to-pdf', (req, res) => {
  res.json({ message: 'Excel to PDF coming soon' });
});

module.exports = router;
