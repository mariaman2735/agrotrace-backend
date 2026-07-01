const db = require('../config/db');

// Lister tous les clients
const getClients = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM client ORDER BY nom');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir un client par ID
const getClientById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM client WHERE id = ?', [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Créer un client
const createClient = async (req, res) => {
    try {
        const { nom, NINEA, adresse, telephone, email } = req.body;

        if (!nom) {
            return res.status(400).json({ message: 'Le nom est obligatoire' });
        }

        const [result] = await db.query(`
            INSERT INTO client (nom, NINEA, adresse, telephone, email)
            VALUES (?, ?, ?, ?, ?)
        `, [nom, NINEA, adresse, telephone, email]);

        res.status(201).json({
            message: 'Client créé avec succès',
            clientId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Modifier un client
const updateClient = async (req, res) => {
    try {
        const { nom, NINEA, adresse, telephone, email } = req.body;

        const [exist] = await db.query(
            'SELECT id FROM client WHERE id = ?', [req.params.id]
        );
        if (exist.length === 0) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }

        await db.query(`
            UPDATE client SET nom=?, NINEA=?, adresse=?, telephone=?, email=?
            WHERE id=?
        `, [nom, NINEA, adresse, telephone, email, req.params.id]);

        res.json({ message: 'Client mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

module.exports = { getClients, getClientById, createClient, updateClient };