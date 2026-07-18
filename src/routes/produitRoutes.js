const express = require('express');
const router  = express.Router();
const {
    getProduits,
    getProduitById,
    createProduit,
    updateProduit,
    deleteProduit
} = require('../controllers/produitController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getProduits);
router.get('/:id', verifierToken, getProduitById);
router.post('/', verifierToken, verifierRole('ADMINISTRATEUR', 'RESP_STOCK'), createProduit);
router.put('/:id', verifierToken, verifierRole('ADMINISTRATEUR', 'RESP_STOCK'), updateProduit);
router.delete('/:id', verifierToken, verifierRole('ADMINISTRATEUR'), deleteProduit);

module.exports = router;