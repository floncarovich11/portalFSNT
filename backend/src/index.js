// carregar variáveis de ambiente de .env
require('dotenv').config();

const db = require('./config/db');
const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const unidadesRoutes = require('./routes/unidades');
const adminRoutes = require('./routes/admin');
const tiRoutes = require('./routes/ti');
const configuracoesRoutes = require('./routes/configuracoes');

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
app.use('/tickets', ticketRoutes);
app.use('/unidades', unidadesRoutes);
app.use('/admin', adminRoutes);
app.use('/ti', tiRoutes);
app.use('/configuracoes', configuracoesRoutes);