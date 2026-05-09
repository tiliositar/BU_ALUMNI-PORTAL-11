const fs = require('fs');
let html = fs.readFileSync('activities.html', 'utf8');

// The block to replace starts at <!-- ══ PAYMENT MODAL ══ --> and goes to the end of the script before </body>
const startIdx = html.indexOf('<!-- ══ PAYMENT MODAL ══ -->');
const endIdx = html.indexOf('</body>');

if (startIdx !== -1 && endIdx !== -1) {
  const newScript = `
  <script src="/socket.io/socket.io.js"></script>
  <script src="script.js"></script>
  <script>
    // ── Form submit handlers ──
    async function handleFormSubmit(e, formId, formType, category) {
      e.preventDefault();
      const form = document.getElementById(formId);
      const data = {};
      form.querySelectorAll('[name]').forEach(el => { data[el.name] = el.value; });

      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;

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

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;

      // Trigger actual payment (Flutterwave) handled in script.js
      if (typeof startPayment === 'function') {
        startPayment(form, category);
      } else {
        alert("Payment gateway is not loaded.");
      }
    }

    document.getElementById('fund-form').addEventListener('submit', e =>
      handleFormSubmit(e, 'fund-form', 'Fundraising Registration', 'fundraising'));

    document.getElementById('charity-form').addEventListener('submit', e =>
      handleFormSubmit(e, 'charity-form', 'Charity Application', 'charity'));
  </script>
`;
  html = html.substring(0, startIdx) + newScript + html.substring(endIdx);
  fs.writeFileSync('activities.html', html);
  console.log('Successfully updated activities.html');
} else {
  console.log('Could not find the target blocks.');
}
