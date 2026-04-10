-- Adicionar coluna display_on_painel à tabela keys
ALTER TABLE keys 
ADD COLUMN display_on_painel BOOLEAN DEFAULT true;

-- Criar índice para melhorar performance de filtros no painel
CREATE INDEX idx_keys_display_on_painel ON keys(display_on_painel);

-- Comentário explicativo
COMMENT ON COLUMN keys.display_on_painel IS 'Define se a chave deve ser exibida no painel de ambientes. Chaves de gabinetes/equipamentos devem ter false para não aparecerem duplicadas.';
