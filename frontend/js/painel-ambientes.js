/* ============================================
   PAINEL DE AMBIENTES - SCRIPT
   ============================================ */

// ============================================
// CONFIGURAÇÕES
// ============================================

const API_BASE = '/api';
const MEDIA_STORAGE_KEY = 'painel_media_storage';
const ADMIN_TOKEN_KEY = 'painel_admin_token';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

let isAdminMode = false;
let adminToken = null;
let currentUploadType = 1; // 1, 2, or 3
let ambientesData = [];
let filteredData = [];

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicializando Painel de Ambientes');
  
  // Atualizar hora e data
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Carregamento inicial de dados
  await loadAmbientes();

  // Auto-atualizar dados a cada 30 segundos
  setInterval(loadAmbientes, 30000);

  // Re-filtrar a cada minuto para acompanhar mudanças de turno
  setInterval(filterAndSort, 60000);

  // Carregar mídia do servidor E do localStorage como fallback
  await loadMediaFromServer();
  
  // Loadomédia local também (fallback se servidor falhar)
  console.log('💾 Verificando localStorage como fallback...');
  loadMediaFromStorage();

  // Verificar token admin no localStorage
  checkAdminToken();

  // Event listeners
  setupEventListeners();

  console.log('✅ Painel de Ambientes inicializado');
});

// ============================================
// ATUALIZAR HORA E DATA
// ============================================

function updateDateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR');
  const dateStr = now.toLocaleDateString('pt-BR');
  
  document.getElementById('currentTime').textContent = timeStr;
  document.getElementById('currentDate').textContent = dateStr;
  
  // Atualizar indicador de turno ativo
  updateActiveTurnIndicator();
}

function updateActiveTurnIndicator() {
  const now = new Date();
  const hours = now.getHours();
  const indicator = document.getElementById('activeTurnIndicator');
  
  let turnText = '';
  let turnEmoji = '';
  
  if (hours >= 6 && hours < 12) {
    turnText = '📅 Turno: Matutino/Integral';
    turnEmoji = '';
  } else if (hours >= 12 && hours < 17.5) {
    turnText = '📅 Turno: Vespertino/Integral';
    turnEmoji = '';
  } else if (hours >= 17.5 && hours < 22) {
    turnText = '📅 Turno: Noturno';
    turnEmoji = '';
  } else {
    turnText = '📅 Fora do horário';
    turnEmoji = '';
  }
  
  indicator.textContent = turnText;
}

// ============================================
// CARREGAR AMBIENTES COM RESERVAS ATIVAS
// ============================================

async function loadAmbientes() {
  try {
    const response = await fetch(`${API_BASE}/painel`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      ambientesData = data.data || [];
      console.log(`✅ ${ambientesData.length} ambiente(s) com reserva ativa carregado(s)`);
      
      // Aplicar filtros e ordenação
      filterAndSort();
    } else {
      console.error('❌ Erro ao carregar ambientes:', data.message);
      showNoData();
    }
  } catch (error) {
    console.error('❌ Erro ao buscar ambientes:', error);
    showNoData();
  }
}

// ============================================
// DETERMINAR TURNO ATIVO BASEADO NA HORA ATUAL
// ============================================

function getActiveTurns() {
  const now = new Date();
  const hours = now.getHours();
  const activeTurns = [];

  // A) Entre 06:00 e 12:00: matutino ou integral
  if (hours >= 6 && hours < 12) {
    activeTurns.push('matutino', 'integral');
  }
  // B) Entre 12:00 e 17:30: vespertino ou integral
  else if (hours >= 12 && hours < 17.5) {
    activeTurns.push('vespertino', 'integral');
  }
  // C) Entre 17:30 e 22:00: noturno
  else if (hours >= 17.5 && hours < 22) {
    activeTurns.push('noturno');
  }
  // Fora do horário: mostrar tudo
  else {
    activeTurns.push('matutino', 'vespertino', 'noturno', 'integral');
  }

  return activeTurns;
}

// ============================================
// FILTRAR E ORDENAR DADOS
// ============================================

function filterAndSort() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const sortBy = document.getElementById('sortSelect').value;
  const activeTurns = getActiveTurns();

  // Filtrar por turno ativo e termo de busca
  filteredData = ambientesData.filter(item => {
    // Verificar se o turno está ativo
    if (!activeTurns.includes(item.shift)) {
      return false;
    }

    // Aplicar filtro de busca
    const searchFields = [
      item.turma || '',
      item.instructor_name || '',
      item.environment || '',
      item.location || '',
      item.shift || ''
    ].join(' ').toLowerCase();

    return searchFields.includes(searchTerm);
  });

  // Ordenar
  sortData(sortBy);

  // Renderizar
  renderTable();
}

function sortData(sortBy) {
  switch(sortBy) {
    case 'turma':
      filteredData.sort((a, b) => (a.turma || '').localeCompare(b.turma || ''));
      break;
    case 'instructor':
      filteredData.sort((a, b) => (a.instructor_name || '').localeCompare(b.instructor_name || ''));
      break;
    case 'environment':
      filteredData.sort((a, b) => (a.environment || '').localeCompare(b.environment || ''));
      break;
    case 'time':
      filteredData.sort((a, b) => {
        const timeA = parseTimeToMinutes(a.start_time || '');
        const timeB = parseTimeToMinutes(b.start_time || '');
        return timeA - timeB;
      });
      break;
  }
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

// ============================================
// RENDERIZAR TABELA
// ============================================

function renderTable() {
  const tbody = document.getElementById('ambientesTableBody');
  const noDataMsg = document.getElementById('noDataMessage');

  if (filteredData.length === 0) {
    tbody.innerHTML = '';
    noDataMsg.style.display = 'block';
    return;
  }

  noDataMsg.style.display = 'none';

  tbody.innerHTML = filteredData.map(item => `
    <tr class="ambiente-row" onclick="showDetails('${item.id}')">
      <td>
        <span class="status-badge ${getStatusClass(item.key_status)}">
          <span class="status-dot"></span>
          ${getStatusLabel(item.key_status)}
        </span>
      </td>
      <td><strong>${item.turma || '-'}</strong></td>
      <td>${item.instructor_name || '-'}</td>
      <td>${item.environment || '-'}</td>
      <td>${item.description || '-'}</td>
      <td>
        ${item.start_time && item.end_time 
          ? `<time>${item.start_time} - ${item.end_time}</time>` 
          : '-'}
      </td>
      <td>${getShiftLabel(item.shift)}</td>
    </tr>
  `).join('');
}

function getStatusClass(keyStatus) {
  const statusMap = {
    'reservado': 'status-reserved',
    'withdrawn': 'status-withdrawn',
    'returned': 'status-returned'
  };
  return statusMap[keyStatus] || 'status-inactive';
}

function getStatusLabel(keyStatus) {
  const statusMap = {
    'reservado': '📦 Reservado',
    'withdrawn': '🔑 Em uso',
    'returned': '✅ Devolvido'
  };
  return statusMap[keyStatus] || 'Desconhecido';
}

function getShiftLabel(shift) {
  const shiftMap = {
    'matutino': '🌅 Matutino',
    'vespertino': '🌤️ Vespertino',
    'noturno': '🌙 Noturno',
    'integral': '☀️ Integral'
  };
  return shiftMap[shift] || shift;
}

function showNoData() {
  const tbody = document.getElementById('ambientesTableBody');
  const noDataMsg = document.getElementById('noDataMessage');
  tbody.innerHTML = '';
  noDataMsg.style.display = 'block';
}

// ============================================
// MOSTRAR DETALHES
// ============================================

function showDetails(ambienteId) {
  const ambiente = ambientesData.find(a => a.id === ambienteId);
  if (!ambiente) return;

  const modal = document.getElementById('detailsModal');
  const title = document.getElementById('detailsTitle');
  const body = document.getElementById('detailsModalBody');

  title.textContent = `${ambiente.environment} - ${ambiente.turma}`;

  body.innerHTML = `
    <div class="details-grid">
      <div class="detail-item">
        <label>Código da Turma</label>
        <p>${ambiente.turma || '-'}</p>
      </div>
      <div class="detail-item">
        <label>Nome do Instrutor</label>
        <p>${ambiente.instructor_name || '-'}</p>
      </div>
      <div class="detail-item">
        <label>Unidade Curricular</label>
        <p>${ambiente.environment || '-'}</p>
      </div>
      <div class="detail-item">
        <label>Lotação</label>
        <p>${ambiente.location || '-'}</p>
      </div>
      <div class="detail-item">
        <label>Horário</label>
        <p>${ambiente.start_time && ambiente.end_time 
          ? `${ambiente.start_time} às ${ambiente.end_time}` 
          : '-'}</p>
      </div>
      <div class="detail-item">
        <label>Turno</label>
        <p>${getShiftLabel(ambiente.shift)}</p>
      </div>
      <div class="detail-item">
        <label>Status da Chave</label>
        <p class="status-badge ${getStatusClass(ambiente.key_status)}">
          <span class="status-dot"></span>
          ${getStatusLabel(ambiente.key_status)}
        </p>
      </div>
      <div class="detail-item">
        <label>Período de Reserva</label>
        <p>${formatDate(ambiente.start_date)} até ${formatDate(ambiente.end_date)}</p>
      </div>
      ${ambiente.motivo_detalhado ? `
        <div class="detail-item full-width">
          <label>Motivo da Reserva</label>
          <p>${ambiente.motivo_detalhado}</p>
        </div>
      ` : ''}
    </div>
  `;

  openModal('detailsModal');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  // Parsear a data manualmente para evitar problemas com timezone
  // "2026-04-04" → [2026, 04, 04]
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // Month é zero-indexed
  return date.toLocaleDateString('pt-BR');
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', filterAndSort);

  // Sort
  document.getElementById('sortSelect').addEventListener('change', filterAndSort);

  // Media upload input
  document.getElementById('mediaUploadInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndPreviewFile(file);
    }
  });
}

// ============================================
// ADMIN LOGIN
// ============================================

async function handleAdminLogin(event) {
  event.preventDefault();

  const matricula = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricula, password })
    });

    const data = await response.json();

    if (data.success && data.user && data.user.role === 'admin') {
      adminToken = data.token;
      localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
      isAdminMode = true;

      enableAdminMode();
      closeModal('adminLoginModal');
      showUploadStatus('✅ Login como admin realizado com sucesso!', 'success');

      console.log('✅ Admin mode ativado');
    } else {
      showUploadStatus('❌ Apenas administradores podem acessar', 'error');
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    showUploadStatus('❌ Erro ao fazer login', 'error');
  }
}

function checkAdminToken() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    adminToken = token;
    isAdminMode = true;
    enableAdminMode();
  }
}

function enableAdminMode() {
  isAdminMode = true;
  
  // Esconder botão de login
  const loginBtn = document.getElementById('adminLoginBtnSidebar');
  if (loginBtn) loginBtn.style.display = 'none';
  
  // Mostrar botão de atualizar mídia
  document.getElementById('updateMediaBtn').style.display = 'block';
  
  // Mostrar seção de informações
  document.getElementById('mediaInfoSection').style.display = 'block';
  
  // Mostrar indicador de admin
  document.getElementById('adminModeIndicator').style.display = 'block';

  // Mostrar todos os botões de controle de mídia
  [1, 2, 3].forEach(type => {
    const controls = document.getElementById(`mediaControls${type}`);
    if (controls) {
      controls.style.display = 'block';
    }
  });

  console.log('✅ Modo admin ativado');
}

function logoutAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  adminToken = null;
  isAdminMode = false;

  // Mostrar botão de login
  const loginBtn = document.getElementById('adminLoginBtnSidebar');
  if (loginBtn) loginBtn.style.display = 'block';
  
  // Esconder botão de atualizar mídia
  document.getElementById('updateMediaBtn').style.display = 'none';
  
  // Esconder seção de informações
  document.getElementById('mediaInfoSection').style.display = 'none';
  
  // Fechar modal se estiver aberto
  closeUpdateMediaModal();
  
  document.getElementById('adminModeIndicator').style.display = 'none';

  // Esconder todos os botões de controle de mídia
  [1, 2, 3].forEach(type => {
    const controls = document.getElementById(`mediaControls${type}`);
    if (controls) {
      controls.style.display = 'none';
    }
  });

  showUploadStatus('✅ Desconectado', 'success');
  console.log('✅ Modo admin desativado');
}

// ============================================
// MODAL DE ATUALIZAR MÍDIA
// ============================================

function openUpdateMediaModal() {
  document.getElementById('updateMediaModal').style.display = 'flex';
  console.log('📤 Modal de atualizar mídia aberto');
}

function closeUpdateMediaModal() {
  document.getElementById('updateMediaModal').style.display = 'none';
  document.getElementById('uploadStatus').textContent = '';
  document.getElementById('mediaUploadInput').value = '';
  console.log('📤 Modal de atualizar mídia fechado');
}

// ============================================
// UPLOAD DE MÍDIA
// ============================================

function switchUploadTab(type) {
  currentUploadType = type;

  // Atualizar tabs
  document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx + 1 === type);
  });

  // Atualizar input
  const input = document.getElementById('mediaUploadInput');
  if (type === 3) {
    input.accept = 'video/mp4,video/webm';
  } else {
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
  }

  input.value = ''; // Limpar seleção anterior
}

function validateAndPreviewFile(file) {
  const isVideo = currentUploadType === 3;
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const fileType = isVideo ? 'vídeo' : 'imagem';

  if (file.size > maxSize) {
    showUploadStatus(`❌ ${fileType} muito grande. Máximo: ${maxSize / 1024 / 1024}MB`, 'error');
    return false;
  }

  // Validar tipo de arquivo
  if (isVideo && !file.type.startsWith('video/')) {
    showUploadStatus('❌ Apenas vídeos MP4/WebM são permitidos', 'error');
    return false;
  }

  if (!isVideo && !file.type.startsWith('image/')) {
    showUploadStatus('❌ Apenas imagens JPG/PNG/GIF/WebP são permitidas', 'error');
    return false;
  }

  showUploadStatus(`✅ Arquivo selecionado: ${file.name}`, 'success');
  return true;
}

async function uploadMedia() {
  if (!isAdminMode || !adminToken) {
    showUploadStatus('❌ Você precisa estar logado como admin', 'error');
    return;
  }

  const input = document.getElementById('mediaUploadInput');
  const file = input.files[0];

  if (!file) {
    showUploadStatus('❌ Selecione um arquivo', 'error');
    return;
  }

  // Validar arquivo
  if (!validateAndPreviewFile(file)) {
    return;
  }

  try {
    showUploadStatus('🔄 Enviando arquivo...', 'info');

    // NOVA ESTRATÉGIA: usar Supabase SDK para upload direto ao Storage
    console.log('📤 Iniciando upload direto ao Supabase (bypass do Vercel)');
    console.log('   Arquivo:', file.name, '|', file.type, '|', file.size, 'bytes');
    console.log('   Tipo de mídia:', currentUploadType);

    // Inicializar cliente Supabase
    const SUPABASE_URL = 'https://gxkmcqcgorkscabzuhks.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_NoPNne9CTg0PAHoAwGq_Rw_Ems6S31r';
    const BUCKET_NAME = 'painel-media';

    const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Preparar nome do arquivo (FIXO, sem timestamp - assim upsert sobrescreve)
    const fileExtension = getFileExtension(file.name);
    const filename = `media_${currentUploadType}${fileExtension}`;
    const uploadPath = `painel/${filename}`;

    console.log('   Bucket:', BUCKET_NAME);
    console.log('   Path:', uploadPath);
    console.log('   ℹ️ Usando nome FIXO para cada tipo - upsert vai sobrescrever automático');

    // NÃO precisa mais limpar arquivos antigos porque o upsert=true sobrescreve
    console.log('🔄 Upload com upsert=true vai sobrescrever arquivo anterior');

    // Fazer upload usando SDK Supabase (muito mais seguro e confiável)
    console.log('📤 Enviando arquivo para Supabase...');
    console.log('   Usando upsert=true para sobrescrever arquivo anterior');
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uploadPath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('❌ Erro no upload:', error);
      console.error('   Error details:', {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
        name: error.name,
        error: error.error,
        full: JSON.stringify(error, null, 2)
      });
      showUploadStatus(`❌ Erro ao fazer upload: ${error.message || error.error || 'Erro desconhecido'}`, 'error');
      return;
    }

    console.log('✅ Upload bem-sucedido!', data);

    // Gerar URL pública
    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadPath);

    const publicUrl = publicData.publicUrl;
    console.log('🔗 URL pública:', publicUrl);

    // Criar objeto de mídia
    const media = {
      type: currentUploadType,
      filename: filename,
      url: publicUrl,
      timestamp: new Date().toISOString()
    };

    // Salvar no localStorage
    saveMediaToStorage(media);
    
    // Atualizar exibição com os dados locais primeiro
    displayMedia(currentUploadType, media);

    showUploadStatus('✅ Arquivo enviado com sucesso!', 'success');
    input.value = '';
    console.log('✅ Mídia enviada:', media);
    
    // Recarregar mídias do servidor para sincronizar (após 1 segundo para garantir propagação)
    console.log('🔄 Recarregando mídias do servidor em 1 segundo...');
    setTimeout(() => {
      loadMediaFromServer();
    }, 1000);
  } catch (error) {
    console.error('❌ Erro ao enviar arquivo:', error);
    console.error('   Stack:', error.stack);
    showUploadStatus('❌ Erro ao enviar arquivo: ' + error.message, 'error');
  }
}

// Helper para extrair extensão do arquivo
function getFileExtension(filename) {
  const match = filename.match(/\.[^.]*$/);
  return match ? match[0] : '';
}

// ============================================
// GERENCIAMENTO DE MÍDIA (LOCAL STORAGE)
// ============================================

function saveMediaToStorage(media) {
  const storage = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '{}');
  storage[`media_${media.type}`] = media;
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(storage));
  console.log('💾 Media salva no localStorage');
}

async function loadMediaFromServer() {
  try {
    console.log('📥 Carregando mídias do servidor...');
    
    const response = await fetch(`${API_BASE}/painel/media`);
    console.log('   Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
      console.warn('⚠️ Erro ao carregar mídias do servidor:', response.status);
      return;
    }
    
    const result = await response.json();
    console.log('   Response do servidor:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      console.log('   Dados recebidos:', result.data);
      let mediaCarregada = false;
      
      [1, 2, 3].forEach(type => {
        const media = result.data[String(type)];
        console.log(`   Verificando tipo ${type}:`, media);
        
        if (media && media.url) {
          console.log(`✅ Mídia ${type} encontrada: ${media.url}`);
          displayMedia(type, media);
          mediaCarregada = true;
        } else {
          console.log(`⚠️ Mídia ${type} não encontrada ou sem URL`);
        }
      });
      
      if (!mediaCarregada) {
        console.warn('⚠️ Nenhuma mídia foi carregada do servidor');
      }
    } else {
      console.warn('⚠️ Resposta do servidor inválida:', result);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar mídias do servidor:', error);
    console.error('   Stack trace:', error.stack);
  }
}

function loadMediaFromStorage() {
  console.log('💾 Carregando mídias do localStorage...');
  const storage = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '{}');
  
  console.log('   Dados no localStorage:', storage);
  
  let mediaCarregada = false;
  
  [1, 2, 3].forEach(type => {
    const media = storage[`media_${type}`];
    if (media) {
      console.log(`✅ Encontrada mídia ${type} no localStorage:`, media);
      displayMedia(type, media);
      mediaCarregada = true;
    } else {
      console.log(`⏭️  Mídia ${type} não encontrada no localStorage`);
    }
  });
  
  if (!mediaCarregada) {
    console.log('ℹ️ Nenhuma mídia encontrada no localStorage');
  }
}

function displayMedia(type, media) {
  console.log(`🖼️  Exibindo mídia tipo ${type}:`, media);
  console.log(`   isAdminMode = ${isAdminMode}`);
  
  const mediaItem = document.getElementById(`mediaItem${type}`);
  const placeholder = document.getElementById(`mediaPlaceholder${type}`);
  const display = document.getElementById(`media${type === 3 ? 'Video' : 'Image'}${type}`);
  const controls = document.getElementById(`mediaControls${type}`);

  // Validar que todos os elementos existem
  if (!mediaItem) {
    console.error(`❌ Elemento mediaItem${type} não encontrado`);
    return;
  }
  if (!placeholder) {
    console.error(`❌ Elemento mediaPlaceholder${type} não encontrado`);
    return;
  }
  if (!display) {
    console.error(`❌ Elemento media${type === 3 ? 'Video' : 'Image'}${type} não encontrado`);
    return;
  }

  const mediaUrl = media.url || createObjectURL(media);
  
  if (!mediaUrl) {
    console.error(`❌ Não há URL para exibir mídia tipo ${type}`);
    return;
  }

  console.log(`   Carregando URL: ${mediaUrl}`);
  
  if (type === 3) {
    // Vídeo
    display.src = mediaUrl;
  } else {
    // Imagem
    display.src = mediaUrl;
  }

  // Mostrar o media-item
  mediaItem.style.display = 'flex';
  placeholder.style.display = 'none';
  display.style.display = 'block';
  if (controls) {
    // Mostrar controles apenas se for admin
    const shouldShowControls = isAdminMode === true;
    controls.style.display = shouldShowControls ? 'block' : 'none';
    console.log(`   Controles: ${shouldShowControls ? '✅ VISÍVEL' : '❌ ESCONDIDO'} (isAdminMode=${isAdminMode})`);
  }
  
  console.log(`✅ Mídia tipo ${type} exibida com sucesso`);
}

function createObjectURL(media) {
  // Se temos um blob ou arquivo local, criar URL
  if (media.blob) {
    return URL.createObjectURL(media.blob);
  }
  return media.url || '';
}

async function removeMedia(type) {
  // Verificar se é admin
  if (!isAdminMode || !adminToken) {
    console.warn('⚠️ Apenas admin pode remover mídias');
    alert('❌ Apenas administradores podem remover mídias');
    return;
  }

  console.log('🗑️ Iniciando remoção de mídia tipo', type);
  
  const mediaItem = document.getElementById(`mediaItem${type}`);
  const placeholder = document.getElementById(`mediaPlaceholder${type}`);
  const display = document.getElementById(`media${type === 3 ? 'Video' : 'Image'}${type}`);
  const controls = document.getElementById(`mediaControls${type}`);

  try {
    // Remover do bucket Supabase
    console.log('☁️ Deletando arquivo do Supabase...');
    const SUPABASE_URL = 'https://gxkmcqcgorkscabzuhks.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_NoPNne9CTg0PAHoAwGq_Rw_Ems6S31r';
    const BUCKET_NAME = 'painel-media';

    const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Determinar extensão do arquivo baseada no tipo
    const fileExtensions = {
      1: '.png',   // Imagem 1
      2: '.png',   // Imagem 2
      3: '.mp4'    // Vídeo
    };
    
    const ext = fileExtensions[type] || '';
    const filePath = `painel/media_${type}${ext}`;
    
    console.log('   Tentando deletar:', filePath);

    // Deletar arquivo com nome fixo
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (deleteError) {
      console.warn('⚠️ Arquivo pode não existir ou erro ao deletar:', deleteError.message);
      // Continuar mesmo se houver erro (arquivo pode já ter sido deletado)
    } else {
      console.log('✅ Arquivo deletado do Supabase');
    }

    // Esconder o media-item inteiro
    mediaItem.style.display = 'none';
    placeholder.style.display = 'flex';
    display.style.display = 'none';
    controls.style.display = 'none';
    display.src = '';

    // Remover do localStorage
    const storage = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '{}');
    delete storage[`media_${type}`];
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(storage));
    console.log('✅ Removido do localStorage');

    // Remover do servidor também (como backup)
    await deleteMediaFromServer(type);

    console.log('✅ Mídia removida com sucesso:', type);
    showUploadStatus(`✅ Mídia ${type} removida com sucesso!`, 'success');
  } catch (error) {
    console.error('❌ Erro ao remover mídia:', error);
    console.error('   Stack:', error.stack);
    showUploadStatus(`❌ Erro ao remover mídia: ${error.message}`, 'error');
  }
}

async function deleteMediaFromServer(type) {
  if (!adminToken) {
    console.warn('⚠️ Token admin não disponível para backup no servidor');
    return;
  }

  try {
    console.log('📡 Tentando deletar arquivo no servidor como backup...');
    const response = await fetch(`${API_BASE}/painel/media/${type}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Mídia deletada do servidor também');
    } else {
      console.warn(`⚠️ Servidor retornou status ${response.status} (não crítico)`);
    }
  } catch (error) {
    console.warn('⚠️ Erro ao deletar do servidor (não crítico):', error.message);
  }
}

// ============================================
// UI HELPERS
// ============================================

function showUploadStatus(message, type) {
  const statusDiv = document.getElementById('uploadStatus');
  statusDiv.textContent = message;
  statusDiv.className = `upload-status ${type}`;

  if (type !== 'info') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'upload-status';
    }, 4000);
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// ============================================
// AUTO-REFRESH
// ============================================

setInterval(() => {
  console.log('🔄 Recarregando dados de ambientes...');
  loadAmbientes();
}, 60000); // A cada 1 minuto

console.log('✅ Painel de Ambientes carregado - v2 com upload direto Supabase');
