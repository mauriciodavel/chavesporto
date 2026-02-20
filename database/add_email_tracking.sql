-- Migration: Adicionar campos para rastreamento de emails de atraso
-- Data: 16/02/2026
-- Descrição: Adiciona campos para controlar envio de emails de primeiro alerta e recobrança

ALTER TABLE key_history ADD COLUMN IF NOT EXISTS email_first_alert_sent_at TIMESTAMP;
ALTER TABLE key_history ADD COLUMN IF NOT EXISTS email_reminder_sent_at TIMESTAMP;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_key_history_email_alerts ON key_history(status, email_first_alert_sent_at);
