// routes/album.routes.js — Trip album CRUD
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createAlbum,
  getMyAlbums,
  getAlbum,
  deleteAlbum,
} = require('../controllers/album.controller');

// All routes require authentication
router.use(protect);

router.post('/', createAlbum);
router.get('/', getMyAlbums);
router.get('/:id', getAlbum);
router.delete('/:id', deleteAlbum);

module.exports = router;
