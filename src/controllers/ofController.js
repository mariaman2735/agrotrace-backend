const db = require('../config/db');

// Générer un numéro d'OF automatique
const genererNumeroOF = async () => {
    const annee = new Date().getFullYear();
    const [rows] = await db.query(
        'SELECT COUNT(*) as total FROM ordrefabrication'
    );
    const numero = String(rows[0].total + 1).padStart(3, '0');
    return `OF-${annee}-${numero}`;
};

// Lister tous les OF
// AJOUT : JOIN avec produit pour avoir le nom du produit fabriqué
const getOFs = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT o.*, u.nom as operateurNom, p.nom as produitNom, p.reference as produitReference
            FROM ordrefabrication o
            LEFT JOIN utilisateur u ON o.operateur_id = u.id
            LEFT JOIN produit p ON o.produit_id = p.id
            ORDER BY o.dateCreation DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir un OF par ID
// AJOUT : JOIN avec produit
const getOFById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT o.*, u.nom as operateurNom, p.nom as produitNom, p.reference as produitReference
            FROM ordrefabrication o
            LEFT JOIN utilisateur u ON o.operateur_id = u.id
            LEFT JOIN produit p ON o.produit_id = p.id
            WHERE o.id = ?
        `, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Ordre de fabrication non trouvé' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer un OF
// AJOUT : produit_id obligatoire + vérification qu'il existe
const createOF = async (req, res) => {
    try {
        const { dateCreation, dateLancement, quantitePlanifiee, produit_id } = req.body;

        if (!dateCreation || !quantitePlanifiee || !produit_id) {
            return res.status(400).json({
                message: 'dateCreation, quantitePlanifiee et produit_id sont obligatoires'
            });
        }

        // Vérifier que le produit existe
        const [produit] = await db.query(
            'SELECT id FROM produit WHERE id = ?', [produit_id]
        );
        if (produit.length === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        const numOrdreFabrication = await genererNumeroOF();
        const operateur_id = req.utilisateur.id;

        const [result] = await db.query(`
            INSERT INTO ordrefabrication
            (numOrdreFabrication, dateCreation, dateLancement, quantitePlanifiee, statut, operateur_id, produit_id)
            VALUES (?, ?, ?, ?, 'PLANIFIE', ?, ?)
        `, [numOrdreFabrication, dateCreation, dateLancement, quantitePlanifiee, operateur_id, produit_id]);

        res.status(201).json({
            message: 'Ordre de fabrication créé avec succès',
            numOrdreFabrication,
            ofId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour le statut d'un OF
const updateStatutOF = async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsValides = ['PLANIFIE','EN_COURS','SUSPENDU','TERMINE','ANNULE'];

        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const [exist] = await db.query(
            'SELECT id FROM ordrefabrication WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Ordre de fabrication non trouvé' });
        }

        const updateData = { statut };
        if (statut === 'TERMINE') {
            updateData.dateCloture = new Date().toISOString().split('T')[0];
        }

        await db.query(
            'UPDATE ordrefabrication SET statut = ?, dateCloture = ? WHERE id = ?',
            [statut, updateData.dateCloture || null, req.params.id]
        );

        res.json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Consommer un lot MP dans un OF
const consommerLotMP = async (req, res) => {
    try {
        const { lotMP_id, quantiteConsommee } = req.body;
        const ordreFabrication_id = req.params.id;

        if (!lotMP_id || !quantiteConsommee) {
            return res.status(400).json({
                message: 'lotMP_id et quantiteConsommee sont obligatoires'
            });
        }

        // Vérifier que le lot MP existe et a assez de quantité
        const [lot] = await db.query(
            'SELECT * FROM lotmatierepremiere WHERE id = ?', [lotMP_id]
        );
        if (lot.length === 0) {
            return res.status(404).json({ message: 'Lot MP non trouvé' });
        }
        if (lot[0].quantiteRestante < quantiteConsommee) {
            return res.status(400).json({
                message: `Quantité insuffisante. Disponible : ${lot[0].quantiteRestante}`
            });
        }

        // Enregistrer la consommation
        await db.query(`
            INSERT INTO consommationmatierepremiere
            (quantiteConsommee, dateConsommation, lotMP_id, ordreFabrication_id)
            VALUES (?, ?, ?, ?)
        `, [quantiteConsommee, new Date().toISOString().split('T')[0], lotMP_id, ordreFabrication_id]);

        // Mettre à jour la quantité restante du lot MP
        await db.query(`
            UPDATE lotmatierepremiere
            SET quantiteRestante = quantiteRestante - ?
            WHERE id = ?
        `, [quantiteConsommee, lotMP_id]);

        res.status(201).json({ message: 'Consommation enregistrée avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { getOFs, getOFById, createOF, updateStatutOF, consommerLotMP };