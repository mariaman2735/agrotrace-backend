const express = require('express');
const cors    = require('cors');
const db      = require('./src/config/db');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes              = require('./src/routes/authRoutes');
const fournisseurRoutes       = require('./src/routes/fournisseurRoutes');
const lotMPRoutes             = require('./src/routes/lotMPRoutes');
const ofRoutes                = require('./src/routes/ofRoutes');
const lotPFRoutes             = require('./src/routes/lotPFRoutes');
const controleQualiteRoutes   = require('./src/routes/controleQualiteRoutes');
const nonConformiteRoutes     = require('./src/routes/nonConformiteRoutes');
const venteRoutes             = require('./src/routes/venteRoutes');
const clientRoutes            = require('./src/routes/clientRoutes');
const rappelProduitRoutes     = require('./src/routes/rappelProduitRoutes');
const matierePremiereRoutes   = require('./src/routes/matierePremiereRoutes');
const demandeAccesRoutes      = require('./src/routes/demandeAccesRoutes');
const resetPasswordRoutes     = require('./src/routes/resetPasswordRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// Rate limiting général
const limiterGeneral = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { message: 'Trop de requêtes, réessayez dans 15 minutes.' }
});

// Rate limiting strict pour le login
const limiterLogin = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' }
});

// Rate limiting pour reset password
const limiterReset = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5,
    message: { message: 'Trop de demandes de réinitialisation, réessayez dans 1 heure.' }
});

app.use(cors());
app.use(express.json());
app.use(limiterGeneral);

db.query('SELECT 1')
    .then(() => console.log('Connexion à MySQL réussie !'))
    .catch(err => console.error('Erreur de connexion MySQL :', err));

// Routes avec rate limiting spécifique
app.use('/api/auth/login',         limiterLogin);
app.use('/api/reset-password',     limiterReset);

// Routes
app.use('/api/auth',               authRoutes);
app.use('/api/fournisseurs',       fournisseurRoutes);
app.use('/api/lots-mp',            lotMPRoutes);
app.use('/api/ordres-fabrication', ofRoutes);
app.use('/api/lots-pf',            lotPFRoutes);
app.use('/api/controles-qualite',  controleQualiteRoutes);
app.use('/api/non-conformites',    nonConformiteRoutes);
app.use('/api/ventes',             venteRoutes);
app.use('/api/clients',            clientRoutes);
app.use('/api/rappels-produit',    rappelProduitRoutes);
app.use('/api/matieres-premieres', matierePremiereRoutes);
app.use('/api/demandes-acces',     demandeAccesRoutes);
app.use('/api/reset-password',     resetPasswordRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Bienvenue sur AgroTrace API !' });
});

app.listen(PORT, () => {
    console.log(`Serveur AgroTrace démarré sur le port ${PORT}`);
});