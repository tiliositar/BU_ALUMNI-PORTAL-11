const fs = require('fs');
let c = fs.readFileSync('admin.html', 'utf8');

const withdrawJS = `
          // Populate Metrics (extra ones)
          document.getElementById('metric-withdrawn').textContent = 'UGX ' + (data.stats.withdrawalsTotal||0).toLocaleString();
          document.getElementById('metric-net-balance').textContent = 'UGX ' + (data.stats.netBalance||0).toLocaleString();

          // Show balance in withdraw form
          const balDisplay = document.getElementById('wd-balance-display');
          if (balDisplay) balDisplay.textContent = 'Available balance: UGX ' + (data.stats.netBalance||0).toLocaleString();

          // Populate Withdrawals Table
          const wdBody = document.getElementById('table-withdrawals');
          if (wdBody) {
            if (!data.withdrawals || data.withdrawals.length === 0) {
              wdBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;">No withdrawals recorded yet.</td></tr>';
            } else {
              let wdTotal = 0;
              data.withdrawals.forEach(w => {
                wdTotal += Number(w.amount);
                const tr = document.createElement('tr');
                tr.id = 'wd-row-' + w.id;
                tr.innerHTML = \`
                  <td style="color:var(--muted);font-size:12px;">\${new Date(w.created_at).toLocaleString()}</td>
                  <td><strong style="color:#dc2626;">UGX \${Number(w.amount).toLocaleString()}</strong></td>
                  <td>\${w.reason}</td>
                  <td>\${w.method}</td>
                  <td><code style="font-size:11px;">\${w.account_ref}</code></td>
                  <td style="font-size:12px;color:var(--muted);">\${w.withdrawn_by}</td>
                  <td><button class="admin-btn admin-btn-reject" onclick="deleteWithdrawal(\${w.id})">&#x1F5D1; Delete</button></td>
                \`;
                wdBody.appendChild(tr);
              });
              // Totals row
              const tr = document.createElement('tr');
              tr.style.cssText = 'background:#fff5f5;font-weight:700;';
              tr.innerHTML = \`<td colspan="1" style="text-align:right;color:#dc2626;padding:12px;">TOTAL WITHDRAWN</td><td style="color:#dc2626;font-size:16px;">UGX \${wdTotal.toLocaleString()}</td><td colspan="5"></td>\`;
              wdBody.appendChild(tr);
            }
          }
`;

// Insert this after the line that populates metric-sacco
const marker = "document.getElementById('metric-sacco').textContent = 'UGX ' + (data.stats.saccoTotal||0).toLocaleString();";
if (c.includes(marker)) {
  c = c.replace(marker, marker + withdrawJS);
  console.log('Injected withdrawal JS after metric-sacco line');
} else {
  console.log('Marker not found!');
  // Try to find any metric setting
  const alt = "document.getElementById('metric-applications').textContent";
  const idx = c.indexOf(alt);
  console.log('Alt index:', idx);
}

fs.writeFileSync('admin.html', c, 'utf8');

// Now also add the withdraw form submit handler and deleteWithdrawal function
let c2 = fs.readFileSync('admin.html', 'utf8');
const deleteWdFn = `
    async function deleteWithdrawal(id) {
      if (!confirm('Delete this withdrawal record?')) return;
      const r = await fetch('/api/admin/withdraw/' + id, { method: 'DELETE', headers: adminHeaders() });
      const d = await r.json();
      if (r.ok) {
        document.getElementById('wd-row-' + id)?.remove();
        showAlert('Withdrawal record deleted.');
      } else { showAlert('Error: ' + d.error, true); }
    }

    // Withdraw form submit
    document.addEventListener('DOMContentLoaded', () => {
      const wdBtn = document.getElementById('wd-submit-btn');
      if (!wdBtn) return;
      wdBtn.addEventListener('click', async () => {
        const amount     = document.getElementById('wd-amount').value;
        const reason     = document.getElementById('wd-reason').value;
        const method     = document.getElementById('wd-method').value;
        const accountRef = document.getElementById('wd-account').value;
        const errEl      = document.getElementById('wd-error');
        errEl.style.display = 'none';

        if (!amount || !reason || !method || !accountRef) {
          errEl.textContent = 'Please fill in all fields.'; errEl.style.display = 'block'; return;
        }

        wdBtn.disabled = true; wdBtn.textContent = 'Processing...';
        try {
          const r = await fetch('/api/admin/withdraw', {
            method: 'POST',
            headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Number(amount), reason, method, account_ref: accountRef })
          });
          const d = await r.json();
          if (!r.ok) {
            errEl.textContent = d.error; errEl.style.display = 'block';
          } else {
            // Add row to table
            const wdBody = document.getElementById('table-withdrawals');
            const placeholder = wdBody.querySelector('td[colspan="7"]');
            if (placeholder) placeholder.closest('tr').remove();

            const oldTotal = wdBody.querySelector('tr[data-wd-total]');
            if (oldTotal) oldTotal.remove();

            const tr = document.createElement('tr');
            tr.id = 'wd-row-' + d.id;
            tr.innerHTML = \`
              <td style="color:var(--muted);font-size:12px;">\${new Date().toLocaleString()}</td>
              <td><strong style="color:#dc2626;">UGX \${Number(amount).toLocaleString()}</strong></td>
              <td>\${reason}</td>
              <td>\${method}</td>
              <td><code style="font-size:11px;">\${accountRef}</code></td>
              <td style="font-size:12px;color:var(--muted);">Admin</td>
              <td><button class="admin-btn admin-btn-reject" onclick="deleteWithdrawal(\${d.id})">&#x1F5D1; Delete</button></td>
            \`;
            wdBody.insertBefore(tr, wdBody.firstChild);

            // Update metrics
            document.getElementById('metric-withdrawn').textContent = 'UGX ' + (Number(document.getElementById('metric-withdrawn').textContent.replace(/[^\\d]/g,'')) + Number(amount)).toLocaleString();
            document.getElementById('metric-net-balance').textContent = 'UGX ' + Number(d.newBalance).toLocaleString();
            document.getElementById('wd-balance-display').textContent = 'Available balance: UGX ' + Number(d.newBalance).toLocaleString();

            // Clear form
            document.getElementById('wd-amount').value = '';
            document.getElementById('wd-reason').value = '';
            document.getElementById('wd-method').value = '';
            document.getElementById('wd-account').value = '';
            showAlert('✅ Withdrawal of UGX ' + Number(amount).toLocaleString() + ' recorded successfully!');
          }
        } catch(e) {
          errEl.textContent = 'Server error. Is the server running?'; errEl.style.display = 'block';
        } finally {
          wdBtn.disabled = false; wdBtn.innerHTML = '&#x1F4E4; Process Withdrawal';
        }
      });
    });
`;

// Insert before the showAlert function
const showAlertMarker = 'function showAlert(msg, isError = false) {';
if (c2.includes(showAlertMarker)) {
  c2 = c2.replace(showAlertMarker, deleteWdFn + '\n    ' + showAlertMarker);
  console.log('Injected withdrawal submit handler');
} else {
  console.log('showAlert marker not found');
}

fs.writeFileSync('admin.html', c2, 'utf8');
console.log('Done');
