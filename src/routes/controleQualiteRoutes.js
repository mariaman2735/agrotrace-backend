const express = require('express');
const router  = express.Router();
const {
    getControles,
    getControleById,
    createControle
} = require('../controllers/controleQualiteController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getControles);
router.get('/:id', verifierToken, getControleById);
router.post('/', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_QUALITE', 'RESP_ACHAT'), createControle);

module.exports = router;