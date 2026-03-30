# Fee Challan Management System

A complete fee challan (voucher) management system for educational institutes. Manages student fees, challan generation, family vouchers, payment tracking, and reporting across multiple campuses. Available as both a web app and a **Windows desktop installer**.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes (Server-side)
- **Database:** SQLite via better-sqlite3 (offline-first, zero config)
- **Desktop:** Electron + electron-builder (Windows/macOS/Linux)
- **Icons:** Lucide React
- **PDF:** jsPDF + jspdf-autotable

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Production build
npm run build && npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The SQLite database is auto-created on first run at `data/fee_challan.db` with seed data (2 campuses, 15 students, 5 families, fee structures, sample challans & payments).

## Desktop App (Electron)

```bash
# Run in Electron (development)
npm run electron:dev

# Build Windows installer (.exe)
npm run electron:build:win

# Build macOS installer (.dmg)
npm run electron:build:mac

# Build Linux installer (.AppImage)
npm run electron:build:linux
```

Output: `dist-electron/Fee-Challan-Setup-1.0.0.exe`

See [BUILD.md](BUILD.md) for detailed build instructions.

## Features

### Dashboard (`/`)
- Real-time stats: today's collections, pending challans, overdue count, active students
- Monthly collection chart
- Recent payments list
- Campus-scoped via top-right campus selector

### Student Search (`/search`)
- Quick search by name, father name, roll number, or guardian contact
- Advanced filters: class, section, status
- Click to view student details or generate challan

### Fee Management (`/fee-management`)
- **Fee Heads:** Create and manage fee categories (tuition, lab, transport, etc.)
- **Fee Structures:** Assign default amounts per fee head per class — this is the base fee every student in that class pays
- **Concession Templates:** Create reusable discount rules (percentage, fixed amount, or full waiver)
- **Student Concessions:** Search students and assign permanent concessions (e.g. scholarship, staff child) — auto-applied at every challan generation

### Class Management (`/classes`)
- Add, edit, and delete classes per campus
- Set display order and academic year per class
- Activate/deactivate classes
- Manage sections within each class (add, edit, delete)
- Set class teacher per section
- Deletion blocked if students are assigned to a class or section

### Challan Generation (`/challan`)
- Search and select a student
- Auto-loads fee structure based on class/campus
- Shows fee breakdown: original, concession, one-time adjustments, net amount
- **Include/Exclude fee types per challan** — uncheck any fee head to remove it from this challan only (e.g. exclude Transport Fee for a student who doesn't use transport)
- Displays active concessions (staff child, scholarship, sibling discount, etc.)
- Generates unique challan number (e.g., `CTY-CHN-2026-03-00001`)
- If challan already exists, shows it with options to view/print or edit fee details

### Challan Detail & Print (`/challan/[id]`)
- Full challan view with dynamic institute header, logo, student info, fee table
- Bank details printed on challan
- Print-ready layout with auto-named PDF (e.g., "Ahmed Ali - Fee Challan March 2026")

### Family Voucher (`/family-voucher`)
- Search families by name, guardian, or contact number
- Consolidated fee view for all siblings in the family
- Per-child fee breakdown with campus info
- Grand total across all children
- Sibling discount indicators

### Bulk Generation (`/bulk-generation`)
- Generate challans for entire class, section, or campus at once
- Select month/year, filter by class
- Preview count before generating
- Batch processing with progress feedback

### View Vouchers (`/vouchers`)
- Browse all generated vouchers and challans
- Filter and search

### Fee Collection (`/collections`)
- Record payments against challans
- Supports cash, bank, cheque, online methods
- Partial payment tracking

### Fee Tracker (`/fee-tracker`)
- View all challans with payment status (paid, unpaid, partially paid, overdue)
- Filter by status, class, date range
- Payment history per challan

### Student Management (`/students`)
- **List View:** All students with filters (class, status, search)
- **Family View:** Students grouped by guardian contact number
- Add/edit students with full form (personal, academic, family info)
- Activate/deactivate students (soft delete)
- Import/Export via CSV

### Campus Management (`/campus`)
- Multi-campus support
- Campus details: name, code, address, contact, email, tagline
- Activate/deactivate campuses

### Reports (`/reports`)
- Defaulters report: students with overdue fees
- Collection summary by month
- Class-wise fee status breakdown

### History (`/history`)
- Audit trail of all transactions and system changes

### Settings (`/settings`)
- **Institution:** Organization name, tagline, academic year, logo upload
- **Bank Details:** Bank account information for challans
- **Voucher Design:** Template customization (layout, colors, borders)
- **Print Configuration:** Paper size, margins, vouchers per page

### API Documentation (`/api-docs`)
- Interactive Swagger-style API docs
- 31+ endpoints documented with parameters, examples, and cURL commands
- Tag-based filtering and search

### Help Center (`/help`)
- Getting started guide
- Module-by-module documentation
- Fee workflow walkthrough
- FAQs with search

## Database Schema

20+ tables including:

| Table | Purpose |
|-------|---------|
| `campuses` | Multi-campus support |
| `families` | Family groups keyed by guardian contact (UNIQUE) |
| `students` | Student records linked to families |
| `classes` / `sections` | Academic structure per campus |
| `fee_heads` | Fee categories (tuition, lab, transport, etc.) |
| `fee_structures` | Amount per fee head per class per campus |
| `concession_templates` | Discount rules (staff child, scholarship, etc.) |
| `student_concessions` | Applied concessions per student |
| `challans` / `challan_items` | Generated fee challans with line items |
| `family_vouchers` | Consolidated family vouchers |
| `payments` | Payment records with receipt numbers |
| `bank_accounts` | Payment collection accounts |
| `voucher_templates` | Customizable voucher layouts |
| `print_configs` | Print settings |
| `institute_settings` | Global configuration |
| `audit_log` | Activity tracking |

## API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/students` | GET, POST | List/create students |
| `/api/students/[id]` | GET, PUT, DELETE | Student CRUD |
| `/api/students/import` | POST | Import students from CSV |
| `/api/students/export` | GET | Export students |
| `/api/families` | GET, POST | List/create families |
| `/api/families/[id]` | GET, PUT | Family details with siblings |
| `/api/campuses` | GET, POST | List/create campuses |
| `/api/campuses/[id]` | GET, PUT, DELETE | Campus CRUD |
| `/api/classes` | GET, POST | List/create classes |
| `/api/classes/[id]` | PUT, DELETE | Update/delete class |
| `/api/sections` | GET, POST | List/create sections |
| `/api/sections/[id]` | PUT, DELETE | Update/delete section |
| `/api/fee-heads` | GET, POST | Fee categories |
| `/api/fee-heads/[id]` | GET, PUT, DELETE | Fee head CRUD |
| `/api/fee-structures` | GET, POST | Fee amounts by class |
| `/api/concessions` | GET, POST | Concession templates |
| `/api/concessions/[id]` | GET, PUT, DELETE | Concession CRUD |
| `/api/student-concessions` | GET, POST | Student concessions |
| `/api/student-concessions/[id]` | PUT, DELETE | Update/remove concession |
| `/api/challans` | GET | List challans |
| `/api/challans/[id]` | GET, PUT | Challan detail/update |
| `/api/challans/generate` | POST | Generate challan |
| `/api/bulk-generate` | POST | Bulk challan generation |
| `/api/family-vouchers` | GET | List family vouchers |
| `/api/family-vouchers/[id]` | GET | Family voucher detail |
| `/api/family-vouchers/generate` | POST | Generate family voucher |
| `/api/payments` | GET, POST | Payment records |
| `/api/dashboard` | GET | Dashboard stats |
| `/api/settings` | GET, POST | Institute settings |
| `/api/bank-accounts` | GET | Bank accounts |
| `/api/voucher-templates` | GET | Voucher templates |
| `/api/print-configs` | GET | Print configurations |
| `/api/reports/defaulters` | GET | Defaulters report |

## Project Structure

```
fee-challan/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (31+ endpoints)
│   │   ├── api-docs/           # Swagger-style API documentation
│   │   ├── bulk-generation/    # Bulk challan generation
│   │   ├── campus/             # Campus management
│   │   ├── challan/            # Challan generation & detail
│   │   ├── classes/            # Class & section management
│   │   ├── collections/        # Fee collection
│   │   ├── family-voucher/     # Family voucher generation
│   │   ├── fee-management/     # Fee heads, structures, concessions
│   │   ├── fee-tracker/        # Payment tracking
│   │   ├── help/               # Help center
│   │   ├── history/            # Audit history
│   │   ├── reports/            # Reports & analytics
│   │   ├── search/             # Student search
│   │   ├── settings/           # System settings
│   │   ├── students/           # Student management
│   │   ├── vouchers/           # View vouchers
│   │   ├── layout.tsx          # Root layout with sidebar
│   │   └── page.tsx            # Dashboard
│   ├── components/
│   │   ├── layout/             # Sidebar, Header, CampusContext
│   │   └── ui/                 # DataTable, Modal, StatCard, StatusBadge
│   ├── lib/
│   │   └── db.ts               # SQLite connection, schema, seed data
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── electron/                   # Electron main process & preload
├── data/                       # SQLite database (auto-created)
├── electron-builder.config.js  # Desktop app build config
├── BUILD.md                    # Desktop build instructions
├── package.json
└── README.md
```

## Seed Data

The app auto-seeds on first run with:
- **2 campuses:** City Campus (CTY), Gulberg Branch (GUL)
- **24 classes:** Nursery through Class 10 for each campus
- **48 sections:** A and B for each class
- **7 fee heads:** Tuition, Lab, Sports, Transport, Exam, Computer, Library
- **5 families:** Ahmed, Ali, Hassan, Malik, Khan
- **15 students:** 10 in City Campus, 5 in Gulberg Branch
- **5 concession templates:** Staff Child, Sibling, Scholarship, Orphan, Hardship
- **Sample challans and payments** for demo purposes

## License

MIT
