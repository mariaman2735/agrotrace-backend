const express = require('express');
const router  = express.Router();
const {
    getNonConformites,
    getNonConformiteById,
    createNonConformite,
    updateNonConformite
} = require('../controllers/nonConformiteController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getNonConformites);
router.get('/:id', verifierToken, getNonConformiteById);
router.post('/', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_QUALITE'), createNonConformite);
router.put('/:id', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_QUALITE'), updateNonConformite);

module.exports = router;