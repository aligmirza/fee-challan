'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Search,
  Wallet,
  FileText,
  Users,
  Layers,
  ClipboardList,
  Banknote,
  Receipt,
  GraduationCap,
  Building2,
  BarChart3,
  History,
  Settings,
  BookOpen,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Keyboard,
  Monitor,
} from 'lucide-react';

type Section = {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
};

function Shortcut({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{action}</span>
      <div className="flex gap-1">
        {keys.map((k, i) => (
          <kbd key={i} className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-200 rounded text-gray-700">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
      <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
      <div>{children}</div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
      <div>{children}</div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1 pb-4">
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <div className="text-sm text-gray-600 space-y-2">{children}</div>
      </div>
    </div>
  );
}

const faqs: { q: string; a: string }[] = [
  {
    q: 'How do I add a new student?',
    a: 'Go to Student Management from the sidebar, click "Add Student", fill in the details (name, class, section, family phone), and save. Students are linked to families by phone number.',
  },
  {
    q: 'How do I generate a fee challan?',
    a: 'Navigate to Challan Generation, select a student by searching their name or ID, pick the fee month, and click Generate. The system will create a challan with all applicable fee heads and concessions.',
  },
  {
    q: 'What happens if I try to generate a challan that already exists?',
    a: 'The system will show you the existing challan with options to View & Print it or Update Fee Details. You can edit fee items and save changes without creating a duplicate.',
  },
  {
    q: 'How do family vouchers work?',
    a: 'Family vouchers combine all children from the same family (identified by phone number) into a single voucher. Go to Family Voucher, search by family name or phone, select the month, and generate.',
  },
  {
    q: 'How do I apply a concession to a student?',
    a: 'Go to Fee Management > Student Concessions tab. Search for the student, then assign a concession template. Concessions can be percentage-based or fixed amounts.',
  },
  {
    q: 'How do I change the institute logo on vouchers?',
    a: 'Go to Settings > Institution tab. Upload your logo using the Upload Logo button. The logo will automatically appear on all printed challans and family vouchers.',
  },
  {
    q: 'Can I use the APIs externally?',
    a: 'Yes! Check the API Documentation page (API Docs in the sidebar) for complete endpoint documentation with examples, parameters, and cURL commands.',
  },
  {
    q: 'How do I record a payment?',
    a: 'Go to Fee Collection, search for the challan or student, enter the payment amount and date, then submit. The system will update the challan status automatically.',
  },
  {
    q: 'How do I set up fee heads and structures?',
    a: 'Go to Fee Management. Under Fee Heads, create heads like "Tuition Fee", "Lab Fee", etc. Then under Fee Structures, assign amounts per class for each fee head.',
  },
  {
    q: 'Can I generate challans in bulk?',
    a: 'Yes, use the Bulk Generation page. Select a campus, class, section, and month, then generate challans for all matching students at once.',
  },
];

export default function HelpPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sections: Section[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Monitor,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">
            Welcome to the Fee Challan Management System. Follow these steps to set up and start using the application.
          </p>
          <div className="space-y-1">
            <Step number={1} title="Configure Institute Settings">
              <p>Go to <strong>Settings &rarr; Institution</strong> to set your institute name, tagline, and upload your logo. These appear on all printed vouchers.</p>
            </Step>
            <Step number={2} title="Set Up Bank Details">
              <p>Go to <strong>Settings &rarr; Bank Details</strong> to add your bank account information. This is printed on challans for fee deposit.</p>
            </Step>
            <Step number={3} title="Create Campuses">
              <p>Go to <strong>Campus Management</strong> to add your campuses/branches. Each campus can have its own classes and sections.</p>
            </Step>
            <Step number={4} title="Add Students">
              <p>Go to <strong>Student Management</strong> to add students. You can add them individually or import via CSV/Excel.</p>
            </Step>
            <Step number={5} title="Configure Fee Structure">
              <p>Go to <strong>Fee Management</strong> to create fee heads, set up class-wise fee structures, and configure concession templates.</p>
            </Step>
            <Step number={6} title="Generate Challans">
              <p>You&apos;re all set! Go to <strong>Challan Generation</strong> or <strong>Family Voucher</strong> to start generating fee challans.</p>
            </Step>
          </div>
          <Tip>Use the campus selector in the top-right header to switch between campuses. All data is filtered by the selected campus.</Tip>
        </div>
      ),
    },
    {
      id: 'modules',
      title: 'Module Guide',
      icon: LayoutDashboard,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">Here&apos;s a quick overview of every module in the system:</p>
          {[
            { icon: LayoutDashboard, name: 'Dashboard', desc: 'Overview of fee collection stats, pending challans, recent activity, and quick actions.' },
            { icon: Search, name: 'Student Search', desc: 'Quickly find any student by name, ID, class, or family phone number.' },
            { icon: Wallet, name: 'Fee Management', desc: 'Central hub for fee heads, class-wise fee structures, concession templates, and student concession assignments.' },
            { icon: FileText, name: 'Challan Generation', desc: 'Generate individual fee challans for students. If a challan already exists for the month, you can view, print, or edit it.' },
            { icon: Users, name: 'Family Voucher', desc: 'Generate combined vouchers for all siblings in a family, grouped by phone number.' },
            { icon: Layers, name: 'Bulk Generation', desc: 'Generate challans for an entire class/section at once. Great for monthly batch processing.' },
            { icon: ClipboardList, name: 'View Vouchers', desc: 'Browse and manage all generated vouchers and challans with filters and search.' },
            { icon: Banknote, name: 'Fee Collection', desc: 'Record fee payments against challans. Tracks partial payments, payment dates, and methods.' },
            { icon: Receipt, name: 'Fee Tracker', desc: 'Track payment status across students and classes. Identify who has paid and who hasn\'t.' },
            { icon: GraduationCap, name: 'Student Management', desc: 'Add, edit, import, and manage student records. Assign classes, sections, and family links.' },
            { icon: Building2, name: 'Campus Management', desc: 'Manage campuses/branches with their classes and sections.' },
            { icon: BarChart3, name: 'Reports', desc: 'Generate reports on collections, defaulters, class-wise summaries, and more.' },
            { icon: History, name: 'History', desc: 'View audit trail of all transactions, payments, and system changes.' },
            { icon: Settings, name: 'Settings', desc: 'Configure institution details, bank accounts, voucher design, print layout, and logo.' },
            { icon: BookOpen, name: 'API Docs', desc: 'Complete REST API documentation for integrating with external systems.' },
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.name} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{mod.name}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{mod.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: 'fee-workflow',
      title: 'Fee Challan Workflow',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600">The complete lifecycle of a fee challan from generation to collection:</p>
          <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
            {[
              { title: 'Fee Structure Setup', desc: 'Define fee heads (Tuition, Lab, Transport, etc.) and assign amounts per class in Fee Management.' },
              { title: 'Concessions (Optional)', desc: 'Create concession templates (sibling discount, merit scholarship) and assign to eligible students.' },
              { title: 'Challan Generation', desc: 'Select student + month. System auto-calculates fees based on class structure minus concessions.' },
              { title: 'Print & Distribute', desc: 'Print the challan with institute logo, bank details, and fee breakdown. Student takes it to bank.' },
              { title: 'Fee Collection', desc: 'When payment is received, record it in Fee Collection. Supports partial payments.' },
              { title: 'Tracking & Reports', desc: 'Use Fee Tracker and Reports to monitor collection status, defaulters, and summaries.' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-blue-600 border-2 border-white" />
                <h4 className="font-semibold text-gray-900 text-sm">{step.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
          <Tip>If you regenerate a challan that already exists, you can update fee details without creating duplicates.</Tip>
          <Warning>Always verify fee structures before bulk generation. Changes to fee structures do not retroactively update already-generated challans.</Warning>
        </div>
      ),
    },
    {
      id: 'family-vouchers',
      title: 'Family Vouchers',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Family vouchers consolidate fees for all siblings into a single document, making it easier for parents with multiple children.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm">How Family Linking Works</h4>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
              <li>Students are linked to families through the <strong>family phone number</strong> field.</li>
              <li>All students sharing the same phone number are considered siblings.</li>
              <li>The family voucher shows each child&apos;s fees separately with a combined grand total.</li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm">Generating a Family Voucher</h4>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
              <li>Go to <strong>Family Voucher</strong> page.</li>
              <li>Search by family name or phone number.</li>
              <li>Select the fee month and click Generate.</li>
              <li>The voucher includes all children&apos;s individual fee breakdowns.</li>
            </ul>
          </div>
          <Tip>The printed voucher filename is automatically set to &quot;FamilyName - Family Voucher Month Year&quot; for easy identification.</Tip>
        </div>
      ),
    },
    {
      id: 'concessions',
      title: 'Concessions & Discounts',
      icon: Wallet,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            The system supports flexible concession management with templates that can be applied to individual students.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 text-sm mb-2">Concession Types</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li><strong>Percentage:</strong> e.g., 10% off tuition fee</li>
                <li><strong>Fixed Amount:</strong> e.g., Rs. 500 off monthly fee</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 text-sm mb-2">Common Use Cases</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>Sibling discounts</li>
                <li>Staff children concessions</li>
                <li>Merit scholarships</li>
                <li>Need-based fee waivers</li>
              </ul>
            </div>
          </div>
          <div className="space-y-1">
            <Step number={1} title="Create a Template">
              <p>In Fee Management &rarr; Concession Templates, create templates with name, type, value, and eligibility criteria.</p>
            </Step>
            <Step number={2} title="Assign to Students">
              <p>In Fee Management &rarr; Student Concessions, search for a student and assign one or more concession templates.</p>
            </Step>
            <Step number={3} title="Auto-Applied on Generation">
              <p>When generating a challan, the system automatically applies all assigned concessions and shows the breakdown.</p>
            </Step>
          </div>
        </div>
      ),
    },
    {
      id: 'printing',
      title: 'Printing & Layout',
      icon: ClipboardList,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Tips for getting the best print results from your challans and vouchers.</p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm">Print Settings</h4>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
              <li>Use <strong>A4 paper size</strong> for best results.</li>
              <li>Set margins to <strong>None</strong> or <strong>Minimum</strong> in print dialog.</li>
              <li>Enable <strong>Background Graphics</strong> to print logos and colored headers.</li>
              <li>Use <strong>Landscape</strong> orientation for family vouchers with many children.</li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm">Customization</h4>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
              <li><strong>Logo:</strong> Upload in Settings &rarr; Institution. Recommended size: 200x200px, PNG or JPG.</li>
              <li><strong>Institute Name & Tagline:</strong> Set in Settings &rarr; Institution. Appears on all vouchers.</li>
              <li><strong>Bank Details:</strong> Set in Settings &rarr; Bank Details. Printed on challans for deposit reference.</li>
              <li><strong>Voucher Design:</strong> Configure colors and layout in Settings &rarr; Voucher Design.</li>
            </ul>
          </div>
          <Tip>The PDF filename is automatically set based on the student name and fee month (e.g., &quot;Ahmed Ali - Fee Challan March 2026&quot;).</Tip>
          <Warning>If the logo appears broken on print, ensure it was uploaded as PNG or JPG and is under 500KB for best performance.</Warning>
        </div>
      ),
    },
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      icon: Keyboard,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Quick keyboard shortcuts to navigate faster:</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <Shortcut keys={['Ctrl', 'P']} action="Print current page / voucher" />
            <Shortcut keys={['Ctrl', 'F']} action="Focus search field" />
            <Shortcut keys={['Esc']} action="Close modal / dialog" />
            <Shortcut keys={['Enter']} action="Submit form / confirm action" />
            <Shortcut keys={['Tab']} action="Navigate between form fields" />
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = searchQuery
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  const filteredFaqs = searchQuery
    ? faqs.filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          <p className="text-sm text-gray-500">Learn how to use the Fee Challan Management System</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search help topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Getting Started', section: 'getting-started', icon: Monitor },
          { label: 'Fee Workflow', section: 'fee-workflow', icon: FileText },
          { label: 'Family Vouchers', section: 'family-vouchers', icon: Users },
          { label: 'Printing', section: 'printing', icon: ClipboardList },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.section}
              onClick={() => { setExpandedSection(link.section); setSearchQuery(''); }}
              className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <Icon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{link.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {filteredSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          return (
            <div key={section.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="flex-1 font-medium text-gray-900">{section.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className="pl-11">{section.content}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      {filteredFaqs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {filteredFaqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-gray-900">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-gray-600 pl-8">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <h3 className="font-semibold text-gray-900 mb-1">Need more help?</h3>
        <p className="text-sm text-gray-500 mb-3">
          Check the API Documentation for technical integration or contact the system administrator.
        </p>
        <a
          href="/api-docs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          View API Docs
        </a>
      </div>
    </div>
  );
}
