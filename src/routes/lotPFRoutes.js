const express = require('express');
const router  = express.Router();
const {
    getLotsPF,
    getLotPFById,
    createLotPF,
    updateStatutLotPF,
    getTraceabilite
} = require('../controllers/lotPFController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getLotsPF);
router.get('/:id', verifierToken, getLotPFById);
router.get('/:id/tracabilite', verifierToken, getTraceabilite);
router.post('/', verifierToken,
    verifierRole('ADMINISTRATEUR', 'OPERATEUR_PRODUCTION'), createLotPF);
router.put('/:id/statut', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_QUALITE'), updateStatutLotPF);

module.exports = router;