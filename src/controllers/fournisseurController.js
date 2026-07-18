const db = require('../config/db');

// Lister tous les fournisseurs
// AJOUT : pour chaque fournisseur, la liste des matières premières qu'il fournit
const getFournisseurs = async (req, res) => {
    try {
        const [fournisseurs] = await db.query('SELECT * FROM fournisseur');

        const [liaisons] = await db.query(`
            SELECT fmp.fournisseur_id, mp.id, mp.nom, mp.code
            FROM fournisseur_matierepremiere fmp
            JOIN matierepremiere mp ON fmp.matierePremiere_id = mp.id
        `);

        const resultat = fournisseurs.map(f => ({
            ...f,
            matieresPremieresFournies: liaisons
                .filter(l => l.fournisseur_id === f.id)
                .map(l => ({ id: l.id, nom: l.nom, code: l.code }))
        }));

        res.json(resultat);
    } catch (error) {
    console.error('ERREUR getFournisseurs:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir un fournisseur par ID
// AJOUT : ses matières premières fournies
const getFournisseurById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM fournisseur WHERE id = ?', [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Fournisseur non trouvé' });
        }

        const [liaisons] = await db.query(`
            SELECT mp.id, mp.nom, mp.code
            FROM fournisseur_matierepremiere fmp
            JOIN matierepremiere mp ON fmp.matierePremiere_id = mp.id
            WHERE fmp.fournisseur_id = ?
        `, [req.params.id]);

        res.json({ ...rows[0], matieresPremieresFournies: liaisons });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer un fournisseur
const createFournisseur = async (req, res) => {
    try {
        const { nom, NINEA, adresse, telephone, email } = req.body;

        if (!nom || !NINEA) {
            return res.status(400).json({ message: 'Nom et NINEA sont obligatoires' });
        }

        const [exist] = await db.query(
            'SELECT id FROM fournisseur WHERE NINEA = ?', [NINEA]
        );
        if (exist.length > 0) {
            return res.status(400).json({ message: 'Ce NINEA existe déjà' });
        }

        const [result] = await db.query(
            'INSERT INTO fournisseur (nom, NINEA, adresse, telephone, email) VALUES (?, ?, ?, ?, ?)',
            [nom, NINEA, adresse, telephone, email]
        );

        res.status(201).json({
            message: 'Fournisseur créé avec succès',
            fournisseurId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Modifier un fournisseur
const updateFournisseur = async (req, res) => {
    try {
        const { nom, NINEA, adresse, telephone, email } = req.body;

        const [exist] = await db.query(
            'SELECT id FROM fournisseur WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Fournisseur non trouvé' });
        }

        await db.query(
            'UPDATE fournisseur SET nom=?, NINEA=?, adresse=?, telephone=?, email=? WHERE id=?',
            [nom, NINEA, adresse, telephone, email, req.params.id]
        );

        res.json({ message: 'Fournisseur mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer un fournisseur
const deleteFournisseur = async (req, res) => {
    try {
        const [exist] = await db.query(
            'SELECT id FROM fournisseur WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Fournisseur non trouvé' });
        }

        await db.query('DELETE FROM fournisseur WHERE id = ?', [req.params.id]);
        res.json({ message: 'Fournisseur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// NOUVELLE FONCTION : lier des matières premières à un fournisseur
// Body attendu : { matierePremiereIds: [1, 3] }
const setMatieresPremieresFournisseur = async (req, res) => {
    try {
        const { matierePremiereIds } = req.body;
        const fournisseurId = req.params.id;

        const [exist] = await db.query(
            'SELECT id FROM fournisseur WHERE id = ?', [fournisseurId]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Fournisseur non trouvé' });
        }

        // On repart de zéro pour ce fournisseur puis on réinsère la sélection actuelle
        await db.query(
            'DELETE FROM fournisseur_matierepremiere WHERE fournisseur_id = ?', [fournisseurId]
        );

        if (matierePremiereIds && matierePremiereIds.length > 0) {
            const values = matierePremiereIds.map(mpId => [fournisseurId, mpId]);
            await db.query(
                'INSERT INTO fournisseur_matierepremiere (fournisseur_id, matierePremiere_id) VALUES ?',
                [values]
            );
        }

        res.json({ message: 'Matières premières liées avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = {
    getFournisseurs,
    getFournisseurById,
    createFournisseur,
    updateFournisseur,
    deleteFournisseur,
    setMatieresPremieresFournisseur
};