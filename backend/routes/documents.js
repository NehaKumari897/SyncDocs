const express = require('express');
const Document = require('../models/Document');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all documents of user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const documents = await Document.find({ owner: req.user.id })
      .sort({ updatedAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single document
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create document
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    const document = await Document.create({
      title,
      content: '',
      owner: req.user.id,
    });
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update document
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content, title } = req.body;
    const document = await Document.findOne({
      _id: req.params.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Save version (bonus feature)
    if (document.content !== content) {
      document.versions.push({ content: document.content });
      if (document.versions.length > 10) {
        document.versions.shift(); // keep last 10 versions
      }
    }

    document.title = title || document.title;
    document.content = content;
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Document.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get document versions (bonus)
router.get('/:id/versions', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document.versions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;