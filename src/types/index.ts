export interface Campus {
  id: number;
  name: string;
  code: string;
  address: string | null;
  contact_phone: string | null;
  email: string | null;
  website: string | null;
  logo_path: string | null;
  secondary_logo_path: string | null;
  tagline: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: number;
  family_name: string;
  guardian_name: string | null;
  contact_phone: string | null;
  address: string | null;
  voucher_preference: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: number;
  campus_id: number;
  name: string;
  display_order: number;
  academic_year: string | null;
  is_active: number;
}

export interface Section {
  id: number;
  class_id: number;
  name: string;
  class_teacher: string | null;
}

export interface Student {
  id: number;
  campus_id: number;
  name: string;
  father_name: string | null;
  mother_name: string | null;
  dob: string | null;
  gender: string | null;
  cnic_bform: string | null;
  class_id: number | null;
  section_id: number | null;
  roll_no: string | null;
  family_id: number | null;
  status: string;
  enrollment_date: string | null;
  withdrawal_date: string | null;
  photo_path: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  class_name?: string;
  section_name?: string;
  campus_name?: string;
  family_name?: string;
  sibling_count?: number;
}

export interface FeeHead {
  id: number;
  campus_id: number | null;
  name: string;
  description: string | null;
  is_active: number;
}

export interface FeeStructure {
  id: number;
  campus_id: number;
  class_id: number;
  section_id: number | null;
  fee_head_id: number;
  amount: number;
  frequency: string;
  effective_from: string | null;
  effective_to: string | null;
  version: number;
  // Joined
  fee_head_name?: string;
  class_name?: string;
}

export interface ConcessionTemplate {
  id: number;
  campus_id: number | null;
  name: string;
  type: string;
  value: number;
  applicable_fee_heads: string | null;
  eligibility: string | null;
  is_active: number;
}

export interface StudentConcession {
  id: number;
  student_id: number;
  template_id: number | null;
  type: string;
  value: number;
  fee_head_id: number | null;
  reason: string | null;
  is_permanent: number;
  start_date: string | null;
  end_date: string | null;
  approved_by: number | null;
  status: string;
  template_name?: string;
  fee_head_name?: string;
}

export interface BankAccount {
  id: number;
  campus_id: number | null;
  bank_name: string;
  branch_name: string | null;
  account_title: string;
  account_number: string;
  iban: string | null;
  is_primary: number;
  is_active: number;
}

export interface WalletAccount {
  id: number;
  campus_id: number | null;
  provider: string;
  account_number: string;
  account_title: string | null;
  is_active: number;
}

export interface Challan {
  id: number;
  campus_id: number;
  challan_no: string;
  student_id: number;
  month: number;
  year: number;
  total_amount: number;
  concession_amount: number;
  net_amount: number;
  arrears: number;
  late_fee: number;
  grand_total: number;
  due_date: string | null;
  status: string;
  template_id: number | null;
  generated_by: number | null;
  generated_at: string;
  // Joined
  student_name?: string;
  father_name?: string;
  class_name?: string;
  section_name?: string;
  roll_no?: string;
  campus_name?: string;
  items?: ChallanItem[];
}

export interface ChallanItem {
  id: number;
  challan_id: number;
  fee_head_id: number;
  original_amount: number;
  concession_amount: number;
  concession_reason: string | null;
  net_amount: number;
  fee_head_name?: string;
}

export interface FamilyVoucher {
  id: number;
  campus_id: number | null;
  voucher_no: string;
  family_id: number;
  month: number;
  year: number;
  total_amount: number;
  concession_amount: number;
  net_amount: number;
  status: string;
  template_id: number | null;
  generated_by: number | null;
  generated_at: string;
  // Joined
  family_name?: string;
  guardian_name?: string;
  students?: Student[];
}

export interface Payment {
  id: number;
  campus_id: number;
  challan_id: number | null;
  voucher_id: number | null;
  amount_paid: number;
  payment_date: string;
  payment_mode: string;
  receipt_no: string | null;
  cheque_no: string | null;
  reference_no: string | null;
  bank_account_id: number | null;
  recorded_by: number | null;
  notes: string | null;
  created_at: string;
  // Joined
  student_name?: string;
  challan_no?: string;
  voucher_no?: string;
}

export interface VoucherTemplate {
  id: number;
  campus_id: number | null;
  name: string;
  size_width_mm: number;
  size_height_mm: number;
  orientation: string;
  copies_per_voucher: number;
  layout_json: string | null;
  colors_json: string | null;
  border_style: string;
  bg_type: string;
  bg_value: string;
  version: number;
  is_default: number;
  is_active: number;
}

export interface PrintConfig {
  id: number;
  campus_id: number | null;
  paper_size: string;
  paper_orientation: string;
  page_margins_json: string;
  vouchers_per_page: number;
  layout_grid: string;
  cut_marks: number;
  separate_family_voucher: number;
  is_default: number;
}

export interface LateFeeRule {
  id: number;
  campus_id: number | null;
  rule_type: string;
  value: number;
  grace_days: number;
  max_cap: number | null;
  is_active: number;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  campus_ids: string;
  is_active: number;
  last_login: string | null;
}

export interface AuditLog {
  id: number;
  campus_id: number | null;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  old_value: string | null;
  new_value: string | null;
  timestamp: string;
}

export interface InstituteSetting {
  id: number;
  campus_id: number | null;
  key: string;
  value: string | null;
}

export interface SiblingDiscountRule {
  id: number;
  campus_id: number | null;
  sibling_order: number;
  discount_type: string;
  discount_value: number;
  is_active: number;
}

export type PaymentStatus = 'paid' | 'partially_paid' | 'unpaid' | 'overdue' | 'advance';
export type PaymentMode = 'cash' | 'bank' | 'online' | 'cheque' | 'jazzcash' | 'easypaisa';
export type UserRole = 'org_admin' | 'campus_super_admin' | 'campus_admin' | 'accountant' | 'viewer';
