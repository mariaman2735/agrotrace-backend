const db = require('../config/db');

// Lister toutes les non-conformités
const getNonConformites = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT n.*, l.numLot as numLotPF, u.nom as responsableNom
            FROM nonconformite n
            LEFT JOIN lotproduitfini l ON n.lotPF_id = l.id
            LEFT JOIN utilisateur u ON n.responsable_id = u.id
            ORDER BY n.dateSignalement DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir une NC par ID
const getNonConformiteById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT n.*, l.numLot as numLotPF, u.nom as responsableNom
            FROM nonconformite n
            LEFT JOIN lotproduitfini l ON n.lotPF_id = l.id
            LEFT JOIN utilisateur u ON n.responsable_id = u.id
            WHERE n.id = ?
        `, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Non-conformité non trouvée' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Signaler une non-conformité
const createNonConformite = async (req, res) => {
    try {
        const { dateSignalement, type, gravite, description, lotPF_id } = req.body;

        if (!dateSignalement || !type || !gravite || !description || !lotPF_id) {
            return res.status(400).json({ 
                message: 'Tous les champs sont obligatoires' 
            });
        }

        const gravitesValides = ['CRITIQUE', 'MAJEURE', 'MINEURE'];
        if (!gravitesValides.includes(gravite)) {
            return res.status(400).json({ message: 'Gravité invalide' });
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
            INSERT INTO nonconformite 
            (dateSignalement, type, gravite, description, statut, lotPF_id, responsable_id)
            VALUES (?, ?, ?, ?, 'OUVERTE', ?, ?)
        `, [dateSignalement, type, gravite, description, lotPF_id, responsable_id]);

        // Bloquer le lot PF
        await db.query(
            'UPDATE lotproduitfini SET statut = ? WHERE id = ?',
            ['BLOQUE', lotPF_id]
        );

        res.status(201).json({
            message: 'Non-conformité signalée avec succès. Lot bloqué.',
            ncId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour une NC (cause, statut)
const updateNonConformite = async (req, res) => {
    try {
        const { causePrincipale, statut } = req.body;
        const statutsValides = ['OUVERTE', 'EN_COURS', 'CLOTUREE', 'ARCHIVEE'];

        if (statut && !statutsValides.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const [exist] = await db.query(
            'SELECT * FROM nonconformite WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Non-conformité non trouvée' });
        }

        await db.query(`
            UPDATE nonconformite 
            SET causePrincipale = ?, statut = ?
            WHERE id = ?
        `, [causePrincipale || exist[0].causePrincipale,
            statut || exist[0].statut,
            req.params.id]);

        // Si NC clôturée, débloquer le lot
        if (statut === 'CLOTUREE') {
            await db.query(
                'UPDATE lotproduitfini SET statut = ? WHERE id = ?',
                ['CONFORME', exist[0].lotPF_id]
            );
        }

        res.json({ message: 'Non-conformité mise à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { getNonConformites, getNonConformiteById, createNonConformite, updateNonConformite };