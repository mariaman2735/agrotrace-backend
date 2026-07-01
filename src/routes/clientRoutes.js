const express = require('express');
const router  = express.Router();
const {
    getClients,
    getClientById,
    createClient,
    updateClient
} = require('../controllers/clientController');
const { verifierToken, verifierRole } = require('../middlewares/auth');

router.get('/', verifierToken, getClients);
router.get('/:id', verifierToken, getClientById);
router.post('/', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_COMMERCIAL'), createClient);
router.put('/:id', verifierToken,
    verifierRole('ADMINISTRATEUR', 'RESP_COMMERCIAL'), updateClient);

module.exports = router;