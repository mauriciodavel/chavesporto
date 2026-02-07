// Endpoint customizado para retornar QR-Codes em formato correto
const express = require('express');
const supabase = require('../config/supabase');
const verifyToken = require('../middleware/auth');

async function getKeysWithQR(req, res) {
  try {
    const { data: keys, error } = await supabase
      .from('keys')
      .select('id, qr_code, environment, description, location, status, qr_code_image')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Processar as imagens QR-Code
    const processedKeys = keys.map(key => {
      let qrCodeImage = key.qr_code_image;
      
      // Se a imagem está em hex, converter para string
      if (qrCodeImage && typeof qrCodeImage === 'string') {
        // Detectar se é hex (começa com \x...)
        if (qrCodeImage.includes('\\x')) {
          try {
            // Converter hex para buffer
            const hexStr = qrCodeImage.replace(/\\x/g, '');
            const buffer = Buffer.from(hexStr, 'hex');
            qrCodeImage = buffer.toString('utf8');
          } catch (e) {
            console.warn(`Erro ao converter hex para string para chave ${key.id}:`, e.message);
            qrCodeImage = null;
          }
        }
      }

      return {
        ...key,
        qr_code_image: qrCodeImage
      };
    });

    res.json({
      success: true,
      data: processedKeys
    });
  } catch (error) {
    console.error('Erro ao buscar chaves:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar chaves',
      error: error.message
    });
  }
}

module.exports = { getKeysWithQR };
