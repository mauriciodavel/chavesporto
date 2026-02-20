// Admin Script
if (!checkAuth('admin')) {
  // Será redirecionado automaticamente
}

const adminUserData = AuthManager.getUserData();
let adminKeys = [];
let adminInstructors = [];
let adminHistory = [];
let editingKeyId = null;
let editingInstructorId = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeAdmin();
  setupAdminEventListeners();
});

function initializeAdmin() {
  if (adminUserData) {
    document.getElementById('adminName').textContent = adminUserData.name;
  }

  // Setup section navigation
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const sectionId = btn.dataset.section + 'Section';
      showSection(sectionId);
      updateActiveNav(btn);
    });
  });

  // Load data
  loadDashboardData();
  loadAdminKeys();
  loadAdminInstructors();
  loadAdminHistory();
}

function setupAdminEventListeners() {
  // New Key Button
  document.getElementById('newKeyBtn').addEventListener('click', () => {
    editingKeyId = null;
    resetKeyForm();
    openModal('keyModal');
  });

  // New Instructor Button
  document.getElementById('newInstructorBtn').addEventListener('click', () => {
    editingInstructorId = null;
    resetInstructorForm();
    openModal('instructorModal');
  });

  // Key Form Submit
  document.getElementById('keyForm').addEventListener('submit', handleKeyFormSubmit);

  // Instructor Form Submit
  document.getElementById('instructorForm').addEventListener('submit', handleInstructorFormSubmit);

  // Search
  document.getElementById('keysSearch').addEventListener('input', (e) => {
    filterKeys(e.target.value);
  });

  document.getElementById('instructorsSearch').addEventListener('input', (e) => {
    filterInstructors(e.target.value);
  });

  // Logout
  document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  });
}

function showSection(sectionId) {
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });

  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
  }
}

function updateActiveNav(activeBtn) {
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.classList.remove('active');
  });
  activeBtn.classList.add('active');
}

// Dashboard Functions
async function loadDashboardData() {
  try {
    const keysResponse = await ApiClient.get('/keys');
    const instructorsResponse = await ApiClient.get('/instructors');
    const lateResponse = await ApiClient.get('/history/late-returns');
    const historyResponse = await ApiClient.get('/history');

    if (keysResponse.success) {
      const keys = keysResponse.data;
      document.getElementById('statTotalKeys').textContent = keys.length;
      document.getElementById('statAvailableKeys').textContent = keys.filter(k => k.status === 'available').length;
      document.getElementById('statInUseKeys').textContent = keys.filter(k => k.status === 'in_use').length;
    }

    if (instructorsResponse.success) {
      document.getElementById('statTotalInstructors').textContent = instructorsResponse.data.length;
    }

    if (lateResponse.success && lateResponse.data.length > 0) {
      displayLateReturns(lateResponse.data);
    } else {
      document.getElementById('lateReturnsContainer').innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #999;">
          <p>✓ Nenhuma devolução em atraso</p>
        </div>
      `;
    }

    // Atualizar histórico também
    if (historyResponse.success) {
      adminHistory = historyResponse.data;
      displayAdminHistory();
    }
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
  }
}

function displayLateReturns(returns) {
  const container = document.getElementById('lateReturnsContainer');

  const html = `
    <table class="table">
      <thead>
        <tr>
          <th>Chave</th>
          <th>Instrutor</th>
          <th>Retirada em</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        ${returns.map(r => `
          <tr style="background-color: rgba(244, 67, 54, 0.1);">
            <td><strong>${r.keys?.environment}</strong></td>
            <td>${r.instructors?.name}</td>
            <td>${formatDateTime(r.withdrawn_at)}</td>
            <td>${r.instructors?.email}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

// Keys Management
async function loadAdminKeys() {
  try {
    const response = await ApiClient.get('/keys');
    if (response.success) {
      adminKeys = response.data;
      displayAdminKeys();
    }
  } catch (error) {
    console.error('Erro ao carregar chaves:', error);
  }
}

function displayAdminKeys() {
  const container = document.getElementById('keysList');

  if (!adminKeys || adminKeys.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
        <p>Nenhuma chave cadastrada</p>
      </div>
    `;
    return;
  }

  container.innerHTML = adminKeys.map(key => `
    <div class="key-item">
      <div class="key-item-header">
        <div class="key-item-title">${key.environment}</div>
        <div class="key-item-actions">
          ${key.status === 'in_use' ? `
            <button class="btn btn-sm btn-success" onclick="returnKeyAsAdmin('${key.id}', '${key.environment}')">
              ↩️ Devolver
            </button>
          ` : ''}
          <button class="btn btn-sm btn-secondary" onclick="editKey('${key.id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="deleteKey('${key.id}', '${key.environment}')">Deletar</button>
        </div>
      </div>
      <div class="key-item-info">
        <p><strong>Descrição:</strong> ${key.description}</p>
        <p><strong>Lotação:</strong> ${key.location}</p>
        <p><strong>Área:</strong> ${key.technical_area || '-'}</p>
        <p><strong>QR Code:</strong> ${key.qr_code}</p>
        <p><strong>Status:</strong> 
          <span class="badge ${key.status === 'available' ? 'badge-success' : 'badge-danger'}">
            ${key.status === 'available' ? 'Disponível' : 'Em uso'}
          </span>
        </p>
        ${key.lastActivity ? `
          <p><strong>Retirada por:</strong> ${key.lastActivity.instructor} em ${formatDateTime(key.lastActivity.withdrawnAt)}</p>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function filterKeys(searchTerm) {
  const filtered = adminKeys.filter(key =>
    key.environment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const container = document.getElementById('keysList');
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
        <p>Nenhuma chave encontrada</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(key => `
    <div class="key-item">
      <div class="key-item-header">
        <div class="key-item-title">${key.environment}</div>
        <div class="key-item-actions">
          <button class="btn btn-sm btn-secondary" onclick="editKey('${key.id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="deleteKey('${key.id}', '${key.environment}')">Deletar</button>
        </div>
      </div>
      <div class="key-item-info">
        <p><strong>Descrição:</strong> ${key.description}</p>
        <p><strong>Lotação:</strong> ${key.location}</p>
        <p><strong>Área:</strong> ${key.technical_area || '-'}</p>
        <p><strong>QR Code:</strong> ${key.qr_code}</p>
        <p><strong>Status:</strong> 
          <span class="badge ${key.status === 'available' ? 'badge-success' : 'badge-danger'}">
            ${key.status === 'available' ? 'Disponível' : 'Em uso'}
          </span>
        </p>
      </div>
    </div>
  `).join('');
}

function resetKeyForm() {
  document.getElementById('keyForm').reset();
  document.getElementById('qrCodeContainer').style.display = 'none';
  document.getElementById('keyModalTitle').textContent = 'Nova Chave';
}

function editKey(keyId) {
  const key = adminKeys.find(k => k.id === keyId);
  if (!key) return;

  editingKeyId = keyId;

  document.getElementById('keyEnvironment').value = key.environment;
  document.getElementById('keyDescription').value = key.description;
  document.getElementById('keyLocation').value = key.location;
  document.getElementById('keyTechnicalArea').value = key.technical_area || '';
  document.getElementById('keyQrCode').value = key.qr_code;

  if (key.qr_code_image) {
    document.getElementById('qrCodeImage').src = key.qr_code_image;
    document.getElementById('qrCodeContainer').style.display = 'block';
  }

  document.getElementById('keyModalTitle').textContent = 'Editar Chave';
  openModal('keyModal');
}

async function handleKeyFormSubmit(e) {
  e.preventDefault();

  const formData = {
    environment: document.getElementById('keyEnvironment').value,
    description: document.getElementById('keyDescription').value,
    location: document.getElementById('keyLocation').value,
    technicalArea: document.getElementById('keyTechnicalArea').value
  };

  try {
    let response;

    if (editingKeyId) {
      response = await ApiClient.put(`/keys/${editingKeyId}`, formData);
    } else {
      response = await ApiClient.post('/keys', formData);

      if (response.success && response.data.qr_code_image) {
        document.getElementById('qrCodeImage').src = response.data.qr_code_image;
        document.getElementById('qrCodeContainer').style.display = 'block';
      }
    }

    if (response.success) {
      showAlert('instructorAlert', '✓ Chave salva com sucesso!', 'success');
      setTimeout(() => {
        closeModal('keyModal');
        loadAdminKeys();
      }, 1000);
    }
  } catch (error) {
    showAlert('instructorAlert', `Erro: ${error.message}`, 'danger');
  }
}

async function deleteKey(keyId, keyName) {
  if (!confirm(`Tem certeza que deseja deletar a chave de ${keyName}?`)) return;

  try {
    const response = await ApiClient.delete(`/keys/${keyId}`);

    if (response.success) {
      showAlert('instructorAlert', '✓ Chave deletada com sucesso!', 'success');
      loadAdminKeys();
    }
  } catch (error) {
    showAlert('instructorAlert', `Erro: ${error.message}`, 'danger');
  }
}

async function returnKeyAsAdmin(keyId, keyName) {
  // Abrir modal para adicionar observação (opcional)
  const observation = prompt(`Observação ao devolver a chave "${keyName}" (deixe em branco para nenhuma):`);
  
  try {
    const response = await ApiClient.post(`/keys/${keyId}/return`, {
      observation: observation || null
    });

    if (response.success) {
      showAlert('keysAlert', `✓ Chave "${keyName}" devolvida com sucesso!`, 'success');
      loadAdminKeys();
      loadAdminHistory(); // Atualizar histórico também
    }
  } catch (error) {
    showAlert('keysAlert', `Erro ao devolver: ${error.message}`, 'danger');
  }
}

// Instructors Management
async function loadAdminInstructors() {
  try {
    const response = await ApiClient.get('/instructors');
    if (response.success) {
      adminInstructors = response.data;
      displayAdminInstructors();
    }
  } catch (error) {
    console.error('Erro ao carregar instrutores:', error);
  }
}

function displayAdminInstructors() {
  const tbody = document.getElementById('instructorsTableBody');
  
  // Mostrar todos os instrutores, independentemente do status
  const filtered = adminInstructors;

  if (!filtered || filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 0.8rem;">Nenhum instrutor cadastrado</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(instructor => {
    const isActive = !instructor.deleted_at;
    return `
      <tr>
        <td>${instructor.matricula}</td>
        <td>${instructor.name}</td>
        <td>${instructor.email}</td>
        <td>${instructor.technical_area || '-'}</td>
        <td>
          <span class="badge ${instructor.role === 'admin' ? 'badge-danger' : 'badge-primary'}">
            ${instructor.role === 'admin' ? 'Administrador' : 'Instrutor'}
          </span>
        </td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-warning'}" style="font-size: 0.6rem; padding: 0.2rem 0.35rem; white-space: nowrap;">
            ${isActive ? '✓ Ativo' : '⊘ Inativo'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="editInstructor('${instructor.id}')">Editar</button>
          <button class="btn btn-sm ${isActive ? 'btn-warning' : 'btn-success'}" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="toggleInstructorStatus('${instructor.id}', ${isActive})">
            ${isActive ? 'Desativar' : 'Ativar'}
          </button>
          <button class="btn btn-sm btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="deleteInstructor('${instructor.id}', '${instructor.name}')">Deletar</button>
        </td>
      </tr>
    `;
  }).join('');
}


function filterInstructors(searchTerm) {
  // Aplicar filtro de busca em todos os instrutores (ativo ou inativo)
  const filtered = adminInstructors.filter(instructor =>
    instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tbody = document.getElementById('instructorsTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 0.8rem;">Nenhum instrutor encontrado</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(instructor => {
    const isActive = !instructor.deleted_at;
    return `
      <tr>
        <td>${instructor.matricula}</td>
        <td>${instructor.name}</td>
        <td>${instructor.email}</td>
        <td>${instructor.technical_area || '-'}</td>
        <td>
          <span class="badge ${instructor.role === 'admin' ? 'badge-danger' : 'badge-primary'}">
            ${instructor.role === 'admin' ? 'Administrador' : 'Instrutor'}
          </span>
        </td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-warning'}" style="font-size: 0.6rem; padding: 0.2rem 0.35rem; white-space: nowrap;">
            ${isActive ? '✓ Ativo' : '⊘ Inativo'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="editInstructor('${instructor.id}')">Editar</button>
          <button class="btn btn-sm ${isActive ? 'btn-warning' : 'btn-success'}" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="toggleInstructorStatus('${instructor.id}', ${isActive})">
            ${isActive ? 'Desativar' : 'Ativar'}
          </button>
          <button class="btn btn-sm btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="deleteInstructor('${instructor.id}', '${instructor.name}')">Deletar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function resetInstructorForm() {
  document.getElementById('instructorForm').reset();
  document.getElementById('instructorRole').value = 'instructor';
  document.getElementById('instructorModalTitle').textContent = 'Novo Instrutor';
}

function editInstructor(instructorId) {
  const instructor = adminInstructors.find(i => i.id === instructorId);
  if (!instructor) return;

  editingInstructorId = instructorId;

  document.getElementById('instructorMatricula').value = instructor.matricula;
  document.getElementById('instructorMatricula').disabled = true;
  document.getElementById('instructorName').value = instructor.name;
  document.getElementById('instructorEmail').value = instructor.email;
  document.getElementById('instructorPassword').value = '';
  document.getElementById('instructorPassword').placeholder = 'Deixe em branco para não alterar';
  document.getElementById('instructorTechnicalArea').value = instructor.technical_area || '';
  document.getElementById('instructorRole').value = instructor.role || 'instructor';

  document.getElementById('instructorModalTitle').textContent = 'Editar Instrutor';
  openModal('instructorModal');
}

async function handleInstructorFormSubmit(e) {
  e.preventDefault();

  const password = document.getElementById('instructorPassword').value;
  
  // Validar se é novo instrutor (obrigatório senha)
  if (!editingInstructorId && !password) {
    showAlert('instructorAlert', 'Erro: Senha é obrigatória para novo instrutor', 'danger');
    return;
  }

  const formData = {
    name: document.getElementById('instructorName').value,
    email: document.getElementById('instructorEmail').value,
    technicalArea: document.getElementById('instructorTechnicalArea').value,
    role: document.getElementById('instructorRole').value
  };

  if (password) {
    formData.password = password;
  }

  try {
    let response;

    if (editingInstructorId) {
      response = await ApiClient.put(`/instructors/${editingInstructorId}`, formData);
    } else {
      formData.matricula = document.getElementById('instructorMatricula').value;
      formData.password = password || document.getElementById('instructorPassword').value;
      response = await ApiClient.post('/instructors', formData);
    }

    if (response.success) {
      showAlert('instructorAlert', '✓ Instrutor salvo com sucesso!', 'success');
      setTimeout(() => {
        closeModal('instructorModal');
        document.getElementById('instructorMatricula').disabled = false;
        loadAdminInstructors();
      }, 1000);
    }
  } catch (error) {
    showAlert('instructorAlert', `Erro: ${error.message}`, 'danger');
  }
}

async function deleteInstructor(instructorId, instructorName) {
  if (!confirm(`Tem certeza que deseja deletar o instrutor ${instructorName}?`)) return;

  try {
    const response = await ApiClient.delete(`/instructors/${instructorId}`);

    if (response.success) {
      showAlert('instructorAlert', '✓ Instrutor deletado com sucesso!', 'success');
      loadAdminInstructors();
    }
  } catch (error) {
    showAlert('instructorAlert', `Erro: ${error.message}`, 'danger');
  }
}

async function toggleInstructorStatus(instructorId, isCurrentlyActive) {
  try {
    const response = await ApiClient.put(`/instructors/${instructorId}/toggle-status`, {
      shouldDeactivate: isCurrentlyActive
    });

    if (response.success) {
      const action = isCurrentlyActive ? 'desativado' : 'ativado';
      showAlert('instructorAlert', `✓ Instrutor ${action} com sucesso!`, 'success');
      loadAdminInstructors();
    }
  } catch (error) {
    showAlert('instructorAlert', `Erro: ${error.message}`, 'danger');
  }
}

// History Management
async function loadAdminHistory() {
  try {
    const response = await ApiClient.get('/history');
    if (response.success) {
      adminHistory = response.data;
      displayAdminHistory();

      // Populate filter (limpar opções anteriores e adicionar as novas)
      const filterSelect = document.getElementById('historyFilter');
      
      // Remover todas as opções exceto a primeira (padrão)
      while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
      }
      
      // Adicionar novas opções
      const keys = [...new Set(adminHistory.map(h => h.keys?.environment).filter(Boolean))];
      keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        filterSelect.appendChild(option);
      });

      // Remover event listener anterior (se existir) para evitar duplicatas
      const oldListener = filterSelect._changeListener;
      if (oldListener) {
        filterSelect.removeEventListener('change', oldListener);
      }

      // Adicionar novo event listener
      const newListener = (e) => {
        if (e.target.value) {
          const filtered = adminHistory.filter(h => h.keys?.environment === e.target.value);
          displayHistoryTable(filtered);
        } else {
          displayAdminHistory();
        }
      };
      
      filterSelect._changeListener = newListener;
      filterSelect.addEventListener('change', newListener);
    }
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
  }
}

function displayAdminHistory() {
  displayHistoryTable(adminHistory);
}

function displayHistoryTable(history) {
  const tbody = document.getElementById('historyTableBody');

  console.log('🔍 DEBUG displayHistoryTable:', {
    dataLength: history?.length,
    firstRecord: history?.[0],
    formatterAvailable: typeof TimezoneFormatter !== 'undefined',
    formatDateTimeAvailable: typeof formatDateTime !== 'undefined'
  });

  if (!history || history.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 0.8rem;">Nenhum registro encontrado</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = history.map((h, idx) => {
    console.log(`📝 Linha ${idx}:`, {
      environment: h.keys?.environment,
      instructor: h.instructors?.name,
      withdrawn_at: h.withdrawn_at,
      returned_at: h.returned_at,
      formatted_withdrawn: formatDateTime(h.withdrawn_at),
      status: h.status,
      observation: h.observation
    });
    
    const observationText = h.observation ? h.observation : '-';
    
    return `
    <tr>
      <td><strong>${h.keys?.environment}</strong></td>
      <td>${h.instructors?.name}</td>
      <td>${formatDateTime(h.withdrawn_at)}</td>
      <td>${h.returned_at ? formatDateTime(h.returned_at) : '-'}</td>
      <td>
        <span class="badge ${h.status === 'returned' ? 'badge-success' : 'badge-warning'}">
          ${h.status === 'returned' ? 'Devolvida' : 'Em Uso'}
        </span>
      </td>
      <td title="${h.observation || 'Sem observação'}">${observationText}</td>
    </tr>
  `;
  }).join('');
}

// Refresh data periodically
setInterval(() => {
  console.log('🔄 Atualizando painel admin...');
  loadDashboardData();
}, 15000); // A cada 15 segundos
