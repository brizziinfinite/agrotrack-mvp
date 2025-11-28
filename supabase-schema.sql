-- Tabela para armazenar metadados dos dispositivos
-- Execute este script no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS device_metadata (
  id BIGSERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL UNIQUE, -- ID do dispositivo no Traccar
  traccar_unique_id VARCHAR(255) NOT NULL UNIQUE, -- IMEI do rastreador
  name VARCHAR(255) NOT NULL,
  descricao TEXT,

  -- Aparência
  icone VARCHAR(10) DEFAULT '🚜',
  cor VARCHAR(7) DEFAULT '#10b981',
  foto TEXT,

  -- Tipo e informações específicas
  tipo VARCHAR(50) DEFAULT 'veiculo', -- veiculo, animal, equipamento, outro

  -- Campos para veículos
  placa VARCHAR(20),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  ano VARCHAR(4),

  -- Campos para animais
  raca VARCHAR(100),
  idade VARCHAR(50),
  peso VARCHAR(50),

  -- Campos para equipamentos
  numero_serie VARCHAR(100),
  fornecedor VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_device_id ON device_metadata(device_id);
CREATE INDEX IF NOT EXISTS idx_traccar_unique_id ON device_metadata(traccar_unique_id);
CREATE INDEX IF NOT EXISTS idx_tipo ON device_metadata(tipo);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_device_metadata_updated_at ON device_metadata;
CREATE TRIGGER update_device_metadata_updated_at
    BEFORE UPDATE ON device_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) - Opcional
ALTER TABLE device_metadata ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (ajuste conforme necessário)
DROP POLICY IF EXISTS "Permitir leitura pública" ON device_metadata;
CREATE POLICY "Permitir leitura pública"
ON device_metadata FOR SELECT
TO public
USING (true);

-- Política para permitir inserção pública (ajuste conforme necessário)
DROP POLICY IF EXISTS "Permitir inserção pública" ON device_metadata;
CREATE POLICY "Permitir inserção pública"
ON device_metadata FOR INSERT
TO public
WITH CHECK (true);

-- Política para permitir atualização pública (ajuste conforme necessário)
DROP POLICY IF EXISTS "Permitir atualização pública" ON device_metadata;
CREATE POLICY "Permitir atualização pública"
ON device_metadata FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Comentários na tabela
COMMENT ON TABLE device_metadata IS 'Metadados dos dispositivos GPS do AgroTrack';
COMMENT ON COLUMN device_metadata.device_id IS 'ID do dispositivo no sistema Traccar';
COMMENT ON COLUMN device_metadata.traccar_unique_id IS 'IMEI ou identificador único do rastreador';
COMMENT ON COLUMN device_metadata.icone IS 'Emoji ou ícone visual do dispositivo';
COMMENT ON COLUMN device_metadata.cor IS 'Cor em formato hexadecimal (#RRGGBB)';
COMMENT ON COLUMN device_metadata.tipo IS 'Tipo do dispositivo: veiculo, animal, equipamento, outro';
