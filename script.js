/* ================================================================
   Bugema University Alumni Portal — Main Script
   Auth · Flutterwave Payments · Socket.IO · Chat · Real-time feeds
   ================================================================ */

// ── Socket.IO (only if backend is running) ─────────────────────────
let socket = null;
try {
  socket = io(window.API_BASE_URL || '', { reconnectionAttempts: 3 });
} catch (e) { /* running as static file */ }

// ── Auth helpers ───────────────────────────────────────────────────
const Auth = {
  get() { try { return JSON.parse(localStorage.getItem('buUser')); } catch { return null; } },
  set(u)  { localStorage.setItem('buUser', JSON.stringify(u)); },
  clear() { localStorage.removeItem('buUser'); },
  isLoggedIn() { return !!this.get(); }
};

// ── Membership Badge Helper ─────────────────────────────────────────
function membershipBadge(tier) {
  if (!tier) return '';
  const badges = {
    ordinary: '<span class="mem-badge mem-badge-ordinary">🥉 Ordinary</span>',
    silver:   '<span class="mem-badge mem-badge-silver">🥈 Silver</span>',
    gold:     '<span class="mem-badge mem-badge-gold">🏆 Gold</span>'
  };
  return badges[tier.toLowerCase()] || '';
}

// ── Toast helper ───────────────────────────────────────────────────
function showToast(title, body, type = '') {
  let tc = document.querySelector('.toast-container');
  if (!tc) { tc = document.createElement('div'); tc.className = 'toast-container'; document.body.appendChild(tc); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<div class="toast-title">${title}</div><div class="toast-body">${body}</div>`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── In-App Notification System ─────────────────────────────────────
async function checkNotifications() {
  const user = Auth.get();
  if (!user) return;
  try {
    const res = await fetch((window.API_BASE_URL || '') + '/api/notifications', {
      headers: { 'user-id': user.id }
    });
    if (!res.ok) return;
    const { notifications, unreadCount } = await res.json();
    if (!unreadCount || !notifications.length) return;

    // Build notification modal
    const existing = document.getElementById('notif-modal');
    if (existing) existing.remove();

    const unread = notifications.filter(n => !n.is_read);
    const modal = document.createElement('div');
    modal.id = 'notif-modal';
    modal.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
      animation:fadeIn 0.25s ease;
    `;

    const notifCards = unread.map(n => {
      const isApproval = n.type === 'approval';
      const iconBg = isApproval
        ? 'linear-gradient(135deg,#0f766e,#0d9488)'
        : 'linear-gradient(135deg,#d97706,#b45309)';
      const icon = isApproval ? '🎉' : '⚠️';
      return `
        <div style="
          background:${isApproval ? '#f0fdf9' : '#fffbeb'};
          border:1px solid ${isApproval ? '#ccfbef' : '#fde68a'};
          border-radius:12px;padding:18px 20px;margin-bottom:12px;
        ">
          <div style="display:flex;align-items:flex-start;gap:14px;">
            <div style="
              width:44px;height:44px;border-radius:50%;flex-shrink:0;
              background:${iconBg};display:flex;align-items:center;
              justify-content:center;font-size:22px;
            ">${icon}</div>
            <div style="flex:1;">
              <div style="font-weight:800;font-size:15px;color:#1e293b;margin-bottom:4px;">${n.title}</div>
              <div style="font-size:13px;color:#475569;line-height:1.6;">${n.message}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:6px;">${new Date(n.created_at).toLocaleString()}</div>
            </div>
          </div>
        </div>`;
    }).join('');

    modal.innerHTML = `
      <div style="
        background:#fff;border-radius:20px;max-width:520px;width:90%;
        box-shadow:0 20px 60px rgba(0,0,0,0.25);animation:popIn 0.3s ease;
        overflow:hidden;
      ">
        <div style="
          background:linear-gradient(135deg,#0d1b3e,#1a3a6e);
          padding:24px 28px;display:flex;align-items:center;gap:14px;
        ">
          <img src="pics/BU%20logo.jpeg" alt="BU" style="height:40px;border-radius:50%;" onerror="this.style.display='none'" />
          <div>
            <div style="color:#f0b429;font-weight:800;font-size:17px;">Bugema University Alumni</div>
            <div style="color:rgba(255,255,255,0.7);font-size:12px;">You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style="padding:24px 28px;max-height:60vh;overflow-y:auto;">
          ${notifCards}
        </div>
        <div style="padding:16px 28px;border-top:1px solid #f1f5f9;display:flex;gap:12px;justify-content:flex-end;">
          ${unread.some(n => n.type === 'approval')
            ? `<a href="index.html" id="notif-go-btn" style="
                background:linear-gradient(135deg,#0f766e,#0b5f58);
                color:#fff;padding:10px 22px;border-radius:8px;
                text-decoration:none;font-weight:700;font-size:14px;
              ">Go to Portal →</a>` : ''}
          <button id="notif-dismiss-btn" style="
            background:#f1f5f9;border:none;padding:10px 22px;
            border-radius:8px;font-weight:600;font-size:14px;
            color:#475569;cursor:pointer;
          ">Dismiss</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    // Mark as read when dismissed
    const dismiss = () => {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.2s';
      setTimeout(() => modal.remove(), 200);
      fetch((window.API_BASE_URL || '') + '/api/notifications/read', {
        method: 'POST',
        headers: { 'user-id': user.id }
      });
    };
    document.getElementById('notif-dismiss-btn').addEventListener('click', dismiss);
    modal.addEventListener('click', e => { if (e.target === modal) dismiss(); });
    const goBtn = document.getElementById('notif-go-btn');
    if (goBtn) goBtn.addEventListener('click', () => {
      fetch((window.API_BASE_URL || '') + '/api/notifications/read', { method:'POST', headers:{'user-id': user.id} });
    });

  } catch(e) { /* silent */ }
}

// ── Format time ────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

// ── Mobile nav ─────────────────────────────────────────────────────
const nav = document.querySelector('.nav');
const menuToggle = document.querySelector('.mobile-menu-toggle');
if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => nav.classList.toggle('is-open'));
}

// ── Scroll animations ──────────────────────────────────────────────
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.card, .wireframe-box').forEach(el => { el.classList.add('fade-in'); obs.observe(el); });
}

// ── Events/News search & filter ────────────────────────────────────
const searchInput = document.getElementById('news-search');
const typeSelect  = document.getElementById('news-type');
const filterItems = document.querySelectorAll('.filter-item');
function applyFilters() {
  if (!filterItems.length || !searchInput || !typeSelect) return;
  const q = searchInput.value.toLowerCase().trim();
  const t = typeSelect.value;
  filterItems.forEach(item => {
    const title = (item.dataset.title || item.textContent).toLowerCase();
    const type  = item.dataset.type || 'all';
    item.style.display = (!q || title.includes(q)) && (t === 'all' || type === t) ? '' : 'none';
  });
}
if (searchInput) { searchInput.addEventListener('input', applyFilters); typeSelect.addEventListener('change', applyFilters); applyFilters(); }

// ── Auth Modal ─────────────────────────────────────────────────────
function injectAuthModal() {
  if (document.getElementById('auth-modal')) return;
  const m = document.createElement('div');
  m.id = 'auth-modal'; m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" id="auth-modal-close">&times;</button>
      <h3>Welcome to BU Alumni</h3>
      <div class="modal-tabs">
        <button class="modal-tab active" data-tab="login">Sign In</button>
        <button class="modal-tab" data-tab="register">Register</button>
      </div>
      <div id="auth-error" class="auth-error"></div>
      <!-- Login form -->
      <form class="auth-form" id="login-form">
        <input type="email" id="login-email" placeholder="Email address" required />
        <input type="password" id="login-password" placeholder="Password" required />
        <button type="submit" class="auth-submit">Sign In</button>
      </form>
      <!-- Register form -->
      <form class="auth-form" id="register-form" style="display:none">
        <input type="text" id="reg-name" placeholder="Full name" required />
        <input type="email" id="reg-email" placeholder="Email address" required />
        <input type="password" id="reg-password" placeholder="Password (min 6 chars)" required minlength="6" />
        <select id="reg-role" required>
          <option value="">I am a...</option>
          <option value="alumni">Alumni</option>
          <option value="student">Student</option>
        </select>

        <div id="alumni-membership-section" style="display:none; margin-top: 10px;">
          <select id="reg-membership">
            <option value="">Select Membership Tier...</option>
            <option value="ordinary">Ordinary - 50,000 UGX</option>
            <option value="silver">Silver - 200,000 UGX</option>
            <option value="gold">Gold - 500,000 UGX</option>
          </select>
          <div id="payment-instructions" style="display:none; margin-top: 10px; font-size: 13px; color: var(--muted); background: var(--surface); padding: 10px; border-radius: 8px;">
            Please send <strong id="pay-amount"></strong> UGX via Mobile Money to <strong style="color:var(--brand)">0763682699</strong> (Admin).
            <br/><br/>
            <input type="text" id="reg-tx-id" placeholder="Enter Mobile Money Transaction ID" style="margin-bottom: 0;" />
          </div>
        </div>

        <button type="submit" class="auth-submit" style="margin-top: 16px;">Create Account</button>
      </form>
    </div>`;
  document.body.appendChild(m);

  // Tab switching
  m.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      m.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('login-form').style.display   = tab.dataset.tab === 'login' ? '' : 'none';
      document.getElementById('register-form').style.display = tab.dataset.tab === 'register' ? '' : 'none';
      document.getElementById('auth-error').style.display = 'none';
    });
  });

  document.getElementById('auth-modal-close').addEventListener('click', closeAuthModal);
  m.addEventListener('click', e => { if (e.target === m) closeAuthModal(); });

  // Alumni membership logic
  const roleSelect = document.getElementById('reg-role');
  const membershipSection = document.getElementById('alumni-membership-section');
  const membershipSelect = document.getElementById('reg-membership');
  const paymentInstructions = document.getElementById('payment-instructions');
  const payAmount = document.getElementById('pay-amount');
  const txIdInput = document.getElementById('reg-tx-id');

  roleSelect.addEventListener('change', (e) => {
    if (e.target.value === 'alumni') {
      membershipSection.style.display = 'block';
      membershipSelect.setAttribute('required', 'required');
      txIdInput.setAttribute('required', 'required');
    } else {
      membershipSection.style.display = 'none';
      membershipSelect.removeAttribute('required');
      txIdInput.removeAttribute('required');
      membershipSelect.value = '';
      paymentInstructions.style.display = 'none';
      txIdInput.value = '';
    }
  });

  membershipSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      paymentInstructions.style.display = 'block';
      if (e.target.value === 'ordinary') payAmount.textContent = '50,000';
      else if (e.target.value === 'silver') payAmount.textContent = '200,000';
      else if (e.target.value === 'gold') payAmount.textContent = '500,000';
    } else {
      paymentInstructions.style.display = 'none';
      txIdInput.value = '';
    }
  });

  // Login submit
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('auth-error');
    try {
      const res = await fetch((window.API_BASE_URL || '') + '/api/auth/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: document.getElementById('login-email').value, password: document.getElementById('login-password').value })
      });
      const data = await res.json();
      if (!res.ok) { err.textContent = data.error; err.style.display = 'block'; return; }
      Auth.set(data.user);
      // Handle pending approval
      if (data.user.status === 'pending') {
        closeAuthModal();
        showToast('⏳ Pending Approval', 'Your account is awaiting admin approval. You will be notified once approved.', 'warning');
        Auth.clear(); // Don't keep them logged in while pending
        return;
      }
      closeAuthModal();
      showToast('Welcome back!', data.user.name + ' signed in as ' + data.user.role, 'success');
      // Check for approval/denial notifications immediately after login
      setTimeout(() => checkNotifications(), 900);
      setTimeout(() => location.reload(), 800);
    } catch { err.textContent = 'Could not reach server. Is it running?'; err.style.display = 'block'; }
  });

  // Register submit
  document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('auth-error');
    try {
      const payload = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value
      };
      
      if (payload.role === 'alumni') {
        payload.membership_tier = document.getElementById('reg-membership').value;
        payload.tx_id = document.getElementById('reg-tx-id').value;
      }

      const res = await fetch((window.API_BASE_URL || '') + '/api/auth/register', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { err.textContent = data.error; err.style.display = 'block'; return; }
      
      closeAuthModal();
      // All new registrations are pending admin approval
      const roleLabel = data.user.role === 'alumni' ? 'Alumni' : 'Student';
      showToast(
        '⏳ Registration Submitted!',
        `Your ${roleLabel} account is pending admin approval. You will be notified once approved.`,
        'warning'
      );
    } catch { err.textContent = 'Could not reach server. Is it running?'; err.style.display = 'block'; }
  });
}

function openAuthModal(tab = 'login') {
  injectAuthModal();
  const m = document.getElementById('auth-modal');
  m.classList.add('is-open');
  m.querySelectorAll('.modal-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('login-form').style.display    = tab === 'login' ? '' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? '' : 'none';
}
function closeAuthModal() {
  const m = document.getElementById('auth-modal');
  if (m) m.classList.remove('is-open');
}

// ── Feedback Modal ───────────────────────────────────────────────────
function injectFeedbackModal() {
  if (document.getElementById('feedback-modal')) return;
  const m = document.createElement('div');
  m.id = 'feedback-modal'; m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" id="feedback-modal-close">&times;</button>
      <div class="feedback-section" style="margin-top: 0; border-top: none; padding-top: 0;">
        <h3>Rate Your Experience</h3>
        <p class="fb-sub">How would you rate our website and services?</p>
        <div class="star-rating" id="modal-star-rating">
          <input type="radio" id="m-star5" name="m-rating" value="5" />
          <label for="m-star5" title="Excellent">&#9733;</label>
          <input type="radio" id="m-star4" name="m-rating" value="4" />
          <label for="m-star4" title="Good">&#9733;</label>
          <input type="radio" id="m-star3" name="m-rating" value="3" />
          <label for="m-star3" title="Average">&#9733;</label>
          <input type="radio" id="m-star2" name="m-rating" value="2" />
          <label for="m-star2" title="Poor">&#9733;</label>
          <input type="radio" id="m-star1" name="m-rating" value="1" />
          <label for="m-star1" title="Terrible">&#9733;</label>
        </div>
        <div class="rating-label" id="m-rating-label">&nbsp;</div>
        <textarea
          class="feedback-comment"
          id="m-feedback-comment"
          placeholder="Tell us what you liked or how we can improve (optional)..."
        ></textarea>
        <br />
        <button class="feedback-submit" id="m-feedback-submit" type="button">Submit Feedback</button>
        <div class="feedback-thanks" id="m-feedback-thanks">
          &#10084; Thank you for your feedback! Your response helps us improve.
        </div>
      </div>
    </div>`;
  document.body.appendChild(m);

  document.getElementById('feedback-modal-close').addEventListener('click', closeFeedbackModal);
  m.addEventListener('click', e => { if (e.target === m) closeFeedbackModal(); });

  const ratingLabels = { "1": "Terrible", "2": "Poor", "3": "Average", "4": "Good", "5": "Excellent" };
  const stars = m.querySelectorAll("input[name='m-rating']");
  const ratingLabelEl = document.getElementById("m-rating-label");
  stars.forEach(star => {
    star.addEventListener("change", function () {
      ratingLabelEl.textContent = ratingLabels[this.value] + "  (" + this.value + " / 5 stars)";
    });
  });

  document.getElementById("m-feedback-submit").addEventListener("click", function () {
    const selected = m.querySelector("input[name='m-rating']:checked");
    if (!selected) {
      showToast("Rating Required", "Please select a star rating before submitting.", "error");
      return;
    }
    const comment = document.getElementById("m-feedback-comment").value.trim();
    const feedback = {
      rating: selected.value,
      label: ratingLabels[selected.value],
      comment: comment
    };

    const btn = this;
    btn.disabled = true;
    btn.textContent = "Submitting...";

    fetch((window.API_BASE_URL || '') + '/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    }).then(r => r.json()).then(() => {
      // Save locally as well for UI consistency
      feedback.submittedAt = new Date().toLocaleString();
      localStorage.setItem("buLastFeedback", JSON.stringify(feedback));

      document.getElementById("m-feedback-thanks").style.display = "block";
      btn.textContent = "Feedback Submitted";
      showToast("Feedback Received!", "Thank you for your response.", "success");
      
      setTimeout(() => {
        closeFeedbackModal();
        // Reset form
        document.getElementById("m-feedback-thanks").style.display = "none";
        btn.disabled = false;
        btn.textContent = "Submit Feedback";
        stars.forEach(s => s.checked = false);
        ratingLabelEl.innerHTML = "&nbsp;";
        document.getElementById("m-feedback-comment").value = "";
      }, 2000);
    }).catch(err => {
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Submit Feedback";
      showToast("Error", "Could not submit feedback. Try again.", "error");
    });
  });
}

function openFeedbackModal(e) {
  if (e) e.preventDefault();
  injectFeedbackModal();
  document.getElementById('feedback-modal').classList.add('is-open');
}
function closeFeedbackModal() {
  const m = document.getElementById('feedback-modal');
  if (m) m.classList.remove('is-open');
}

// Expose open modal for chat page gate buttons
document.querySelectorAll('.js-open-login').forEach(b => b.addEventListener('click', () => openAuthModal('login')));
document.getElementById('chat-register-btn') && document.getElementById('chat-register-btn').addEventListener('click', () => openAuthModal('register'));

// ── Newsletter Modal ──────────────────────────────────────────────────
function injectNewsletterModal() {
  if (document.getElementById('newsletter-modal')) return;
  const m = document.createElement('div');
  m.id = 'newsletter-modal'; m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-box" style="max-width: 400px; text-align: center;">
      <button class="modal-close" id="newsletter-modal-close">&times;</button>
      <div class="success-icon" style="background: linear-gradient(135deg, #c9a227, #f0b429); width: 60px; height: 60px; margin: 0 auto 16px;">
        <svg viewBox="0 0 24 24" style="stroke: #0d1b3e; width: 30px; height: 30px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
      </div>
      <h3 style="margin-bottom: 8px;">Subscribe to our Newsletter</h3>
      <p style="font-size: 14px; color: var(--muted); margin-bottom: 20px;">Get the latest updates on alumni events, campus news, and exclusive opportunities delivered straight to your inbox.</p>
      
      <form id="newsletter-form" class="auth-form">
        <input type="text" id="nl-name" placeholder="Your Full Name" required style="text-align: center;" />
        <input type="email" id="nl-email" placeholder="Your Email Address" required style="text-align: center;" />
        <button type="submit" class="auth-submit" style="background: #c9a227; color: #0d1b3e;">Subscribe Now</button>
      </form>
      <div id="nl-success-msg" style="display: none; color: #15803d; background: #dcfce7; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 16px;">
        🎉 Thanks for subscribing!
      </div>
    </div>`;
  document.body.appendChild(m);

  document.getElementById('newsletter-modal-close').addEventListener('click', closeNewsletterModal);
  m.addEventListener('click', e => { if (e.target === m) closeNewsletterModal(); });

  document.getElementById('newsletter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = "Subscribing...";
    btn.disabled = true;

    // Simulate API call
    setTimeout(() => {
      e.target.style.display = 'none';
      document.getElementById('nl-success-msg').style.display = 'block';
      showToast('Subscribed!', 'You are now on our mailing list.', 'success');
      
      setTimeout(() => {
        closeNewsletterModal();
        e.target.reset();
        e.target.style.display = 'flex';
        document.getElementById('nl-success-msg').style.display = 'none';
        btn.textContent = "Subscribe Now";
        btn.disabled = false;
      }, 2000);
    }, 800);
  });
}

function openNewsletterModal(e) {
  if (e) e.preventDefault();
  injectNewsletterModal();
  document.getElementById('newsletter-modal').classList.add('is-open');
}
function closeNewsletterModal() {
  const m = document.getElementById('newsletter-modal');
  if (m) m.classList.remove('is-open');
}

// ── Contacts Modal ──────────────────────────────────────────────────
function injectContactsModal() {
  if (document.getElementById('contacts-modal')) return;
  const m = document.createElement('div');
  m.id = 'contacts-modal'; m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-box" style="max-width: 500px;">
      <div class="modal-header">
        <h3>Recent Contacts</h3>
        <button class="modal-close" onclick="closeContactsModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="contact-list">
          <div class="contact-item">
            <h4>WhatsApp</h4>
            <a href="https://wa.me/256702940003" target="_blank" rel="noopener" class="contact-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" style="color:#25D366">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              +256 702 940 003
            </a>
          </div>
          <div class="contact-item">
            <h4>Phone</h4>
            <a href="tel:+256312351400" class="contact-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              +256 312 351 400
            </a>
          </div>
          <div class="contact-item">
            <h4>Email</h4>
            <a href="mailto:alumni@bugemauniversity.ac.ug" class="contact-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              alumni@bugemauniversity.ac.ug
            </a>
          </div>
          <div class="contact-item">
            <h4>Location</h4>
            <div class="contact-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Kampala, Uganda
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(m);
}

function openContactsModal(e) {
  if (e) e.preventDefault();
  injectContactsModal();
  document.getElementById('contacts-modal').classList.add('is-open');
}

function closeContactsModal() {
  const m = document.getElementById('contacts-modal');
  if (m) m.classList.remove('is-open');
}

// Setup global feedback & newsletter links
function setupFooterLinks() {
  document.querySelectorAll('.js-open-feedback').forEach(link => {
    link.addEventListener('click', openFeedbackModal);
  });
  document.querySelectorAll('.js-open-newsletter').forEach(link => {
    link.addEventListener('click', openNewsletterModal);
  });
  document.querySelectorAll('.js-open-contacts').forEach(link => {
    link.addEventListener('click', openContactsModal);
  });
}
document.addEventListener('DOMContentLoaded', setupFooterLinks);

// ── Check for unread notifications on every page load ──────────────
document.addEventListener('DOMContentLoaded', () => {
  // Only check if user is logged in and approved
  const user = Auth.get();
  if (user && user.status === 'approved') {
    // Small delay so the page renders first
    setTimeout(checkNotifications, 600);
  }
});

// ── Render auth bar on activities/opportunities pages ──────────────
function renderAuthBar(container) {
  const user = Auth.get();
  if (!container) return;
  if (!user) {
    container.innerHTML = `<div class="auth-bar" style="justify-content:space-between">
      <span style="color:#c9a227;font-size:13px;font-weight:600;">Sign in to post jobs or make donations</span>
      <button class="btn-wire js-open-login" style="font-size:12px;padding:6px 12px">Sign In / Register</button>
    </div>`;
    container.querySelector('.js-open-login').addEventListener('click', () => openAuthModal('login'));
  } else {
    const badge = user.role === 'alumni' ? membershipBadge(user.membership_tier) : '';
    container.innerHTML = `<div class="auth-bar">
      <div class="auth-avatar">${user.name[0].toUpperCase()}</div>
      <div><span class="auth-name">${user.name}</span>${badge}<span class="role-chip ${user.role}">${user.role}</span></div>
      <button class="auth-logout">Sign Out</button>
    </div>`;
    container.querySelector('.auth-logout').addEventListener('click', () => { Auth.clear(); location.reload(); });
  }
}

// ── Live Donation Feed ─────────────────────────────────────────────
function renderDonationItem(d) {
  const div = document.createElement('div');
  div.className = 'donation-item';
  div.innerHTML = `
    <div class="d-avatar">${d.donor_name[0].toUpperCase()}</div>
    <div class="d-info">
      <div class="d-name">${d.donor_name}</div>
      <div class="d-purpose">${d.purpose} · ${timeAgo(d.created_at)}</div>
    </div>
    <div class="d-amount">${(d.currency||'UGX')} ${Number(d.amount).toLocaleString()}</div>`;
  return div;
}

async function loadDonationFeed() {
  const ticker = document.getElementById('donation-ticker');
  const statCount = document.getElementById('stat-count');
  const statTotal = document.getElementById('stat-total');
  if (!ticker) return;
  try {
    const res = await fetch((window.API_BASE_URL || '') + '/api/donations/live');
    const { donations, stats } = await res.json();
    ticker.innerHTML = '';
    if (!donations.length) {
      ticker.innerHTML = '<div class="donation-empty">Be the first to donate! 🎉</div>';
    } else {
      donations.forEach(d => ticker.appendChild(renderDonationItem(d)));
    }
    if (statCount) statCount.textContent = stats.total_count.toLocaleString();
    if (statTotal) statTotal.textContent = 'UGX ' + Number(stats.total_amount).toLocaleString();
  } catch {
    ticker.innerHTML = '<div class="donation-empty">Start the server to see live donations</div>';
  }
}

if (socket) {
  socket.on('new-donation', d => {
    const ticker = document.getElementById('donation-ticker');
    if (ticker) {
      const empty = ticker.querySelector('.donation-empty');
      if (empty) empty.remove();
      ticker.prepend(renderDonationItem(d));
    }
    const statCount = document.getElementById('stat-count');
    if (statCount) statCount.textContent = (parseInt(statCount.textContent.replace(/,/g,''))||0) + 1;
    showToast('💛 New Donation!', d.donor_name + ' donated UGX ' + Number(d.amount).toLocaleString());
  });
}

// ── Flutterwave Payment ────────────────────────────────────────────
async function startPayment(formEl, category) {
  const user = Auth.get();
  const name   = formEl.querySelector('[name="Name"]')?.value   || (user?.name || '');
  const email  = formEl.querySelector('[name="Email"]')?.value  || (user?.email || '');
  const amount = formEl.querySelector('[name="Amount"]')?.value || 0;
  const purpose= formEl.querySelector('[name="Purpose for Funds"]')?.value ||
                 formEl.querySelector('[name="Funding Request Details"]')?.value || 'General';

  if (!name || !email || !amount) { showToast('Missing info', 'Please fill in Name, Email, and Amount.', 'error'); return; }
  if (parseFloat(amount) < 500) { showToast('Minimum', 'Minimum donation is UGX 500', 'error'); return; }

  try {
    const res = await fetch((window.API_BASE_URL || '') + '/api/donations/initiate', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ donor_name: name, email, amount, currency: 'UGX', purpose, category, payment_method: 'flutterwave' })
    });
    const { tx_ref } = await res.json();

    FlutterwaveCheckout({
      public_key: 'FLWPUBK_TEST-PASTE-YOUR-KEY-HERE',
      tx_ref,
      amount: parseFloat(amount),
      currency: 'UGX',
      payment_options: 'mobilemoneyuganda, card, banktransfer',
      customer: { email, phone_number: formEl.querySelector('[name="Phone Number"]')?.value || '', name },
      customizations: {
        title: 'Bugema University Alumni',
        description: purpose,
        logo: window.location.origin + '/pics/BU%20logo.jpeg'
      },
      callback: async (data) => {
        if (data.status === 'successful' || data.status === 'completed') {
          await fetch((window.API_BASE_URL || '') + '/api/donations/verify', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ transaction_id: data.transaction_id, tx_ref })
          });
          showToast('Payment Successful! 🎉', 'Thank you for your generous donation!', 'success');
          formEl.reset();
          loadDonationFeed();
          setTimeout(() => { window.location.href = 'success.html'; }, 1500);
        }
      },
      onclose: () => showToast('Payment closed', 'Your payment was not completed.', '')
    });
  } catch {
    showToast('Error', 'Could not initiate payment. Is the server running?', 'error');
  }
}

// ── Payment field visibility (fund & char forms) ───────────────────
function setupPaymentFields(prefix) {
  const sel = document.getElementById(prefix + '-payment');
  const bank = document.getElementById(prefix + '-bank-fields');
  const mob  = document.getElementById(prefix + '-mobile-fields');
  const card = document.getElementById(prefix + '-card-fields');
  if (!sel) return;
  function toggle() {
    const v = sel.value;
    if (bank) bank.style.display = v === 'Bank Transfer'     ? '' : 'none';
    if (mob)  mob.style.display  = v === 'Mobile Money'      ? '' : 'none';
    if (card) card.style.display = v === 'Credit/Debit Card' ? '' : 'none';
    [bank, mob, card].forEach((c, i) => {
      if (!c) return;
      c.querySelectorAll('input, select').forEach(inp => {
        if ([[bank,'Bank Transfer'],[mob,'Mobile Money'],[card,'Credit/Debit Card']][i][0] === c &&
            v === [[bank,'Bank Transfer'],[mob,'Mobile Money'],[card,'Credit/Debit Card']][i][1]) {
          inp.setAttribute('required','required');
        } else { inp.removeAttribute('required'); }
      });
    });
  }
  sel.addEventListener('change', toggle); toggle();
}
setupPaymentFields('fund');
setupPaymentFields('char');

// ── Form toggle buttons (existing) ────────────────────────────────
function wireToggle(btnId, formId) {
  const btn = document.getElementById(btnId);
  const frm = document.getElementById(formId);
  if (!btn || !frm) return;
  btn.addEventListener('click', () => { frm.style.display = frm.style.display === 'none' ? 'block' : 'none'; });
}
// Removed the duplicate wireToggle calls for forms, as they are handled
// in activities.html and opportunities.html with auth checks.

document.querySelectorAll('.js-cancel-btn').forEach(btn => {
  btn.addEventListener('click', () => { const f = btn.closest('form'); if (f) { f.reset(); f.style.display = 'none'; } });
});

// ── Donate Now buttons ─────────────────────────────────────────────
document.querySelectorAll('.js-pay-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = document.getElementById(btn.dataset.form);
    if (form) startPayment(form, btn.dataset.category || 'fundraising');
  });
});

// ── Opportunity Board ─────────────────────────────────────────────
async function loadOpportunities(type) {
  const board = document.getElementById(type + '-board');
  if (!board) return;
  try {
    const res = await fetch((window.API_BASE_URL || '') + '/api/' + type);
    const items = await res.json();
    renderOpportunities(board, items, type);
  } catch {
    board.innerHTML = '<div class="opp-empty">Start the server to see live ' + type + '</div>';
  }
}

function renderOpportunities(board, items, type) {
  if (!items.length) {
    board.innerHTML = '<div class="opp-empty">No ' + type + ' posted yet. Be the first!</div>';
    return;
  }
  board.innerHTML = '';
  items.forEach(item => board.appendChild(createOppCard(item, type)));
}

function createOppCard(item, type) {
  const div = document.createElement('div');
  div.className = 'opp-card';
  div.innerHTML = `
    <div class="opp-card-logo">${item.company[0].toUpperCase()}</div>
    <div class="opp-card-body">
      <div class="opp-card-title">${item.title}</div>
      <div class="opp-card-company">${item.company} · ${item.location}</div>
      <div class="opp-card-meta">
        <span class="opp-tag">${type === 'jobs' ? (item.type||'Full-time') : (item.duration||'3 months')}</span>
        <span class="opp-tag green">Posted by ${item.poster_name}</span>
        ${item.salary_range ? `<span class="opp-tag amber">${item.salary_range}</span>` : ''}
      </div>
    </div>
    <div class="opp-card-time">${timeAgo(item.created_at)}</div>`;
  return div;
}

if (socket) {
  socket.on('new-job', job => {
    const board = document.getElementById('jobs-board');
    if (board) {
      board.querySelector('.opp-empty')?.remove();
      board.prepend(createOppCard(job, 'jobs'));
    }
    showToast('💼 New Job Posted!', job.title + ' at ' + job.company);
  });
  socket.on('new-internship', intern => {
    const board = document.getElementById('internships-board');
    if (board) {
      board.querySelector('.opp-empty')?.remove();
      board.prepend(createOppCard(intern, 'internships'));
    }
    showToast('🎓 New Internship!', intern.title + ' at ' + intern.company);
  });
}

// Post job / internship
async function postOpportunity(type, formEl) {
  const user = Auth.get();
  if (!user || user.role !== 'alumni') { openAuthModal('login'); return; }
  const fields = {};
  new FormData(formEl).forEach((v, k) => { fields[k] = v; });
  try {
    const res = await fetch((window.API_BASE_URL || '') + '/api/' + type, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ...fields, user_id: user.id, poster_name: user.name })
    });
    if (!res.ok) throw new Error();
    formEl.reset(); formEl.style.display = 'none';
    showToast('Posted!', 'Your ' + (type === 'jobs' ? 'job' : 'internship') + ' listing is live.', 'success');
  } catch { showToast('Error', 'Could not post. Is the server running?', 'error'); }
}

document.getElementById('post-job-form')?.addEventListener('submit', e => { e.preventDefault(); postOpportunity('jobs', e.target); });
document.getElementById('post-intern-form')?.addEventListener('submit', e => { e.preventDefault(); postOpportunity('internships', e.target); });


// ── Existing form submit → success page ───────────────────────────
document.querySelectorAll('.js-submit-form').forEach(form => {
  // Skip if it has a js-pay-btn (handled by Flutterwave)
  if (form.id === 'fund-form' || form.id === 'charity-form') return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const entries = [];
    const dataObj = {};
    new FormData(form).forEach((v, k) => {
      const val = v instanceof File ? (v.name||'No file') : String(v).trim();
      entries.push({ key: k, value: val });
      dataObj[k] = val;
    });
    
    const btn = form.querySelector('button[type="submit"]');
    const oldTxt = btn ? btn.textContent : 'Submit';
    if(btn) {
      btn.textContent = "Submitting...";
      btn.disabled = true;
    }

    fetch((window.API_BASE_URL || '') + '/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_type: form.dataset.formType || 'Submission', data_json: dataObj })
    }).then(r => r.json()).then(() => {
      localStorage.setItem('buLastSubmission', JSON.stringify({ type: form.dataset.formType||'Submission', submittedAt: new Date().toLocaleString(), entries }));
      window.location.href = 'success.html';
    }).catch(err => {
      console.error(err);
      if(btn) {
        btn.textContent = oldTxt;
        btn.disabled = false;
      }
      showToast("Error", "Submission failed. Please try again.", "error");
    });
  });
});

// ── Chat Page ──────────────────────────────────────────────────────
const chatContainer = document.getElementById('chat-container');
const chatAuthGate  = document.getElementById('chat-auth-gate');
if (chatContainer && chatAuthGate) {
  const user = Auth.get();
  if (user) {
    chatAuthGate.style.display  = 'none';
    chatContainer.style.display = 'grid';
    initChat(user);
  }
}

function initChat(user) {
  document.getElementById('chat-my-avatar').textContent = user.name[0].toUpperCase();
  document.getElementById('chat-my-name').textContent   = user.name;
  document.getElementById('chat-my-role').textContent   = user.role;
  document.getElementById('chat-logout-btn').addEventListener('click', () => { Auth.clear(); location.reload(); });

  // Load history
  fetch((window.API_BASE_URL || '') + '/api/chat/messages').then(r => r.json()).then(msgs => {
    const welcome = document.getElementById('chat-welcome');
    if (msgs.length && welcome) welcome.remove();
    msgs.forEach(m => appendMessage(m, user.id));
    scrollChat();
  }).catch(() => {});

  // Join via socket
  if (socket) {
    socket.emit('user-join', { id: user.id, name: user.name, role: user.role });

    socket.on('online-users', users => {
      const list = document.getElementById('online-users-list');
      const count = document.getElementById('online-count');
      if (!list) return;
      count.textContent = users.length;
      list.innerHTML = users.map(u => `
        <li class="online-user-item">
          <div class="ou-dot"></div>
          <span class="ou-name">${u.name}</span>
          <span class="ou-role ${u.role}">${u.role}</span>
        </li>`).join('');
    });

    socket.on('chat-message', msg => {
      const welcome = document.getElementById('chat-welcome');
      if (welcome) welcome.remove();
      appendMessage(msg, user.id);
      scrollChat();
    });

    socket.on('user-joined', d => appendSystem(d.name + ' joined the chat'));
    socket.on('user-left',   d => appendSystem(d.name + ' left the chat'));

    let typingTimer;
    socket.on('user-typing', d => {
      const el = document.getElementById('chat-typing');
      const nm = document.getElementById('typing-name');
      if (el) { nm.textContent = d.name; el.style.display = 'flex'; }
    });
    socket.on('user-stop-typing', () => {
      const el = document.getElementById('chat-typing');
      if (el) el.style.display = 'none';
    });

    const input = document.getElementById('chat-input');
    input.addEventListener('input', () => {
      socket.emit('typing', { name: user.name, role: user.role });
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => socket.emit('stop-typing'), 1500);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(); });
    document.getElementById('chat-send-btn').addEventListener('click', sendMessage);

    function sendMessage() {
      const msg = input.value.trim();
      if (!msg) return;
      socket.emit('chat-message', { sender_id: user.id, sender_name: user.name, sender_role: user.role, message: msg });
      input.value = '';
      socket.emit('stop-typing');
    }
  }
}

function appendMessage(msg, myId) {
  const feed = document.getElementById('chat-messages');
  if (!feed) return;
  const isMine = msg.sender_id === myId;
  const row = document.createElement('div');
  row.className = 'msg-row' + (isMine ? ' mine' : '');
  const avClass = msg.sender_role === 'alumni' ? 'alumni-av' : 'student-av';
  const t = new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  row.innerHTML = `
    <div class="msg-avatar ${avClass}">${msg.sender_name[0].toUpperCase()}</div>
    <div class="msg-bubble-wrap">
      ${!isMine ? `<div class="msg-meta"><span class="msg-sender">${msg.sender_name}</span><span class="msg-role ${msg.sender_role}">${msg.sender_role}</span></div>` : ''}
      <div class="msg-bubble">${msg.message.replace(/</g,'&lt;')}</div>
      <div class="msg-time">${t}</div>
    </div>`;
  feed.appendChild(row);
}

function appendSystem(text) {
  const feed = document.getElementById('chat-messages');
  if (!feed) return;
  const div = document.createElement('div');
  div.className = 'msg-system';
  div.textContent = text;
  feed.appendChild(div);
  scrollChat();
}

function scrollChat() {
  const feed = document.getElementById('chat-messages');
  if (feed) feed.scrollTop = feed.scrollHeight;
}

// ── Home Auth Nav (header Sign In / user chip) ─────────────────────
function renderHomeAuthNav() {
  const container = document.getElementById('home-auth-nav');
  if (!container) return;
  const user = Auth.get();
  if (!user) {
    container.innerHTML = `
      <button class="nav-signin-btn" id="nav-signin-btn">Sign In / Register</button>`;
    container.querySelector('#nav-signin-btn').addEventListener('click', () => openAuthModal('login'));
  } else {
    container.innerHTML = `
      ${user.role === 'admin' ? '<a href="admin.html" class="nav-admin-btn" style="color:var(--brand); font-weight:600; margin-right: 15px; text-decoration:none;">Admin Dashboard</a>' : ''}
      <div class="nav-user-chip">
        <div class="nav-avatar">${user.name[0].toUpperCase()}</div>
        <span>${user.name}</span>
      </div>
      <button class="nav-logout">Sign Out</button>`;
    container.querySelector('.nav-logout').addEventListener('click', () => { Auth.clear(); location.reload(); });
  }
}

// ── Initialise page-specific features ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Render auth nav in header (all pages)
  renderHomeAuthNav();

  // "Join Alumni Network" hero button → open register tab
  const joinBtn = document.getElementById('join-alumni-btn');
  if (joinBtn) {
    const user = Auth.get();
    if (user) {
      // Already logged in — update button text
      joinBtn.textContent = 'Welcome, ' + user.name + ' 👋';
      joinBtn.style.background = '#0f766e';
      joinBtn.style.borderColor = '#0f766e';
      joinBtn.style.cursor = 'default';
    } else {
      joinBtn.addEventListener('click', () => openAuthModal('register'));
    }
  }

  // Activities page — render auth bar and load donation feed
  const actAuthBar = document.getElementById('activities-auth-bar');
  if (actAuthBar) { renderAuthBar(actAuthBar); loadDonationFeed(); }

  // Opportunities page
  const oppAuthBar = document.getElementById('opp-auth-bar');
  if (oppAuthBar) { renderAuthBar(oppAuthBar); loadOpportunities('jobs'); loadOpportunities('internships'); }
});
