const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { envoyerEmailResetPassword } = require('../config/email');

// Demander une réinitialisation
const demanderReset = async (req, res) => {
    try {
        const { login } = req.body;

        if (!login) {
            return res.status(400).json({ message: 'Login obligatoire' });
        }

        const [users] = await db.query(
            'SELECT * FROM utilisateur WHERE login = ?', [login]
        );

        if (users.length === 0) {
            // Message générique pour ne pas révéler si le login existe
            return res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
        }

        const user = users[0];

        if (!user.email) {
            return res.status(400).json({ 
                message: 'Aucun email associé à ce compte. Contactez l\'administrateur.' 
            });
        }

        // Générer un token unique
        const token = crypto.randomBytes(32).toString('hex');
        const expiration = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

        await db.query(`
            INSERT INTO ResetPassword (utilisateur_id, token, expiration)
            VALUES (?, ?, ?)
        `, [user.id, token, expiration]);

        const lien = `http://localhost:3000/reinitialiser-mot-de-passe/${token}`;

        const envoye = await envoyerEmailResetPassword(user.email, user.nom, lien);

        if (!envoye) {
            return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
        }

        res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Vérifier la validité du token
const verifierToken = async (req, res) => {
    try {
        const { token } = req.params;

        const [resets] = await db.query(`
            SELECT * FROM ResetPassword 
            WHERE token = ? AND utilise = FALSE AND expiration > NOW()
        `, [token]);

        if (resets.length === 0) {
            return res.status(400).json({ message: 'Lien invalide ou expiré' });
        }

        res.json({ valide: true });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Réinitialiser le mot de passe
const reinitialiserMotDePasse = async (req, res) => {
    try {
        const { token, nouveauMotDePasse } = req.body;

        const [resets] = await db.query(`
            SELECT * FROM ResetPassword 
            WHERE token = ? AND utilise = FALSE AND expiration > NOW()
        `, [token]);

        if (resets.length === 0) {
            return res.status(400).json({ message: 'Lien invalide ou expiré' });
        }

        const reset = resets[0];
        const hash = await bcrypt.hash(nouveauMotDePasse, 10);

        await db.query(
            'UPDATE utilisateur SET motDePasse = ? WHERE id = ?',
            [hash, reset.utilisateur_id]
        );

        await db.query(
            'UPDATE ResetPassword SET utilise = TRUE WHERE id = ?',
            [reset.id]
        );

        res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { demanderReset, verifierToken, reinitialiserMotDePasse };