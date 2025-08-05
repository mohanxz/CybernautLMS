const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const verifyAccessToken = require('../middleware/auth');


router.get('/:batchId/:module', verifyAccessToken, async (req, res) => {
  const { batchId, module } = req.params;

  try {
    const notes = await Note.find({ batch: batchId, module }).populate('admin', 'name email');
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes', details: err.message });
  }
});

module.exports = router;
