import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'fee_challan.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    -- Campuses
    CREATE TABLE IF NOT EXISTS campuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      address TEXT,
      contact_phone TEXT,
      email TEXT,
      website TEXT,
      logo_path TEXT,
      secondary_logo_path TEXT,
      tagline TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Families (keyed by guardian contact number)
    CREATE TABLE IF NOT EXISTS families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_name TEXT NOT NULL,
      guardian_name TEXT,
      contact_phone TEXT NOT NULL UNIQUE,
      address TEXT,
      voucher_preference TEXT DEFAULT 'individual',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Classes
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      academic_year TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Sections
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      class_teacher TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    -- Students
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      father_name TEXT,
      mother_name TEXT,
      dob TEXT,
      gender TEXT,
      cnic_bform TEXT,
      class_id INTEGER,
      section_id INTEGER,
      roll_no TEXT,
      family_id TEXT,
      status TEXT DEFAULT 'active',
      enrollment_date TEXT,
      withdrawal_date TEXT,
      photo_path TEXT,
      contact_phone TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (section_id) REFERENCES sections(id)
    );

    -- Fee Heads
    CREATE TABLE IF NOT EXISTS fee_heads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Fee Structures
    CREATE TABLE IF NOT EXISTS fee_structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      section_id INTEGER,
      fee_head_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT DEFAULT 'monthly',
      effective_from TEXT,
      effective_to TEXT,
      version INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (section_id) REFERENCES sections(id),
      FOREIGN KEY (fee_head_id) REFERENCES fee_heads(id)
    );

    -- Concession Templates
    CREATE TABLE IF NOT EXISTS concession_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      applicable_fee_heads TEXT,
      eligibility TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Student Concessions
    CREATE TABLE IF NOT EXISTS student_concessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      template_id INTEGER,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      fee_head_id INTEGER,
      reason TEXT,
      is_permanent INTEGER DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      approved_by INTEGER,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (template_id) REFERENCES concession_templates(id),
      FOREIGN KEY (fee_head_id) REFERENCES fee_heads(id)
    );

    -- Sibling Discount Rules
    CREATE TABLE IF NOT EXISTS sibling_discount_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      sibling_order INTEGER NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Bank Accounts
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      bank_name TEXT NOT NULL,
      branch_name TEXT,
      account_title TEXT NOT NULL,
      account_number TEXT NOT NULL,
      iban TEXT,
      is_primary INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Wallet Accounts
    CREATE TABLE IF NOT EXISTS wallet_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      provider TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_title TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Challans
    CREATE TABLE IF NOT EXISTS challans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER NOT NULL,
      challan_no TEXT NOT NULL UNIQUE,
      student_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      total_amount REAL DEFAULT 0,
      concession_amount REAL DEFAULT 0,
      net_amount REAL DEFAULT 0,
      arrears REAL DEFAULT 0,
      late_fee REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      due_date TEXT,
      status TEXT DEFAULT 'unpaid',
      template_id INTEGER,
      generated_by INTEGER,
      generated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (template_id) REFERENCES voucher_templates(id)
    );

    -- Challan Items
    CREATE TABLE IF NOT EXISTS challan_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challan_id INTEGER NOT NULL,
      fee_head_id INTEGER NOT NULL,
      original_amount REAL NOT NULL,
      concession_amount REAL DEFAULT 0,
      concession_reason TEXT,
      net_amount REAL NOT NULL,
      FOREIGN KEY (challan_id) REFERENCES challans(id) ON DELETE CASCADE,
      FOREIGN KEY (fee_head_id) REFERENCES fee_heads(id)
    );

    -- Family Vouchers
    CREATE TABLE IF NOT EXISTS family_vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      voucher_no TEXT NOT NULL UNIQUE,
      family_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      total_amount REAL DEFAULT 0,
      concession_amount REAL DEFAULT 0,
      net_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'unpaid',
      template_id INTEGER,
      generated_by INTEGER,
      generated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id),
      FOREIGN KEY (family_id) REFERENCES families(id),
      FOREIGN KEY (template_id) REFERENCES voucher_templates(id)
    );

    -- Family Voucher Students
    CREATE TABLE IF NOT EXISTS family_voucher_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      campus_id INTEGER,
      subtotal REAL DEFAULT 0,
      FOREIGN KEY (voucher_id) REFERENCES family_vouchers(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER NOT NULL,
      challan_id INTEGER,
      voucher_id INTEGER,
      amount_paid REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_mode TEXT NOT NULL,
      receipt_no TEXT,
      cheque_no TEXT,
      reference_no TEXT,
      bank_account_id INTEGER,
      recorded_by INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id),
      FOREIGN KEY (challan_id) REFERENCES challans(id),
      FOREIGN KEY (voucher_id) REFERENCES family_vouchers(id),
      FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
    );

    -- Voucher Templates
    CREATE TABLE IF NOT EXISTS voucher_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      name TEXT NOT NULL,
      size_width_mm REAL DEFAULT 210,
      size_height_mm REAL DEFAULT 297,
      orientation TEXT DEFAULT 'portrait',
      copies_per_voucher INTEGER DEFAULT 3,
      layout_json TEXT,
      colors_json TEXT,
      border_style TEXT DEFAULT 'thin',
      bg_type TEXT DEFAULT 'solid',
      bg_value TEXT DEFAULT '#ffffff',
      version INTEGER DEFAULT 1,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Print Configs
    CREATE TABLE IF NOT EXISTS print_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      paper_size TEXT DEFAULT 'A4',
      paper_orientation TEXT DEFAULT 'portrait',
      page_margins_json TEXT DEFAULT '{"top":10,"bottom":10,"left":10,"right":10}',
      vouchers_per_page INTEGER DEFAULT 1,
      layout_grid TEXT DEFAULT '1x1',
      cut_marks INTEGER DEFAULT 0,
      separate_family_voucher INTEGER DEFAULT 1,
      is_default INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Late Fee Rules
    CREATE TABLE IF NOT EXISTS late_fee_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      rule_type TEXT NOT NULL,
      value REAL NOT NULL,
      grace_days INTEGER DEFAULT 0,
      max_cap REAL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Institute Settings
    CREATE TABLE IF NOT EXISTS institute_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      key TEXT NOT NULL,
      value TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      campus_ids TEXT DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Audit Log
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    -- Promotion Batches
    CREATE TABLE IF NOT EXISTS promotion_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER NOT NULL,
      from_class_id INTEGER NOT NULL,
      to_class_id INTEGER NOT NULL,
      academic_year TEXT,
      promoted_by INTEGER,
      promoted_at TEXT DEFAULT (datetime('now')),
      student_count INTEGER DEFAULT 0,
      is_reversed INTEGER DEFAULT 0,
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    -- Student Transfers
    CREATE TABLE IF NOT EXISTS student_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      from_campus_id INTEGER NOT NULL,
      to_campus_id INTEGER NOT NULL,
      from_class_id INTEGER,
      to_class_id INTEGER,
      transfer_date TEXT DEFAULT (datetime('now')),
      transferred_by INTEGER,
      notes TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- Sync Log
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      sync_direction TEXT,
      records_synced INTEGER DEFAULT 0,
      status TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      error_log TEXT
    );
  `);

  // Seed default data if empty
  const campusCount = db.prepare('SELECT COUNT(*) as count FROM campuses').get() as { count: number };
  if (campusCount.count === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  // Default campus
  db.exec(`
    INSERT INTO campuses (name, code, address, contact_phone, email, tagline) VALUES
    ('City Campus', 'CTY', '123 Main Street, Lahore', '042-35761234', 'city@institute.edu.pk', 'Excellence in Education'),
    ('Gulberg Branch', 'GUL', '45 Gulberg III, Lahore', '042-35890123', 'gulberg@institute.edu.pk', 'Nurturing Future Leaders');
  `);

  // Default users
  db.exec(`
    INSERT INTO users (username, password_hash, full_name, role, campus_ids) VALUES
    ('admin', '$2b$10$placeholder', 'System Administrator', 'org_admin', '[1,2]'),
    ('accountant1', '$2b$10$placeholder', 'Ali Ahmed', 'accountant', '[1]'),
    ('accountant2', '$2b$10$placeholder', 'Sara Khan', 'accountant', '[2]');
  `);

  // Classes for both campuses
  const classNames = ['Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  for (const campusId of [1, 2]) {
    classNames.forEach((name, i) => {
      db.prepare('INSERT INTO classes (campus_id, name, display_order, academic_year, is_active) VALUES (?, ?, ?, ?, 1)')
        .run(campusId, name, i + 1, '2025-2026');
    });
  }

  // Sections for each class
  const sections = ['A', 'B'];
  const allClasses = db.prepare('SELECT id FROM classes').all() as { id: number }[];
  for (const cls of allClasses) {
    for (const sec of sections) {
      db.prepare('INSERT INTO sections (class_id, name) VALUES (?, ?)').run(cls.id, sec);
    }
  }

  // Fee Heads
  db.exec(`
    INSERT INTO fee_heads (campus_id, name, description) VALUES
    (NULL, 'Tuition Fee', 'Monthly tuition fee'),
    (NULL, 'Lab Fee', 'Science/Computer lab fee'),
    (NULL, 'Sports Fee', 'Sports and extracurricular activities'),
    (NULL, 'Transport Fee', 'School transport service'),
    (NULL, 'Exam Fee', 'Examination fee'),
    (NULL, 'Computer Fee', 'Computer lab usage fee'),
    (NULL, 'Library Fee', 'Library membership and maintenance');
  `);

  // Fee Structures for campus 1 classes
  const campus1Classes = db.prepare('SELECT id, display_order FROM classes WHERE campus_id = 1').all() as { id: number; display_order: number }[];
  const feeHeads = db.prepare('SELECT id FROM fee_heads').all() as { id: number }[];
  const baseFees = [2000, 500, 300, 1000, 500, 400, 200];
  for (const cls of campus1Classes) {
    feeHeads.forEach((fh, i) => {
      const amount = baseFees[i] + (cls.display_order * 200);
      db.prepare('INSERT INTO fee_structures (campus_id, class_id, fee_head_id, amount, frequency, effective_from) VALUES (1, ?, ?, ?, ?, ?)')
        .run(cls.id, fh.id, amount, i === 4 ? 'quarterly' : 'monthly', '2025-04-01');
    });
  }

  // Fee Structures for campus 2
  const campus2Classes = db.prepare('SELECT id, display_order FROM classes WHERE campus_id = 2').all() as { id: number; display_order: number }[];
  for (const cls of campus2Classes) {
    feeHeads.forEach((fh, i) => {
      const amount = baseFees[i] + (cls.display_order * 150);
      db.prepare('INSERT INTO fee_structures (campus_id, class_id, fee_head_id, amount, frequency, effective_from) VALUES (2, ?, ?, ?, ?, ?)')
        .run(cls.id, fh.id, amount, i === 4 ? 'quarterly' : 'monthly', '2025-04-01');
    });
  }

  // Families (contact_phone is the unique family identifier)
  db.exec(`
    INSERT INTO families (family_name, guardian_name, contact_phone, address, voucher_preference) VALUES
    ('Ahmed Family', 'Mr. Ahmed Khan', '03001234567', '12 Model Town, Lahore', 'family'),
    ('Ali Family', 'Mr. Ali Raza', '03219876543', '45 DHA Phase 5, Lahore', 'individual'),
    ('Hassan Family', 'Mr. Hassan Sheikh', '03335551234', '78 Johar Town, Lahore', 'family'),
    ('Malik Family', 'Mr. Tariq Malik', '03457778899', '23 Cantt, Lahore', 'individual'),
    ('Khan Family', 'Mr. Imran Khan', '03124445566', '56 Iqbal Town, Lahore', 'family');
  `);

  // Students — family_id is now the guardian's contact number (TEXT)
  const studentData: (string | number | null)[][] = [
    [1, 'Ahmad Khan', 'Ahmed Khan', 'Fatima Khan', 'M', 1, 1, '001', '03001234567'],
    [1, 'Ayesha Khan', 'Ahmed Khan', 'Fatima Khan', 'F', 3, 5, '002', '03001234567'],
    [1, 'Sara Ali', 'Ali Raza', 'Nida Ali', 'F', 2, 3, '003', '03219876543'],
    [1, 'Usman Ali', 'Ali Raza', 'Nida Ali', 'M', 5, 9, '004', '03219876543'],
    [1, 'Zainab Hassan', 'Hassan Sheikh', 'Amna Hassan', 'F', 4, 7, '005', '03335551234'],
    [1, 'Bilal Hassan', 'Hassan Sheikh', 'Amna Hassan', 'M', 7, 13, '006', '03335551234'],
    [1, 'Hamza Malik', 'Tariq Malik', 'Sana Malik', 'M', 6, 11, '007', '03457778899'],
    [1, 'Fatima Malik', 'Tariq Malik', 'Sana Malik', 'F', 8, 15, '008', '03457778899'],
    [1, 'Ibrahim Khan', 'Imran Khan', 'Hina Khan', 'M', 9, 17, '009', '03124445566'],
    [1, 'Maryam Khan', 'Imran Khan', 'Hina Khan', 'F', 10, 19, '010', '03124445566'],
    [2, 'Asad Mahmood', 'Mahmood Ahmad', 'Rabia Mahmood', 'M', 13, 25, '001', null],
    [2, 'Hira Mahmood', 'Mahmood Ahmad', 'Rabia Mahmood', 'F', 15, 29, '002', null],
    [2, 'Fahad Siddiqui', 'Kamran Siddiqui', 'Nazia Siddiqui', 'M', 14, 27, '003', null],
    [2, 'Maham Tariq', 'Tariq Hussain', 'Saima Tariq', 'F', 16, 31, '004', null],
    [2, 'Owais Qureshi', 'Nadeem Qureshi', 'Asma Qureshi', 'M', 18, 35, '005', null],
  ];

  const insertStudent = db.prepare(`
    INSERT INTO students (campus_id, name, father_name, mother_name, gender, class_id, section_id, roll_no, family_id, enrollment_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '2025-04-01', 'active')
  `);

  for (const s of studentData) {
    insertStudent.run(...s);
  }

  // Bank Accounts
  db.exec(`
    INSERT INTO bank_accounts (campus_id, bank_name, branch_name, account_title, account_number, iban, is_primary) VALUES
    (NULL, 'HBL', 'Gulberg Branch', 'Institute Fee Collection', '1234567890', 'PK36HABB0001234567890100', 1),
    (NULL, 'MCB', 'Model Town Branch', 'Institute Fee Account', '0987654321', 'PK36MUCB0000987654321000', 0),
    (1, 'UBL', 'City Branch', 'City Campus Fees', '1122334455', 'PK36UNIL0001122334455000', 0);
  `);

  // Wallet Accounts
  db.exec(`
    INSERT INTO wallet_accounts (campus_id, provider, account_number, account_title) VALUES
    (NULL, 'JazzCash', '0300-1234567', 'Institute Fee Collection'),
    (NULL, 'EasyPaisa', '0345-9876543', 'Institute Fee Collection');
  `);

  // Concession Templates
  db.exec(`
    INSERT INTO concession_templates (campus_id, name, type, value, applicable_fee_heads, eligibility) VALUES
    (NULL, 'Staff Child', 'percentage', 50, '["all"]', 'Children of institute staff'),
    (NULL, 'Sibling Discount', 'percentage', 10, '["tuition"]', 'Second sibling onward'),
    (NULL, 'Scholarship', 'percentage', 100, '["all"]', 'Merit-based full scholarship'),
    (NULL, 'Orphan Waiver', 'waiver', 100, '["all"]', 'Orphaned students'),
    (NULL, 'Financial Hardship', 'percentage', 25, '["tuition","lab","computer"]', 'Verified financial need');
  `);

  // Sibling Discount Rules
  db.exec(`
    INSERT INTO sibling_discount_rules (campus_id, sibling_order, discount_type, discount_value) VALUES
    (NULL, 2, 'percentage', 10),
    (NULL, 3, 'percentage', 15),
    (NULL, 4, 'percentage', 20);
  `);

  // Late Fee Rules
  db.exec(`
    INSERT INTO late_fee_rules (campus_id, rule_type, value, grace_days, max_cap) VALUES
    (NULL, 'flat_per_day', 50, 5, 1000);
  `);

  // Default Voucher Template
  db.exec(`
    INSERT INTO voucher_templates (campus_id, name, size_width_mm, size_height_mm, orientation, copies_per_voucher, layout_json, colors_json, border_style, is_default) VALUES
    (NULL, 'Classic Template', 210, 297, 'portrait', 3,
     '{"logo_position":"top-center","logo_size":"medium","name_font_size":18,"body_font_size":11}',
     '{"primary":"#1a365d","secondary":"#2d3748","accent":"#3182ce","text":"#1a202c","bg":"#ffffff"}',
     'thin', 1);
  `);

  // Default Print Config
  db.exec(`
    INSERT INTO print_configs (campus_id, paper_size, paper_orientation, vouchers_per_page, layout_grid, cut_marks, separate_family_voucher, is_default) VALUES
    (NULL, 'A4', 'portrait', 1, '1x1', 0, 1, 1);
  `);

  // Institute Settings
  db.exec(`
    INSERT INTO institute_settings (campus_id, key, value) VALUES
    (NULL, 'organization_name', 'Educational Institute'),
    (NULL, 'academic_year', '2025-2026'),
    (NULL, 'current_billing_month', '4'),
    (NULL, 'current_billing_year', '2026'),
    (NULL, 'default_due_date', '10'),
    (NULL, 'receipt_format', '{campus_code}-RCP-{year}-{seq}'),
    (NULL, 'challan_format', '{campus_code}-CHN-{year}-{month}-{seq}');
  `);

  // Some sample challans
  const now = new Date().toISOString();
  db.exec(`
    INSERT INTO challans (campus_id, challan_no, student_id, month, year, total_amount, concession_amount, net_amount, arrears, late_fee, grand_total, due_date, status, generated_at) VALUES
    (1, 'CTY-CHN-2026-03-00001', 1, 3, 2026, 4900, 0, 4900, 0, 0, 4900, '2026-03-10', 'paid', '${now}'),
    (1, 'CTY-CHN-2026-03-00002', 2, 3, 2026, 5700, 570, 5130, 0, 0, 5130, '2026-03-10', 'paid', '${now}'),
    (1, 'CTY-CHN-2026-03-00003', 3, 3, 2026, 5100, 0, 5100, 0, 0, 5100, '2026-03-10', 'unpaid', '${now}'),
    (1, 'CTY-CHN-2026-03-00004', 5, 3, 2026, 5500, 0, 5500, 0, 0, 5500, '2026-03-10', 'overdue', '${now}'),
    (1, 'CTY-CHN-2026-04-00001', 1, 4, 2026, 4900, 0, 4900, 0, 0, 4900, '2026-04-10', 'unpaid', '${now}'),
    (1, 'CTY-CHN-2026-04-00002', 2, 4, 2026, 5700, 570, 5130, 0, 0, 5130, '2026-04-10', 'unpaid', '${now}');
  `);

  // Sample payments
  db.exec(`
    INSERT INTO payments (campus_id, challan_id, amount_paid, payment_date, payment_mode, receipt_no, recorded_by) VALUES
    (1, 1, 4900, '2026-03-08', 'cash', 'CTY-RCP-2026-00001', 1),
    (1, 2, 5130, '2026-03-09', 'bank', 'CTY-RCP-2026-00002', 1);
  `);
}

export default getDb;
