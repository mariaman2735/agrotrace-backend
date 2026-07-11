/**
 * ============================================================
 * AgroTrace - Contrôleur des Lots de Produits Finis
 * Gère la production et la traçabilité des produits finis
 * ============================================================
 */

const db = require('../config/db');

/**
 * Génère automatiquement un numéro de lot unique pour les produits finis
 * Format : PF-AAAA-XXX (ex: PF-2026-001)
 */
const genererNumeroLotPF = async () => {
    const annee = new Date().getFullYear();
    const [rows] = await db.query('SELECT COUNT(*) as total FROM lotproduitfini');
    const numero = String(rows[0].total + 1).padStart(3, '0');
    return `PF-${annee}-${numero}`;
};

/**
 * Récupère la liste de tous les lots de produits finis
 * avec le numéro d'ordre de fabrication associé
 */
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

/**
 * Récupère un lot de produit fini par son identifiant
 */
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

/**
 * Crée un nouveau lot de produit fini à l'issue d'un ordre de fabrication
 * Le numéro de lot est généré automatiquement
 * L'ordre de fabrication associé est automatiquement clôturé (statut TERMINE)
 */
const createLotPF = async (req, res) => {
    try {
        const { dateProduction, quantiteProduite, dateDC, ordreFabrication_id } = req.body;

        if (!dateProduction || !quantiteProduite || !ordreFabrication_id) {
            return res.status(400).json({ 
                message: 'dateProduction, quantiteProduite et ordreFabrication_id sont obligatoires' 
            });
        }

        // Vérification que l'ordre de fabrication existe
        const [of] = await db.query(
            'SELECT id FROM ordrefabrication WHERE id = ?', [ordreFabrication_id]
        );
        if (of.length === 0) {
            return res.status(404).json({ message: 'Ordre de fabrication non trouvé' });
        }

        // Génération du numéro de lot unique
        const numLot = await genererNumeroLotPF();

        // Insertion du lot de produit fini
        const [result] = await db.query(`
            INSERT INTO lotproduitfini 
            (numLot, dateProduction, quantiteProduite, quantiteDisponible, statut, dateDC, ordreFabrication_id)
            VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, ?)
        `, [numLot, dateProduction, quantiteProduite, quantiteProduite, dateDC, ordreFabrication_id]);

        // Clôture automatique de l'ordre de fabrication
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

/**
 * Met à jour le statut d'un lot de produit fini
 * Statuts possibles : EN_ATTENTE, CONFORME, NON_CONFORME, BLOQUE, EPUISE
 */
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

/**
 * Récupère la chaîne de traçabilité complète d'un lot de produit fini
 * Retourne : informations du lot PF + matières premières utilisées + ventes associées
 * Conformément à la norme ISO 22005:2007
 */
const getTraceabilite = async (req, res) => {
    try {
        // Récupération du lot PF avec son ordre de fabrication
        const [lotPF] = await db.query(`
            SELECT l.*, o.numOrdreFabrication
            FROM lotproduitfini l
            LEFT JOIN ordrefabrication o ON l.ordreFabrication_id = o.id
            WHERE l.id = ?
        `, [req.params.id]);

        if (lotPF.length === 0) {
            return res.status(404).json({ message: 'Lot PF non trouvé' });
        }

        // Récupération des matières premières consommées lors de la fabrication
        const [lotsMP] = await db.query(`
            SELECT c.*, m.numLot as numLotMP, f.nom as fournisseurNom
            FROM consommationmatierepremiere c
            LEFT JOIN lotmatierepremiere m ON c.lotMP_id = m.id
            LEFT JOIN fournisseur f ON m.fournisseur_id = f.id
            WHERE c.ordreFabrication_id = ?
        `, [lotPF[0].ordreFabrication_id]);

        // Récupération des ventes associées à ce lot
        const [ventes] = await db.query(`
            SELECT v.*, c.nom as clientNom
            FROM vente v
            LEFT JOIN client c ON v.client_id = c.id
            WHERE v.lotPF_id = ?
        `, [req.params.id]);

        res.json({
            lotProduitFini: lotPF[0],
            matieresPremières: lotsMP,
            ventes
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { getLotsPF, getLotPFById, createLotPF, updateStatutLotPF, getTraceabilite };