/**
 * ============================================================
 * AgroTrace - Serveur Principal
 * Système de gestion et de traçabilité agroalimentaire
 * Auteur : Mariama Ndiaye — ESTM/UCAD 2025-2026
 * ============================================================
 */

const express = require('express');
const cors    = require('cors');
const db      = require('./src/config/db');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import des routes
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

// ── Limiteurs de requêtes (sécurité anti-brute force) ──────────────────────

// Limiteur général : 100 requêtes par 15 minutes
const limiterGeneral = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Trop de requêtes, réessayez dans 15 minutes.' }
});

// Limiteur strict pour la connexion : 10 tentatives par 15 minutes
const limiterLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' }
});

// Limiteur pour la réinitialisation de mot de passe : 5 demandes par heure
const limiterReset = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: 'Trop de demandes de réinitialisation, réessayez dans 1 heure.' }
});

// ── Middlewares globaux ────────────────────────────────────────────────────

// Autorisation des requêtes cross-origin (frontend React)
app.use(cors({
    origin: ['https://agrotrace-frontend-snowy.vercel.app', 'http://localhost:3000'],
    credentials: true
}));

// Parsing du corps des requêtes en JSON
app.use(express.json());

// Application du limiteur général sur toutes les routes
app.use(limiterGeneral);

// ── Connexion à la base de données ────────────────────────────────────────
db.query('SELECT 1')
    .then(() => console.log('Connexion à MySQL réussie !'))
    .catch(err => console.error('Erreur de connexion MySQL :', err));

// ── Limiteurs spécifiques sur certaines routes sensibles ──────────────────
app.use('/api/auth/login',     limiterLogin);
app.use('/api/reset-password', limiterReset);

// ── Déclaration des routes de l'API ───────────────────────────────────────
app.use('/api/auth',               authRoutes);          // Authentification et gestion utilisateurs
app.use('/api/fournisseurs',       fournisseurRoutes);   // Gestion des fournisseurs
app.use('/api/lots-mp',            lotMPRoutes);         // Lots de matières premières
app.use('/api/ordres-fabrication', ofRoutes);            // Ordres de fabrication
app.use('/api/lots-pf',            lotPFRoutes);         // Lots de produits finis
app.use('/api/controles-qualite',  controleQualiteRoutes); // Contrôles qualité
app.use('/api/non-conformites',    nonConformiteRoutes); // Non-conformités
app.use('/api/ventes',             venteRoutes);         // Ventes
app.use('/api/clients',            clientRoutes);        // Clients
app.use('/api/rappels-produit',    rappelProduitRoutes); // Rappels produit
app.use('/api/matieres-premieres', matierePremiereRoutes); // Matières premières
app.use('/api/demandes-acces',     demandeAccesRoutes);  // Demandes d'accès
app.use('/api/reset-password',     resetPasswordRoutes); // Réinitialisation mot de passe
app.use('/api/matieres-premieres', require('./src/routes/matierePremiereRoutes'));
app.use('/api/produits', require('./src/routes/produitRoutes'));

// ── Route de base ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'Bienvenue sur AgroTrace API !' });
});

// ── Démarrage du serveur ──────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Serveur AgroTrace démarré sur le port ${PORT}`);
});