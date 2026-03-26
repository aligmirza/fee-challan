# Stars Fee Challan Management System

A complete fee challan (voucher) management system built for **Stars Educational Institute** (Kar-e-Khair). Manages student fees, challan generation, family vouchers, payment tracking, and reporting across multiple campuses.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes (Server-side)
- **Database:** SQLite via better-sqlite3 (offline-first, zero config)
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

### Challan Generation (`/challan`)
- Search and select a student
- Auto-loads fee structure based on class/campus
- Shows fee breakdown: original, concession, one-time adjustments, net amount
- Displays active concessions (staff child, scholarship, sibling discount, etc.)
- Generates unique challan number (e.g., `CTY-CHN-2026-03-00001`)
- Link to view/print generated challan

### Challan Detail & Print (`/challan/[id]`)
- Full challan view with institute header, student info, fee table
- Payment recording: cash, bank, cheque, online
- Print-ready layout

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

### Fee Tracker (`/fee-tracker`)
- View all challans with payment status (paid, unpaid, partially paid, overdue)
- Filter by status, class, date range
- Record payments against challans
- Payment history per challan

### Student Management (`/students`)
- **List View:** All students with filters (class, status, search)
- **Family View:** Students grouped by guardian contact number
- Add/edit students with full form (personal, academic, family info)
- Activate/deactivate students (soft delete)
- **Family Grouping:** Students sharing the same guardian contact number are auto-grouped as siblings
- **Family CRUD:** View siblings, add new sibling to family, remove from family group
- Import/Export buttons (UI ready)

### Campus Management (`/campus`)
- Multi-campus support
- Campus details: name, code, address, contact, email, tagline
- Manage classes and sections per campus
- Activate/deactivate campuses

### Reports (`/reports`)
- Defaulters report: students with overdue fees
- Collection summary by month
- Class-wise fee status breakdown

### Settings (`/settings`)
- **Institution:** Organization name, academic year, billing month
- **Fee Configuration:** Fee heads, fee structures per class, concession templates
- **Voucher Design:** Template customization (layout, colors, borders)
- **Print Configuration:** Paper size, margins, vouchers per page, cut marks
- **General:** Challan/receipt number format, default due date

## Database Schema

20+ tables including:

| Table | Purpose |
|-------|---------|
| `campuses` | Multi-campus support |
| `families` | Family groups keyed by guardian contact (UNIQUE) |
| `students` | Student records, `family_id` = guardian's phone number |
| `classes` / `sections` | Academic structure per campus |
| `fee_heads` | Fee categories (tuition, lab, transport, etc.) |
| `fee_structures` | Amount per fee head per class per campus |
| `concession_templates` | Discount rules (staff child, scholarship, etc.) |
| `student_concessions` | Applied concessions per student |
| `sibling_discount_rules` | Auto sibling discounts by order |
| `challans` / `challan_items` | Generated fee challans with line items |
| `family_vouchers` | Consolidated family vouchers |
| `payments` | Payment records with receipt numbers |
| `bank_accounts` / `wallet_accounts` | Payment collection accounts |
| `voucher_templates` | Customizable voucher layouts |
| `print_configs` | Print settings |
| `late_fee_rules` | Overdue fee rules |
| `institute_settings` | Global configuration |
| `users` | User accounts with role-based access |
| `audit_log` | Activity tracking |

## Family Grouping System

Family groups are created automatically using the **guardian's contact number** as the family identifier:

- When adding a student, enter the guardian's phone number (e.g., `03001234567`)
- All students sharing the same guardian contact are automatically grouped as siblings
- The `families` table stores guardian name, family name, address, and voucher preference
- Family records are auto-created when a new guardian contact is first used
- Use the **Families** tab in Student Management to view and manage family groups

## API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/students` | GET, POST | List/create students |
| `/api/students/[id]` | GET, PUT, DELETE | Student CRUD |
| `/api/families` | GET, POST | List/create families |
| `/api/families/[id]` | GET, PUT | Family details with siblings |
| `/api/campuses` | GET | List campuses |
| `/api/classes` | GET | Classes by campus |
| `/api/sections` | GET | Sections by class |
| `/api/fee-heads` | GET | Fee categories |
| `/api/fee-structures` | GET | Fee amounts by class |
| `/api/concessions` | GET | Concession templates |
| `/api/student-concessions` | GET | Student-specific concessions |
| `/api/challans` | GET | List challans |
| `/api/challans/[id]` | GET | Challan detail |
| `/api/challans/generate` | POST | Generate challan |
| `/api/bulk-generate` | POST | Bulk challan generation |
| `/api/family-vouchers` | GET | List family vouchers |
| `/api/family-vouchers/generate` | POST | Generate family voucher |
| `/api/payments` | GET, POST | Payment records |
| `/api/dashboard` | GET | Dashboard stats |
| `/api/settings` | GET, PUT | Institute settings |
| `/api/bank-accounts` | GET | Bank accounts |
| `/api/voucher-templates` | GET | Voucher templates |
| `/api/print-configs` | GET | Print configurations |
| `/api/reports/defaulters` | GET | Defaulters report |

## Project Structure

```
fee-challan/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (20+ endpoints)
│   │   ├── bulk-generation/    # Bulk challan generation
│   │   ├── campus/             # Campus management
│   │   ├── challan/            # Challan generation & detail
│   │   ├── family-voucher/     # Family voucher generation
│   │   ├── fee-tracker/        # Payment tracking
│   │   ├── reports/            # Reports & analytics
│   │   ├── search/             # Student search
│   │   ├── settings/           # System settings
│   │   ├── students/           # Student & family management
│   │   ├── layout.tsx          # Root layout with sidebar
│   │   └── page.tsx            # Dashboard
│   ├── components/
│   │   ├── layout/             # Sidebar, Header, CampusContext
│   │   └── ui/                 # DataTable, Modal, StatCard, StatusBadge
│   ├── lib/
│   │   └── db.ts               # SQLite connection, schema, seed data
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── data/                       # SQLite database (auto-created)
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

Private - Stars Educational Institute (Kar-e-Khair)
