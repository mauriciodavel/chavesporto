-- Aumentar limite de caracteres para unidade_curricular de 150 para 1000
-- Isso permite mais unidades curriculares por turma

ALTER TABLE key_reservations
ALTER COLUMN unidade_curricular TYPE VARCHAR(1000);

-- Log de sucesso
SELECT 'Coluna unidade_curricular aumentada de VARCHAR(150) para VARCHAR(1000)' as status;
