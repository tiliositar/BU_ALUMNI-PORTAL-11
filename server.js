/**
 * Bugema University Alumni Portal — Backend Server
 * Express + Socket.IO + Flutterwave + SQLite
 */
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Flutterwave = require('flutterwave-node-v3');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ── Flutterwave Setup ──────────────────────────────────────────────
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Nodemailer Setup ───────────────────────────────────────────────
const nodemailer = require('nodemailer');

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Test the connection at startup (non-blocking)
mailer.verify().then(() => {
  console.log('  ✅ Email service ready (' + process.env.MAIL_USER + ')');
}).catch(err => {
  console.warn('  ⚠️  Email service not configured — set MAIL_USER & MAIL_PASS in .env');
  console.warn('     Emails will be skipped until configured.');
});

/**
 * Send an approval or denial email to a user.
 * Fails silently so it never blocks an API response.
 */
async function sendApprovalEmail({ name, email, approved, membership_tier }) {
  if (!process.env.MAIL_USER || process.env.MAIL_PASS === 'your_gmail_app_password_here') {
    console.log(`[Email skipped — not configured] Would send ${approved ? 'approval' : 'denial'} to ${email}`);
    return;
  }
  const tier = membership_tier ? membership_tier.charAt(0).toUpperCase() + membership_tier.slice(1) : null;
  const tierLine = tier ? `<p style="margin:0 0 12px;">Membership Tier: <strong style="color:#c9a227;">${tier}</strong></p>` : '';

  const approvedHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#0d1b3e,#1a3a6e);padding:32px;text-align:center;">
        <img src="https://www.bugemauniv.ac.ug/wp-content/uploads/2021/03/bu-logo.png" alt="BU Logo" style="height:60px;margin-bottom:12px;" />
        <h1 style="margin:0;color:#f0b429;font-size:22px;">Welcome to the BU Alumni Network! 🎓</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#1e293b;font-size:16px;">Dear <strong>${name}</strong>,</p>
        <p style="color:#475569;">We are pleased to inform you that your registration on the <strong>Bugema University Alumni Portal</strong> has been <span style="color:#15803d;font-weight:700;">approved</span> by the administrator.</p>
        ${tierLine}
        <p style="color:#475569;">You can now log in and access all alumni features including:</p>
        <ul style="color:#475569;line-height:2;">
          <li>Community Chat &amp; Networking</li>
          <li>Job Opportunities &amp; Career Resources</li>
          <li>Events &amp; Alumni Gatherings</li>
          <li>SACCO Contributions</li>
        </ul>
        <div style="text-align:center;margin:28px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background:linear-gradient(135deg,#0f766e,#0b5f58);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Log In to Your Account</a>
        </div>
        <p style="color:#94a3b8;font-size:13px;">If you have any questions, contact us at alumni@bugemauniversity.ac.ug</p>
      </div>
      <div style="background:#f8fafc;padding:16px 32px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;">
        &copy; 2026 Bugema University Alumni Association. All rights reserved.
      </div>
    </div>`;

  const deniedHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:#0d1b3e;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#f0b429;font-size:22px;">Registration Update</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#1e293b;font-size:16px;">Dear <strong>${name}</strong>,</p>
        <p style="color:#475569;">We regret to inform you that your registration on the <strong>Bugema University Alumni Portal</strong> has not been approved at this time.</p>
        <p style="color:#475569;">This may be due to incomplete or unverifiable payment details. If you believe this is an error, please contact us with your payment transaction ID.</p>
        <p style="color:#475569;">📧 <a href="mailto:alumni@bugemauniversity.ac.ug" style="color:#0f766e;">alumni@bugemauniversity.ac.ug</a></p>
        <p style="color:#94a3b8;font-size:13px;">You are welcome to register again with valid payment proof.</p>
      </div>
      <div style="background:#f8fafc;padding:16px 32px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;">
        &copy; 2026 Bugema University Alumni Association. All rights reserved.
      </div>
    </div>`;

  try {
    await mailer.sendMail({
      from: process.env.MAIL_FROM || `"Bugema University Alumni" <${process.env.MAIL_USER}>`,
      to: email,
      subject: approved
        ? '✅ Your BU Alumni Registration Has Been Approved!'
        : 'Registration Update — Bugema University Alumni Portal',
      html: approved ? approvedHtml : deniedHtml
    });
    console.log(`  📧 Email sent (${approved ? 'approval' : 'denial'}) → ${email}`);
  } catch (err) {
    console.error(`  ⚠️  Failed to send email to ${email}:`, err.message);
  }
}

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

// ── Track online users for chat ────────────────────────────────────
const onlineUsers = new Map(); // socketId -> { id, name, role }

// =====================================================================
//  AUTH API
// =====================================================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, membership_tier, tx_id } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['alumni', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Role must be alumni or student' });
    }

    if (role === 'alumni') {
      if (!membership_tier || !tx_id) {
        return res.status(400).json({ error: 'Alumni registration requires membership tier and payment transaction ID' });
      }
    }

    // Check existing
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // All new registrations start as 'pending' — admin must approve both alumni and students
    const status = 'pending';

    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password_hash, role, membership_tier, payment_tx_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, email, hash, role, membership_tier || null, tx_id || null, status);

    res.status(201).json({
      message: 'Registration submitted! Please wait for admin approval. You will receive a notification once your account is approved.',
      user: { id: result.lastInsertRowid, name, email, role, membership_tier, status }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block denied users
    if (user.status === 'denied') {
      return res.status(403).json({ error: 'Your registration was denied by the administrator. Please contact support.' });
    }

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, membership_tier: user.membership_tier, status: user.status }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================================
//  DONATIONS API
// =====================================================================

// Initiate a donation — create a record and return tx_ref for Flutterwave
app.post('/api/donations/initiate', (req, res) => {
  try {
    const { donor_name, email, amount, currency, purpose, category, payment_method, tx_id } = req.body;

    if (!donor_name || !email || !amount) {
      return res.status(400).json({ error: 'Name, email, and amount are required' });
    }

    const tx_ref = 'BU-' + uuidv4();

    const stmt = db.prepare(`
      INSERT INTO donations (donor_name, email, amount, currency, purpose, category, payment_method, tx_ref, flw_ref, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);
    stmt.run(
      donor_name,
      email,
      parseFloat(amount),
      currency || 'UGX',
      purpose || 'General Fund',
      category || 'fundraising',
      payment_method || 'card',
      tx_ref,
      tx_id || null
    );

    res.json({ tx_ref, message: 'Donation initiated' });
  } catch (err) {
    console.error('Donation initiate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify donation after Flutterwave callback
app.post('/api/donations/verify', async (req, res) => {
  try {
    const { transaction_id, tx_ref } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    // Verify with Flutterwave
    const response = await flw.Transaction.verify({ id: transaction_id });

    if (
      response.data &&
      response.data.status === 'successful' &&
      response.data.tx_ref === tx_ref
    ) {
      // Update donation status in database
      db.prepare(`
        UPDATE donations SET status = 'completed', flw_ref = ?, flw_tx_id = ?
        WHERE tx_ref = ?
      `).run(response.data.flw_ref, response.data.id, tx_ref);

      const donation = db.prepare('SELECT * FROM donations WHERE tx_ref = ?').get(tx_ref);

      // Broadcast to all connected clients via Socket.IO
      io.emit('new-donation', {
        donor_name: donation.donor_name,
        amount: donation.amount,
        currency: donation.currency,
        purpose: donation.purpose,
        category: donation.category,
        created_at: donation.created_at
      });

      return res.json({ status: 'success', message: 'Donation verified and recorded' });
    } else {
      // Update as failed
      db.prepare("UPDATE donations SET status = 'failed' WHERE tx_ref = ?").run(tx_ref);
      return res.status(400).json({ status: 'failed', message: 'Payment verification failed' });
    }
  } catch (err) {
    console.error('Donation verify error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Flutterwave Webhook — receives payment notifications
app.post('/api/donations/webhook', (req, res) => {
  try {
    const payload = req.body;

    // Verify webhook hash (in production, verify the secret hash header)
    if (payload.event === 'charge.completed' && payload.data) {
      const txRef = payload.data.tx_ref;
      const status = payload.data.status === 'successful' ? 'completed' : 'failed';

      db.prepare(`
        UPDATE donations SET status = ?, flw_ref = ?, flw_tx_id = ?
        WHERE tx_ref = ?
      `).run(status, payload.data.flw_ref, payload.data.id, txRef);

      if (status === 'completed') {
        const donation = db.prepare('SELECT * FROM donations WHERE tx_ref = ?').get(txRef);
        if (donation) {
          io.emit('new-donation', {
            donor_name: donation.donor_name,
            amount: donation.amount,
            currency: donation.currency,
            purpose: donation.purpose,
            category: donation.category,
            created_at: donation.created_at
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(200); // Always respond 200 to webhooks
  }
});

// Get recent donations (live feed)
app.get('/api/donations/live', (req, res) => {
  const donations = db.prepare(`
    SELECT donor_name, amount, currency, purpose, category, created_at
    FROM donations
    WHERE status = 'completed'
    ORDER BY created_at DESC
    LIMIT 20
  `).all();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_count,
      COALESCE(SUM(amount), 0) as total_amount
    FROM donations
    WHERE status = 'completed'
  `).get();

  res.json({ donations, stats });
});

// =====================================================================
//  JOBS API
// =====================================================================

app.get('/api/jobs', (req, res) => {
  const jobs = db.prepare(`
    SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50
  `).all();
  res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
  try {
    const { user_id, poster_name, title, company, location, type, description, requirements, salary_range } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ error: 'Title, company, and description are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO jobs (posted_by, poster_name, title, company, location, type, description, requirements, salary_range)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      user_id || 0,
      poster_name || 'Anonymous Alumni',
      title, company,
      location || 'Uganda',
      type || 'Full-time',
      description,
      requirements || '',
      salary_range || 'Negotiable'
    );

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);

    // Broadcast new job to all connected clients
    io.emit('new-job', job);

    res.status(201).json(job);
  } catch (err) {
    console.error('Post job error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================================
//  INTERNSHIPS API
// =====================================================================

app.get('/api/internships', (req, res) => {
  const internships = db.prepare(`
    SELECT * FROM internships ORDER BY created_at DESC LIMIT 50
  `).all();
  res.json(internships);
});

app.post('/api/internships', (req, res) => {
  try {
    const { user_id, poster_name, title, company, location, duration, description, requirements } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ error: 'Title, company, and description are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO internships (posted_by, poster_name, title, company, location, duration, description, requirements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      user_id || 0,
      poster_name || 'Anonymous Alumni',
      title, company,
      location || 'Uganda',
      duration || '3 months',
      description,
      requirements || ''
    );

    const internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(result.lastInsertRowid);

    // Broadcast new internship to all connected clients
    io.emit('new-internship', internship);

    res.status(201).json(internship);
  } catch (err) {
    console.error('Post internship error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================================
//  CHAT API
// =====================================================================

app.get('/api/chat/messages', (req, res) => {
  const messages = db.prepare(`
    SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 100
  `).all();
  res.json(messages.reverse()); // Return oldest first
});

// =====================================================================
//  SOCKET.IO — Real-Time Events
// =====================================================================

io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  // User joins chat
  socket.on('user-join', (userData) => {
    onlineUsers.set(socket.id, {
      id: userData.id,
      name: userData.name,
      role: userData.role
    });
    io.emit('online-users', Array.from(onlineUsers.values()));
    io.emit('user-joined', { name: userData.name, role: userData.role });
  });

  // Chat message
  socket.on('chat-message', (data) => {
    const { sender_id, sender_name, sender_role, message } = data;

    if (!message || !message.trim()) return;

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO chat_messages (sender_id, sender_name, sender_role, message)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(sender_id, sender_name, sender_role, message.trim());
    const saved = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);

    // Broadcast to all clients
    io.emit('chat-message', saved);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.broadcast.emit('user-typing', { name: data.name, role: data.role });
  });

  socket.on('stop-typing', () => {
    socket.broadcast.emit('user-stop-typing');
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    io.emit('online-users', Array.from(onlineUsers.values()));
    if (user) {
      io.emit('user-left', { name: user.name });
    }
    console.log(`✖ Client disconnected: ${socket.id}`);
  });
});

// =====================================================================
//  ADMIN / FEEDBACK / APPLICATIONS API
// =====================================================================

app.post('/api/feedback', (req, res) => {
  try {
    const { rating, label, comment, reviewer_name } = req.body;
    if (!rating) return res.status(400).json({ error: 'Rating is required' });

    const stmt = db.prepare('INSERT INTO feedback (rating, label, comment, reviewer_name) VALUES (?, ?, ?, ?)');
    stmt.run(rating, label, comment || '', reviewer_name || 'Anonymous');
    
    res.status(201).json({ message: 'Feedback saved' });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public feedback — only entries that have a comment
app.get('/api/feedback/public', (req, res) => {
  try {
    const reviews = db.prepare(
      `SELECT id, rating, label, comment, reviewer_name, created_at
       FROM feedback
       WHERE comment IS NOT NULL AND comment != ''
       ORDER BY created_at DESC
       LIMIT 20`
    ).all();
    const stats = db.prepare(
      `SELECT COUNT(*) as total,
              ROUND(AVG(rating), 1) as avg_rating,
              SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
              SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
              SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
              SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as low_star
       FROM feedback`
    ).get();
    res.json({ reviews, stats });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/applications', (req, res) => {
  try {
    const { form_type, data_json } = req.body;
    if (!form_type || !data_json) return res.status(400).json({ error: 'Form type and data are required' });

    const stmt = db.prepare('INSERT INTO applications (form_type, data_json) VALUES (?, ?)');
    stmt.run(form_type, typeof data_json === 'string' ? data_json : JSON.stringify(data_json));
    
    res.status(201).json({ message: 'Application saved' });
  } catch (err) {
    console.error('Application error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

app.get('/api/admin/data', adminAuth, (req, res) => {
  try {
    const stats = {
      donationsTotal:    db.prepare("SELECT SUM(amount) as sum FROM donations WHERE status = 'completed'").get().sum || 0,
      feedbackCount:     db.prepare("SELECT COUNT(*) as count FROM feedback").get().count || 0,
      applicationsCount: db.prepare("SELECT COUNT(*) as count FROM applications").get().count || 0,
      usersCount:        db.prepare("SELECT COUNT(*) as count FROM users").get().count || 0,
      pendingApprovals:  db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'").get().count || 0,
      saccoTotal:        db.prepare("SELECT COALESCE(SUM(amount),0) as sum FROM sacco_contributions WHERE status = 'verified'").get().sum || 0,
      withdrawalsTotal:  db.prepare("SELECT COALESCE(SUM(amount),0) as sum FROM withdrawals").get().sum || 0
    };
    // Net balance = donations + sacco verified - withdrawals
    stats.netBalance = (stats.donationsTotal + stats.saccoTotal) - stats.withdrawalsTotal;

    const feedback     = db.prepare("SELECT * FROM feedback ORDER BY created_at DESC LIMIT 50").all();
    const applications = db.prepare("SELECT * FROM applications ORDER BY created_at DESC LIMIT 50").all();
    const pendingDonations = db.prepare("SELECT * FROM donations WHERE status = 'pending' ORDER BY created_at DESC").all();
    const verifiedDonations = db.prepare("SELECT * FROM donations WHERE status = 'completed' ORDER BY created_at DESC LIMIT 50").all();
    const users        = db.prepare("SELECT id, name, email, role, membership_tier, payment_tx_id, status, created_at FROM users ORDER BY created_at DESC LIMIT 100").all();
    const saccoPending  = db.prepare("SELECT * FROM sacco_contributions WHERE status = 'pending'  ORDER BY created_at DESC").all();
    const saccoVerified = db.prepare("SELECT * FROM sacco_contributions WHERE status = 'verified' ORDER BY created_at DESC").all();
    const withdrawals   = db.prepare("SELECT * FROM withdrawals ORDER BY created_at DESC").all();

    res.json({ stats, feedback, applications, pendingDonations, verifiedDonations, users, saccoPending, saccoVerified, withdrawals });
  } catch (err) {
    console.error('Admin data error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Record a withdrawal
app.post('/api/admin/withdraw', adminAuth, (req, res) => {
  try {
    const { amount, reason, method, account_ref } = req.body;
    if (!amount || !reason || !method || !account_ref) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Check available balance
    const donationsTotal = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM donations WHERE status='completed'").get().s || 0;
    const saccoTotal     = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM sacco_contributions WHERE status='verified'").get().s || 0;
    const withdrawn      = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM withdrawals").get().s || 0;
    const netBalance     = (donationsTotal + saccoTotal) - withdrawn;

    if (Number(amount) > netBalance) {
      return res.status(400).json({
        error: `Insufficient balance. Available: UGX ${netBalance.toLocaleString()}`
      });
    }

    const adminUser = db.prepare('SELECT name FROM users WHERE id = ?').get(req.headers['user-id']);
    const withdrawn_by = adminUser ? adminUser.name : 'Admin';

    const result = db.prepare(
      'INSERT INTO withdrawals (amount, reason, method, account_ref, withdrawn_by) VALUES (?, ?, ?, ?, ?)'
    ).run(Number(amount), reason, method, account_ref, withdrawn_by);

    const newBalance = netBalance - Number(amount);
    res.status(201).json({
      message: 'Withdrawal recorded successfully',
      id: result.lastInsertRowid,
      newBalance
    });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Delete a withdrawal record
app.delete('/api/admin/withdraw/:id', adminAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM withdrawals WHERE id = ?').run(req.params.id);
    res.json({ message: 'Withdrawal record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Approve user + in-app notification + email
app.post('/api/admin/users/:id/approve', adminAuth, async (req, res) => {
  try {
    const uid = req.params.id;
    db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").run(uid);

    // Create in-app notification
    const user = db.prepare('SELECT name, email, role, membership_tier FROM users WHERE id = ?').get(uid);
    if (user) {
      let accessMsg = '';
      if (user.role === 'alumni') {
        const tierText = user.membership_tier
          ? ` as a ${user.membership_tier.charAt(0).toUpperCase() + user.membership_tier.slice(1)} member`
          : '';
        accessMsg = `Your Bugema University Alumni registration has been approved${tierText}. You now have full access to all alumni features including Chat, SACCO, Events, and Career Opportunities.`;
      } else {
        accessMsg = `Your Bugema University Student portal registration has been approved. You now have full access to the alumni portal including Community Chat, Events, News, and Career Opportunities.`;
      }
      db.prepare(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'approval', ?, ?)`
      ).run(
        uid,
        '🎉 Registration Approved!',
        `Congratulations ${user.name}! ${accessMsg}`
      );
      // Also try email (non-blocking, fails silently if unconfigured)
      sendApprovalEmail({ ...user, approved: true });
    }

    res.json({ message: 'User approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Deny user + in-app notification + email
app.post('/api/admin/users/:id/deny', adminAuth, async (req, res) => {
  try {
    const uid = req.params.id;
    db.prepare("UPDATE users SET status = 'denied' WHERE id = ?").run(uid);

    // Create in-app notification
    const user = db.prepare('SELECT name, email, role FROM users WHERE id = ?').get(uid);
    if (user) {
      const contactLine = user.role === 'alumni'
        ? 'Please contact us at alumni@bugemauniversity.ac.ug with your Mobile Money Transaction ID to appeal.'
        : 'Please contact us at alumni@bugemauniversity.ac.ug for further assistance.';
      db.prepare(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'denial', ?, ?)`
      ).run(
        uid,
        '⚠️ Registration Not Approved',
        `Dear ${user.name}, your registration on the Bugema University Alumni Portal was not approved at this time. ${contactLine}`
      );
      // Also try email (non-blocking)
      sendApprovalEmail({ ...user, approved: false });
    }

    res.json({ message: 'User denied' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Notifications API ──────────────────────────────────────────────
// Get unread notifications for logged-in user
app.get('/api/notifications', (req, res) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const notes = db.prepare(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).all(userId);
    const unreadCount = db.prepare(
      `SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0`
    ).get(userId).c;
    res.json({ notifications: notes, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notifications as read
app.post('/api/notifications/read', (req, res) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(userId);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================================
//  SACCO API
// =====================================================================

// Submit a SACCO contribution (alumni only)
app.post('/api/sacco/contribute', (req, res) => {
  try {
    const { user_id, user_name, membership_tier, amount, tx_id, note } = req.body;
    if (!user_id || !user_name || !amount || !tx_id) {
      return res.status(400).json({ error: 'user_id, user_name, amount and tx_id are required' });
    }
    if (parseFloat(amount) < 10000) {
      return res.status(400).json({ error: 'Minimum SACCO contribution is UGX 10,000' });
    }
    db.prepare(
      'INSERT INTO sacco_contributions (user_id, user_name, membership_tier, amount, tx_id, note) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user_id, user_name, membership_tier || null, parseFloat(amount), tx_id, note || null);
    res.status(201).json({ message: 'Contribution submitted for verification' });
  } catch (err) {
    console.error('SACCO contribute error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get public SACCO contributions (verified)
app.get('/api/sacco/contributions', (req, res) => {
  try {
    const contributions = db.prepare(
      "SELECT id, user_name, membership_tier, amount, note, created_at FROM sacco_contributions WHERE status = 'verified' ORDER BY created_at DESC LIMIT 50"
    ).all();
    const stats = db.prepare(
      "SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM sacco_contributions WHERE status = 'verified'"
    ).get();
    res.json({ contributions, stats });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Verify SACCO contribution
app.post('/api/admin/sacco/:id/verify', adminAuth, (req, res) => {
  try {
    db.prepare("UPDATE sacco_contributions SET status = 'verified' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Contribution verified' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Reject SACCO contribution
app.post('/api/admin/sacco/:id/reject', adminAuth, (req, res) => {
  try {
    db.prepare("DELETE FROM sacco_contributions WHERE id = ?").run(req.params.id);
    res.json({ message: 'Contribution rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Verify Donation
app.post('/api/admin/donations/:id/verify', adminAuth, (req, res) => {
  try {
    db.prepare("UPDATE donations SET status = 'completed' WHERE id = ?").run(req.params.id);
    // Fetch updated donation to broadcast via socket
    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(req.params.id);
    if (donation) {
      io.emit('new-donation', {
        donor_name: donation.donor_name,
        amount: donation.amount,
        currency: donation.currency,
        purpose: donation.purpose,
        category: donation.category,
        created_at: donation.created_at
      });
    }
    res.json({ message: 'Donation verified' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Reject Donation
app.post('/api/admin/donations/:id/reject', adminAuth, (req, res) => {
  try {
    db.prepare("DELETE FROM donations WHERE id = ?").run(req.params.id);
    res.json({ message: 'Donation rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



// =====================================================================
//  SEED ADMIN (Ensure admin exists on fresh deployments)
// =====================================================================

async function seedAdmin() {
  const email = 'admin@alumnibugemauniv.ac.ug';
  const name = 'Admin';
  const password = 'Microsoft@2030'; // Your default admin password
  
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (!existing) {
    console.log('  🏗️  No admin found. Seeding default administrator...');
    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)')
      .run(name, email, hash, 'admin', 'active');
    console.log('  ✅ Default admin seeded successfully.');
  }
}

// =====================================================================
//  START SERVER
// =====================================================================

const PORT = process.env.PORT || 3000;
seedAdmin().then(() => {
  server.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════════╗');
    console.log('  ║   🎓 Bugema University Alumni Portal            ║');
    console.log(`  ║   🌐 Server running at http://localhost:${PORT}    ║`);
    console.log('  ║   📡 Socket.IO ready for real-time updates      ║');
    console.log('  ║   💳 Flutterwave payment integration active     ║');
    console.log('  ╚══════════════════════════════════════════════════╝');
    console.log('');
  });
});
