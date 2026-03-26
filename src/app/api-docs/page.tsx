'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react';

const methodColors: Record<string, string> = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-amber-500',
  DELETE: 'bg-red-500',
};

const methodBg: Record<string, string> = {
  GET: 'bg-green-50 border-green-200',
  POST: 'bg-blue-50 border-blue-200',
  PUT: 'bg-amber-50 border-amber-200',
  DELETE: 'bg-red-50 border-red-200',
};

interface Param {
  name: string;
  in: 'query' | 'path' | 'body';
  type: string;
  required?: boolean;
  description: string;
}

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  description?: string;
  tag: string;
  params?: Param[];
  body?: { fields: { name: string; type: string; required?: boolean; description: string }[] };
  response?: string;
}

const endpoints: Endpoint[] = [
  // ─── SETTINGS ───
  { method: 'GET', path: '/api/settings', summary: 'Get institute settings', tag: 'Settings',
    params: [{ name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus (returns campus-specific + global)' }],
    response: '[{ "id": 1, "campus_id": null, "key": "organization_name", "value": "Educational Institute", "created_at": "...", "updated_at": "..." }]' },
  { method: 'POST', path: '/api/settings', summary: 'Create or update a setting', tag: 'Settings',
    body: { fields: [
      { name: 'campus_id', type: 'number|null', description: 'Campus ID (null for global setting)' },
      { name: 'key', type: 'string', required: true, description: 'Setting key (e.g. organization_name, tagline, logo_base64)' },
      { name: 'value', type: 'string', required: true, description: 'Setting value' },
    ]},
    response: '{ "success": true }' },

  // ─── CAMPUSES ───
  { method: 'GET', path: '/api/campuses', summary: 'List all campuses', tag: 'Campuses',
    response: '[{ "id": 1, "name": "City Campus", "code": "CTY", "address": "...", "is_active": 1 }]' },
  { method: 'POST', path: '/api/campuses', summary: 'Create a campus', tag: 'Campuses',
    body: { fields: [
      { name: 'name', type: 'string', required: true, description: 'Campus name' },
      { name: 'code', type: 'string', required: true, description: 'Unique campus code (e.g. CTY)' },
      { name: 'address', type: 'string', description: 'Campus address' },
      { name: 'contact_phone', type: 'string', description: 'Phone number' },
      { name: 'email', type: 'string', description: 'Email address' },
      { name: 'tagline', type: 'string', description: 'Campus tagline' },
    ]} },
  { method: 'GET', path: '/api/campuses/{id}', summary: 'Get campus details with stats', tag: 'Campuses',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Campus ID' }],
    response: '{ "id": 1, "name": "City Campus", "student_count": 10, "challan_count": 5, "defaulter_count": 2, "total_collected": 50000, "classes": [...] }' },
  { method: 'PUT', path: '/api/campuses/{id}', summary: 'Update a campus', tag: 'Campuses',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Campus ID' }],
    body: { fields: [
      { name: 'name', type: 'string', description: 'Campus name' },
      { name: 'code', type: 'string', description: 'Campus code' },
      { name: 'address', type: 'string', description: 'Address' },
      { name: 'is_active', type: 'number', description: '1=active, 0=inactive' },
    ]} },

  // ─── CLASSES & SECTIONS ───
  { method: 'GET', path: '/api/classes', summary: 'List classes', tag: 'Classes & Sections',
    params: [{ name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' }],
    response: '[{ "id": 1, "name": "Nursery", "display_order": 1 }]' },
  { method: 'POST', path: '/api/classes', summary: 'Create a class', tag: 'Classes & Sections',
    body: { fields: [{ name: 'name', type: 'string', required: true, description: 'Class name' }, { name: 'display_order', type: 'number', description: 'Sort order' }] } },
  { method: 'GET', path: '/api/sections', summary: 'List sections', tag: 'Classes & Sections',
    params: [{ name: 'class_id', in: 'query', type: 'number', description: 'Filter by class' }] },
  { method: 'POST', path: '/api/sections', summary: 'Create a section', tag: 'Classes & Sections',
    body: { fields: [{ name: 'class_id', type: 'number', required: true, description: 'Parent class ID' }, { name: 'name', type: 'string', required: true, description: 'Section name (e.g. A, B)' }] } },

  // ─── STUDENTS ───
  { method: 'GET', path: '/api/students', summary: 'List/search students', tag: 'Students',
    params: [
      { name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' },
      { name: 'class_id', in: 'query', type: 'number', description: 'Filter by class' },
      { name: 'section_id', in: 'query', type: 'number', description: 'Filter by section' },
      { name: 'status', in: 'query', type: 'string', description: 'active|inactive|withdrawn' },
      { name: 'search', in: 'query', type: 'string', description: 'Search name, father_name, roll_no' },
    ],
    response: '[{ "id": 1, "name": "Ahmad Khan", "father_name": "...", "class_name": "Nursery", "section_name": "A", "roll_no": "001" }]' },
  { method: 'POST', path: '/api/students', summary: 'Create a student', tag: 'Students',
    body: { fields: [
      { name: 'campus_id', type: 'number', required: true, description: 'Campus ID' },
      { name: 'name', type: 'string', required: true, description: 'Student name' },
      { name: 'father_name', type: 'string', description: 'Father name' },
      { name: 'class_id', type: 'number', required: true, description: 'Class ID' },
      { name: 'section_id', type: 'number', description: 'Section ID' },
      { name: 'roll_no', type: 'string', description: 'Roll number' },
      { name: 'family_id', type: 'string', description: 'Guardian contact phone (links to family)' },
      { name: 'gender', type: 'string', description: 'male|female' },
      { name: 'dob', type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
      { name: 'contact_phone', type: 'string', description: 'Student/parent phone' },
      { name: 'address', type: 'string', description: 'Home address' },
    ]} },
  { method: 'GET', path: '/api/students/{id}', summary: 'Get student details', tag: 'Students',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Student ID' }] },
  { method: 'PUT', path: '/api/students/{id}', summary: 'Update a student', tag: 'Students',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Student ID' }] },
  { method: 'DELETE', path: '/api/students/{id}', summary: 'Delete/withdraw a student', tag: 'Students',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Student ID' }] },
  { method: 'GET', path: '/api/students/export', summary: 'Export students as CSV', tag: 'Students',
    params: [
      { name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' },
      { name: 'format', in: 'query', type: 'string', description: 'csv (default) or json' },
    ],
    description: 'Returns CSV file download with all student data' },
  { method: 'POST', path: '/api/students/import', summary: 'Bulk import students from CSV data', tag: 'Students',
    body: { fields: [
      { name: 'campus_id', type: 'number', required: true, description: 'Target campus ID' },
      { name: 'rows', type: 'object[]', required: true, description: 'Array of {name, father_name, class_name, section_name, roll_no, guardian_contact, gender, dob, address}' },
    ]},
    response: '{ "imported": 15, "skipped": 2, "errors": 0 }' },

  // ─── FAMILIES ───
  { method: 'GET', path: '/api/families', summary: 'List/search families', tag: 'Families',
    params: [{ name: 'search', in: 'query', type: 'string', description: 'Search family_name, guardian_name, contact_phone, or child name' }] },
  { method: 'POST', path: '/api/families', summary: 'Create a family', tag: 'Families',
    body: { fields: [
      { name: 'family_name', type: 'string', required: true, description: 'Family name' },
      { name: 'guardian_name', type: 'string', required: true, description: 'Guardian name' },
      { name: 'contact_phone', type: 'string', required: true, description: 'Unique contact phone (used as family_id in students)' },
      { name: 'address', type: 'string', description: 'Address' },
    ]} },
  { method: 'GET', path: '/api/families/{id}', summary: 'Get family with enrolled members and fee breakdowns', tag: 'Families',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Family ID' }],
    response: '{ "id": 1, "family_name": "...", "members": [{ "id": 1, "name": "...", "fees": [...], "subtotal": 5600 }] }' },
  { method: 'PUT', path: '/api/families/{id}', summary: 'Update family details', tag: 'Families',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Family ID' }] },

  // ─── FEE HEADS ───
  { method: 'GET', path: '/api/fee-heads', summary: 'List all fee heads', tag: 'Fee Management',
    params: [{ name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus (includes global)' }],
    response: '[{ "id": 1, "name": "Tuition Fee", "description": "Monthly tuition", "is_active": 1 }]' },
  { method: 'POST', path: '/api/fee-heads', summary: 'Create a fee head', tag: 'Fee Management',
    body: { fields: [
      { name: 'name', type: 'string', required: true, description: 'Fee head name' },
      { name: 'description', type: 'string', description: 'Description' },
      { name: 'campus_id', type: 'number', description: 'Campus ID (null for global)' },
    ]} },
  { method: 'GET', path: '/api/fee-heads/{id}', summary: 'Get a fee head', tag: 'Fee Management',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Fee head ID' }] },
  { method: 'PUT', path: '/api/fee-heads/{id}', summary: 'Update a fee head', tag: 'Fee Management',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Fee head ID' }],
    body: { fields: [
      { name: 'name', type: 'string', description: 'Name' },
      { name: 'description', type: 'string', description: 'Description' },
      { name: 'is_active', type: 'number', description: '1=active, 0=inactive' },
    ]} },
  { method: 'DELETE', path: '/api/fee-heads/{id}', summary: 'Delete a fee head (soft-delete if in use)', tag: 'Fee Management',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Fee head ID' }] },

  // ─── FEE STRUCTURES ───
  { method: 'GET', path: '/api/fee-structures', summary: 'List fee structures (class × fee head matrix)', tag: 'Fee Management',
    params: [
      { name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' },
      { name: 'class_id', in: 'query', type: 'number', description: 'Filter by class' },
    ],
    response: '[{ "id": 1, "campus_id": 1, "class_id": 1, "fee_head_id": 1, "amount": 2200, "fee_head_name": "Tuition Fee", "class_name": "Nursery" }]' },
  { method: 'POST', path: '/api/fee-structures', summary: 'Create/update fee structure (auto-versions)', tag: 'Fee Management',
    body: { fields: [
      { name: 'campus_id', type: 'number', required: true, description: 'Campus ID' },
      { name: 'class_id', type: 'number', required: true, description: 'Class ID' },
      { name: 'fee_head_id', type: 'number', required: true, description: 'Fee head ID' },
      { name: 'amount', type: 'number', required: true, description: 'Monthly fee amount (Rs.)' },
      { name: 'frequency', type: 'string', description: 'monthly (default), quarterly, annually' },
    ]},
    description: 'If a structure already exists for the same campus/class/fee_head, it archives the old version and creates a new one with incremented version number.' },

  // ─── CONCESSION TEMPLATES ───
  { method: 'GET', path: '/api/concessions', summary: 'List concession templates', tag: 'Fee Management',
    params: [{ name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' }] },
  { method: 'POST', path: '/api/concessions', summary: 'Create a concession template', tag: 'Fee Management',
    body: { fields: [
      { name: 'name', type: 'string', required: true, description: 'Template name (e.g. Staff Child Discount)' },
      { name: 'type', type: 'string', required: true, description: 'percentage | flat | waiver' },
      { name: 'value', type: 'number', required: true, description: 'Discount value (% for percentage, Rs. for flat, ignored for waiver)' },
      { name: 'applicable_fee_heads', type: 'string', description: 'JSON array of fee_head IDs (null = all)' },
      { name: 'eligibility', type: 'string', description: 'Eligibility criteria description' },
    ]} },
  { method: 'PUT', path: '/api/concessions/{id}', summary: 'Update concession template', tag: 'Fee Management',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Template ID' }] },
  { method: 'DELETE', path: '/api/concessions/{id}', summary: 'Delete concession (soft-delete if in use)', tag: 'Fee Management',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Template ID' }] },

  // ─── STUDENT CONCESSIONS ───
  { method: 'GET', path: '/api/student-concessions', summary: 'Get concessions assigned to a student', tag: 'Fee Management',
    params: [{ name: 'student_id', in: 'query', type: 'number', required: true, description: 'Student ID' }],
    response: '[{ "id": 1, "type": "percentage", "value": 25, "template_name": "Staff Child", "fee_head_name": null, "status": "active" }]' },
  { method: 'POST', path: '/api/student-concessions', summary: 'Assign concession to a student', tag: 'Fee Management',
    body: { fields: [
      { name: 'student_id', type: 'number', required: true, description: 'Student ID' },
      { name: 'type', type: 'string', required: true, description: 'percentage | flat | waiver' },
      { name: 'value', type: 'number', required: true, description: 'Discount value' },
      { name: 'template_id', type: 'number', description: 'Concession template ID (optional)' },
      { name: 'fee_head_id', type: 'number', description: 'Specific fee head (null = all)' },
      { name: 'reason', type: 'string', description: 'Reason for concession' },
      { name: 'is_permanent', type: 'number', description: '1=permanent, 0=date-ranged' },
      { name: 'start_date', type: 'string', description: 'YYYY-MM-DD (if not permanent)' },
      { name: 'end_date', type: 'string', description: 'YYYY-MM-DD (if not permanent)' },
      { name: 'approved_by', type: 'string', description: 'Approver name' },
    ]} },
  { method: 'PUT', path: '/api/student-concessions/{id}', summary: 'Update student concession', tag: 'Fee Management',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Concession ID' }] },
  { method: 'DELETE', path: '/api/student-concessions/{id}', summary: 'Remove student concession', tag: 'Fee Management',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Concession ID' }] },

  // ─── CHALLANS ───
  { method: 'GET', path: '/api/challans', summary: 'List challans with filters', tag: 'Challans',
    params: [
      { name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' },
      { name: 'student_id', in: 'query', type: 'number', description: 'Filter by student' },
      { name: 'status', in: 'query', type: 'string', description: 'unpaid | paid | partial | overdue' },
      { name: 'month', in: 'query', type: 'number', description: 'Fee month (1-12)' },
      { name: 'year', in: 'query', type: 'number', description: 'Fee year' },
      { name: 'search', in: 'query', type: 'string', description: 'Search challan_no, student name, father_name, roll_no' },
    ] },
  { method: 'POST', path: '/api/challans/generate', summary: 'Generate individual student challan', tag: 'Challans',
    description: 'Generates a fee challan for a student. If already exists for the same student/month/year, returns the existing challan with already_exists: true. Supports runtime-edited fee items.',
    body: { fields: [
      { name: 'student_id', type: 'number', required: true, description: 'Student ID' },
      { name: 'campus_id', type: 'number', required: true, description: 'Campus ID' },
      { name: 'month', type: 'number', required: true, description: 'Fee month (1-12)' },
      { name: 'year', type: 'number', required: true, description: 'Fee year' },
      { name: 'items', type: 'object[]', description: 'Optional runtime-edited fee items [{fee_head_id, original_amount, concession_amount, one_time_adjustment, one_time_reason, net_amount}]. If omitted, calculates from DB fee structures.' },
    ]},
    response: '{ "id": 7, "challan_no": "CTY-CHN-2026-03-00005", "grand_total": 18900, "items": [...], "already_exists": false }' },
  { method: 'GET', path: '/api/challans/{id}', summary: 'Get full challan with items, settings, and bank', tag: 'Challans',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Challan ID' }],
    response: '{ "id": 7, "challan_no": "...", "student_name": "...", "items": [{ "fee_head_name": "Tuition", "original_amount": 4000, "net_amount": 4000 }], "settings": { "organization_name": "..." }, "bank": { "bank_name": "HBL", ... } }' },
  { method: 'PUT', path: '/api/challans/{id}', summary: 'Update challan (status, amounts, or replace fee items)', tag: 'Challans',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Challan ID' }],
    description: 'Can update status, due_date, amounts, etc. If `items` array is provided, replaces all challan_items and recalculates totals.',
    body: { fields: [
      { name: 'status', type: 'string', description: 'unpaid | paid | partial | overdue' },
      { name: 'due_date', type: 'string', description: 'New due date' },
      { name: 'items', type: 'object[]', description: 'New fee items [{fee_head_id, original_amount, concession_amount, concession_reason, net_amount}]. Replaces existing items and recalculates totals.' },
    ]} },

  // ─── FAMILY VOUCHERS ───
  { method: 'GET', path: '/api/family-vouchers', summary: 'List family vouchers with filters', tag: 'Family Vouchers',
    params: [
      { name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' },
      { name: 'family_id', in: 'query', type: 'number', description: 'Filter by family' },
      { name: 'status', in: 'query', type: 'string', description: 'unpaid | paid | partial' },
      { name: 'month', in: 'query', type: 'number', description: 'Month' },
      { name: 'year', in: 'query', type: 'number', description: 'Year' },
      { name: 'search', in: 'query', type: 'string', description: 'Search voucher_no, family_name, guardian_name' },
    ] },
  { method: 'POST', path: '/api/family-vouchers/generate', summary: 'Generate family voucher (consolidated for all siblings)', tag: 'Family Vouchers',
    description: 'Generates a combined fee voucher for all active students in a family plus individual challans per student. If already exists, returns existing with already_exists: true.',
    body: { fields: [
      { name: 'family_id', type: 'string', required: true, description: 'Family contact phone or numeric family ID' },
      { name: 'month', type: 'number', required: true, description: 'Fee month' },
      { name: 'year', type: 'number', required: true, description: 'Fee year' },
    ]},
    response: '{ "id": 1, "voucher_no": "CTY-FV-2026-03-00001", "total_amount": 13600, "students": [...], "already_exists": false }' },
  { method: 'GET', path: '/api/family-vouchers/{id}', summary: 'Get full family voucher with students, fees, settings, bank', tag: 'Family Vouchers',
    params: [{ name: 'id', in: 'path', type: 'number', required: true, description: 'Voucher ID' }],
    response: '{ "voucher_no": "...", "family_name": "...", "students": [{ "student_name": "...", "fees": [...], "subtotal": 5600 }], "settings": {...}, "bank": {...} }' },

  // ─── PAYMENTS ───
  { method: 'GET', path: '/api/payments', summary: 'List payments with filters', tag: 'Payments',
    params: [
      { name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' },
      { name: 'challan_id', in: 'query', type: 'number', description: 'Filter by challan' },
      { name: 'date', in: 'query', type: 'string', description: 'Single day (YYYY-MM-DD)' },
      { name: 'from', in: 'query', type: 'string', description: 'Date range start' },
      { name: 'to', in: 'query', type: 'string', description: 'Date range end' },
      { name: 'payment_mode', in: 'query', type: 'string', description: 'cash | bank | online | cheque | jazzcash | easypaisa' },
      { name: 'search', in: 'query', type: 'string', description: 'Search receipt_no, student name, challan_no' },
    ] },
  { method: 'POST', path: '/api/payments', summary: 'Record a payment against a challan', tag: 'Payments',
    body: { fields: [
      { name: 'campus_id', type: 'number', required: true, description: 'Campus ID' },
      { name: 'challan_id', type: 'number', required: true, description: 'Challan ID' },
      { name: 'amount_paid', type: 'number', required: true, description: 'Amount paid (Rs.)' },
      { name: 'payment_date', type: 'string', required: true, description: 'Payment date (YYYY-MM-DD)' },
      { name: 'payment_mode', type: 'string', required: true, description: 'cash | bank | online | cheque | jazzcash | easypaisa' },
      { name: 'notes', type: 'string', description: 'Payment notes' },
    ]},
    description: 'Auto-generates receipt_no and updates challan status to paid/partial based on amount.' },

  // ─── BANK ACCOUNTS ───
  { method: 'GET', path: '/api/bank-accounts', summary: 'List bank accounts', tag: 'Bank Accounts',
    params: [{ name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' }] },
  { method: 'POST', path: '/api/bank-accounts', summary: 'Add a bank account', tag: 'Bank Accounts',
    body: { fields: [
      { name: 'bank_name', type: 'string', required: true, description: 'Bank name' },
      { name: 'branch_name', type: 'string', description: 'Branch name' },
      { name: 'account_title', type: 'string', required: true, description: 'Account title' },
      { name: 'account_number', type: 'string', required: true, description: 'Account number' },
      { name: 'iban', type: 'string', description: 'IBAN' },
      { name: 'is_primary', type: 'number', description: '1=primary bank account' },
    ]} },

  // ─── BULK GENERATION ───
  { method: 'POST', path: '/api/bulk-generate', summary: 'Bulk generate challans for a class/section', tag: 'Challans',
    body: { fields: [
      { name: 'campus_id', type: 'number', required: true, description: 'Campus ID' },
      { name: 'class_id', type: 'number', required: true, description: 'Class ID' },
      { name: 'section_id', type: 'number', description: 'Section ID (optional, all sections if omitted)' },
      { name: 'month', type: 'number', required: true, description: 'Fee month' },
      { name: 'year', type: 'number', required: true, description: 'Fee year' },
    ]},
    response: '{ "generated": 25, "skipped": 3, "errors": 0 }' },

  // ─── REPORTS ───
  { method: 'GET', path: '/api/reports/defaulters', summary: 'Get defaulter report', tag: 'Reports',
    params: [
      { name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' },
      { name: 'month', in: 'query', type: 'number', description: 'Fee month' },
      { name: 'year', in: 'query', type: 'number', description: 'Fee year' },
    ] },

  // ─── DASHBOARD ───
  { method: 'GET', path: '/api/dashboard', summary: 'Get dashboard summary statistics', tag: 'Dashboard',
    params: [{ name: 'campus_id', in: 'query', type: 'number', description: 'Filter by campus' }],
    response: '{ "total_students": 50, "total_collected": 250000, "total_pending": 80000, "defaulters": 12, ... }' },
];

const tags = [...new Set(endpoints.map(e => e.tag))];

export default function ApiDocsPage() {
  const [openEndpoints, setOpenEndpoints] = useState<Set<string>>(new Set());
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const toggle = (key: string) => {
    setOpenEndpoints(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  const filteredEndpoints = activeTag ? endpoints.filter(e => e.tag === activeTag) : endpoints;
  const groupedByTag: Record<string, Endpoint[]> = {};
  for (const ep of filteredEndpoints) {
    if (!groupedByTag[ep.tag]) groupedByTag[ep.tag] = [];
    groupedByTag[ep.tag].push(ep);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <ExternalLink size={20} />
          </div>
          <h1 className="text-2xl font-bold">Fee Challan — API Reference</h1>
        </div>
        <p className="text-gray-400 mt-2">Complete REST API documentation for integrating with the fee management system</p>
        <div className="flex gap-4 mt-4 text-sm">
          <span className="px-3 py-1 bg-white/10 rounded-full">Base URL: <code className="text-blue-300">/api</code></span>
          <span className="px-3 py-1 bg-white/10 rounded-full">Format: JSON</span>
          <span className="px-3 py-1 bg-white/10 rounded-full">{endpoints.length} endpoints</span>
        </div>
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveTag(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${!activeTag ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All ({endpoints.length})
        </button>
        {tags.map(tag => (
          <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTag === tag ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tag} ({endpoints.filter(e => e.tag === tag).length})
          </button>
        ))}
      </div>

      {/* Endpoints by Tag */}
      {Object.entries(groupedByTag).map(([tag, eps]) => (
        <div key={tag}>
          <h2 className="text-lg font-bold text-gray-800 mb-3 mt-6">{tag}</h2>
          <div className="space-y-2">
            {eps.map((ep, i) => {
              const key = `${ep.method}-${ep.path}-${i}`;
              const isOpen = openEndpoints.has(key);
              const curlCmd = `curl -X ${ep.method} "http://localhost:3001${ep.path.replace(/\{(\w+)\}/g, ':$1')}"${ep.body ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(Object.fromEntries(ep.body.fields.filter(f => f.required).map(f => [f.name, f.type === 'number' ? 1 : f.type === 'string' ? '' : null])), null, 0)}'` : ''}`;

              return (
                <div key={key} className={`border rounded-xl overflow-hidden ${isOpen ? methodBg[ep.method] : 'bg-white'}`}>
                  <button onClick={() => toggle(key)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/50 transition">
                    <span className={`${methodColors[ep.method]} text-white text-xs font-bold px-2.5 py-1 rounded min-w-[52px] text-center`}>{ep.method}</span>
                    <code className="text-sm font-mono text-gray-700 flex-1">{ep.path}</code>
                    <span className="text-sm text-gray-500 hidden md:inline">{ep.summary}</span>
                    {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t space-y-4">
                      <p className="text-sm text-gray-600 mt-3">{ep.description || ep.summary}</p>

                      {/* Parameters */}
                      {ep.params && ep.params.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Parameters</h4>
                          <div className="bg-white rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead><tr className="bg-gray-50"><th className="text-left px-3 py-2 text-xs text-gray-500">Name</th><th className="text-left px-3 py-2 text-xs text-gray-500">In</th><th className="text-left px-3 py-2 text-xs text-gray-500">Type</th><th className="text-left px-3 py-2 text-xs text-gray-500">Description</th></tr></thead>
                              <tbody>
                                {ep.params.map(p => (
                                  <tr key={p.name} className="border-t">
                                    <td className="px-3 py-2 font-mono text-xs">{p.name}{p.required && <span className="text-red-500 ml-0.5">*</span>}</td>
                                    <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{p.in}</span></td>
                                    <td className="px-3 py-2 text-gray-500 text-xs">{p.type}</td>
                                    <td className="px-3 py-2 text-gray-600 text-xs">{p.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Request Body */}
                      {ep.body && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Request Body <span className="text-gray-400 font-normal">(application/json)</span></h4>
                          <div className="bg-white rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead><tr className="bg-gray-50"><th className="text-left px-3 py-2 text-xs text-gray-500">Field</th><th className="text-left px-3 py-2 text-xs text-gray-500">Type</th><th className="text-left px-3 py-2 text-xs text-gray-500">Description</th></tr></thead>
                              <tbody>
                                {ep.body.fields.map(f => (
                                  <tr key={f.name} className="border-t">
                                    <td className="px-3 py-2 font-mono text-xs">{f.name}{f.required && <span className="text-red-500 ml-0.5">*</span>}</td>
                                    <td className="px-3 py-2 text-gray-500 text-xs">{f.type}</td>
                                    <td className="px-3 py-2 text-gray-600 text-xs">{f.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Example Response */}
                      {ep.response && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Response Example</h4>
                            <button onClick={() => copyToClipboard(ep.response!, key)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                              <Copy size={12} /> {copied === key ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto"><code>{ep.response}</code></pre>
                        </div>
                      )}

                      {/* cURL Example */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">cURL</h4>
                          <button onClick={() => copyToClipboard(curlCmd, `curl-${key}`)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                            <Copy size={12} /> {copied === `curl-${key}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre className="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg overflow-x-auto"><code>{curlCmd}</code></pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
