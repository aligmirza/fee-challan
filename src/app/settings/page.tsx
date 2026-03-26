'use client';

import { useEffect, useState } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import { Save, Plus, CheckCircle, Upload, X } from 'lucide-react';

type Tab = 'institution' | 'bank' | 'voucher' | 'print';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('institution');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'institution', label: 'Institution' },
    { key: 'bank', label: 'Bank Details' },
    { key: 'voucher', label: 'Voucher Design' },
    { key: 'print', label: 'Print Config' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${activeTab === t.key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'institution' && <InstitutionSettings />}
      {activeTab === 'bank' && <BankSettings />}
      {activeTab === 'voucher' && <VoucherSettings />}
      {activeTab === 'print' && <PrintSettings />}
    </div>
  );
}

function InstitutionSettings() {
  const { selectedCampusId } = useCampus();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/settings?campus_id=${selectedCampusId}`).then(r => r.json()).then((data: { key: string; value: string }[]) => {
      const map: Record<string, string> = {};
      (data || []).forEach(s => { map[s.key] = s.value; });
      setSettings(map);
      if (map.logo_base64) setLogoPreview(map.logo_base64);
    }).catch(() => {});
  }, [selectedCampusId]);

  const save = async () => {
    for (const [key, value] of Object.entries(settings)) {
      await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campus_id: null, key, value }) });
    }
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert('Logo must be under 500KB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      update('logo_base64', base64);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    update('logo_base64', '');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
      {saved && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-center gap-2 text-sm"><CheckCircle size={16} /> Settings saved!</div>}

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">Institute Logo</label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <div className="relative group">
              <img src={logoPreview} alt="Logo" className="w-20 h-20 object-contain border rounded-lg bg-gray-50 p-1" />
              <button onClick={removeLogo} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={12} /></button>
            </div>
          ) : (
            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
              <Upload size={24} />
            </div>
          )}
          <div className="flex-1">
            <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Upload size={14} /> {logoPreview ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoUpload} className="sr-only" />
            </label>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG or WebP. Max 500KB. Used on vouchers and challans.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Organization Name</label><input type="text" value={settings.organization_name || ''} onChange={e => update('organization_name', e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Academic Year</label><input type="text" value={settings.academic_year || ''} onChange={e => update('academic_year', e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="2025-2026" /></div>
        <div><label className="block text-sm font-medium mb-1">Current Billing Month</label>
          <select value={settings.current_billing_month || ''} onChange={e => update('current_billing_month', e.target.value)} className="w-full border rounded-lg px-3 py-2">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-1">Default Due Date (day of month)</label><input type="number" min={1} max={31} value={settings.default_due_date || '10'} onChange={e => update('default_due_date', e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Challan Number Format</label><input type="text" value={settings.challan_format || ''} onChange={e => update('challan_format', e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Receipt Number Format</label><input type="text" value={settings.receipt_format || ''} onChange={e => update('receipt_format', e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1">Tagline / Motto</label><input type="text" value={settings.tagline || ''} onChange={e => update('tagline', e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Excellence in Education" /></div>
      <button onClick={save} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"><Save size={16} /> Save Settings</button>
    </div>
  );
}

function BankSettings() {
  const { selectedCampusId } = useCampus();
  const [banks, setBanks] = useState<{ id: number; bank_name: string; branch_name: string; account_title: string; account_number: string; iban: string; is_primary: number }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bank_name: '', branch_name: '', account_title: '', account_number: '', iban: '' });

  useEffect(() => { fetch(`/api/bank-accounts?campus_id=${selectedCampusId}`).then(r => r.json()).then(setBanks).catch(() => {}); }, [selectedCampusId]);

  const addBank = async () => {
    await fetch('/api/bank-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, campus_id: null }) });
    setShowForm(false); setForm({ bank_name: '', branch_name: '', account_title: '', account_number: '', iban: '' });
    fetch(`/api/bank-accounts?campus_id=${selectedCampusId}`).then(r => r.json()).then(setBanks);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-semibold">Bank Accounts</h3><button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Plus size={16} /> Add Bank</button></div>
      {showForm && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Bank Name" value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="Branch Name" value={form.branch_name} onChange={e => setForm(f => ({ ...f, branch_name: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="Account Title" value={form.account_title} onChange={e => setForm(f => ({ ...f, account_title: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="Account Number" value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="IBAN" value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm col-span-2" />
          </div>
          <button onClick={addBank} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Save Bank</button>
        </div>
      )}
      <div className="space-y-3">
        {banks.map(b => (
          <div key={b.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{b.bank_name} {b.is_primary ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs ml-2">Primary</span> : ''}</div>
              <div className="text-sm text-gray-500">{b.branch_name} · {b.account_title}</div>
              <div className="text-sm font-mono text-gray-600">{b.account_number} {b.iban && `· IBAN: ${b.iban}`}</div>
            </div>
          </div>
        ))}
        {banks.length === 0 && <p className="text-gray-400 text-center py-4">No bank accounts configured</p>}
      </div>
    </div>
  );
}

function VoucherSettings() {
  const [size, setSize] = useState('full_a4');
  const [orientation, setOrientation] = useState('portrait');
  const [copies, setCopies] = useState(3);
  const [template, setTemplate] = useState('classic');
  const [colors, setColors] = useState({ primary: '#1a365d', secondary: '#2d3748', accent: '#3182ce' });
  const [borderStyle, setBorderStyle] = useState('thin');
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6">
      {saved && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-center gap-2 text-sm"><CheckCircle size={16} /> Voucher design saved!</div>}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h3 className="font-semibold">Voucher Size</h3>
        <div className="grid grid-cols-5 gap-3">
          {[{ v: 'full_a4', l: 'Full A4' }, { v: 'half_a4', l: 'Half A4' }, { v: 'third_a4', l: 'Third A4' }, { v: 'quarter_a4', l: 'Quarter A4' }, { v: 'custom', l: 'Custom' }].map(s => (
            <label key={s.v} className={`p-3 border-2 rounded-lg cursor-pointer text-center text-sm ${size === s.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input type="radio" name="size" value={s.v} checked={size === s.v} onChange={() => setSize(s.v)} className="sr-only" />{s.l}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Orientation</label>
            <select value={orientation} onChange={e => setOrientation(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Copies per Voucher</label>
            <div className="flex gap-2">{[1, 2, 3].map(n => (
              <label key={n} className={`flex-1 p-2 border-2 rounded-lg cursor-pointer text-center text-sm ${copies === n ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="copies" checked={copies === n} onChange={() => setCopies(n)} className="sr-only" />{n} {n === 1 ? 'copy' : 'copies'}
              </label>
            ))}</div>
          </div>
        </div>

        <div><label className="block text-sm font-medium mb-2">Template</label>
          <div className="grid grid-cols-3 gap-3">
            {['classic', 'modern', 'minimal'].map(t => (
              <label key={t} className={`p-4 border-2 rounded-lg cursor-pointer ${template === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="template" checked={template === t} onChange={() => setTemplate(t)} className="sr-only" />
                <div className="text-center capitalize font-medium">{t}</div>
                <div className="mt-2 h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">Preview</div>
              </label>
            ))}
          </div>
        </div>

        <div><label className="block text-sm font-medium mb-2">Color Scheme</label>
          <div className="flex gap-4">
            <div><label className="block text-xs mb-1">Primary</label><input type="color" value={colors.primary} onChange={e => setColors(c => ({ ...c, primary: e.target.value }))} className="w-12 h-8 rounded cursor-pointer" /></div>
            <div><label className="block text-xs mb-1">Secondary</label><input type="color" value={colors.secondary} onChange={e => setColors(c => ({ ...c, secondary: e.target.value }))} className="w-12 h-8 rounded cursor-pointer" /></div>
            <div><label className="block text-xs mb-1">Accent</label><input type="color" value={colors.accent} onChange={e => setColors(c => ({ ...c, accent: e.target.value }))} className="w-12 h-8 rounded cursor-pointer" /></div>
          </div>
        </div>

        <div><label className="block text-sm font-medium mb-1">Border Style</label>
          <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="none">None</option><option value="thin">Thin Line</option><option value="double">Double Line</option><option value="decorative">Decorative</option>
          </select>
        </div>

        <button onClick={save} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"><Save size={16} /> Save Design</button>
      </div>
    </div>
  );
}

function PrintSettings() {
  const [paperSize, setPaperSize] = useState('A4');
  const [paperOrientation, setPaperOrientation] = useState('portrait');
  const [margins, setMargins] = useState({ top: 10, bottom: 10, left: 10, right: 10 });
  const [vouchersPerPage, setVouchersPerPage] = useState(1);
  const [cutMarks, setCutMarks] = useState(false);
  const [separateFamily, setSeparateFamily] = useState(true);
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const layoutOptions = [{ v: 1, g: '1×1' }, { v: 2, g: '2×1' }, { v: 3, g: '3×1' }, { v: 4, g: '2×2' }, { v: 6, g: '3×2' }];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      {saved && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-center gap-2 text-sm"><CheckCircle size={16} /> Print config saved!</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Paper Size</label>
          <select value={paperSize} onChange={e => setPaperSize(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="A4">A4 (210×297mm)</option><option value="A5">A5 (148×210mm)</option><option value="Letter">Letter (8.5×11")</option><option value="Legal">Legal (8.5×14")</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-1">Paper Orientation</label>
          <select value={paperOrientation} onChange={e => setPaperOrientation(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
          </select>
        </div>
      </div>
      <div><label className="block text-sm font-medium mb-2">Page Margins (mm)</label>
        <div className="grid grid-cols-4 gap-3">
          {(['top', 'bottom', 'left', 'right'] as const).map(side => (
            <div key={side}><label className="block text-xs text-gray-500 capitalize">{side}</label><input type="number" value={margins[side]} onChange={e => setMargins(m => ({ ...m, [side]: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          ))}
        </div>
      </div>
      <div><label className="block text-sm font-medium mb-2">Vouchers Per Page</label>
        <div className="grid grid-cols-5 gap-3">
          {layoutOptions.map(opt => (
            <label key={opt.v} className={`p-3 border-2 rounded-lg cursor-pointer text-center ${vouchersPerPage === opt.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input type="radio" name="vpp" checked={vouchersPerPage === opt.v} onChange={() => setVouchersPerPage(opt.v)} className="sr-only" />
              <div className="text-lg font-bold">{opt.v}</div><div className="text-xs text-gray-500">{opt.g}</div>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2"><input type="checkbox" checked={cutMarks} onChange={e => setCutMarks(e.target.checked)} className="rounded" /><span className="text-sm">Show cut marks</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={separateFamily} onChange={e => setSeparateFamily(e.target.checked)} className="rounded" /><span className="text-sm">Family vouchers on separate sheets</span></label>
      </div>
      <button onClick={save} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium"><Save size={16} /> Save Print Config</button>
    </div>
  );
}
