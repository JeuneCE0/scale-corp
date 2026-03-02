const express = require('express');
const router = express.Router();

// GET /api/artists - Liste tous les artistes
router.get('/', (req, res) => {
  res.json({ artists: [], message: 'Liste des artistes' });
});

// GET /api/artists/:id - Détail d'un artiste
router.get('/:id', (req, res) => {
  res.json({ artist: null, message: 'Détail artiste' });
});

// POST /api/artists - Créer un artiste
router.post('/', (req, res) => {
  res.status(201).json({ message: 'Artiste créé' });
});

module.exports = router;
