const db = require('../config/db');

// Lister tous les fournisseurs
const getFournisseurs = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM fournisseur');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir un fournisseur par ID
const getFournisseurById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM fournisseur WHERE id = ?', [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Fournisseur non trouvé' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer un fournisseur
const createFournisseur = async (req, res) => {
    try {
        const { nom, NINEA, adresse, telephone, email } = req.body;

        if (!nom || !NINEA) {
            return res.status(400).json({ message: 'Nom et NINEA sont obligatoires' });
        }

        const [exist] = await db.query(
            'SELECT id FROM fournisseur WHERE NINEA = ?', [NINEA]
        );
        if (exist.length > 0) {
            return res.status(400).json({ message: 'Ce NINEA existe déjà' });
        }

        const [result] = await db.query(
            'INSERT INTO fournisseur (nom, NINEA, adresse, telephone, email) VALUES (?, ?, ?, ?, ?)',
            [nom, NINEA, adresse, telephone, email]
        );

        res.status(201).json({
            message: 'Fournisseur créé avec succès',
            fournisseurId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Modifier un fournisseur
const updateFournisseur = async (req, res) => {
    try {
        const { nom, NINEA, adresse, telephone, email } = req.body;

        const [exist] = await db.query(
            'SELECT id FROM fournisseur WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Fournisseur non trouvé' });
        }

        await db.query(
            'UPDATE fournisseur SET nom=?, NINEA=?, adresse=?, telephone=?, email=? WHERE id=?',
            [nom, NINEA, adresse, telephone, email, req.params.id]
        );

        res.json({ message: 'Fournisseur mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer un fournisseur
const deleteFournisseur = async (req, res) => {
    try {
        const [exist] = await db.query(
            'SELECT id FROM fournisseur WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Fournisseur non trouvé' });
        }

        await db.query('DELETE FROM fournisseur WHERE id = ?', [req.params.id]);
        res.json({ message: 'Fournisseur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = {
    getFournisseurs,
    getFournisseurById,
    createFournisseur,
    updateFournisseur,
    deleteFournisseur
};