const db = require('../config/db');

// Lister toutes les ventes
const getVentes = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT v.*, c.nom as clientNom, l.numLot as numLotPF,
                   u.nom as commercialNom
            FROM vente v
            LEFT JOIN client c ON v.client_id = c.id
            LEFT JOIN lotproduitfini l ON v.lotPF_id = l.id
            LEFT JOIN utilisateur u ON v.commercial_id = u.id
            ORDER BY v.dateVente DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir une vente par ID
const getVenteById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT v.*, c.nom as clientNom, l.numLot as numLotPF,
                   u.nom as commercialNom
            FROM vente v
            LEFT JOIN client c ON v.client_id = c.id
            LEFT JOIN lotproduitfini l ON v.lotPF_id = l.id
            LEFT JOIN utilisateur u ON v.commercial_id = u.id
            WHERE v.id = ?
        `, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Vente non trouvée' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer une vente
const createVente = async (req, res) => {
    try {
        const { dateVente, referenceCommande, quantiteVendue, 
                prixUnitaire, lotPF_id, client_id } = req.body;

        if (!dateVente || !referenceCommande || !quantiteVendue || 
            !prixUnitaire || !lotPF_id || !client_id) {
            return res.status(400).json({ 
                message: 'Tous les champs sont obligatoires' 
            });
        }

        // Vérifier que le lot PF existe et est disponible
        const [lot] = await db.query(
            'SELECT * FROM lotproduitfini WHERE id = ?', [lotPF_id]
        );
        if (lot.length === 0) {
            return res.status(404).json({ message: 'Lot PF non trouvé' });
        }
        if (lot[0].statut === 'BLOQUE') {
            return res.status(400).json({ message: 'Ce lot est bloqué, vente impossible' });
        }
        if (lot[0].quantiteDisponible < quantiteVendue) {
            return res.status(400).json({ 
                message: `Quantité insuffisante. Disponible : ${lot[0].quantiteDisponible}` 
            });
        }

        // Vérifier que le client existe
        const [client] = await db.query(
            'SELECT id FROM client WHERE id = ?', [client_id]
        );
        if (client.length === 0) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }

        const commercial_id = req.utilisateur.id;

        const [result] = await db.query(`
            INSERT INTO vente 
            (dateVente, referenceCommande, quantiteVendue, prixUnitaire, 
             lotPF_id, client_id, commercial_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [dateVente, referenceCommande, quantiteVendue, prixUnitaire,
            lotPF_id, client_id, commercial_id]);

        // Mettre à jour la quantité disponible du lot PF
        await db.query(`
            UPDATE lotproduitfini 
            SET quantiteDisponible = quantiteDisponible - ?
            WHERE id = ?
        `, [quantiteVendue, lotPF_id]);

        res.status(201).json({
            message: 'Vente enregistrée avec succès',
            venteId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { getVentes, getVenteById, createVente };