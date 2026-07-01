const express = require('express');
const router  = express.Router();
const {
    createDemande,
    getDemandes,
    updateStatutDemande
} = require('../controllers/demandeAccesController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

// Route publique — n'importe qui peut faire une demande
router.post('/', createDemande);

// Routes protégées — admin seulement
router.get('/', verifierToken, verifierRole('ADMINISTRATEUR'), getDemandes);
router.put('/:id/statut', verifierToken, verifierRole('ADMINISTRATEUR'), updateStatutDemande);

module.exports = router;