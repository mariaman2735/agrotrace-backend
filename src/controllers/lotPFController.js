const db = require('../config/db');

// Générer un numéro de lot PF automatique
const genererNumeroLotPF = async () => {
    const annee = new Date().getFullYear();
    const [rows] = await db.query(
        'SELECT COUNT(*) as total FROM lotproduitfini'
    );
    const numero = String(rows[0].total + 1).padStart(3, '0');
    return `PF-${annee}-${numero}`;
};

// Lister tous les lots PF
const getLotsPF = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT l.*, o.numOrdreFabrication
            FROM lotproduitfini l
            LEFT JOIN ordrefabrication o ON l.ordreFabrication_id = o.id
            ORDER BY l.dateProduction DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir un lot PF par ID
const getLotPFById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT l.*, o.numOrdreFabrication
            FROM lotproduitfini l
            LEFT JOIN ordrefabrication o ON l.ordreFabrication_id = o.id
            WHERE l.id = ?
        `, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Lot PF non trouvé' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer un lot PF (production)
const createLotPF = async (req, res) => {
    try {
        const { dateProduction, quantiteProduite, dateDC, ordreFabrication_id } = req.body;

        if (!dateProduction || !quantiteProduite || !ordreFabrication_id) {
            return res.status(400).json({ 
                message: 'dateProduction, quantiteProduite et ordreFabrication_id sont obligatoires' 
            });
        }

        // Vérifier que l'OF existe
        const [of] = await db.query(
            'SELECT id FROM ordrefabrication WHERE id = ?', [ordreFabrication_id]
        );
        if (of.length === 0) {
            return res.status(404).json({ message: 'Ordre de fabrication non trouvé' });
        }

        const numLot = await genererNumeroLotPF();

        const [result] = await db.query(`
            INSERT INTO lotproduitfini 
            (numLot, dateProduction, quantiteProduite, quantiteDisponible, statut, dateDC, ordreFabrication_id)
            VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, ?)
        `, [numLot, dateProduction, quantiteProduite, quantiteProduite, dateDC, ordreFabrication_id]);

        // Mettre à jour le statut de l'OF en TERMINE
        await db.query(
            'UPDATE ordrefabrication SET statut = ?, dateCloture = ? WHERE id = ?',
            ['TERMINE', dateProduction, ordreFabrication_id]
        );

        res.status(201).json({
            message: 'Lot PF créé avec succès',
            numLot,
            lotPFId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour le statut d'un lot PF
const updateStatutLotPF = async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsValides = ['RECU','EN_ATTENTE','CONFORME','NON_CONFORME','BLOQUE','EPUISE'];

        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const [exist] = await db.query(
            'SELECT id FROM lotproduitfini WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Lot PF non trouvé' });
        }

        await db.query(
            'UPDATE lotproduitfini SET statut = ? WHERE id = ?',
            [statut, req.params.id]
        );

        res.json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Traçabilité d'un lot PF
const getTraceabilite = async (req, res) => {
    try {
        const [lotPF] = await db.query(`
            SELECT l.*, o.numOrdreFabrication
            FROM lotproduitfini l
            LEFT JOIN ordrefabrication o ON l.ordreFabrication_id = o.id
            WHERE l.id = ?
        `, [req.params.id]);

        if (lotPF.length === 0) {
            return res.status(404).json({ message: 'Lot PF non trouvé' });
        }

        // Lots MP utilisés
        const [lotsMP] = await db.query(`
            SELECT c.*, m.numLot as numLotMP, f.nom as fournisseurNom
            FROM consommationmatierepremiere c
            LEFT JOIN lotmatierepremiere m ON c.lotMP_id = m.id
            LEFT JOIN fournisseur f ON m.fournisseur_id = f.id
            WHERE c.ordreFabrication_id = ?
        `, [lotPF[0].ordreFabrication_id]);

        // Ventes associées
        const [ventes] = await db.query(`
            SELECT v.*, c.nom as clientNom
            FROM vente v
            LEFT JOIN client c ON v.client_id = c.id
            WHERE v.lotPF_id = ?
        `, [req.params.id]);

        res.json({
            lotProduitFini : lotPF[0],
            matieresPremières: lotsMP,
            ventes
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { getLotsPF, getLotPFById, createLotPF, updateStatutLotPF, getTraceabilite };