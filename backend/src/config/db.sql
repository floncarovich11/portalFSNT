-- =====================================================
-- SISTEMA DE CHAMADOS TI - BANCO DE DADOS
-- =====================================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS portalFSNT;
USE portalFSNT;

-- =====================================================
-- TABELA: unidades
-- Armazena as unidades onde os funcionários trabalham
-- =====================================================
CREATE TABLE unidades (
  id_unidade INT AUTO_INCREMENT PRIMARY KEY,
  nome_unidade VARCHAR(100) NOT NULL UNIQUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Inserir unidades padrão
INSERT INTO unidades (nome_unidade) VALUES 
('Colégio Shunji Nishimura'),
('FATEC'),
('Museu Shunji Nishimura'),
('CITAP');

-- =====================================================
-- TABELA: tipos_solicitacao
-- Categorias de problemas/solicitações (Computador, Impressora, etc)
-- =====================================================
CREATE TABLE tipos_solicitacao (
  id_tipo INT AUTO_INCREMENT PRIMARY KEY,
  nome_tipo VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Inserir tipos de solicitação padrão (você pode adicionar mais depois)
INSERT INTO tipos_solicitacao (nome_tipo, descricao) VALUES 
('Computador', 'Problemas relacionados a computadores e notebooks'),
('Impressora', 'Problemas com impressoras e scanners'),
('Rede/Internet', 'Problemas de conexão e rede'),
('Software', 'Instalação ou problemas com programas'),
('Hardware', 'Problemas com equipamentos físicos'),
('E-mail', 'Problemas relacionados a e-mail'),
('Telefonia', 'Problemas com telefones e ramais'),
('Outro', 'Outras solicitações');

-- =====================================================
-- TABELA: usuarios
-- Funcionários que podem abrir chamados
-- =====================================================
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  id_unidade INT NOT NULL,
  tipo_usuario ENUM('Funcionario', 'TI', 'Administrador') DEFAULT 'Funcionario',
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_unidade) REFERENCES unidades(id_unidade) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Índices para melhor performance
CREATE INDEX idx_email ON usuarios(email);
CREATE INDEX idx_unidade ON usuarios(id_unidade);

-- =====================================================
-- TABELA: chamados
-- Tickets/chamados abertos pelos funcionários
-- =====================================================
CREATE TABLE chamados (
  id_chamado INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_unidade INT NOT NULL,
  id_tipo_solicitacao INT NOT NULL,
  resumo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  status_chamado ENUM('Aberto', 'Em Andamento', 'Aguardando Resposta', 'Resolvido', 'Cancelado') DEFAULT 'Aberto',
  prioridade ENUM('Baixa', 'Média', 'Alta', 'Urgente') DEFAULT 'Média',
  id_tecnico_responsavel INT NULL,
  data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_conclusao TIMESTAMP NULL,
  observacoes_tecnico TEXT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_unidade) REFERENCES unidades(id_unidade) ON DELETE RESTRICT,
  FOREIGN KEY (id_tipo_solicitacao) REFERENCES tipos_solicitacao(id_tipo) ON DELETE RESTRICT,
  FOREIGN KEY (id_tecnico_responsavel) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Índices para melhor performance
CREATE INDEX idx_status ON chamados(status_chamado);
CREATE INDEX idx_usuario ON chamados(id_usuario);
CREATE INDEX idx_tecnico ON chamados(id_tecnico_responsavel);
CREATE INDEX idx_data_abertura ON chamados(data_abertura);

-- =====================================================
-- TABELA: anexos_chamado
-- Imagens e arquivos anexados aos chamados
-- =====================================================
CREATE TABLE anexos_chamado (
  id_anexo INT AUTO_INCREMENT PRIMARY KEY,
  id_chamado INT NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(500) NOT NULL,
  tipo_arquivo VARCHAR(50),
  tamanho_arquivo INT,
  enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chamado) REFERENCES chamados(id_chamado) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_chamado ON anexos_chamado(id_chamado);

-- =====================================================
-- TABELA: historico_chamado
-- Registro de todas as alterações/comentários no chamado
-- =====================================================
CREATE TABLE historico_chamado (
  id_historico INT AUTO_INCREMENT PRIMARY KEY,
  id_chamado INT NOT NULL,
  id_usuario INT NOT NULL,
  tipo_acao ENUM('Comentario', 'Mudanca_Status', 'Atribuicao', 'Conclusao') NOT NULL,
  descricao_acao TEXT NOT NULL,
  status_anterior VARCHAR(50) NULL,
  status_novo VARCHAR(50) NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_chamado) REFERENCES chamados(id_chamado) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_chamado_historico ON historico_chamado(id_chamado);
CREATE INDEX idx_data_historico ON historico_chamado(criado_em);

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para listar chamados com informações completas
CREATE VIEW vw_chamados_completos AS
SELECT 
  c.id_chamado,
  c.resumo,
  c.descricao,
  c.status_chamado,
  c.prioridade,
  c.data_abertura,
  c.data_atualizacao,
  c.data_conclusao,
  u.nome_completo AS nome_solicitante,
  u.email AS email_solicitante,
  un.nome_unidade,
  ts.nome_tipo AS tipo_solicitacao,
  COALESCE(t.nome_completo, 'Não atribuído') AS tecnico_responsavel,
  (SELECT COUNT(*) FROM anexos_chamado WHERE id_chamado = c.id_chamado) AS total_anexos
FROM chamados c
INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
INNER JOIN unidades un ON c.id_unidade = un.id_unidade
INNER JOIN tipos_solicitacao ts ON c.id_tipo_solicitacao = ts.id_tipo
LEFT JOIN usuarios t ON c.id_tecnico_responsavel = t.id_usuario;

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- =====================================================

-- Criar usuário admin padrão (senha: admin123)
-- IMPORTANTE: Trocar a senha após primeiro login!
-- INSERT INTO usuarios (nome_completo, email, senha, id_unidade, tipo_usuario) 
-- VALUES ('Administrador', 'admin@sistema.com', '$2b$10$XqZW8Z8Z8Z8Z8Z8Z8Z8Z8Z', 1, 'Administrador');

-- Criar usuário TI padrão
-- INSERT INTO usuarios (nome_completo, email, senha, id_unidade, tipo_usuario) 
-- VALUES ('Técnico TI', 'ti@sistema.com', '$2b$10$XqZW8Z8Z8Z8Z8Z8Z8Z8Z8Z', 1, 'TI');

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================