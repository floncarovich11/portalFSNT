const db = require('./config/db');
const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/auth');

app.use(express.json());

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log('Body recebido:', req.body);
    }
    next();
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado ao banco com sucesso!');
    app.listen(3000, () => {
        console.log('Servidor rodando na porta 3000');
    });
});

app.use('/auth', authRoutes);