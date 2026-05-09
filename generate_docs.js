const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, PageBreak, NumberFormat } = require('docx');
const fs = require('fs');

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } });
}
function h3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } });
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { before: 80, after: 80 } });
}
function bullet(text) {
  return new Paragraph({ text: '• ' + text, indent: { left: 400 }, spacing: { before: 60, after: 60 } });
}
function bold(text) {
  return new Paragraph({ children: [new TextRun({ text, bold: true })], spacing: { before: 80, after: 80 } });
}
function hr() {
  return new Paragraph({ text: '─'.repeat(80), spacing: { before: 100, after: 100 } });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function makeTable(headers, rows) {
  const headerRow = new TableRow({
    children: headers.map(h => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
      shading: { fill: '1a3a6e' },
    })),
    tableHeader: true,
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map(cell => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: String(cell) })] })],
      shading: { fill: ri % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
    })),
  }));
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

const doc = new Document({
  styles: {
    default: {
      heading1: { run: { bold: true, size: 32, color: '0D1B3E' } },
      heading2: { run: { bold: true, size: 26, color: '1A3A6E' } },
      heading3: { run: { bold: true, size: 22, color: '0F766E' } },
    }
  },
  sections: [{
    properties: {},
    children: [
      // ── TITLE PAGE ──
      new Paragraph({ text: '', spacing: { before: 1200 } }),
      new Paragraph({ children: [new TextRun({ text: 'BUGEMA UNIVERSITY', bold: true, size: 52, color: '0D1B3E' })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'ALUMNI PORTAL', bold: true, size: 48, color: '0F766E' })], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: '', spacing: { before: 200 } }),
      new Paragraph({ children: [new TextRun({ text: 'System Documentation', size: 32, color: '475569' })], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: '', spacing: { before: 600 } }),
      new Paragraph({ children: [new TextRun({ text: 'Version 1.0  |  May 2026', size: 24, color: '64748B' })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: 'Excellence In Service', italics: true, size: 24, color: '64748B' })], alignment: AlignmentType.CENTER }),
      pageBreak(),

      // ── 1. PROJECT OVERVIEW ──
      h1('1. Project Overview'),
      p('The Bugema University Alumni Portal is a full-stack web application designed to connect alumni, students, and the university administration on a single digital platform. It provides tools for networking, financial contributions, career development, community events, and administrative management.'),
      new Paragraph({ text: '' }),
      h2('1.1 Purpose'),
      bullet('Foster lasting relationships between Bugema University graduates and current students'),
      bullet('Provide a SACCO platform for alumni financial contributions'),
      bullet('Enable fundraising and charity activities'),
      bullet('Share career and internship opportunities'),
      bullet('Facilitate real-time community communication'),
      bullet('Streamline alumni registration and admin approval workflows'),
      new Paragraph({ text: '' }),
      h2('1.2 Technology Stack'),
      makeTable(
        ['Layer', 'Technology', 'Purpose'],
        [
          ['Frontend', 'HTML5, Vanilla CSS, JavaScript', 'User Interface & Interactivity'],
          ['Backend', 'Node.js + Express.js', 'REST API Server'],
          ['Database', 'SQLite via better-sqlite3', 'Persistent Data Storage'],
          ['Real-time', 'Socket.IO', 'Live Chat & Donation Feed'],
          ['Payments', 'Flutterwave v3', 'Payment Processing'],
          ['Email', 'Nodemailer (Gmail SMTP)', 'Email Notifications'],
          ['Auth', 'bcryptjs + localStorage', 'Password Hashing & Sessions'],
        ]
      ),
      pageBreak(),

      // ── 2. SYSTEM ARCHITECTURE ──
      h1('2. System Architecture'),
      h2('2.1 File Structure'),
      makeTable(
        ['File / Folder', 'Description'],
        [
          ['server.js', 'Main Express server — all API routes, Socket.IO, Flutterwave'],
          ['database.js', 'SQLite database setup & schema initialization'],
          ['script.js', 'Shared frontend JS — Auth, Notifications, Modals, Toast'],
          ['styles.css', 'Global CSS design system'],
          ['index.html', 'Home page with Reviews section'],
          ['about.html', 'About Bugema University page'],
          ['activities.html', 'Fundraising, Charity & Mentorship page'],
          ['opportunities.html', 'Jobs & Internships page'],
          ['events-news.html', 'Events & News page'],
          ['sacco.html', 'SACCO contribution page'],
          ['chat.html', 'Real-time community chat page'],
          ['success.html', 'Post-application feedback & rating page'],
          ['admin.html', 'Admin dashboard'],
          ['admin-login.html', 'Admin login page'],
          ['resources.html', 'FAQ, Privacy Policy, Terms of Service'],
          ['.env', 'Environment variables (API keys, email credentials)'],
          ['pics/', 'Image assets (logos, payment icons)'],
        ]
      ),
      new Paragraph({ text: '' }),
      h2('2.2 Server Port'),
      p('The server runs on http://localhost:3000 by default. This can be changed via the PORT variable in the .env file.'),
      pageBreak(),

      // ── 3. PAGES & FEATURES ──
      h1('3. Pages & Features'),

      h2('3.1 Home Page (index.html)'),
      bullet('Hero section with a "Become a Member" call-to-action'),
      bullet('Navigation bar with auth-aware Sign In / Sign Out button'),
      bullet('Feature cards: Alumni Network, SACCO, Opportunities, Charity, Events, Chat'),
      bullet('"What Our Users Say" reviews section — dynamically loads star ratings and comments from the database'),
      bullet('Footer with contact information, social media links, and newsletter signup'),

      h2('3.2 About Page (about.html)'),
      bullet('University history, mission, vision and values'),
      bullet('Leadership information'),
      bullet('Photo gallery of campus'),

      h2('3.3 Activities Page (activities.html)'),
      bullet('Career Guidance / Mentorship Program sign-up form'),
      bullet('Fundraising Registration form with payment modal'),
      bullet('Charity Application form with payment modal'),
      bullet('Live Donation Feed (real-time via Socket.IO)'),
      bullet('ALL forms are auth-gated — only approved registered users can open and submit'),

      h2('3.4 Opportunities Page (opportunities.html)'),
      bullet('Job Application form'),
      bullet('Internship Application form'),
      bullet('Post a Job form (for alumni to post opportunities)'),
      bullet('Post an Internship form'),
      bullet('Live Job Board and Internship Board'),
      bullet('ALL forms are auth-gated — only approved registered users can access'),

      h2('3.5 Events & News Page (events-news.html)'),
      bullet('Upcoming events calendar'),
      bullet('Latest news and announcements'),
      bullet('Event registration'),

      h2('3.6 SACCO Page (sacco.html)'),
      bullet('Alumni SACCO contribution form'),
      bullet('Membership tier selection (Ordinary, Silver, Gold)'),
      bullet('Mobile Money payment proof (Transaction ID submission)'),
      bullet('Contribution history for logged-in user'),
      bullet('Contributions require admin verification before counting toward the fund'),

      h2('3.7 Chat Page (chat.html)'),
      bullet('Real-time community chat powered by Socket.IO'),
      bullet('Auth-gated — only approved registered users can participate'),
      bullet('Shows online users count'),
      bullet('Message history with timestamps'),

      h2('3.8 Success Page (success.html)'),
      bullet('Shown after any form/application submission'),
      bullet('Experience rating form (1–5 stars)'),
      bullet('Reviewer name field'),
      bullet('Comment/feedback text area'),
      bullet('Submits feedback to the server — appears on home page reviews section'),

      h2('3.9 Resources Page (resources.html)'),
      bullet('FAQ section'),
      bullet('Privacy Policy'),
      bullet('Terms of Service'),
      pageBreak(),

      // ── 4. USER ROLES & REGISTRATION ──
      h1('4. User Roles & Permissions'),
      makeTable(
        ['Role', 'Registration', 'Access Level'],
        [
          ['Alumni', 'Requires membership tier selection + Mobile Money payment TX ID', 'Full access + SACCO + Membership badge'],
          ['Student', 'Standard email/password registration', 'Full access (no SACCO/tier)'],
          ['Admin', 'Pre-configured in database', 'Full dashboard access + withdraw funds'],
        ]
      ),
      new Paragraph({ text: '' }),
      h2('4.1 Registration Flow'),
      bullet('User visits the portal and clicks "Sign In / Register"'),
      bullet('Fills name, email, password, and role (Alumni or Student)'),
      bullet('Alumni must additionally select membership tier and provide Mobile Money Transaction ID'),
      bullet('Registration status is set to PENDING'),
      bullet('User sees: "Your account is pending admin approval"'),
      bullet('Admin receives the new user in the dashboard under Registered Users'),
      bullet('Admin clicks Approve ✓ or Deny ✗'),
      bullet('User receives an in-app notification on next login, and an email (if configured)'),

      h2('4.2 Membership Tiers (Alumni Only)'),
      makeTable(
        ['Tier', 'Fee (UGX)', 'Badge'],
        [
          ['Ordinary', '50,000', '🥉 Ordinary'],
          ['Silver', '200,000', '🥈 Silver'],
          ['Gold', '500,000', '🏆 Gold'],
        ]
      ),
      new Paragraph({ text: '' }),
      p('Payment is made to the admin Mobile Money number: 0763682699. The user submits the Transaction ID as proof. Admin verifies manually.'),
      pageBreak(),

      // ── 5. ADMIN DASHBOARD ──
      h1('5. Admin Dashboard'),
      p('Access via: http://localhost:3000/admin-login.html'),
      p('Admin email: admin@alumnibugemauniv.ac.ug'),
      new Paragraph({ text: '' }),

      h2('5.1 Metric Cards'),
      makeTable(
        ['Metric', 'Description'],
        [
          ['Total Donations', 'Sum of all completed donations (UGX)'],
          ['Registered Users', 'Total number of registered accounts'],
          ['Pending Approvals', 'Number of users awaiting admin approval'],
          ['SACCO Fund', 'Total verified SACCO contributions (UGX)'],
          ['Total Withdrawn', 'Total amount withdrawn from portal funds (UGX)'],
          ['Net Balance', '(Donations + SACCO Fund) − Withdrawals'],
          ['Feedback Entries', 'Total feedback submissions'],
          ['Total Applications', 'Total form applications received'],
        ]
      ),

      h2('5.2 Registered Users Management'),
      bullet('View all registered users with date, name, email, role, tier, TX ID, and status'),
      bullet('Status can be: pending, approved, or denied'),
      bullet('Admin can Approve ✓ — activates the account, sends in-app notification + email'),
      bullet('Admin can Deny ✗ — rejects the account, sends in-app denial notification + email'),
      bullet('Admin can Reinstate a denied user'),
      bullet('Admin can Revoke an approved user'),

      h2('5.3 SACCO Management'),
      bullet('Pending Contributions table — shows unverified SACCO deposits'),
      bullet('Admin can Verify ✓ contribution (moves to Verified Members list)'),
      bullet('Admin can Reject ✗ contribution'),
      bullet('Verified Members table — shows all approved SACCO contributors with running total'),
      bullet('Admin can Revoke verified contributions if needed'),
      bullet('SACCO Fund metric updates in real-time on the dashboard'),

      h2('5.4 Fund Withdrawal'),
      bullet('Admin-exclusive feature to record fund withdrawals'),
      bullet('Fields: Amount (UGX), Reason, Payment Method, Account Reference'),
      bullet('System validates that withdrawal does not exceed available Net Balance'),
      bullet('Withdrawal reasons: Infrastructure, Scholarship, SACCO Dividend, Outreach, Admin Expenses, Emergency, Other'),
      bullet('Methods: MTN Mobile Money, Airtel Mobile Money, Bank Transfer, Cash'),
      bullet('Full withdrawal history table with delete capability'),
      bullet('Net Balance and Total Withdrawn metric cards update in real-time'),

      h2('5.5 Other Dashboard Sections'),
      bullet('Recent Feedback — star ratings, labels, and comments from users'),
      bullet('Submitted Applications — all fundraising, charity, job, internship forms'),
      bullet('Donations Received — completed donation records'),
      pageBreak(),

      // ── 6. SACCO SYSTEM ──
      h1('6. SACCO System'),
      p('The Savings and Credit Cooperative (SACCO) allows alumni to contribute financially toward the growth of Bugema University. Contributions are tracked, verified by admin, and the total fund is displayed publicly.'),
      new Paragraph({ text: '' }),
      h2('6.1 Contribution Process'),
      bullet('Logged-in alumni navigate to the SACCO page'),
      bullet('Fill in: Full Name, Membership Tier, Amount, Mobile Money TX ID, and optional Note'),
      bullet('Submit — contribution is saved with status "pending"'),
      bullet('Admin reviews in dashboard and verifies or rejects'),
      bullet('Verified contributions count toward the SACCO Fund total'),

      h2('6.2 Admin Verification'),
      bullet('Admin views pending contributions in "SACCO Contributions — Pending Verification"'),
      bullet('Clicks Verify ✓ — contribution moves to "Verified Members" list instantly'),
      bullet('Verified section shows each member with tier badge, amount, running total, and TX ID'),
      bullet('Grand total is displayed at the bottom of the verified table'),
      pageBreak(),

      // ── 7. NOTIFICATION SYSTEM ──
      h1('7. Notification System'),
      h2('7.1 In-App Notifications'),
      p('When admin approves or denies a user, an in-app notification is stored in the database. The next time the user logs in (or visits any page while logged in), a popup modal appears showing the notification.'),
      bullet('Approval notification: green card with 🎉 icon, personalized message with tier'),
      bullet('Denial notification: amber card with ⚠️ icon, contact information for appeal'),
      bullet('User can dismiss the popup — it will not reappear (marked as read)'),
      bullet('"Go to Portal →" button for approved users'),

      h2('7.2 Email Notifications'),
      p('Email notifications are sent via Nodemailer using Gmail SMTP. To enable, configure the following in .env:'),
      bullet('MAIL_USER — Gmail address to send from'),
      bullet('MAIL_PASS — Gmail App Password (from myaccount.google.com/apppasswords)'),
      bullet('MAIL_FROM — Display name and email for the sender'),
      p('If email is not configured, notifications are skipped silently — in-app notifications still work.'),
      pageBreak(),

      // ── 8. DATABASE SCHEMA ──
      h1('8. Database Schema'),
      p('Database: SQLite (alumni.db). All tables are created automatically on first server start.'),
      new Paragraph({ text: '' }),

      h2('users'),
      makeTable(
        ['Column', 'Type', 'Description'],
        [
          ['id', 'INTEGER PK', 'Auto-increment user ID'],
          ['name', 'TEXT', 'Full name'],
          ['email', 'TEXT UNIQUE', 'Email address'],
          ['password_hash', 'TEXT', 'bcrypt hashed password'],
          ['role', 'TEXT', 'alumni | student | admin'],
          ['membership_tier', 'TEXT', 'ordinary | silver | gold | NULL'],
          ['payment_tx_id', 'TEXT', 'Mobile Money TX ID for alumni'],
          ['status', 'TEXT', 'pending | approved | denied'],
          ['created_at', 'TEXT', 'Registration timestamp'],
        ]
      ),

      h2('sacco_contributions'),
      makeTable(
        ['Column', 'Type', 'Description'],
        [
          ['id', 'INTEGER PK', 'Auto-increment'],
          ['user_id', 'INTEGER', 'FK to users.id'],
          ['user_name', 'TEXT', 'Contributor name'],
          ['membership_tier', 'TEXT', 'Tier at time of contribution'],
          ['amount', 'REAL', 'Contribution amount (UGX)'],
          ['tx_id', 'TEXT', 'Mobile Money TX ID'],
          ['note', 'TEXT', 'Optional note'],
          ['status', 'TEXT', 'pending | verified | rejected'],
          ['created_at', 'TEXT', 'Timestamp'],
        ]
      ),

      h2('withdrawals'),
      makeTable(
        ['Column', 'Type', 'Description'],
        [
          ['id', 'INTEGER PK', 'Auto-increment'],
          ['amount', 'REAL', 'Withdrawal amount (UGX)'],
          ['reason', 'TEXT', 'Reason for withdrawal'],
          ['method', 'TEXT', 'Payment method used'],
          ['account_ref', 'TEXT', 'Account number or phone reference'],
          ['withdrawn_by', 'TEXT', 'Admin name who authorized'],
          ['created_at', 'TEXT', 'Timestamp'],
        ]
      ),

      h2('notifications'),
      makeTable(
        ['Column', 'Type', 'Description'],
        [
          ['id', 'INTEGER PK', 'Auto-increment'],
          ['user_id', 'INTEGER', 'FK to users.id'],
          ['type', 'TEXT', 'approval | denial'],
          ['title', 'TEXT', 'Notification headline'],
          ['message', 'TEXT', 'Full notification message'],
          ['is_read', 'INTEGER', '0 = unread, 1 = read'],
          ['created_at', 'TEXT', 'Timestamp'],
        ]
      ),

      h2('feedback'),
      makeTable(
        ['Column', 'Type', 'Description'],
        [
          ['id', 'INTEGER PK', 'Auto-increment'],
          ['reviewer_name', 'TEXT', 'Reviewer name (optional)'],
          ['rating', 'INTEGER', '1–5 star rating'],
          ['label', 'TEXT', 'Excellent | Good | Average | Poor | Terrible'],
          ['comment', 'TEXT', 'Written feedback'],
          ['created_at', 'TEXT', 'Timestamp'],
        ]
      ),

      h2('applications'),
      makeTable(
        ['Column', 'Type', 'Description'],
        [
          ['id', 'INTEGER PK', 'Auto-increment'],
          ['form_type', 'TEXT', 'Fundraising | Charity | Job Application | etc.'],
          ['data_json', 'TEXT', 'JSON of all submitted form fields'],
          ['created_at', 'TEXT', 'Timestamp'],
        ]
      ),

      h2('donations'),
      makeTable(
        ['Column', 'Type', 'Description'],
        [
          ['id', 'INTEGER PK', 'Auto-increment'],
          ['donor_name', 'TEXT', 'Donor full name'],
          ['email', 'TEXT', 'Donor email'],
          ['amount', 'REAL', 'Donation amount'],
          ['currency', 'TEXT', 'UGX'],
          ['purpose', 'TEXT', 'Fundraising | Charity | etc.'],
          ['status', 'TEXT', 'pending | completed | failed'],
          ['tx_ref', 'TEXT', 'Flutterwave transaction reference'],
          ['created_at', 'TEXT', 'Timestamp'],
        ]
      ),
      pageBreak(),

      // ── 9. API ENDPOINTS ──
      h1('9. API Endpoints'),

      h2('9.1 Authentication'),
      makeTable(
        ['Method', 'Endpoint', 'Description'],
        [
          ['POST', '/api/auth/register', 'Register new user (status: pending)'],
          ['POST', '/api/auth/login', 'Login — returns user object'],
        ]
      ),

      h2('9.2 Admin Endpoints (require admin user-id header)'),
      makeTable(
        ['Method', 'Endpoint', 'Description'],
        [
          ['GET', '/api/admin/data', 'Get all dashboard data (stats, users, SACCO, etc.)'],
          ['POST', '/api/admin/users/:id/approve', 'Approve a user + create notification'],
          ['POST', '/api/admin/users/:id/deny', 'Deny a user + create notification'],
          ['POST', '/api/admin/sacco/:id/verify', 'Verify a SACCO contribution'],
          ['POST', '/api/admin/sacco/:id/reject', 'Reject a SACCO contribution'],
          ['POST', '/api/admin/withdraw', 'Record a fund withdrawal'],
          ['DELETE', '/api/admin/withdraw/:id', 'Delete a withdrawal record'],
        ]
      ),

      h2('9.3 Public / User Endpoints'),
      makeTable(
        ['Method', 'Endpoint', 'Description'],
        [
          ['POST', '/api/applications', 'Submit a form application'],
          ['POST', '/api/feedback', 'Submit star rating & review'],
          ['GET', '/api/feedback/public', 'Get public reviews for home page'],
          ['GET', '/api/notifications', 'Get user notifications (requires user-id header)'],
          ['POST', '/api/notifications/read', 'Mark all notifications as read'],
          ['POST', '/api/sacco/contribute', 'Submit SACCO contribution'],
          ['GET', '/api/donations/live', 'Get live donation feed data'],
          ['POST', '/api/donations/initiate', 'Initiate a donation record'],
        ]
      ),
      pageBreak(),

      // ── 10. PAYMENTS ──
      h1('10. Payment Integration'),
      h2('10.1 Flutterwave'),
      p('Flutterwave is used for processing donations from the fundraising and charity forms. Configure API keys in .env:'),
      bullet('FLW_PUBLIC_KEY — Flutterwave public key'),
      bullet('FLW_SECRET_KEY — Flutterwave secret key'),
      bullet('FLW_ENCRYPTION_KEY — Flutterwave encryption key'),

      h2('10.2 Mobile Money (Manual)'),
      p('For SACCO contributions and alumni registration fees, payment is made directly to the admin Mobile Money number:'),
      bold('Admin Mobile Money Number: 0763682699'),
      p('The user submits the Transaction ID as proof. Admin verifies the transaction manually via their phone and then approves via the dashboard.'),
      pageBreak(),

      // ── 11. SECURITY ──
      h1('11. Security & Access Control'),
      h2('11.1 Authentication'),
      bullet('Passwords are hashed using bcryptjs (10 salt rounds) before storage'),
      bullet('User sessions are stored in browser localStorage'),
      bullet('Admin endpoints require a user-id header matching an admin-role account'),

      h2('11.2 Form Access Control'),
      bullet('All application forms (fundraising, charity, mentorship, jobs, internships) are auth-gated'),
      bullet('Unauthenticated users see a 🔒 "Access Restricted" banner with Sign In/Register buttons'),
      bullet('Pending users cannot submit forms until admin approval'),
      bullet('Chat is restricted to approved users only'),

      h2('11.3 Admin Panel'),
      bullet('Admin login is separate from user login (admin-login.html)'),
      bullet('All /api/admin/* endpoints verify user-id corresponds to an admin role'),
      bullet('Non-admin users receive a 403 Forbidden response'),
      pageBreak(),

      // ── 12. SETUP GUIDE ──
      h1('12. Installation & Setup Guide'),
      h2('12.1 Prerequisites'),
      bullet('Node.js v18 or higher'),
      bullet('npm (comes with Node.js)'),
      bullet('A modern web browser'),

      h2('12.2 Installation Steps'),
      new Paragraph({ children: [new TextRun({ text: 'Step 1: ', bold: true }), new TextRun('Navigate to the project folder in your terminal')], spacing: { before: 80 } }),
      new Paragraph({ children: [new TextRun({ text: 'Step 2: ', bold: true }), new TextRun('Run: npm install')], spacing: { before: 80 } }),
      new Paragraph({ children: [new TextRun({ text: 'Step 3: ', bold: true }), new TextRun('Configure your .env file with Flutterwave keys and email credentials')], spacing: { before: 80 } }),
      new Paragraph({ children: [new TextRun({ text: 'Step 4: ', bold: true }), new TextRun('Run: npm start')], spacing: { before: 80 } }),
      new Paragraph({ children: [new TextRun({ text: 'Step 5: ', bold: true }), new TextRun('Open http://localhost:3000 in your browser')], spacing: { before: 80 } }),

      h2('12.3 Default Admin Account'),
      makeTable(
        ['Field', 'Value'],
        [
          ['Email', 'admin@alumnibugemauniv.ac.ug'],
          ['Role', 'admin'],
          ['URL', 'http://localhost:3000/admin-login.html'],
        ]
      ),

      h2('12.4 Environment Variables (.env)'),
      makeTable(
        ['Variable', 'Description'],
        [
          ['FLW_PUBLIC_KEY', 'Flutterwave public API key'],
          ['FLW_SECRET_KEY', 'Flutterwave secret API key'],
          ['FLW_ENCRYPTION_KEY', 'Flutterwave encryption key'],
          ['PORT', 'Server port (default: 3000)'],
          ['SESSION_SECRET', 'Session signing secret'],
          ['MAIL_USER', 'Gmail address for sending notifications'],
          ['MAIL_PASS', 'Gmail App Password (16-character)'],
          ['MAIL_FROM', 'Display name + email for outgoing mail'],
        ]
      ),
      new Paragraph({ text: '' }),
      hr(),
      new Paragraph({ children: [new TextRun({ text: '© 2026 Bugema University Alumni Association — System Documentation', italics: true, color: '94A3B8' })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Bugema_Alumni_Portal_Documentation.docx', buffer);
  console.log('✅ Documentation generated: Bugema_Alumni_Portal_Documentation.docx');
}).catch(err => {
  console.error('Error:', err);
});
