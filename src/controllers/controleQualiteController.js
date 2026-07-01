const db = require('../config/db');

// Lister tous les contrôles qualité
const getControles = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, l.numLot as numLotPF, u.nom as responsableNom
            FROM controlequalite c
            LEFT JOIN lotproduitfini l ON c.lotPF_id = l.id
            LEFT JOIN utilisateur u ON c.responsable_id = u.id
            ORDER BY c.dateControle DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir un contrôle par ID
const getControleById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, l.numLot as numLotPF, u.nom as responsableNom
            FROM controlequalite c
            LEFT JOIN lotproduitfini l ON c.lotPF_id = l.id
            LEFT JOIN utilisateur u ON c.responsable_id = u.id
            WHERE c.id = ?
        `, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Contrôle qualité non trouvé' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer un contrôle qualité
const createControle = async (req, res) => {
    try {
        const { dateControle, typeControle, resultats, statut, lotPF_id } = req.body;

        if (!dateControle || !typeControle || !statut || !lotPF_id) {
            return res.status(400).json({ 
                message: 'dateControle, typeControle, statut et lotPF_id sont obligatoires' 
            });
        }

        // Vérifier que le lot PF existe
        const [lot] = await db.query(
            'SELECT id FROM lotproduitfini WHERE id = ?', [lotPF_id]
        );
        if (lot.length === 0) {
            return res.status(404).json({ message: 'Lot PF non trouvé' });
        }

        const responsable_id = req.utilisateur.id;

        const [result] = await db.query(`
            INSERT INTO controlequalite 
            (dateControle, typeControle, resultats, statut, lotPF_id, responsable_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [dateControle, typeControle, resultats, statut, lotPF_id, responsable_id]);

        // Mettre à jour le statut du lot PF selon le résultat
        const statutLot = statut === 'CONFORME' ? 'CONFORME' : 'NON_CONFORME';
        await db.query(
            'UPDATE lotproduitfini SET statut = ? WHERE id = ?',
            [statutLot, lotPF_id]
        );

        res.status(201).json({
            message: 'Contrôle qualité enregistré avec succès',
            controleId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { getControles, getControleById, createControle };