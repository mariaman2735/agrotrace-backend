const express = require('express');
const router  = express.Router();
const {
    demanderReset,
    verifierToken,
    reinitialiserMotDePasse
} = require('../controllers/resetPasswordController');

router.post('/demander', demanderReset);
router.get('/verifier/:token', verifierToken);
router.post('/reinitialiser', reinitialiserMotDePasse);

module.exports = router;