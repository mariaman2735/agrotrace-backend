const db = require('../config/db');

// Lister tous les rappels
const getRappels = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, a.description as actionDescription,
                   u.nom as responsableNom
            FROM rappelproduit r
            LEFT JOIN actioncorrective a ON r.actionCorrective_id = a.id
            LEFT JOIN utilisateur u ON r.responsable_id = u.id
            ORDER BY r.dateRappel DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir un rappel par ID avec les lots concernés
const getRappelById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, u.nom as responsableNom
            FROM rappelproduit r
            LEFT JOIN utilisateur u ON r.responsable_id = u.id
            WHERE r.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Rappel produit non trouvé' });
        }

        // Lots concernés
        const [lots] = await db.query(`
            SELECT l.numLot, l.dateProduction, l.quantiteProduite, l.statut
            FROM rappelproduit_lotpf rl
            LEFT JOIN lotproduitfini l ON rl.lotPF_id = l.id
            WHERE rl.rappelProduit_id = ?
        `, [req.params.id]);

        res.json({ ...rows[0], lotsConcernes: lots });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Déclencher un rappel produit
const createRappel = async (req, res) => {
    try {
        const { dateRappel, motif, actionCorrective_id, lotsPF_ids } = req.body;

        if (!dateRappel || !motif || !lotsPF_ids || lotsPF_ids.length === 0) {
            return res.status(400).json({ 
                message: 'dateRappel, motif et lotsPF_ids sont obligatoires' 
            });
        }

        const responsable_id = req.utilisateur.id;

        // Créer le rappel
        const [result] = await db.query(`
            INSERT INTO rappelproduit 
            (dateRappel, motif, statut, actionCorrective_id, responsable_id)
            VALUES (?, ?, 'INITIE', ?, ?)
        `, [dateRappel, motif, actionCorrective_id || null, responsable_id]);

        const rappelId = result.insertId;

        // Associer les lots concernés et les bloquer
        for (const lotPF_id of lotsPF_ids) {
            await db.query(`
                INSERT INTO rappelproduit_lotpf (rappelProduit_id, lotPF_id)
                VALUES (?, ?)
            `, [rappelId, lotPF_id]);

            await db.query(
                'UPDATE lotproduitfini SET statut = ? WHERE id = ?',
                ['BLOQUE', lotPF_id]
            );
        }

        res.status(201).json({
            message: 'Rappel produit déclenché avec succès',
            rappelId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour le statut d'un rappel
const updateStatutRappel = async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsValides = ['INITIE', 'EN_COURS', 'CLOTURE', 'ARCHIVE'];

        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const [exist] = await db.query(
            'SELECT id FROM rappelproduit WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Rappel non trouvé' });
        }

        await db.query(
            'UPDATE rappelproduit SET statut = ? WHERE id = ?',
            [statut, req.params.id]
        );

        res.json({ message: 'Statut du rappel mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { getRappels, getRappelById, createRappel, updateStatutRappel };