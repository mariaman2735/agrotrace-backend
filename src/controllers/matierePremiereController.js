const db = require('../config/db');

// Génère un code automatique à partir du nom (ex: "Bissap" -> "MP-BISS")
// Gère les doublons en ajoutant un suffixe numérique si nécessaire
const genererCodeMatierePremiere = async (nom) => {
    const base = nom
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
        .replace(/[^a-zA-Z]/g, '')                          // garde seulement les lettres
        .toUpperCase()
        .slice(0, 4);

    let code = `MP-${base}`;
    let suffixe = 1;

    // Vérifie l'unicité, y compris parmi les matières premières archivées
    while (true) {
        const [exist] = await db.query(
            'SELECT id FROM matierepremiere WHERE code = ?', [code]
        );
        if (exist.length === 0) break;
        suffixe++;
        code = `MP-${base}${suffixe}`;
    }

    return code;
};

// Lister toutes les matières premières
const getMatieresPremieres = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM matierepremiere WHERE deleted_at IS NULL ORDER BY nom ASC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir une matière première par ID
const getMatierePremiereById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM matierepremiere WHERE id = ? AND deleted_at IS NULL', [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Matière première non trouvée' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer une matière première (le code est généré automatiquement)
const createMatierePremiere = async (req, res) => {
    try {
        const { nom, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin } = req.body;

        if (!nom) {
            return res.status(400).json({ message: 'nom est obligatoire' });
        }

        const code = await genererCodeMatierePremiere(nom);

        const [result] = await db.query(`
            INSERT INTO matierepremiere
            (nom, code, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nom, code, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin || 0]);

        res.status(201).json({
            message: 'Matière première créée avec succès',
            code,
            matierePremiereId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Modifier une matière première (le code n'est pas modifiable, il reste stable)
const updateMatierePremiere = async (req, res) => {
    try {
        const { nom, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin } = req.body;

        const [exist] = await db.query(
            'SELECT id FROM matierepremiere WHERE id = ? AND deleted_at IS NULL', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Matière première non trouvée' });
        }

        await db.query(`
            UPDATE matierepremiere
            SET nom=?, categorie=?, uniteMesure=?, dureeConservationJours=?, conditionStockage=?, quantiteMin=?
            WHERE id=?
        `, [nom, categorie, uniteMesure, dureeConservationJours, conditionStockage, quantiteMin, req.params.id]);

        res.json({ message: 'Matière première mise à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer une matière première (soft delete - conservation pour traçabilité)
const deleteMatierePremiere = async (req, res) => {
    try {
        const [exist] = await db.query(
            'SELECT id FROM matierepremiere WHERE id = ? AND deleted_at IS NULL', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Matière première non trouvée' });
        }

        await db.query(
            'UPDATE matierepremiere SET deleted_at = NOW() WHERE id = ?', [req.params.id]
        );
        res.json({ message: 'Matière première archivée avec succès' });
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