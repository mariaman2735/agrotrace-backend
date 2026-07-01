const express = require('express');
const router  = express.Router();
const {
    getVentes,
    getVenteById,
    createVente
} = require('../controllers/venteController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getVentes);
router.get('/:id', verifierToken, getVenteById);
router.post('/', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_COMMERCIAL'), createVente);

module.exports = router;