const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Buscar todas as unidades
router.get('/', (req, res) => {
    db.query('SELECT id_unidade, nome_unidade FROM unidades ORDER BY nome_unidade', (err, results) => {
        if (err) {
            console.error('DB SELECT UNIDADES ERROR:', err);
            return res.status(500).json({ message: 'Erro ao buscar unidades.' });
        }
        return res.status(200).json({ unidades: results });
    });
});

module.exports = router;