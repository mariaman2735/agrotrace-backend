const express = require('express');
const router  = express.Router();
const {
    getRappels,
    getRappelById,
    createRappel,
    updateStatutRappel
} = require('../controllers/rappelProduitController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getRappels);
router.get('/:id', verifierToken, getRappelById);
router.post('/', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_QUALITE'), createRappel);
router.put('/:id/statut', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_QUALITE'), updateStatutRappel);

module.exports = router;