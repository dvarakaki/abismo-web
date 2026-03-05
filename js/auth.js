/**
 * ABISMO — auth.js
 * JavaScript dedicado para login.html e register.html
 */

'use strict';

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ================================================================
   SHOW / HIDE FIELD ERROR
   ================================================================ */
const showError = (fieldId, message) => {
  const el = qs(`#${fieldId}-error`);
  const input = qs(`#${fieldId}`);
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  input?.classList.add('is-invalid');
  input?.classList.remove('is-valid');
};

const clearError = (fieldId) => {
  const el = qs(`#${fieldId}-error`);
  const input = qs(`#${fieldId}`);
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
  input?.classList.remove('is-invalid');
};

const markValid = (fieldId) => {
  const input = qs(`#${fieldId}`);
  clearError(fieldId);
  input?.classList.add('is-valid');
};

/* ================================================================
   PASSWORD TOGGLE (show / hide)
   ================================================================ */
const initPasswordToggles = () => {
  qsa('.field-toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap  = btn.closest('.field-input-wrap');
      const input = wrap.querySelector('.field-input');
      const icon  = btn.querySelector('i');
      if (!input) return;

      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      icon.className = isHidden ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
  });
};

/* ================================================================
   PASSWORD STRENGTH METER
   ================================================================ */
const scorePassword = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];

const initPasswordStrength = () => {
  const input  = qs('#reg-password');
  const wrap   = qs('#pw-strength');
  const fill   = qs('#pw-strength-fill');
  const label  = qs('#pw-strength-label');
  if (!input || !wrap) return;

  input.addEventListener('input', () => {
    const score = scorePassword(input.value);
    wrap.classList.toggle('active', input.value.length > 0);
    fill.setAttribute('data-strength', score);
    label.textContent = STRENGTH_LABELS[score] || '';
  });
};

/* ================================================================
   USERNAME AVAILABILITY CHECK (debounced)
   ================================================================ */
const initUsernameCheck = () => {
  const input  = qs('#username');
  const status = qs('#username-status');
  if (!input || !status) return;

  let timer;

  input.addEventListener('input', () => {
    clearTimeout(timer);
    clearError('username');

    const val = input.value.trim();
    if (val.length < 3) {
      status.textContent = '';
      status.className = 'field-status';
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      showError('username', 'Use apenas letras, números e _');
      return;
    }

    status.textContent = '...';
    status.className = 'field-status checking';

    timer = setTimeout(async () => {
      /* ---- Substitua pela chamada real ao seu servlet: ----
         const res  = await fetch(`/api/check-username?u=${encodeURIComponent(val)}`);
         const data = await res.json();
         const free = data.available;
      -------------------------------------------------------- */

      /* Simulação local */
      const taken = ['admin', 'abismo', 'terror', 'root'].includes(val.toLowerCase());
      const free  = !taken;

      if (free) {
        status.textContent = '✓';
        status.className = 'field-status available';
        markValid('username');
      } else {
        status.textContent = '✗';
        status.className = 'field-status taken';
        showError('username', 'Este nome de usuário já está em uso');
      }
    }, 600);
  });
};

/* ================================================================
   REAL-TIME FIELD VALIDATION
   ================================================================ */
const validators = {
  email: (val) => {
    if (!val) return 'O e-mail é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'E-mail inválido';
    return null;
  },
  'reg-email': (val) => {
    if (!val) return 'O e-mail é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'E-mail inválido';
    return null;
  },
  password: (val) => {
    if (!val) return 'A senha é obrigatória';
    if (val.length < 6) return 'Mínimo de 6 caracteres';
    return null;
  },
  'reg-password': (val) => {
    if (!val) return 'A senha é obrigatória';
    if (val.length < 8) return 'Mínimo de 8 caracteres';
    return null;
  },
  'confirm-password': (val) => {
    const pw = qs('#reg-password')?.value;
    if (!val) return 'Confirme sua senha';
    if (val !== pw) return 'As senhas não coincidem';
    return null;
  },
  firstName: (val) => {
    if (!val || val.trim().length < 2) return 'Nome muito curto';
    return null;
  },
  lastName: (val) => {
    if (!val || val.trim().length < 2) return 'Sobrenome muito curto';
    return null;
  },
  username: (val) => {
    if (!val || val.trim().length < 3) return 'Mínimo de 3 caracteres';
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Somente letras, números e _';
    return null;
  },
};

const initLiveValidation = () => {
  Object.keys(validators).forEach(fieldId => {
    const input = qs(`#${fieldId}`);
    if (!input) return;

    input.addEventListener('blur', () => {
      const err = validators[fieldId](input.value);
      if (err) showError(fieldId, err);
      else markValid(fieldId);
    });

    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) {
        const err = validators[fieldId](input.value);
        if (!err) markValid(fieldId);
      }
    });
  });
};

/* ================================================================
   LOGIN FORM SUBMISSION
   ================================================================ */
const initLoginForm = () => {
  const form   = qs('#login-form');
  const submit = qs('#login-submit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailVal = qs('#email')?.value.trim();
    const pwVal    = qs('#password')?.value;
    let valid = true;

    const emailErr = validators.email(emailVal);
    if (emailErr) { showError('email', emailErr); valid = false; }
    else markValid('email');

    const pwErr = validators.password(pwVal);
    if (pwErr) { showError('password', pwErr); valid = false; }
    else markValid('password');

    if (!valid) return;

    /* Loading state */
    submit.classList.add('loading');
    submit.disabled = true;

    /* ------ Substitua pela chamada real: ------
       try {
         const res = await fetch('/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
           body: new URLSearchParams({ email: emailVal, password: pwVal })
         });
         if (res.redirected) { window.location.href = res.url; return; }
         const data = await res.json();
         if (!data.success) showServerError(data.message);
       } catch { showServerError('Erro de conexão. Tente novamente.'); }
       finally { submit.classList.remove('loading'); submit.disabled = false; }
    -------------------------------------------- */

    /* Simulação */
    await new Promise(r => setTimeout(r, 1500));
    submit.classList.remove('loading');
    submit.disabled = false;
    showServerError('Credenciais inválidas. Verifique seu e-mail e senha.');
  });
};

/* ================================================================
   REGISTER FORM SUBMISSION
   ================================================================ */
const initRegisterForm = () => {
  const form   = qs('#register-form');
  const submit = qs('#register-submit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fields = ['firstName','lastName','username','reg-email','reg-password','confirm-password'];
    let valid = true;

    fields.forEach(id => {
      const input = qs(`#${id}`);
      if (!input) return;
      const err = validators[id]?.(input.value);
      if (err) { showError(id, err); valid = false; }
      else markValid(id);
    });

    const terms = qs('#terms');
    if (!terms?.checked) {
      showError('terms', 'Você precisa aceitar os termos');
      valid = false;
    } else { clearError('terms'); }

    if (!valid) {
      const firstErr = qs('.is-invalid');
      firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submit.classList.add('loading');
    submit.disabled = true;

    /* ------ Substitua pela chamada real: ------
       try {
         const formData = new FormData(form);
         const res = await fetch('/register', { method: 'POST', body: formData });
         if (res.redirected) { window.location.href = res.url; return; }
         const data = await res.json();
         if (!data.success) showServerError(data.message);
       } catch { showServerError('Erro de conexão. Tente novamente.'); }
       finally { submit.classList.remove('loading'); submit.disabled = false; }
    -------------------------------------------- */

    await new Promise(r => setTimeout(r, 1500));
    submit.classList.remove('loading');
    submit.disabled = false;
    showServerError('Este e-mail já está cadastrado.');
  });
};

/* ================================================================
   SHOW SERVER ERROR
   ================================================================ */
const showServerError = (message) => {
  const el = qs('#server-error');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => el.classList.remove('visible'), 6000);
};

/* ================================================================
   SOCIAL BUTTONS — Loading feedback
   ================================================================ */
const initSocialBtns = () => {
  qsa('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.opacity = '0.6';
      btn.style.pointerEvents = 'none';
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Redirecionando...</span>';
      /* Restore on timeout (in real app, redirect happens) */
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }, 3000);
    });
  });
};

/* ================================================================
   ENTRANCE STAGGER ANIMATION
   ================================================================ */
const initAuthEntrance = () => {
  const groups = qsa('.field-group, .social-login, .auth-divider, .field-row, .btn-full, .auth-switch');
  groups.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = `opacity 0.45s ease ${i * 0.05 + 0.2}s, transform 0.45s cubic-bezier(0.16,1,0.3,1) ${i * 0.05 + 0.2}s`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
    }));
  });
};

/* ================================================================
   INIT
   ================================================================ */
const initAuth = () => {
  initPasswordToggles();
  initPasswordStrength();
  initUsernameCheck();
  initLiveValidation();
  initLoginForm();
  initRegisterForm();
  initSocialBtns();
  initAuthEntrance();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}