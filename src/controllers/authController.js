/**
 * ============================================================
 * AgroTrace - Contrôleur d'authentification et de gestion des utilisateurs
 * ============================================================
 */

const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
require('dotenv').config();

/**
 * Connexion d'un utilisateur
 * Vérifie les identifiants et retourne un token JWT en cas de succès
 */
const login = async (req, res) => {
    try {
        const { login, motDePasse } = req.body;

        if (!login || !motDePasse) {
            return res.status(400).json({ message: 'Login et mot de passe sont obligatoires' });
        }

        // Recherche de l'utilisateur par son login
        const [users] = await db.query(
            'SELECT * FROM utilisateur WHERE login = ?', [login]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
        }

        const user = users[0];

        // Vérification du mot de passe avec bcrypt
        const motDePasseValide = await bcrypt.compare(motDePasse, user.motDePasse);
        if (!motDePasseValide) {
            return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
        }

        // Génération du token JWT valable 8 heures
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            utilisateur: {
                id: user.id,
                nom: user.nom,
                login: user.login,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

/**
 * Création d'un nouvel utilisateur (réservé à l'administrateur)
 * Hache le mot de passe avant de l'enregistrer en base de données
 */
const creerUtilisateur = async (req, res) => {
    try {
        const { login, motDePasse, nom, role } = req.body;

        if (!login || !motDePasse || !nom || !role) {
            return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
        }

        // Vérification de l'unicité du login
        const [exist] = await db.query(
            'SELECT id FROM utilisateur WHERE login = ?', [login]
        );
        if (exist.length > 0) {
            return res.status(400).json({ message: 'Ce login existe déjà' });
        }

        // Hachage du mot de passe avec bcrypt (10 rounds de salage)
        const hash = await bcrypt.hash(motDePasse, 10);

        await db.query(
            'INSERT INTO utilisateur (login, motDePasse, nom, role) VALUES (?, ?, ?, ?)',
            [login, hash, nom, role]
        );

        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

/**
 * Récupération de la liste de tous les utilisateurs (réservé à l'administrateur)
 */
const getUtilisateurs = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, nom, login, role, email, dateCreation FROM utilisateur ORDER BY nom'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

/**
 * Modification du profil de l'utilisateur connecté
 * Permet de changer son login et/ou son mot de passe
 * Nécessite la saisie du mot de passe actuel pour validation
 */
const modifierProfil = async (req, res) => {
    try {
        const { login, ancienMotDePasse, nouveauMotDePasse } = req.body;
        const userId = req.utilisateur.id;

        // Récupération de l'utilisateur connecté
        const [users] = await db.query(
            'SELECT * FROM utilisateur WHERE id = ?', [userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = users[0];

        // Vérification du mot de passe actuel
        const valide = await bcrypt.compare(ancienMotDePasse, user.motDePasse);
        if (!valide) {
            return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
        }

        // Vérification de la disponibilité du nouveau login
        if (login !== user.login) {
            const [exist] = await db.query(
                'SELECT id FROM utilisateur WHERE login = ? AND id != ?', [login, userId]
            );
            if (exist.length > 0) {
                return res.status(400).json({ message: 'Ce login est déjà utilisé' });
            }
        }

        // Mise à jour avec ou sans changement de mot de passe
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

/**
 * Suppression d'un utilisateur (réservé à l'administrateur)
 */
const supprimerUtilisateur = async (req, res) => {
    try {
        const [exist] = await db.query(
            'SELECT id FROM utilisateur WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        await db.query('DELETE FROM utilisateur WHERE id = ?', [req.params.id]);
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

/**
 * Modification du rôle d'un utilisateur (réservé à l'administrateur)
 */
const modifierRole = async (req, res) => {
    try {
        const { role } = req.body;
        const rolesValides = ['ADMINISTRATEUR','RESP_ACHAT','RESP_QUALITE','RESP_STOCK','RESP_COMMERCIAL','OPERATEUR_PRODUCTION','AUDITEUR'];
        
        if (!rolesValides.includes(role)) {
            return res.status(400).json({ message: 'Rôle invalide' });
        }

        await db.query(
            'UPDATE utilisateur SET role = ? WHERE id = ?',
            [role, req.params.id]
        );
        res.json({ message: 'Rôle mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { login, creerUtilisateur, getUtilisateurs, modifierProfil, supprimerUtilisateur, modifierRole };