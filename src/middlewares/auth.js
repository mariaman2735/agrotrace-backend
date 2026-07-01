const jwt = require('jsonwebtoken');
require('dotenv').config();

// Vérifier le token
const verifierToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.utilisateur = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token invalide ou expiré.' });
    }
};

// Vérifier le rôle
const verifierRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.utilisateur.role)) {
            return res.status(403).json({ 
                message: 'Accès refusé. Vous n\'avez pas les droits nécessaires.' 
            });
        }
        next();
    };
};

module.exports = { verifierToken, verifierRole };