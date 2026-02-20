-- Script para atualizar role de "Mauricio Davel" para admin
UPDATE instructors 
SET role = 'admin' 
WHERE name = 'Mauricio Davel' 
AND role != 'admin';

-- Verificar o resultado
SELECT id, name, role FROM instructors WHERE name = 'Mauricio Davel';
