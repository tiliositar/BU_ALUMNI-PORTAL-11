const fs = require('fs');
let c = fs.readFileSync('admin.html', 'utf8');

// Find the verified SACCO section end and insert withdraw section after it
const withdrawSection = `
      <!-- Withdraw Funds Section -->
      <section class="admin-section" style="border:2px solid #dc2626;border-radius:12px;padding:24px;">
        <h2 style="color:#dc2626;">&#x1F4E4; Withdraw Funds</h2>
        <p style="color:var(--muted);font-size:13px;margin:-8px 0 20px;">Record a fund withdrawal from the portal account. The system will verify available balance before processing.</p>

        <div style="background:#fff5f5;border:1px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:24px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px;">
            <div>
              <label style="font-size:12px;font-weight:700;color:#6b7280;display:block;margin-bottom:4px;">AMOUNT (UGX)</label>
              <input id="wd-amount" type="number" placeholder="Enter amount" min="1" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;box-sizing:border-box;" />
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:#6b7280;display:block;margin-bottom:4px;">REASON</label>
              <select id="wd-reason" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
                <option value="">Select reason</option>
                <option>University Infrastructure Project</option>
                <option>Student Scholarship Disbursement</option>
                <option>SACCO Member Dividend</option>
                <option>Community Outreach Program</option>
                <option>Administrative Expenses</option>
                <option>Emergency Fund Release</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:#6b7280;display:block;margin-bottom:4px;">PAYMENT METHOD</label>
              <select id="wd-method" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
                <option value="">Select method</option>
                <option>Mobile Money (MTN)</option>
                <option>Mobile Money (Airtel)</option>
                <option>Bank Transfer</option>
                <option>Cash</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:#6b7280;display:block;margin-bottom:4px;">ACCOUNT / REFERENCE</label>
              <input id="wd-account" type="text" placeholder="Account no. or phone" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;box-sizing:border-box;" />
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
            <button id="wd-submit-btn" class="admin-btn admin-btn-deny" style="padding:12px 28px;font-size:14px;border-radius:8px;">
              &#x1F4E4; Process Withdrawal
            </button>
            <span id="wd-balance-display" style="font-size:13px;color:#0f766e;font-weight:600;"></span>
          </div>
          <p id="wd-error" style="color:#dc2626;font-size:13px;margin-top:8px;display:none;"></p>
        </div>

        <!-- Withdrawal History -->
        <h3 style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:12px;">Withdrawal History</h3>
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Method</th>
                <th>Account/Ref</th>
                <th>By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="table-withdrawals"></tbody>
          </table>
        </div>
      </section>

`;

// Insert before the donations section (or before </div> of dashboard-content)
// Find the donations section header
const donationsMarker = '<h2>Donations Received</h2>';
if (c.includes(donationsMarker)) {
  // Find the section start
  const idx = c.indexOf(donationsMarker);
  const sectionStart = c.lastIndexOf('<section', idx);
  c = c.slice(0, sectionStart) + withdrawSection + c.slice(sectionStart);
  console.log('Inserted before Donations section');
} else {
  // Fallback: insert before </div> at end of dashboard-content
  c = c.replace('</div>\r\n\r\n  <footer', withdrawSection + '</div>\r\n\r\n  <footer');
  console.log('Inserted before dashboard end');
}

fs.writeFileSync('admin.html', c, 'utf8');
console.log('Withdraw section added to admin.html');
