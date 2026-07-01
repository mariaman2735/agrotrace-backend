const express = require('express');
const router  = express.Router();
const {
    getLotsMPList,
    getLotMPById,
    createLotMP,
    updateStatutLotMP
} = require('../controllers/lotMPController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getLotsMPList);
router.get('/:id', verifierToken, getLotMPById);
router.post('/', verifierToken, 
    verifierRole('ADMINISTRATEUR', 'RESP_ACHAT'), createLotMP);
router.put('/:id/statut', verifierToken, 
    verifierRole('ADMINISTRATEUR', 'RESP_ACHAT', 'RESP_QUALITE'), updateStatutLotMP);

module.exports = router;