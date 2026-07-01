const express = require('express');
const router  = express.Router();
const {
    getMatieresPremières,
    getMatierePremiereById,
    createMatierePremiere,
    updateMatierePremiere,
    deleteMatierePremiere
} = require('../controllers/matierePremiereController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getMatieresPremières);
router.get('/:id', verifierToken, getMatierePremiereById);
router.post('/', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_ACHAT'), createMatierePremiere);
router.put('/:id', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_ACHAT'), updateMatierePremiere);
router.delete('/:id', verifierToken,
    verifierRole('ADMINISTRATEUR'), deleteMatierePremiere);

module.exports = router;