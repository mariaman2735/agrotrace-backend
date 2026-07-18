const db = require('../config/db');

// Générer un numéro de lot automatique
const genererNumeroLot = async () => {
    const annee = new Date().getFullYear();
    const [rows] = await db.query(
        'SELECT COUNT(*) as total FROM lotmatierepremiere'
    );
    const numero = String(rows[0].total + 1).padStart(3, '0');
    return `MP-${annee}-${numero}`;
};

// Lister tous les lots MP
// AJOUT : JOIN avec matierepremiere pour avoir le nom de la matière première
const getLotsMPList = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT l.*, f.nom as fournisseurNom, mp.nom as matierePremiereNom, mp.code as matierePremiereCode
            FROM lotmatierepremiere l
            LEFT JOIN fournisseur f ON l.fournisseur_id = f.id
            LEFT JOIN matierepremiere mp ON l.matierePremiere_id = mp.id
            ORDER BY l.dateReception DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir un lot MP par ID
// AJOUT : JOIN avec matierepremiere
const getLotMPById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT l.*, f.nom as fournisseurNom, mp.nom as matierePremiereNom, mp.code as matierePremiereCode
            FROM lotmatierepremiere l
            LEFT JOIN fournisseur f ON l.fournisseur_id = f.id
            LEFT JOIN matierepremiere mp ON l.matierePremiere_id = mp.id
            WHERE l.id = ?
        `, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Lot MP non trouvé' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer un lot MP (réception)
// AJOUT : matierePremiere_id obligatoire + vérification qu'elle existe
const createLotMP = async (req, res) => {
    try {
        const { dateReception, quantite, dateDC, fournisseur_id, matierePremiere_id } = req.body;

        if (!dateReception || !quantite || !fournisseur_id || !matierePremiere_id) {
            return res.status(400).json({
                message: 'dateReception, quantite, fournisseur_id et matierePremiere_id sont obligatoires'
            });
        }

        // Vérifier que le fournisseur existe
        const [fourn] = await db.query(
            'SELECT id FROM fournisseur WHERE id = ?', [fournisseur_id]
        );
        if (fourn.length === 0) {
            return res.status(404).json({ message: 'Fournisseur non trouvé' });
        }

        // Vérifier que la matière première existe
        const [mp] = await db.query(
            'SELECT id FROM matierepremiere WHERE id = ?', [matierePremiere_id]
        );
        if (mp.length === 0) {
            return res.status(404).json({ message: 'Matière première non trouvée' });
        }

        // Générer le numéro de lot
        const numLot = await genererNumeroLot();

        const [result] = await db.query(`
            INSERT INTO lotmatierepremiere
            (numLot, dateReception, quantite, quantiteRestante, statut, dateDC, fournisseur_id, matierePremiere_id)
            VALUES (?, ?, ?, ?, 'RECU', ?, ?, ?)
        `, [numLot, dateReception, quantite, quantite, dateDC, fournisseur_id, matierePremiere_id]);

        res.status(201).json({
            message: 'Lot MP créé avec succès',
            numLot,
            lotId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour le statut d'un lot MP
const updateStatutLotMP = async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsValides = ['RECU','EN_ATTENTE','CONFORME','NON_CONFORME','BLOQUE','EPUISE'];

        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const [exist] = await db.query(
            'SELECT id FROM lotmatierepremiere WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Lot MP non trouvé' });
        }

        await db.query(
            'UPDATE lotmatierepremiere SET statut = ? WHERE id = ?',
            [statut, req.params.id]
        );

        res.json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { getLotsMPList, getLotMPById, createLotMP, updateStatutLotMP };