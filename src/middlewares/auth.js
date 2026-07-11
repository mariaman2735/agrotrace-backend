/**
 * ============================================================
 * AgroTrace - Middlewares d'authentification et d'autorisation
 * ============================================================
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware de vérification du token JWT
 * Vérifie que la requête contient un token valide dans l'en-tête Authorization
 * Si le token est valide, ajoute les informations de l'utilisateur à req.utilisateur
 */
const verifierToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format : "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    try {
        // Vérification et décodage du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.utilisateur = decoded; // Injection des infos utilisateur dans la requête
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token invalide ou expiré.' });
    }
};

/**
 * Middleware de vérification du rôle utilisateur
 * Vérifie que l'utilisateur connecté possède l'un des rôles autorisés
 * @param {...string} rolesAutorises - Liste des rôles ayant accès à la route
 */
const verifierRole = (...rolesAutorises) => {
    return (req, res, next) => {
        if (!rolesAutorises.includes(req.utilisateur.role)) {
            return res.status(403).json({ 
                message: 'Accès refusé. Vous n\'avez pas les droits nécessaires.' 
            });
        }
        next();
    };
};

module.exports = { verifierToken, verifierRole };