// ============================================
// PAINEL DE AMBIENTES - CONTROLLER
// ============================================

const supabase = require('../config/supabase');
const path = require('path');
const fs = require('fs').promises;

// Constantes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'painel-media';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ============================================
// GET AMBIENTES COM RESERVAS ATIVAS
// (Public endpoint - sem autenticação)
// ============================================

exports.getAmbientesComReservas = async (req, res) => {
  try {
    console.log('📺 [PAINEL] Obtendo ambientes com reservas ativas');

    // ✅ CORRIGIDO: Usar data LOCAL (Brasil) em vez de UTC
    // toISOString() retorna UTC, mas precisamos da data local em Brasil (UTC-3)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    console.log(`📅 Data LOCAL (Brasil): ${today}`);
    console.log(`   Hora LOCAL: ${now.toLocaleTimeString('pt-BR')}`);
    console.log(`   Timezone offset: ${-now.getTimezoneOffset() / 60} horas`);

    const { data: reservas, error: reservasError } = await supabase
      .from('key_reservations')
      .select(`
        id,
        key_id,
        instructor_id,
        reservation_start_date,
        reservation_end_date,
        shift,
        turma,
        motivo_detalhado,
        status,
        keys!inner (id, environment, location, description),
        instructors!instructor_id (id, name)
      `)
      .eq('status', 'approved')
      .lte('reservation_start_date', today)
      .gte('reservation_end_date', today)
      .order('reservation_start_date', { ascending: true });

    if (reservasError) {
      console.error('❌ Erro ao buscar reservas:', reservasError);
      return res.status(400).json({
        success: false,
        message: 'Erro ao buscar ambientes',
        error: reservasError.message
      });
    }

    console.log(`✅ ${reservas?.length || 0} reservas ativas encontradas no intervalo [<=${today}, >=${today}]`);
    if (reservas && reservas.length > 0) {
      console.log('📋 Primeiras 3 reservas:', reservas.slice(0, 3).map(r => ({
        id: r.id,
        start: r.reservation_start_date,
        end: r.reservation_end_date,
        turma: r.turma,
        instructor: r.instructors?.name,
        chave: r.keys?.environment
      })));
    } else {
      console.log('⚠️ ATENÇÃO: Nenhuma reserva encontrada! Verificar datas de início/fim...');
      
      // Log de debug: buscar TODAS as reservas aprovadas sem filtro de data
      const { data: allReservas } = await supabase
        .from('key_reservations')
        .select(`
          id,
          reservation_start_date,
          reservation_end_date,
          shift,
          turma,
          status,
          keys!inner (environment),
          instructors!instructor_id (name)
        `)
        .eq('status', 'approved')
        .order('reservation_start_date', { ascending: false })
        .limit(10);
      
      console.log(`📊 Debug: Total de reservas aprovadas (últimas 10): ${allReservas?.length || 0}`);
      if (allReservas && allReservas.length > 0) {
        console.log('   Amostra:', allReservas.map(r => ({
          start: r.reservation_start_date,
          end: r.reservation_end_date,
          chave: r.keys?.environment,
          turma: r.turma
        })));
      }
    }

    // Transformar dados para formato da tabela
    const ambientes = await Promise.all((reservas || []).map(async (res) => {
      // Calcular horários padrão baseado no turno
      const horarios = getHorariosPorTurno(res.shift);

      // Buscar histórico mais recente da chave
      let keyStatus = 'reservado'; // default
      try {
        const { data: history, error: historyError } = await supabase
          .from('key_history')
          .select('withdrawn_at, returned_at')
          .eq('key_id', res.key_id)
          .order('withdrawn_at', { ascending: false })
          .limit(1);

        if (!historyError && history && history.length > 0) {
          const h = history[0];
          // ✅ CORRIGIDO: A lógica correta de status é:
          // - Se foi retirada E NÃO foi devolvida → 'withdrawn' (em uso)
          // - Se foi retirada E foi devolvida → 'reservado' (disponível novamente)
          if (h.withdrawn_at && !h.returned_at) {
            keyStatus = 'withdrawn'; // Em uso - retirada mas não devolvida
          } else if (h.withdrawn_at && h.returned_at) {
            keyStatus = 'reservado'; // ✅ CORRIGIDO: Devolvida = Disponível novamente
          }
        }
      } catch (err) {
        console.warn('⚠️ Erro ao buscar histórico da chave:', err);
        // Manter como 'reservado' se houver erro
      }

      return {
        id: res.id,
        turma: res.turma || '-',
        instructor_name: res.instructors?.name || 'Desconhecido',
        environment: res.keys?.environment || '-',
        location: res.keys?.location || '-',
        description: res.keys?.description || '-',
        start_date: res.reservation_start_date,
        end_date: res.reservation_end_date,
        start_time: horarios.start,
        end_time: horarios.end,
        shift: res.shift,
        status: res.status, // Status da reserva (approved)
        key_status: keyStatus, // Status da chave (reservado/withdrawn/returned)
        motivo_detalhado: res.motivo_detalhado || ''
      };
    }));

    return res.status(200).json({
      success: true,
      message: `${ambientes.length} ambiente(s) com reserva ativa`,
      data: ambientes,
      count: ambientes.length
    });
  } catch (error) {
    console.error('❌ Erro ao obter ambientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// ============================================
// HELPER: CALCULAR HORÁRIOS POR TURNO
// ============================================

function getHorariosPorTurno(shift) {
  const horarios = {
    matutino: { start: '07:30', end: '11:30' },
    vespertino: { start: '13:30', end: '17:30' },
    noturno: { start: '18:30', end: '22:00' },
    integral: { start: '07:00', end: '17:00' }
  };

  return horarios[shift] || { start: '08:00', end: '17:00' };
}

// ============================================
// UPLOAD DE MÍDIA
// ============================================

exports.uploadMedia = async (req, res) => {
  try {
    console.log('📤 [MEDIA] Upload iniciado');
    console.log('   User:', req.user);
    console.log('   File:', req.file ? { name: req.file.originalname, size: req.file.size, mime: req.file.mimetype } : 'NENHUM');
    console.log('   Body:', req.body);

    // Verificar autenticação admin
    if (!req.user || req.user.role !== 'admin') {
      console.error('❌ Usuário não é admin');
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem fazer upload'
      });
    }

    if (!req.file) {
      console.error('❌ Nenhum arquivo foi enviado');
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    const { type } = req.body; // 1, 2 (imagens) ou 3 (vídeo)
    console.log('   Type recebido:', type, `(tipo: ${typeof type})`);

    if (!type || !['1', '2', '3'].includes(String(type))) {
      console.error('❌ Tipo de mídia inválido:', type);
      return res.status(400).json({
        success: false,
        message: 'Tipo de mídia inválido (1, 2 ou 3)'
      });
    }

    // Validar tipo de arquivo
    const isVideo = type === '3';
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    const fileType = isVideo ? 'vídeo' : 'imagem';
    
    console.log(`   Validação: type=${type}, isVideo=${isVideo}, mime=${req.file.mimetype}, size=${req.file.size}B, max=${maxSize}B`);

    if (!isVideo && !req.file.mimetype.startsWith('image/')) {
      console.error('❌ Arquivo não é imagem:', req.file.mimetype);
      return res.status(400).json({
        success: false,
        message: 'Apenas imagens JPG/PNG/GIF/WebP são permitidas'
      });
    }

    if (isVideo && !req.file.mimetype.startsWith('video/')) {
      console.error('❌ Arquivo não é vídeo:', req.file.mimetype);
      return res.status(400).json({
        success: false,
        message: 'Apenas vídeos MP4/WebM são permitidos'
      });
    }

    // Validar tamanho
    if (req.file.size > maxSize) {
      console.error('❌ Arquivo muito grande:', req.file.size, 'máximo:', maxSize);
      return res.status(400).json({
        success: false,
        message: `${fileType} muito grande. Máximo: ${maxSize / 1024 / 1024}MB`
      });
    }

    const ext = path.extname(req.file.originalname);
    const filename = `media_${type}_${Date.now()}${ext}`;

    if (IS_PRODUCTION) {
      // ========== PRODUÇÃO: Supabase Storage ==========
      console.log('☁️ [PROD] Usando Supabase Storage');
      console.log(`   Bucket: ${BUCKET_NAME}`);
      console.log(`   Arquivo: ${filename}`);
      console.log(`   Tipo MIME: ${req.file.mimetype}`);
      console.log(`   Tamanho: ${req.file.size} bytes`);

      // Listar arquivos antigos do mesmo tipo para deletar
      try {
        console.log(`   📋 Listando arquivos antigos de tipo ${type}...`);
        const { data: oldFiles, error: listError } = await supabase.storage
          .from(BUCKET_NAME)
          .list(`painel`, { search: `media_${type}_` });

        if (!listError && oldFiles && oldFiles.length > 0) {
          console.log(`   🗑️ Encontrados ${oldFiles.length} arquivo(s) antigo(s)`);
          for (const oldFile of oldFiles) {
            await supabase.storage.from(BUCKET_NAME).remove([`painel/${oldFile.name}`]);
            console.log(`      ✓ Removido: ${oldFile.name}`);
          }
        } else if (listError) {
          console.log(`   ⚠️ Erro ao listar (não crítico): ${listError.message}`);
        } else {
          console.log(`   ✓ Nenhum arquivo antigo para remover`);
        }
      } catch (cleanError) {
        console.warn('⚠️ Erro ao limpar mídia anterior no Supabase:', cleanError.message);
      }

      // Upload para Supabase Storage
      console.log(`   📤 Iniciando upload para painel/${filename}...`);
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`painel/${filename}`, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('❌ ERRO NO UPLOAD:', {
          message: error.message,
          code: error.code,
          status: error.status,
          fullError: error
        });
        return res.status(500).json({
          success: false,
          message: 'Erro ao enviar arquivo para Supabase',
          error: error.message,
          details: {
            code: error.code,
            status: error.status,
            bucket: BUCKET_NAME,
            filename: filename
          }
        });
      }

      // Gerar URL pública
      console.log(`   🔗 Gerando URL pública...`);
      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`painel/${filename}`);

      if (!publicData || !publicData.publicUrl) {
        console.error('❌ Erro ao gerar URL pública');
        return res.status(500).json({
          success: false,
          message: 'Erro ao gerar URL pública',
          details: { bucket: BUCKET_NAME, filename: filename }
        });
      }

      const url = publicData.publicUrl;
      console.log('✅ UPLOAD BEM-SUCEDIDO!');
      console.log(`   URL: ${url}`);

      return res.status(200).json({
        success: true,
        message: 'Arquivo enviado com sucesso',
        filename: filename,
        url: url,
        type: type
      });
    } else {
      // ========== DESENVOLVIMENTO: Filesystem Local ==========
      console.log('💾 [DEV] Usando filesystem local');

      const mediaDir = path.join(__dirname, '../../', 'public', 'media', 'painel');
      await fs.mkdir(mediaDir, { recursive: true });

      // Limpar mídia anterior do mesmo tipo
      try {
        const files = await fs.readdir(mediaDir);
        const oldFiles = files.filter(f => f.startsWith(`media_${type}_`));
        
        for (const oldFile of oldFiles) {
          await fs.unlink(path.join(mediaDir, oldFile));
          console.log(`🗑️ Arquivo antigo removido: ${oldFile}`);
        }
      } catch (cleanError) {
        console.warn('⚠️ Erro ao limpar mídia anterior:', cleanError.message);
      }

      // Salvar arquivo localmente
      const filepath = path.join(mediaDir, filename);
      await fs.writeFile(filepath, req.file.buffer);
      console.log('✅ Arquivo salvo localmente:', filename);

      const url = `/media/painel/${filename}`;
      return res.status(200).json({
        success: true,
        message: 'Arquivo enviado com sucesso',
        filename: filename,
        url: url,
        type: type
      });
    }
  } catch (error) {
    console.error('❌❌❌ ERRO CRÍTICO ao fazer upload:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar arquivo',
      error: error.message,
      errorType: error.name,
      errorStack: process.env.NODE_ENV === 'production' ? undefined : error.stack.split('\n')
    });
  }
};

// ============================================
// PREPARAR UPLOAD DIRETO (sem payload de arquivo)
// Endpoint pequeno que retorna info para cliente fazer upload direto ao Supabase
// ============================================

exports.prepareDirectUpload = async (req, res) => {
  try {
    console.log('📝 [MEDIA] Preparando upload direto');

    if (!req.user || req.user.role !== 'admin') {
      console.error('❌ Usuário não é admin');
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem fazer upload'
      });
    }

    const { type, filename: clientFilename, filesize } = req.body;
    console.log('   Type:', type, '| Filename:', clientFilename, '| Size:', filesize);

    if (!type || !['1', '2', '3'].includes(String(type))) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de mídia inválido (1, 2 ou 3)'
      });
    }

    if (!clientFilename) {
      return res.status(400).json({
        success: false,
        message: 'Nome do arquivo não fornecido'
      });
    }

    // Validar tamanho
    const isVideo = type === '3';
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (filesize > maxSize) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`
      });
    }

    // Limpar APENAS (não fazemos upload aqui)
    if (IS_PRODUCTION) {
      console.log(`   🗑️ Limpando arquivos antigos de tipo ${type}...`);
      try {
        const { data: oldFiles } = await supabase.storage
          .from(BUCKET_NAME)
          .list('painel', { search: `media_${type}_` });

        if (oldFiles && oldFiles.length > 0) {
          for (const oldFile of oldFiles) {
            await supabase.storage.from(BUCKET_NAME).remove([`painel/${oldFile.name}`]);
            console.log(`      ✓ Removido: ${oldFile.name}`);
          }
        }
      } catch (cleanError) {
        console.warn('⚠️ Erro ao limpar (não crítico):', cleanError.message);
      }
    }

    // Retornar info para o cliente fazer upload direto
    const uploadPath = `painel/${clientFilename}`;
    const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${uploadPath}`;

    console.log('✅ Upload preparado');
    console.log(`   URL: ${uploadUrl}`);

    return res.status(200).json({
      success: true,
      message: 'Pronto para upload direto',
      uploadUrl: uploadUrl,
      uploadPath: uploadPath,
      bucket: BUCKET_NAME,
      filename: clientFilename,
      type: type,
      supabaseKey: process.env.SUPABASE_KEY
    });
  } catch (error) {
    console.error('❌ Erro ao preparar upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao preparar upload',
      error: error.message
    });
  }
};

// ============================================
// DELETE DE MÍDIA
// ============================================

exports.deleteMedia = async (req, res) => {
  try {
    console.log('🗑️ [MEDIA] Deletando mídia');

    // Verificar autenticação admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem deletar mídia'
      });
    }

    const { type } = req.params;

    if (!type || !['1', '2', '3'].includes(String(type))) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de mídia inválido'
      });
    }

    if (IS_PRODUCTION) {
      // ========== PRODUÇÃO: Supabase Storage ==========
      console.log('☁️ [PROD] Deletando do Supabase Storage');

      try {
        const { data: files, error: listError } = await supabase.storage
          .from(BUCKET_NAME)
          .list(`painel`, { search: `media_${type}_` });

        if (!listError && files && files.length > 0) {
          for (const file of files) {
            await supabase.storage.from(BUCKET_NAME).remove([`painel/${file.name}`]);
            console.log(`🗑️ Arquivo deletado do Supabase: ${file.name}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao deletar mídia do Supabase:', error.message);
      }
    } else {
      // ========== DESENVOLVIMENTO: Filesystem Local ==========
      console.log('💾 [DEV] Deletando do filesystem local');

      const mediaDir = path.join(__dirname, '../../', 'public', 'media', 'painel');

      try {
        const files = await fs.readdir(mediaDir);
        const mediaFiles = files.filter(f => f.startsWith(`media_${type}_`));

        for (const file of mediaFiles) {
          await fs.unlink(path.join(mediaDir, file));
          console.log(`🗑️ Arquivo deletado: ${file}`);
        }
      } catch (cleanError) {
        console.warn('⚠️ Erro ao deletar mídia:', cleanError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Mídia deletada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar mídia:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao deletar mídia',
      error: error.message
    });
  }
};

// ============================================
// GET LISTA DE MÍDIAS
// ============================================

exports.getMediaList = async (req, res) => {
  try {
    console.log('📺 [MEDIA] Listando mídias');

    // Construir URL base absoluta a partir da request
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    console.log(`🌐 URL base: ${baseUrl}`);

    const media = {
      1: null,
      2: null,
      3: null
    };

    if (IS_PRODUCTION) {
      // ========== PRODUÇÃO: Supabase Storage ==========
      console.log('☁️ [PROD] Listando mídias do Supabase Storage');
      console.log('   Bucket:', BUCKET_NAME);

      try {
        const { data: files, error } = await supabase.storage
          .from(BUCKET_NAME)
          .list('painel', {
            limit: 100
          });

        console.log('   Resultado da listagem:', { files: files?.length || 0, error: error?.message || 'sem erro' });

        if (error) {
          console.error('   ❌ Erro ao listar Supabase:', error.message);
          throw error;
        }

        if (!files || files.length === 0) {
          console.log('   ℹ️ Nenhum arquivo encontrado no Supabase');
        } else {
          console.log('   📂 Arquivos encontrados:', files.map(f => f.name).join(', '));
        }

        // Buscar mídias por nome fixo (cada tipo tem um arquivo específico)
        for (let type = 1; type <= 3; type++) {
          // Extensões esperadas para cada tipo
          const extensions = {
            1: '.png',   // Imagem 1
            2: '.png',   // Imagem 2
            3: '.mp4'    // Vídeo
          };
          
          const expectedFileName = `media_${type}${extensions[type]}`;
          const typeFile = files?.find(f => f.name === expectedFileName);

          console.log(`   [Tipo ${type}] Procurando por: ${expectedFileName} → ${typeFile ? 'ENCONTRADO' : 'NÃO encontrado'}`);

          if (typeFile) {
            const { data: publicData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(`painel/${typeFile.name}`);

            media[type] = {
              filename: typeFile.name,
              url: publicData.publicUrl
            };
            console.log(`   ✅ media_${type}: ${publicData.publicUrl}`);
          } else {
            console.log(`   ⏭️  media_${type}: sem arquivos`);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao listar mídias do Supabase:', error.message);
        console.error('   Stack:', error.stack);
        // Retornar vazio se houver erro
      }
    } else {
      // ========== DESENVOLVIMENTO: Filesystem Local ==========
      console.log('💾 [DEV] Listando mídias do filesystem local');

      const mediaDir = path.join(__dirname, '../../', 'public', 'media', 'painel');

      try {
        const files = await fs.readdir(mediaDir);
        console.log('   Arquivos encontrados:', files.length, files.join(', '));

        // Agrupar mídias por tipo (pegar a mais recente de cada)
        for (let type = 1; type <= 3; type++) {
          const typeFiles = files
            .filter(f => f.startsWith(`media_${type}_`))
            .sort()
            .reverse(); // Ordem decrescente (mais novo primeiro)

          console.log(`   [Tipo ${type}] Encontrados: ${typeFiles.length} arquivo(s)`);

          if (typeFiles.length > 0) {
            const absoluteUrl = `${baseUrl}/media/painel/${typeFiles[0]}`;
            media[type] = {
              filename: typeFiles[0],
              url: absoluteUrl
            };
            console.log(`   ✅ media_${type}: ${absoluteUrl}`);
          }
        }
      } catch (readError) {
        console.log('⚠️ Pasta de mídia não existe ou acesso negado:', readError.message);
      }
    }

    console.log('📊 Resultado final:', JSON.stringify(media, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Mídias listadas',
      data: media
    });
  } catch (error) {
    console.error('❌ Erro ao listar mídias:', error);
    console.error('   Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar mídias',
      error: error.message
    });
  }
};

// ============================================
// DEBUG: VERIFICAR VARIÁVEIS DE AMBIENTE
// ============================================

exports.debugStatus = async (req, res) => {
  try {
    const status = {
      mode: IS_PRODUCTION ? '☁️ PRODUÇÃO' : '💾 DESENVOLVIMENTO',
      environment_variables: {
        NODE_ENV: {
          set: !!process.env.NODE_ENV,
          value: process.env.NODE_ENV || 'não configurado'
        },
        SUPABASE_URL: {
          set: !!process.env.SUPABASE_URL,
          preview: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.slice(0, 20)}...` : 'não configurado'
        },
        SUPABASE_KEY: {
          set: !!process.env.SUPABASE_KEY,
          preview: process.env.SUPABASE_KEY ? `${process.env.SUPABASE_KEY.slice(0, 10)}...${process.env.SUPABASE_KEY.slice(-5)}` : 'não configurado'
        },
        SUPABASE_SERVICE_ROLE: {
          set: !!process.env.SUPABASE_SERVICE_ROLE,
          preview: process.env.SUPABASE_SERVICE_ROLE ? '*****(configurado)' : 'não configurado'
        },
        SUPABASE_BUCKET: {
          set: !!process.env.SUPABASE_BUCKET,
          value: process.env.SUPABASE_BUCKET || 'não configurado'
        }
      },
      supabase_connection: {
        url: process.env.SUPABASE_URL || 'não configurado',
        can_connect: false,
        bucket_exists: false,
        bucket_is_public: false
      }
    };

    // Tentar conectar ao Supabase e verificar bucket
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      try {
        status.supabase_connection.can_connect = true;
        
        // Tentar listar arquivos no bucket específico (mais confiável que listBuckets)
        const { data: files, error: listError } = await supabase.storage
          .from(BUCKET_NAME)
          .list('painel', { limit: 1 });

        if (listError && listError.message.includes('not found')) {
          status.supabase_connection.bucket_exists = false;
          status.supabase_connection.error = 'Bucket não existe or não accessible';
        } else if (listError) {
          status.supabase_connection.bucket_exists = false;
          status.supabase_connection.error = listError.message;
        } else {
          status.supabase_connection.bucket_exists = true;
          status.supabase_connection.bucket_is_public = true; // Se conseguiu listar sem erro, é public
          
          // Tentar get public URL para confirmar
          try {
            const { data: urlData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl('test.jpg');
            
            if (urlData && urlData.publicUrl) {
              status.supabase_connection.bucket_is_public = true;
              status.supabase_connection.sample_public_url = urlData.publicUrl.split('/test.jpg')[0] + '/...';
            }
          } catch (e) {
            // Ignore URL test errors
          }
        }
      } catch (error) {
        status.supabase_connection.error = error.message;
        console.error('❌ Erro ao testar Supabase:', error);
      }
    }

    console.log('🔍 DEBUG STATUS:', JSON.stringify(status, null, 2));

    return res.status(200).json({
      success: true,
      message: 'Status de debug obtido com sucesso',
      data: status,
      timestamp: new Date().toISOString(),
      recommendations: !status.supabase_connection.bucket_exists 
        ? ['Bucket pode não estar criado', 'Ou permissões de API podem estar restritas']
        : []
    });
  } catch (error) {
    console.error('❌ Erro ao gerar status de debug:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar status de debug',
      error: error.message
    });
  }
};

module.exports = exports;
