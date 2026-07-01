const db      = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
require('dotenv').config();

// Connexion
const login = async (req, res) => {
    try {
        const { login, motDePasse } = req.body;

        // Vérifier si l'utilisateur existe
        const [rows] = await db.query(
            'SELECT * FROM utilisateur WHERE login = ?', [login]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
        }

        const utilisateur = rows[0];

        // Vérifier le mot de passe
        const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);

        if (!motDePasseValide) {
            return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: utilisateur.id, role: utilisateur.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message : 'Connexion réussie',
            token,
            utilisateur: {
                id    : utilisateur.id,
                nom   : utilisateur.nom,
                login : utilisateur.login,
                role  : utilisateur.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer un utilisateur (admin seulement)
const creerUtilisateur = async (req, res) => {
    try {
        const { login, motDePasse, nom, role } = req.body;

        // Vérifier si le login existe déjà
        const [exist] = await db.query(
            'SELECT id FROM utilisateur WHERE login = ?', [login]
        );

        if (exist.length > 0) {
            return res.status(400).json({ message: 'Ce login existe déjà' });
        }

        // Hasher le mot de passe
        const hash = await bcrypt.hash(motDePasse, 10);

        // Insérer l'utilisateur
        const [result] = await db.query(
            'INSERT INTO utilisateur (login, motDePasse, nom, role) VALUES (?, ?, ?, ?)',
            [login, hash, nom, role]
        );

        res.status(201).json({
            message      : 'Utilisateur créé avec succès',
            utilisateurId: result.insertId
        });

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Lister les utilisateurs
const getUtilisateurs = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, login, nom, role, dateCreation, actif FROM utilisateur'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Modifier son propre profil
const modifierProfil = async (req, res) => {
    try {
        const { login, ancienMotDePasse, nouveauMotDePasse } = req.body;
        const userId = req.utilisateur.id;

        // Vérifier l'ancien mot de passe
        const [users] = await db.query(
            'SELECT * FROM utilisateur WHERE id = ?', [userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = users[0];
        const valide = await bcrypt.compare(ancienMotDePasse, user.motDePasse);
        if (!valide) {
            return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
        }

        // Vérifier si le nouveau login est disponible
        if (login !== user.login) {
            const [exist] = await db.query(
                'SELECT id FROM utilisateur WHERE login = ? AND id != ?', [login, userId]
            );
            if (exist.length > 0) {
                return res.status(400).json({ message: 'Ce login est déjà utilisé' });
            }
        }

        // Mettre à jour
        if (nouveauMotDePasse) {
            const hash = await bcrypt.hash(nouveauMotDePasse, 10);
            await db.query(
                'UPDATE utilisateur SET login = ?, motDePasse = ? WHERE id = ?',
                [login, hash, userId]
            );
        } else {
            await db.query(
                'UPDATE utilisateur SET login = ? WHERE id = ?',
                [login, userId]
            );
        }

        res.json({ message: 'Profil mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { login, creerUtilisateur, getUtilisateurs, modifierProfil };