const express = require('express');
const router  = express.Router();
const { 
    login, 
    creerUtilisateur, 
    getUtilisateurs, 
    modifierProfil,
    supprimerUtilisateur,
    modifierRole
} = require('../controllers/authController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.post('/login', login);
router.post('/creer', verifierToken, verifierRole('ADMINISTRATEUR'), creerUtilisateur);
router.get('/utilisateurs', verifierToken, verifierRole('ADMINISTRATEUR'), getUtilisateurs);
router.put('/profil', verifierToken, modifierProfil);
router.delete('/utilisateurs/:id', verifierToken, verifierRole('ADMINISTRATEUR'), supprimerUtilisateur);
router.put('/utilisateurs/:id/role', verifierToken, verifierRole('ADMINISTRATEUR'), modifierRole);

module.exports = router;