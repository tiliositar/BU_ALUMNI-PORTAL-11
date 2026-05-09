const fs = require('fs');

const originalBlock = `  <!-- ══ PAYMENT MODAL ══ -->
  <div id="payment-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:2000; align-items:center; justify-content:center;">
    <div style="background:#fff; border-radius:16px; padding:36px 32px; max-width:480px; width:93%; box-shadow:0 24px 64px rgba(0,0,0,0.22); animation:pmIn .25s ease; position:relative; max-height:90vh; overflow-y:auto;">
      <button id="pay-modal-close" style="position:absolute;top:14px;right:18px;background:none;border:none;font-size:22px;cursor:pointer;color:#94a3b8;">✕</button>
      <div style="text-align:center; margin-bottom:20px;">
        <div style="font-size:38px;">💳</div>
        <h3 style="margin:8px 0 4px; color:#1e293b; font-size:20px;">Choose Payment Method</h3>
        <p style="color:#64748b; font-size:13px; margin:0;">Your application has been saved. Complete your payment below.</p>
        <p id="pay-modal-summary" style="margin:10px 0 0; font-weight:700; color:#1a7a5e; font-size:15px;"></p>
      </div>

      <!-- Method selector -->
      <div style="display:flex; gap:10px; margin-bottom:20px;">
        <button class="pm-tab active" data-method="bank" style="flex:1; padding:10px 6px; border-radius:8px; border:2px solid #1a7a5e; background:#f0fdf9; color:#1a7a5e; font-weight:700; cursor:pointer; font-size:13px;">🏦 Bank Transfer</button>
        <button class="pm-tab" data-method="mobile" style="flex:1; padding:10px 6px; border-radius:8px; border:2px solid #e2e8f0; background:#f8fafc; color:#64748b; font-weight:600; cursor:pointer; font-size:13px;">📱 Mobile Money</button>
        <button class="pm-tab" data-method="card" style="flex:1; padding:10px 6px; border-radius:8px; border:2px solid #e2e8f0; background:#f8fafc; color:#64748b; font-weight:600; cursor:pointer; font-size:13px;">💳 Card</button>
      </div>

      <!-- Bank Transfer Panel -->
      <div id="pm-bank" class="pm-panel">
        <div style="text-align:center; margin-bottom:14px;">
          <img src="pics/Bank%20Transfer.jpeg" alt="Bank Transfer" style="height:40px; border-radius:6px; object-fit:contain;" />
          <p style="font-size:12px; color:#64748b; margin:6px 0 0;">Safe and secure direct bank transfer.</p>
        </div>
        <div style="display:grid; gap:12px;">
          <div><label style="font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">Bank Name</label>
            <select id="pm-bank-name" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; font-size:14px;">
              <option value="">Select bank</option>
              <option>Stanbic Bank</option><option>Centenary Bank</option><option>Absa Bank</option>
              <option>Equity Bank</option><option>Housing Finance Bank</option><option>Bank of Africa</option>
              <option>DFCU Bank</option><option>Standard Chartered Bank</option><option>Other</option>
            </select></div>
          <div><label style="font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">Account Number</label>
            <input id="pm-bank-account" type="text" placeholder="Enter account number" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; font-size:14px; box-sizing:border-box;" /></div>
        </div>
      </div>

      <!-- Mobile Money Panel -->
      <div id="pm-mobile" class="pm-panel" style="display:none;">
        <div style="text-align:center; margin-bottom:14px;">
          <img src="pics/MTN%20Mobile%20Money.jpeg" alt="MTN Mobile Money" style="height:40px; border-radius:6px; object-fit:contain;" />
          <p style="font-size:12px; color:#64748b; margin:6px 0 0;">Instant and secure mobile money payment.</p>
        </div>
        <div style="display:grid; gap:12px;">
          <div><label style="font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">Provider</label>
            <select id="pm-mobile-provider" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; font-size:14px;">
              <option value="">Select provider</option><option>MTN</option><option>Airtel</option>
            </select></div>
          <div><label style="font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">Phone Number</label>
            <input id="pm-mobile-number" type="tel" placeholder="e.g. 0771234567" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; font-size:14px; box-sizing:border-box;" /></div>
        </div>
      </div>

      <!-- Card Panel -->
      <div id="pm-card" class="pm-panel" style="display:none;">
        <div style="text-align:center; margin-bottom:14px;">
          <img src="pics/VISA.jpeg" alt="Visa" style="height:34px; border-radius:6px; object-fit:contain; margin-right:6px;" />
          <img src="pics/MasterCard.jpeg" alt="MasterCard" style="height:34px; border-radius:6px; object-fit:contain;" />
          <p style="font-size:12px; color:#64748b; margin:6px 0 0;">Your card details are encrypted and securely processed.</p>
        </div>
        <div style="display:grid; gap:12px;">
          <div><label style="font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">Card Number</label>
            <input id="pm-card-number" type="text" placeholder="1234 5678 9012 3456" maxlength="19" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; font-size:14px; box-sizing:border-box;" /></div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div><label style="font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">Expiry</label>
              <input id="pm-card-expiry" type="month" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; font-size:14px; box-sizing:border-box;" /></div>
            <div><label style="font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">CVV</label>
              <input id="pm-card-cvv" type="text" placeholder="123" maxlength="4" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; font-size:14px; box-sizing:border-box;" /></div>
          </div>
        </div>
      </div>

      <button id="pay-modal-confirm" style="width:100%; margin-top:22px; padding:13px; background:#1a7a5e; color:#fff; border:none; border-radius:8px; font-size:16px; font-weight:700; cursor:pointer; transition:background .2s;">Proceed to Pay</button>
      <p id="pay-modal-msg" style="text-align:center; margin-top:10px; font-size:13px; color:#ef4444; display:none;"></p>
    </div>
  </div>

  <style>
    @keyframes pmIn { from { transform:scale(.85); opacity:0; } to { transform:scale(1); opacity:1; } }
    #payment-modal { display:none; }
    #payment-modal.open { display:flex; }
    .pm-tab.active { border-color:#1a7a5e !important; background:#f0fdf9 !important; color:#1a7a5e !important; }
  </style>

  <script src="/socket.io/socket.io.js"></script>
  <script src="script.js"></script>
  <script>
    // ── Shared payment modal state ──
    let _pendingPayment = null;

    function openPaymentModal(formData) {
      _pendingPayment = formData;
      const modal = document.getElementById('payment-modal');
      document.getElementById('pay-modal-summary').textContent =
        formData.formType + ' — UGX ' + Number(formData.amount).toLocaleString();
      document.getElementById('pay-modal-msg').style.display = 'none';
      // Use style.display directly — inline styles override CSS classes
      modal.style.display = 'flex';
      switchPayTab('bank');
    }

    function closePaymentModal() {
      document.getElementById('payment-modal').style.display = 'none';
      _pendingPayment = null;
    }

    document.getElementById('pay-modal-close').addEventListener('click', closePaymentModal);
    document.getElementById('payment-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('payment-modal')) closePaymentModal();
    });

    // ── Tab switching ──
    function switchPayTab(method) {
      document.querySelectorAll('.pm-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.pm-panel').forEach(p => p.style.display = 'none');
      document.querySelector('[data-method="' + method + '"]').classList.add('active');
      document.getElementById('pm-' + method).style.display = 'block';
    }
    document.querySelectorAll('.pm-tab').forEach(tab => {
      tab.addEventListener('click', () => switchPayTab(tab.dataset.method));
    });

    // ── Form submit handlers ──
    async function handleFormSubmit(e, formId, formType, category) {
      e.preventDefault();
      const form = document.getElementById(formId);
      const data = {};
      form.querySelectorAll('[name]').forEach(el => { data[el.name] = el.value; });

      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;

      // Always capture form data before async ops
      const paymentData = {
        formType,
        category,
        amount: data['Amount'] || 0,
        email: data['Email'] || '',
        name: data['Name'] || ''
      };

      try {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form_type: formType, data_json: data })
        });
        if (!res.ok) throw new Error('Server error');
      } catch (err) {
        console.warn('Could not save to server, proceeding to payment anyway.', err);
      }

      // Always close form and open payment modal regardless of server save
      form.style.display = 'none';
      form.reset();
      submitBtn.textContent = '✅ Submit Application';
      submitBtn.disabled = false;
      openPaymentModal(paymentData);
    }

    document.getElementById('fund-form').addEventListener('submit', e =>
      handleFormSubmit(e, 'fund-form', 'Fundraising Registration', 'fundraising'));

    document.getElementById('charity-form').addEventListener('submit', e =>
      handleFormSubmit(e, 'charity-form', 'Charity Application', 'charity'));

    // ── Confirm Payment ──
    document.getElementById('pay-modal-confirm').addEventListener('click', async () => {
      const activeMethod = document.querySelector('.pm-tab.active').dataset.method;
      const msgEl = document.getElementById('pay-modal-msg');
      msgEl.style.display = 'none';

      let paymentDetails = { method: activeMethod };
      if (activeMethod === 'bank') {
        paymentDetails.bankName = document.getElementById('pm-bank-name').value;
        paymentDetails.accountNumber = document.getElementById('pm-bank-account').value;
        if (!paymentDetails.bankName || !paymentDetails.accountNumber) {
          msgEl.textContent = 'Please fill in your bank details.'; msgEl.style.display = 'block'; return;
        }
      } else if (activeMethod === 'mobile') {
        paymentDetails.provider = document.getElementById('pm-mobile-provider').value;
        paymentDetails.phone = document.getElementById('pm-mobile-number').value;
        if (!paymentDetails.provider || !paymentDetails.phone) {
          msgEl.textContent = 'Please fill in your mobile money details.'; msgEl.style.display = 'block'; return;
        }
      } else if (activeMethod === 'card') {
        paymentDetails.cardNumber = document.getElementById('pm-card-number').value;
        paymentDetails.expiry = document.getElementById('pm-card-expiry').value;
        paymentDetails.cvv = document.getElementById('pm-card-cvv').value;
        if (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv) {
          msgEl.textContent = 'Please fill in all card details.'; msgEl.style.display = 'block'; return;
        }
      }

      const btn = document.getElementById('pay-modal-confirm');
      btn.textContent = 'Processing...';
      btn.disabled = true;

      try {
        // Initiate donation record
        const res = await fetch('/api/donations/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donor_name: _pendingPayment.name || 'Anonymous',
            email: _pendingPayment.email || 'noemail@example.com',
            amount: _pendingPayment.amount,
            currency: 'UGX',
            purpose: _pendingPayment.formType,
            category: _pendingPayment.category,
            payment_method: activeMethod
          })
        });
        const data = await res.json();
        closePaymentModal();
        alert('✅ Payment submitted successfully!\\n\\nRef: ' + (data.tx_ref || 'N/A') + '\\nThank you for your generous contribution!');
      } catch (err) {
        msgEl.textContent = 'Payment failed. Please try again.'; msgEl.style.display = 'block';
      } finally {
        btn.textContent = 'Proceed to Pay';
        btn.disabled = false;
      }
    });
  </script>`;

let html = fs.readFileSync('activities.html', 'utf8');

const startStr = '<script src="/socket.io/socket.io.js"></script>';
const endStr = '</body>';

const startIdx = html.lastIndexOf(startStr);
const endIdx = html.lastIndexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  html = html.substring(0, startIdx) + originalBlock + '\\n' + html.substring(endIdx);
  fs.writeFileSync('activities.html', html);
  console.log('Restored original activities.html');
} else {
  console.log('Could not find boundaries.');
}
