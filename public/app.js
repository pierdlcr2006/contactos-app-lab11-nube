const state = {
  token: localStorage.getItem('token'),
  user: null,
  contacts: [],
};

const $ = (selector) => document.querySelector(selector);

const elements = {
  loginView: $('#loginView'),
  dashboard: $('#dashboard'),
  loginForm: $('#loginForm'),
  loginMessage: $('#loginMessage'),
  userLabel: $('#userLabel'),
  logoutButton: $('#logoutButton'),
  contactForm: $('#contactForm'),
  formTitle: $('#formTitle'),
  formMessage: $('#formMessage'),
  saveButton: $('#saveButton'),
  cancelEditButton: $('#cancelEditButton'),
  contactsBody: $('#contactsBody'),
  emptyState: $('#emptyState'),
  countLabel: $('#countLabel'),
  searchInput: $('#searchInput'),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? 'Ocurrio un error inesperado');
  }

  return data;
}

function setMessage(element, text, ok = false) {
  element.textContent = text;
  element.classList.toggle('ok', ok);
}

function showDashboard() {
  elements.loginView.classList.add('hidden');
  elements.dashboard.classList.remove('hidden');
  elements.userLabel.textContent = state.user?.name ?? 'Admin';
}

function showLogin() {
  elements.dashboard.classList.add('hidden');
  elements.loginView.classList.remove('hidden');
}

async function login(event) {
  event.preventDefault();
  setMessage(elements.loginMessage, '');
  const form = new FormData(elements.loginForm);

  try {
    const result = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
      }),
    });
    state.token = result.accessToken;
    state.user = result.user;
    localStorage.setItem('token', state.token);
    showDashboard();
    await loadContacts();
  } catch (error) {
    setMessage(elements.loginMessage, error.message);
  }
}

async function loadMe() {
  if (!state.token) {
    showLogin();
    return;
  }

  try {
    state.user = await api('/api/auth/me');
    showDashboard();
    await loadContacts();
  } catch {
    logout();
  }
}

async function loadContacts() {
  const search = elements.searchInput.value.trim();
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  state.contacts = await api(`/api/contacts${params}`);
  renderContacts();
}

function renderContacts() {
  elements.contactsBody.innerHTML = '';
  elements.emptyState.classList.toggle('hidden', state.contacts.length > 0);
  elements.countLabel.textContent = `${state.contacts.length} registrado${
    state.contacts.length === 1 ? '' : 's'
  }`;

  for (const contact of state.contacts) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHtml(contact.firstName)} ${escapeHtml(contact.lastName)}</strong><span>${escapeHtml(contact.notes ?? '')}</span></td>
      <td>${escapeHtml(contact.email)}</td>
      <td>${escapeHtml(contact.phone)}</td>
      <td>${escapeHtml(contact.company ?? '-')}</td>
      <td>
        <div class="row-actions">
          <button type="button" data-action="edit" data-id="${contact.id}">Editar</button>
          <button type="button" class="delete" data-action="delete" data-id="${contact.id}">Eliminar</button>
        </div>
      </td>
    `;
    elements.contactsBody.appendChild(row);
  }
}

async function saveContact(event) {
  event.preventDefault();
  setMessage(elements.formMessage, '');
  const id = $('#contactId').value;
  const payload = {
    firstName: $('#firstName').value,
    lastName: $('#lastName').value,
    email: $('#email').value,
    phone: $('#phone').value,
    company: $('#company').value,
    notes: $('#notes').value,
  };

  try {
    await api(id ? `/api/contacts/${id}` : '/api/contacts', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    });
    resetForm();
    setMessage(elements.formMessage, 'Contacto guardado.', true);
    await loadContacts();
  } catch (error) {
    setMessage(elements.formMessage, error.message);
  }
}

function editContact(id) {
  const contact = state.contacts.find((item) => item.id === id);
  if (!contact) return;

  $('#contactId').value = contact.id;
  $('#firstName').value = contact.firstName;
  $('#lastName').value = contact.lastName;
  $('#email').value = contact.email;
  $('#phone').value = contact.phone;
  $('#company').value = contact.company ?? '';
  $('#notes').value = contact.notes ?? '';
  elements.formTitle.textContent = 'Editar contacto';
  elements.saveButton.textContent = 'Actualizar contacto';
  elements.cancelEditButton.classList.remove('hidden');
}

async function deleteContact(id) {
  const contact = state.contacts.find((item) => item.id === id);
  if (!confirm(`Eliminar a ${contact?.firstName ?? 'este contacto'}?`)) {
    return;
  }

  await api(`/api/contacts/${id}`, { method: 'DELETE' });
  await loadContacts();
}

function resetForm() {
  elements.contactForm.reset();
  $('#contactId').value = '';
  elements.formTitle.textContent = 'Nuevo contacto';
  elements.saveButton.textContent = 'Guardar contacto';
  elements.cancelEditButton.classList.add('hidden');
}

function logout() {
  localStorage.removeItem('token');
  state.token = null;
  state.user = null;
  state.contacts = [];
  showLogin();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

elements.loginForm.addEventListener('submit', login);
elements.contactForm.addEventListener('submit', saveContact);
elements.cancelEditButton.addEventListener('click', () => {
  resetForm();
  setMessage(elements.formMessage, '');
});
elements.logoutButton.addEventListener('click', logout);
elements.searchInput.addEventListener('input', () => {
  window.clearTimeout(elements.searchInput.searchTimer);
  elements.searchInput.searchTimer = window.setTimeout(loadContacts, 250);
});
elements.contactsBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  if (button.dataset.action === 'edit') {
    editContact(button.dataset.id);
  }

  if (button.dataset.action === 'delete') {
    await deleteContact(button.dataset.id);
  }
});

loadMe();
