const db = require('../config/db');

// Lister toutes les matières premières
const getMatieresPremieres = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM matierepremiere ORDER BY nom ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir une matière première par ID
const getMatierePremiereById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM matierepremiere WHERE id = ?', [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Matière première non trouvée' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer une matière première
const createMatierePremiere = async (req, res) => {
    try {
        const { nom, code, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin } = req.body;

        if (!nom || !code) {
            return res.status(400).json({ message: 'nom et code sont obligatoires' });
        }

        const [exist] = await db.query(
            'SELECT id FROM matierepremiere WHERE code = ?', [code]
        );
        if (exist.length > 0) {
            return res.status(400).json({ message: 'Ce code existe déjà' });
        }

        const [result] = await db.query(`
            INSERT INTO matierepremiere
            (nom, code, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nom, code, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin || 0]);

        res.status(201).json({
            message: 'Matière première créée avec succès',
            matierePremiereId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Modifier une matière première
const updateMatierePremiere = async (req, res) => {
    try {
        const { nom, code, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin } = req.body;

        const [exist] = await db.query(
            'SELECT id FROM matierepremiere WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Matière première non trouvée' });
        }

        await db.query(`
            UPDATE matierepremiere
            SET nom=?, code=?, categorie=?, uniteMesure=?, dureeConservationJours=?, conditionStockage=?, quantiteMin=?
            WHERE id=?
        `, [nom, code, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin, req.params.id]);

        res.json({ message: 'Matière première mise à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer une matière première
const deleteMatierePremiere = async (req, res) => {
    try {
        const [exist] = await db.query(
            'SELECT id FROM matierepremiere WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Matière première non trouvée' });
        }

        await db.query('DELETE FROM matierepremiere WHERE id = ?', [req.params.id]);
        res.json({ message: 'Matière première supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = {
    getMatieresPremieres,
    getMatierePremiereById,
    createMatierePremiere,
    updateMatierePremiere,
    deleteMatierePremiere
};