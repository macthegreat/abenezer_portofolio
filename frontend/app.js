const state = {
  apiBaseUrl: localStorage.getItem('nid_api_base_url') || 'http://localhost:4000',
  token: localStorage.getItem('nid_token') || '',
  user: JSON.parse(localStorage.getItem('nid_user') || 'null')
};

const el = {
  apiBaseUrl: document.getElementById('apiBaseUrl'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  loginBtn: document.getElementById('loginBtn'),
  registerName: document.getElementById('registerName'),
  registerEmail: document.getElementById('registerEmail'),
  registerPassword: document.getElementById('registerPassword'),
  registerBtn: document.getElementById('registerBtn'),
  authCard: document.getElementById('authCard'),
  dashboardCard: document.getElementById('dashboardCard'),
  dashboardTitle: document.getElementById('dashboardTitle'),
  dashboardBody: document.getElementById('dashboardBody'),
  roleBadge: document.getElementById('roleBadge'),
  logoutBtn: document.getElementById('logoutBtn'),
  output: document.getElementById('output')
};

function log(data, label = 'Response') {
  const prefix = `[${new Date().toLocaleTimeString()}] ${label}`;
  el.output.textContent = `${prefix}\n${JSON.stringify(data, null, 2)}\n\n${el.output.textContent}`;
}

function persistSession() {
  localStorage.setItem('nid_api_base_url', state.apiBaseUrl);
  if (state.token) {
    localStorage.setItem('nid_token', state.token);
    localStorage.setItem('nid_user', JSON.stringify(state.user));
  } else {
    localStorage.removeItem('nid_token');
    localStorage.removeItem('nid_user');
  }
}

async function api(path, method = 'GET', body) {
  const url = `${state.apiBaseUrl.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

function makeInput(label, id, type = 'text', placeholder = '') {
  return `<div><label>${label}</label><input id="${id}" type="${type}" placeholder="${placeholder}" /></div>`;
}

function renderSupervisor() {
  el.dashboardBody.innerHTML = `
    <div class="block">
      <h3>Create officer</h3>
      <div class="grid three">
        ${makeInput('Name', 'officerName', 'text', 'Officer Name')}
        ${makeInput('Email', 'officerEmail', 'email', 'officer@email.com')}
        ${makeInput('Password', 'officerPassword', 'password', 'StrongPass123')}
      </div>
      <button id="createOfficerBtn">Create officer</button>
    </div>

    <div class="block">
      <h3>Create agent</h3>
      <div class="grid three">
        ${makeInput('Name', 'agentName', 'text', 'Agent Name')}
        ${makeInput('Email', 'agentEmail', 'email', 'agent@email.com')}
        ${makeInput('Password', 'agentPassword', 'password', 'StrongPass123')}
        ${makeInput('Commission per person', 'agentCommission', 'number', '50')}
      </div>
      <button id="createAgentBtn">Create agent</button>
    </div>

    <div class="block">
      <h3>Update agent commission</h3>
      <div class="grid two">
        ${makeInput('Agent ID', 'updateAgentId', 'number', '1')}
        ${makeInput('Commission per person', 'updateCommission', 'number', '75')}
      </div>
      <button id="updateCommissionBtn">Update commission</button>
    </div>

    <div class="block">
      <h3>Supervisor reports</h3>
      <button id="supervisorReportBtn" class="secondary">Load reports</button>
    </div>
  `;

  document.getElementById('createOfficerBtn').onclick = async () => {
    try {
      const data = await api('/supervisor/create-officer', 'POST', {
        name: document.getElementById('officerName').value,
        email: document.getElementById('officerEmail').value,
        password: document.getElementById('officerPassword').value
      });
      log(data, 'Officer created');
    } catch (error) { log({ message: error.message }, 'Error'); }
  };

  document.getElementById('createAgentBtn').onclick = async () => {
    try {
      const data = await api('/supervisor/create-agent', 'POST', {
        name: document.getElementById('agentName').value,
        email: document.getElementById('agentEmail').value,
        password: document.getElementById('agentPassword').value,
        commissionPerPerson: Number(document.getElementById('agentCommission').value)
      });
      log(data, 'Agent created');
    } catch (error) { log({ message: error.message }, 'Error'); }
  };

  document.getElementById('updateCommissionBtn').onclick = async () => {
    try {
      const agentId = document.getElementById('updateAgentId').value;
      const data = await api(`/supervisor/agent/${agentId}/commission`, 'PATCH', {
        commissionPerPerson: Number(document.getElementById('updateCommission').value)
      });
      log(data, 'Commission updated');
    } catch (error) { log({ message: error.message }, 'Error'); }
  };

  document.getElementById('supervisorReportBtn').onclick = async () => {
    try {
      log(await api('/supervisor/reports'), 'Supervisor reports');
    } catch (error) { log({ message: error.message }, 'Error'); }
  };
}

function renderOfficer() {
  el.dashboardBody.innerHTML = `
    <div class="block">
      <h3>Register user</h3>
      <div class="grid three">
        ${makeInput('Full name', 'regName', 'text', 'Customer Name')}
        ${makeInput('IDNO / FIN', 'regIdno', 'text', 'FIN1234')}
        ${makeInput('Amount', 'regAmount', 'number', '1000')}
      </div>
      <button id="registerUserBtn">Submit registration</button>
    </div>

    <div class="block">
      <h3>My reports</h3>
      <div class="grid three">
        <button id="officerDailyBtn" class="secondary">Daily</button>
        <button id="officerWeeklyBtn" class="secondary">Weekly</button>
        <button id="officerMonthlyBtn" class="secondary">Monthly</button>
      </div>
    </div>
  `;

  document.getElementById('registerUserBtn').onclick = async () => {
    try {
      const data = await api('/officer/register-user', 'POST', {
        fullName: document.getElementById('regName').value,
        idno: document.getElementById('regIdno').value,
        amount: Number(document.getElementById('regAmount').value)
      });
      log(data, 'Registration created');
    } catch (error) { log({ message: error.message }, 'Error'); }
  };

  ['daily', 'weekly', 'monthly'].forEach((w) => {
    document.getElementById(`officer${w[0].toUpperCase()}${w.slice(1)}Btn`).onclick = async () => {
      try { log(await api(`/officer/report/${w}`), `Officer ${w} report`); }
      catch (error) { log({ message: error.message }, 'Error'); }
    };
  });
}

function renderAgent() {
  el.dashboardBody.innerHTML = `
    <div class="block">
      <h3>Submit potential client</h3>
      <div class="grid two">
        ${makeInput('Full name', 'leadName', 'text', 'Client Name')}
        ${makeInput('IDNO / FIN', 'leadIdno', 'text', 'FIN1234')}
      </div>
      <button id="submitLeadBtn">Submit lead</button>
    </div>

    <div class="block">
      <h3>Matches & commission</h3>
      <div class="grid three">
        <button id="agentMatchesBtn" class="secondary">View matches</button>
        <button id="agentDailyBtn" class="secondary">Daily commission</button>
        <button id="agentWeeklyBtn" class="secondary">Weekly commission</button>
        <button id="agentMonthlyBtn" class="secondary">Monthly commission</button>
      </div>
    </div>
  `;

  document.getElementById('submitLeadBtn').onclick = async () => {
    try {
      const data = await api('/agent/submit-person', 'POST', {
        fullName: document.getElementById('leadName').value,
        idno: document.getElementById('leadIdno').value
      });
      log(data, 'Lead submitted');
    } catch (error) { log({ message: error.message }, 'Error'); }
  };

  document.getElementById('agentMatchesBtn').onclick = async () => {
    try { log(await api('/agent/matches'), 'Agent matches'); }
    catch (error) { log({ message: error.message }, 'Error'); }
  };

  ['daily', 'weekly', 'monthly'].forEach((w) => {
    document.getElementById(`agent${w[0].toUpperCase()}${w.slice(1)}Btn`).onclick = async () => {
      try { log(await api(`/agent/commission/${w}`), `Agent ${w} commission`); }
      catch (error) { log({ message: error.message }, 'Error'); }
    };
  });
}

function renderDashboard() {
  if (!state.user) {
    el.authCard.classList.remove('hidden');
    el.dashboardCard.classList.add('hidden');
    return;
  }

  el.authCard.classList.add('hidden');
  el.dashboardCard.classList.remove('hidden');
  el.dashboardTitle.textContent = `${state.user.name} dashboard`;
  el.roleBadge.textContent = state.user.role;

  if (state.user.role === 'supervisor') return renderSupervisor();
  if (state.user.role === 'officer') return renderOfficer();
  if (state.user.role === 'agent') return renderAgent();

  el.dashboardBody.innerHTML = '<p>Unknown role.</p>';
}

el.apiBaseUrl.value = state.apiBaseUrl;
el.apiBaseUrl.addEventListener('change', () => {
  state.apiBaseUrl = el.apiBaseUrl.value.trim();
  persistSession();
});

el.loginBtn.onclick = async () => {
  try {
    state.apiBaseUrl = el.apiBaseUrl.value.trim();
    const data = await api('/auth/login', 'POST', {
      email: el.loginEmail.value,
      password: el.loginPassword.value
    });
    state.token = data.token;
    state.user = data.user;
    persistSession();
    log(data, 'Logged in');
    renderDashboard();
  } catch (error) {
    log({ message: error.message }, 'Login failed');
  }
};

el.registerBtn.onclick = async () => {
  try {
    state.apiBaseUrl = el.apiBaseUrl.value.trim();
    const data = await api('/auth/register', 'POST', {
      name: el.registerName.value,
      email: el.registerEmail.value,
      password: el.registerPassword.value
    });
    log(data, 'Supervisor created');
  } catch (error) {
    log({ message: error.message }, 'Bootstrap failed');
  }
};

el.logoutBtn.onclick = () => {
  state.token = '';
  state.user = null;
  persistSession();
  renderDashboard();
  log({ message: 'Logged out.' }, 'Session');
};

renderDashboard();
