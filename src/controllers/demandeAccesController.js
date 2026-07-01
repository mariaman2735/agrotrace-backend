const db = require('../config/db');

// Créer une demande d'accès (public, pas besoin de token)
const createDemande = async (req, res) => {
    try {
        const { nom, email, telephone, entreprise, motif } = req.body;

        if (!nom || !email) {
            return res.status(400).json({ message: 'Nom et email sont obligatoires' });
        }

        const [result] = await db.query(`
            INSERT INTO DemandeAcces (nom, email, telephone, entreprise, motif)
            VALUES (?, ?, ?, ?, ?)
        `, [nom, email, telephone, entreprise, motif]);

        res.status(201).json({
            message: 'Votre demande a été envoyée avec succès. Vous serez contacté(e) prochainement.',
            id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Lister toutes les demandes (admin seulement)
const getDemandes = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM DemandeAcces ORDER BY dateCreation DESC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour le statut d'une demande (admin seulement)
const updateStatutDemande = async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsValides = ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'];

        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        await db.query(
            'UPDATE DemandeAcces SET statut = ? WHERE id = ?',
            [statut, req.params.id]
        );

        res.json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { createDemande, getDemandes, updateStatutDemande };