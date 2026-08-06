const db = require('../config/db');

// Lister tous les produits
const getProduits = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM produit WHERE deleted_at IS NULL ORDER BY nom ASC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir un produit par ID
const getProduitById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM produit WHERE id = ? AND deleted_at IS NULL', [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer un produit
const createProduit = async (req, res) => {
    try {
        const { nom, reference, categorie, uniteMesure } = req.body;

        if (!nom || !reference) {
            return res.status(400).json({ message: 'nom et reference sont obligatoires' });
        }

        const [exist] = await db.query(
            'SELECT id FROM produit WHERE reference = ?', [reference]
        );
        if (exist.length > 0) {
            return res.status(400).json({ message: 'Cette référence existe déjà' });
        }

        const [result] = await db.query(`
            INSERT INTO produit (nom, reference, categorie, uniteMesure)
            VALUES (?, ?, ?, ?)
        `, [nom, reference, categorie, uniteMesure || 'unite']);

        res.status(201).json({
            message: 'Produit créé avec succès',
            produitId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Modifier un produit
const updateProduit = async (req, res) => {
    try {
        const { nom, reference, categorie, uniteMesure } = req.body;

        const [exist] = await db.query(
            'SELECT id FROM produit WHERE id = ? AND deleted_at IS NULL', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        await db.query(`
            UPDATE produit SET nom=?, reference=?, categorie=?, uniteMesure=? WHERE id=?
        `, [nom, reference, categorie, uniteMesure, req.params.id]);

        res.json({ message: 'Produit mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer un produit (soft delete - conservation pour traçabilité)
const deleteProduit = async (req, res) => {
    try {
        const [exist] = await db.query(
            'SELECT id FROM produit WHERE id = ? AND deleted_at IS NULL', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        await db.query(
            'UPDATE produit SET deleted_at = NOW() WHERE id = ?', [req.params.id]
        );
        res.json({ message: 'Produit archivé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = {
    getProduits,
    getProduitById,
    createProduit,
    updateProduit,
    deleteProduit
};