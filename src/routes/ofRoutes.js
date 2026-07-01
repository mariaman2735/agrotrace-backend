const express = require('express');
const router  = express.Router();
const {
    getOFs,
    getOFById,
    createOF,
    updateStatutOF,
    consommerLotMP
} = require('../controllers/ofController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getOFs);
router.get('/:id', verifierToken, getOFById);
router.post('/', verifierToken,
    verifierRole('ADMINISTRATEUR', 'OPERATEUR_PRODUCTION'), createOF);
router.put('/:id/statut', verifierToken,
    verifierRole('ADMINISTRATEUR', 'OPERATEUR_PRODUCTION'), updateStatutOF);
router.post('/:id/consommer', verifierToken,
    verifierRole('ADMINISTRATEUR', 'OPERATEUR_PRODUCTION'), consommerLotMP);

module.exports = router;