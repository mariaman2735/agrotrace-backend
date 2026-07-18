const express = require('express');
const router  = express.Router();
const {
    getFournisseurs,
    getFournisseurById,
    createFournisseur,
    updateFournisseur,
    deleteFournisseur,
    setMatieresPremieresFournisseur
} = require('../controllers/fournisseurController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

// Toutes les routes sont protégées
router.get('/', verifierToken, getFournisseurs);
router.get('/:id', verifierToken, getFournisseurById);
router.post('/', verifierToken, verifierRole('ADMINISTRATEUR', 'RESP_ACHAT'), createFournisseur);
router.put('/:id', verifierToken, verifierRole('ADMINISTRATEUR', 'RESP_ACHAT'), updateFournisseur);
router.delete('/:id', verifierToken, verifierRole('ADMINISTRATEUR'), deleteFournisseur);

// NOUVELLE ROUTE : lier des matières premières à un fournisseur
router.put('/:id/matieres-premieres', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_ACHAT'), setMatieresPremieresFournisseur);

module.exports = router;