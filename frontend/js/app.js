// API Configuration
const API_BASE_URL = '/api';

// Auth Management
class AuthManager {
  static setToken(token) {
    localStorage.setItem('auth_token', token);
  }

  static getToken() {
    return localStorage.getItem('auth_token');
  }

  static getUserData() {
    const user = localStorage.getItem('user_data');
    return user ? JSON.parse(user) : null;
  }

  static setUserData(user) {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  static getRole() {
    const user = this.getUserData();
    return user?.role || null;
  }

  static isLoggedIn() {
    return !!this.getToken();
  }

  static logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
}

// API Helper
class ApiClient {
  static async request(endpoint, options = {}) {
    const token = AuthManager.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  static post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Utilidade para exibir alertas
function showAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <div style="flex: 1;">${message}</div>
    <button style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.25rem; padding: 0;" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.innerHTML = '';
  container.appendChild(alert);
}

function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

// Formatar data e hora em timezone de Brasília
function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    if (typeof TimezoneFormatter === 'undefined') {
      console.warn('⚠️  TimezoneFormatter não está disponível, usando toLocaleString');
      return new Date(dateString).toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo'
      });
    }
    const date = new Date(dateString);
    return TimezoneFormatter.formatDateTime(date);
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Input:', dateString);
    return dateString ? '⚠️ Erro' : '-';
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return TimezoneFormatter.formatDate(date);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '-';
  }
}

function formatTime(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return TimezoneFormatter.formatTime(date);
  } catch (error) {
    console.error('Erro ao formatar hora:', error);
    return '-';
  }
}

// Verificar autenticação e redirecionar para login se necessário
function checkAuth(requiredRole = null) {
  if (!AuthManager.isLoggedIn()) {
    window.location.href = '/';
    return false;
  }

  if (requiredRole && AuthManager.getRole() !== requiredRole) {
    window.location.href = '/';
    return false;
  }

  return true;
}

// Login Forms
document.addEventListener('DOMContentLoaded', () => {
  // Verificar se estamos na página de login
  if (window.location.pathname === '/' || window.location.pathname.includes('login')) {
    setupLoginPage();
  }
});

function setupLoginPage() {
  const tabButtons = document.querySelectorAll('.login-tab');
  const forms = document.querySelectorAll('.login-form');

  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`${tab}Form`).classList.add('active');
    });
  });

  // Instructor Login
  const instructorForm = document.getElementById('instructorForm');
  if (instructorForm) {
    instructorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleInstructorLogin();
    });
  }

  // Admin Login
  const adminForm = document.getElementById('adminForm');
  if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleAdminLogin();
    });
  }
}

async function handleInstructorLogin() {
  const matricula = document.getElementById('instructorMatricula').value;
  const password = document.getElementById('instructorPassword').value;
  const alertContainer = document.getElementById('instructorAlert');
  const button = document.querySelector('#instructorForm button[type="submit"]');
  const spinner = button.querySelector('.loading-spinner');
  const btnText = button.querySelector('.btn-text');

  try {
    button.disabled = true;
    spinner.classList.add('show');
    btnText.textContent = 'Entrando...';

    const response = await ApiClient.post('/auth/login', {
      matricula,
      password
    });

    if (response.success) {
      AuthManager.setToken(response.token);
      AuthManager.setUserData(response.user);  // Usar diretamente a resposta do backend

      // Redirecionar baseado na role retornada pelo backend
      const role = response.user.role || 'instructor';
      if (role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    }
  } catch (error) {
    showAlert('instructorAlert', error.message || 'Erro ao realizar login', 'danger');
  } finally {
    button.disabled = false;
    spinner.classList.remove('show');
    btnText.textContent = 'Entrar';
  }
}

async function handleAdminLogin() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  const alertContainer = document.getElementById('adminAlert');
  const button = document.querySelector('#adminForm button[type="submit"]');
  const spinner = button.querySelector('.loading-spinner');
  const btnText = button.querySelector('.btn-text');

  try {
    button.disabled = true;
    spinner.classList.add('show');
    btnText.textContent = 'Entrando...';

    const response = await ApiClient.post('/auth/admin-login', {
      email,
      password
    });

    if (response.success) {
      AuthManager.setToken(response.token);
      AuthManager.setUserData(response.user);  // Usar diretamente a resposta do backend

      window.location.href = '/admin';
    }
  } catch (error) {
    showAlert('adminAlert', error.message || 'Erro ao realizar login', 'danger');
  } finally {
    button.disabled = false;
    spinner.classList.remove('show');
    btnText.textContent = 'Entrar';
  }
}

// Logout
function logout() {
  AuthManager.logout();
  window.location.href = '/';
}

// Modal Management
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

// Setup modal close buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.dataset.modalClose;
      closeModal(modalId);
    });
  });

  // Close modal when clicking outside
  document.querySelectorAll('.modal, .form-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
});

// Verificar logout buttons
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtns = document.querySelectorAll('#logoutBtn, #adminLogoutBtn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja sair?')) {
        logout();
      }
    });
  });
});
