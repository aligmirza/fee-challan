'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import {
  Save, Plus, Trash2, CheckCircle, Edit2, ToggleLeft, ToggleRight,
  DollarSign, Percent, Award, Users, Search, X, ChevronDown,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

type Tab = 'fee-heads' | 'structures' | 'concessions' | 'student-concessions';

export default function FeeManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('fee-heads');

  const tabs: { key: Tab; label: string; icon: typeof DollarSign }[] = [
    { key: 'fee-heads', label: 'Fee Heads', icon: DollarSign },
    { key: 'structures', label: 'Fee Structures', icon: DollarSign },
    { key: 'concessions', label: 'Concession Templates', icon: Percent },
    { key: 'student-concessions', label: 'Student Concessions', icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-sm text-gray-500 mt-1">Configure fee heads, structures, and concession policies</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition ${
                activeTab === t.key ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}>
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'fee-heads' && <FeeHeadsTab />}
      {activeTab === 'structures' && <FeeStructuresTab />}
      {activeTab === 'concessions' && <ConcessionTemplatesTab />}
      {activeTab === 'student-concessions' && <StudentConcessionsTab />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB 1 — FEE HEADS
   ════════════════════════════════════════════════════════════════ */
function FeeHeadsTab() {
  const { selectedCampusId } = useCampus();
  interface FeeHead { id: number; name: string; description: string; is_active: number; }
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [saved, setSaved] = useState('');

  const load = useCallback(() => {
    fetch('/api/fee-heads').then(r => r.json()).then(d => { if (Array.isArray(d)) setFeeHeads(d); }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const addHead = async () => {
    if (!form.name.trim()) return;
    const res = await fetch('/api/fee-heads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null, campus_id: selectedCampusId }) });
    if (res.ok) { setForm({ name: '', description: '' }); setShowAdd(false); flash('Fee head added'); load(); }
  };

  const saveEdit = async () => {
    if (!editId || !editForm.name.trim()) return;
    await fetch(`/api/fee-heads/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editForm.name.trim(), description: editForm.description.trim() || null }) });
    setEditId(null); flash('Fee head updated'); load();
  };

  const toggleActive = async (h: FeeHead) => {
    await fetch(`/api/fee-heads/${h.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: h.is_active ? 0 : 1 }) });
    flash(h.is_active ? 'Deactivated' : 'Activated'); load();
  };

  const deleteHead = async (h: FeeHead) => {
    if (!confirm(`Delete "${h.name}"? If in use, it will be deactivated instead.`)) return;
    await fetch(`/api/fee-heads/${h.id}`, { method: 'DELETE' });
    flash('Removed'); load();
  };

  const flash = (msg: string) => { setSaved(msg); setTimeout(() => setSaved(''), 2000); };

  const activeCount = feeHeads.filter(h => h.is_active).length;
  const inactiveCount = feeHeads.length - activeCount;

  return (
    <div className="space-y-4">
      {saved && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-center gap-2 text-sm"><CheckCircle size={16} /> {saved}</div>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-900">{feeHeads.length}</div>
          <div className="text-sm text-gray-500">Total Fee Heads</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-red-500">{inactiveCount}</div>
          <div className="text-sm text-gray-500">Inactive</div>
        </div>
      </div>

      {/* Add Button & Form */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Fee Heads</h3>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={15} /> Add Fee Head
          </button>
        </div>

        {showAdd && (
          <div className="p-4 border-b bg-blue-50/50">
            <div className="flex gap-3">
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Fee head name *" className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" onKeyDown={e => e.key === 'Enter' && addHead()} autoFocus />
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={e => e.key === 'Enter' && addHead()} />
              <button onClick={addHead} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Add</button>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={18} /></button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="divide-y">
          {feeHeads.map(h => (
            <div key={h.id} className={`flex items-center gap-4 p-4 ${!h.is_active ? 'bg-gray-50/50 opacity-70' : ''}`}>
              {editId === h.id ? (
                <div className="flex gap-2 flex-1">
                  <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="flex-1 border rounded-lg px-3 py-1.5 text-sm" autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }} />
                  <input type="text" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="flex-1 border rounded-lg px-3 py-1.5 text-sm" placeholder="Description" onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }} />
                  <button onClick={saveEdit} className="text-blue-600 text-sm font-medium px-3">Save</button>
                  <button onClick={() => setEditId(null)} className="text-gray-400 text-sm px-2">Cancel</button>
                </div>
              ) : (
                <>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${h.is_active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <DollarSign size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">{h.name}</div>
                    {h.description && <div className="text-xs text-gray-500 truncate">{h.description}</div>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {h.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditId(h.id); setEditForm({ name: h.name, description: h.description || '' }); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => toggleActive(h)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={h.is_active ? 'Deactivate' : 'Activate'}>
                      {h.is_active ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} className="text-gray-400" />}
                    </button>
                    <button onClick={() => deleteHead(h)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {feeHeads.length === 0 && <p className="text-gray-400 text-center py-8">No fee heads configured yet</p>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB 2 — FEE STRUCTURES (Class × Fee Head matrix)
   ════════════════════════════════════════════════════════════════ */
function FeeStructuresTab() {
  const { selectedCampusId } = useCampus();
  const [feeHeads, setFeeHeads] = useState<{ id: number; name: string; is_active: number }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [structures, setStructures] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/fee-heads').then(r => r.json()),
      fetch(`/api/classes?campus_id=${selectedCampusId}`).then(r => r.json()),
      fetch(`/api/fee-structures?campus_id=${selectedCampusId}`).then(r => r.json()),
    ]).then(([heads, cls, structs]) => {
      setFeeHeads((heads || []).filter((h: { is_active: number }) => h.is_active));
      setClasses(cls || []);
      const map: Record<string, number> = {};
      (structs || []).forEach((s: { class_id: number; fee_head_id: number; amount: number }) => { map[`${s.class_id}-${s.fee_head_id}`] = s.amount; });
      setStructures(map);
      setDirty(false);
    }).catch(() => {});
  }, [selectedCampusId]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateAmount = (classId: number, feeHeadId: number, amount: number) => {
    setStructures(prev => ({ ...prev, [`${classId}-${feeHeadId}`]: amount }));
    setDirty(true);
  };

  const saveStructures = async () => {
    setSaving(true);
    for (const [key, amount] of Object.entries(structures)) {
      const [classId, feeHeadId] = key.split('-');
      if (amount > 0) {
        await fetch('/api/fee-structures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campus_id: selectedCampusId, class_id: Number(classId), fee_head_id: Number(feeHeadId), amount }) });
      }
    }
    setSaving(false); setSaved(true); setDirty(false);
    setTimeout(() => setSaved(false), 2000);
  };

  // Calculate totals
  const classTotal = (classId: number) => feeHeads.reduce((sum, h) => sum + (structures[`${classId}-${h.id}`] || 0), 0);
  const headTotal = (headId: number) => classes.reduce((sum, c) => sum + (structures[`${c.id}-${headId}`] || 0), 0);
  const grandTotal = classes.reduce((sum, c) => sum + classTotal(c.id), 0);

  return (
    <div className="space-y-4">
      {saved && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-center gap-2 text-sm"><CheckCircle size={16} /> Fee structures saved!</div>}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">Fee Structure Matrix</h3>
            <p className="text-xs text-gray-500 mt-0.5">Set monthly fee amounts per class for each active fee head</p>
          </div>
          <button onClick={saveStructures} disabled={!dirty || saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${dirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>

        {feeHeads.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No active fee heads. Add fee heads first.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[140px]">Class</th>
                  {feeHeads.map(h => <th key={h.id} className="text-center py-3 px-2 font-medium text-gray-600 text-xs min-w-[100px]">{h.name}</th>)}
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 bg-blue-50 min-w-[100px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c, ci) => (
                  <tr key={c.id} className={ci % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className={`py-2 px-4 font-medium text-gray-800 sticky left-0 z-10 ${ci % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>{c.name}</td>
                    {feeHeads.map(h => (
                      <td key={h.id} className="py-1.5 px-1.5">
                        <input type="number" value={structures[`${c.id}-${h.id}`] || ''} onChange={e => updateAmount(c.id, h.id, Number(e.target.value))}
                          className="w-full text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition" placeholder="0" />
                      </td>
                    ))}
                    <td className="py-2 px-4 text-center font-semibold text-blue-700 bg-blue-50/50">
                      Rs. {classTotal(c.id).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-gray-100">
                  <td className="py-3 px-4 font-bold text-gray-800 sticky left-0 bg-gray-100 z-10">Column Total</td>
                  {feeHeads.map(h => (
                    <td key={h.id} className="py-3 px-2 text-center font-semibold text-gray-700 text-xs">Rs. {headTotal(h.id).toLocaleString()}</td>
                  ))}
                  <td className="py-3 px-4 text-center font-bold text-blue-800 bg-blue-100">Rs. {grandTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB 3 — CONCESSION TEMPLATES
   ════════════════════════════════════════════════════════════════ */
function ConcessionTemplatesTab() {
  const { selectedCampusId } = useCampus();
  interface Concession { id: number; name: string; type: string; value: number; applicable_fee_heads: string | null; eligibility: string | null; is_active: number; campus_id: number | null; }
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [feeHeads, setFeeHeads] = useState<{ id: number; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Concession> | null>(null);
  const [saved, setSaved] = useState('');

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/concessions?campus_id=${selectedCampusId}`).then(r => r.json()),
      fetch('/api/fee-heads').then(r => r.json()),
    ]).then(([c, h]) => {
      setConcessions(c || []);
      setFeeHeads((h || []).filter((f: { is_active: number }) => f.is_active));
    }).catch(() => {});
  }, [selectedCampusId]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditItem({ name: '', type: 'percentage', value: 0, applicable_fee_heads: null, eligibility: '', campus_id: selectedCampusId });
    setShowModal(true);
  };
  const openEdit = (c: Concession) => { setEditItem({ ...c }); setShowModal(true); };

  const saveConcession = async () => {
    if (!editItem || !editItem.name?.trim()) return;
    if (editItem.id) {
      await fetch(`/api/concessions/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem) });
      flash('Updated');
    } else {
      await fetch('/api/concessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editItem, campus_id: selectedCampusId }) });
      flash('Created');
    }
    setShowModal(false); setEditItem(null); load();
  };

  const toggleActive = async (c: Concession) => {
    await fetch(`/api/concessions/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: c.is_active ? 0 : 1 }) });
    flash(c.is_active ? 'Deactivated' : 'Activated'); load();
  };

  const deleteConcession = async (c: Concession) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    await fetch(`/api/concessions/${c.id}`, { method: 'DELETE' });
    flash('Removed'); load();
  };

  const flash = (msg: string) => { setSaved(msg); setTimeout(() => setSaved(''), 2000); };

  const typeLabel = (t: string) => t === 'percentage' ? 'Percentage' : t === 'waiver' ? 'Full Waiver' : 'Fixed Amount';
  const typeColor = (t: string) => t === 'percentage' ? 'bg-purple-100 text-purple-700' : t === 'waiver' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
  const valueDisplay = (c: Concession) => c.type === 'percentage' ? `${c.value}%` : c.type === 'waiver' ? '100%' : `Rs. ${c.value.toLocaleString()}`;

  return (
    <div className="space-y-4">
      {saved && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-center gap-2 text-sm"><CheckCircle size={16} /> {saved}</div>}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">Concession Templates</h3>
            <p className="text-xs text-gray-500 mt-0.5">Define reusable discount/waiver policies to assign to students</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={15} /> Add Template
          </button>
        </div>

        <div className="divide-y">
          {concessions.map(c => (
            <div key={c.id} className={`flex items-center gap-4 p-4 ${!c.is_active ? 'opacity-60 bg-gray-50/50' : ''}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.type === 'percentage' ? 'bg-purple-50 text-purple-600' : c.type === 'waiver' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                {c.type === 'percentage' ? <Percent size={18} /> : <Award size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">{c.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor(c.type)}`}>{typeLabel(c.type)}</span>
                  <span className="text-xs text-gray-500 font-semibold">{valueDisplay(c)}</span>
                  {c.eligibility && <span className="text-xs text-gray-400">· {c.eligibility}</span>}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                <button onClick={() => toggleActive(c)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  {c.is_active ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} className="text-gray-400" />}
                </button>
                <button onClick={() => deleteConcession(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {concessions.length === 0 && <p className="text-gray-400 text-center py-8">No concession templates. Add one to get started.</p>}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem?.id ? 'Edit Concession Template' : 'Add Concession Template'}>
        {editItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name *</label>
              <input type="text" value={editItem.name || ''} onChange={e => setEditItem(p => ({ ...p!, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Staff Child Discount" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <div className="relative">
                  <select value={editItem.type || 'percentage'} onChange={e => setEditItem(p => ({ ...p!, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm appearance-none pr-8">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Fixed Amount (Rs.)</option>
                    <option value="waiver">Full Waiver (100%)</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value *</label>
                <input type="number" value={editItem.value || ''} onChange={e => setEditItem(p => ({ ...p!, value: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={editItem.type === 'percentage' ? 'e.g., 25' : 'e.g., 500'}
                  disabled={editItem.type === 'waiver'} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Eligibility / Description</label>
              <input type="text" value={editItem.eligibility || ''} onChange={e => setEditItem(p => ({ ...p!, eligibility: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Children of staff members" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Applicable Fee Heads</label>
              <p className="text-xs text-gray-500 mb-2">Leave empty to apply to all fee heads</p>
              <div className="flex flex-wrap gap-2">
                {feeHeads.map(fh => {
                  const selected = editItem.applicable_fee_heads ? JSON.parse(editItem.applicable_fee_heads).includes(fh.id) : false;
                  return (
                    <label key={fh.id} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition ${selected ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      <input type="checkbox" className="sr-only" checked={selected}
                        onChange={() => {
                          const current: number[] = editItem.applicable_fee_heads ? JSON.parse(editItem.applicable_fee_heads) : [];
                          const next = selected ? current.filter(id => id !== fh.id) : [...current, fh.id];
                          setEditItem(p => ({ ...p!, applicable_fee_heads: next.length ? JSON.stringify(next) : null }));
                        }} />
                      {fh.name}
                    </label>
                  );
                })}
              </div>
            </div>
            <button onClick={saveConcession} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">
              {editItem.id ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB 4 — STUDENT CONCESSIONS (assign templates to students)
   ════════════════════════════════════════════════════════════════ */
function StudentConcessionsTab() {
  const { selectedCampusId } = useCampus();
  interface Student { id: number; name: string; father_name: string; class_name: string; section_name: string; }
  interface Template { id: number; name: string; type: string; value: number; }
  interface StudentConcession { id: number; student_id: number; template_id: number | null; type: string; value: number; fee_head_id: number | null; reason: string; is_permanent: number; start_date: string | null; end_date: string | null; approved_by: string | null; status: string; created_at: string; template_name?: string; fee_head_name?: string; }

  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [concessions, setConcessions] = useState<StudentConcession[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [feeHeads, setFeeHeads] = useState<{ id: number; name: string }[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ template_id: '', type: 'percentage', value: 0, fee_head_id: '', reason: '', is_permanent: 1, start_date: '', end_date: '', approved_by: '' });
  const [saved, setSaved] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/concessions?campus_id=${selectedCampusId}`).then(r => r.json()),
      fetch('/api/fee-heads').then(r => r.json()),
    ]).then(([t, h]) => {
      setTemplates((t || []).filter((c: { is_active: number }) => c.is_active));
      setFeeHeads((h || []).filter((f: { is_active: number }) => f.is_active));
    }).catch(() => {});
  }, [selectedCampusId]);

  const searchStudents = async () => {
    if (!search.trim()) return;
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/students?campus_id=${selectedCampusId}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setStudents(data || []);
    } catch { setStudents([]); }
    setLoadingStudents(false);
  };

  const selectStudent = async (s: Student) => {
    setSelectedStudent(s);
    setStudents([]);
    setSearch('');
    try {
      const res = await fetch(`/api/student-concessions?student_id=${s.id}`);
      setConcessions(await res.json());
    } catch { setConcessions([]); }
  };

  const assignConcession = async () => {
    if (!selectedStudent) return;
    const payload: Record<string, unknown> = {
      student_id: selectedStudent.id,
      type: assignForm.type,
      value: assignForm.value,
      reason: assignForm.reason || null,
      is_permanent: assignForm.is_permanent,
      approved_by: assignForm.approved_by || null,
    };
    if (assignForm.template_id) payload.template_id = Number(assignForm.template_id);
    if (assignForm.fee_head_id) payload.fee_head_id = Number(assignForm.fee_head_id);
    if (!assignForm.is_permanent) {
      payload.start_date = assignForm.start_date || null;
      payload.end_date = assignForm.end_date || null;
    }

    await fetch('/api/student-concessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setShowAssign(false);
    setAssignForm({ template_id: '', type: 'percentage', value: 0, fee_head_id: '', reason: '', is_permanent: 1, start_date: '', end_date: '', approved_by: '' });
    flash('Concession assigned');
    // Reload
    const res = await fetch(`/api/student-concessions?student_id=${selectedStudent.id}`);
    setConcessions(await res.json());
  };

  const removeConcession = async (id: number) => {
    if (!confirm('Remove this concession?')) return;
    await fetch(`/api/student-concessions/${id}`, { method: 'DELETE' });
    flash('Removed');
    if (selectedStudent) {
      const res = await fetch(`/api/student-concessions?student_id=${selectedStudent.id}`);
      setConcessions(await res.json());
    }
  };

  const applyTemplate = (tid: string) => {
    setAssignForm(f => ({ ...f, template_id: tid }));
    const t = templates.find(x => x.id === Number(tid));
    if (t) {
      setAssignForm(f => ({ ...f, type: t.type, value: t.value }));
    }
  };

  const flash = (msg: string) => { setSaved(msg); setTimeout(() => setSaved(''), 2000); };

  return (
    <div className="space-y-4">
      {saved && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 flex items-center gap-2 text-sm"><CheckCircle size={16} /> {saved}</div>}

      {/* Student Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Find Student</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchStudents()}
              placeholder="Search by name, roll no, or father name..." className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <button onClick={searchStudents} disabled={loadingStudents} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            {loadingStudents ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {students.length > 0 && (
          <div className="mt-3 border rounded-lg divide-y max-h-48 overflow-y-auto">
            {students.map(s => (
              <button key={s.id} onClick={() => selectStudent(s)} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{s.name}</span>
                  <span className="text-xs text-gray-500 ml-2">s/o {s.father_name}</span>
                </div>
                <span className="text-xs text-gray-400">{s.class_name} - {s.section_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Student */}
        {selectedStudent && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <div>
                <div className="font-medium text-sm">{selectedStudent.name}</div>
                <div className="text-xs text-gray-500">s/o {selectedStudent.father_name} · {selectedStudent.class_name} - {selectedStudent.section_name}</div>
              </div>
            </div>
            <button onClick={() => { setSelectedStudent(null); setConcessions([]); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Student's Concessions */}
      {selectedStudent && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Active Concessions</h3>
            <button onClick={() => setShowAssign(true)} className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus size={15} /> Assign Concession
            </button>
          </div>

          <div className="divide-y">
            {concessions.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Award size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{c.template_name || c.type}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span className="font-semibold">{c.type === 'percentage' ? `${c.value}%` : c.type === 'waiver' ? '100% waiver' : `Rs. ${c.value}`}</span>
                    {c.fee_head_name && <span>· {c.fee_head_name}</span>}
                    {c.reason && <span>· {c.reason}</span>}
                    {!c.is_permanent && c.start_date && <span>· {c.start_date} to {c.end_date || '∞'}</span>}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                <button onClick={() => removeConcession(c.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
            {concessions.length === 0 && <p className="text-gray-400 text-center py-8">No concessions assigned to this student</p>}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign Concession">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Use Template (optional)</label>
            <select value={assignForm.template_id} onChange={e => applyTemplate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">— Custom concession —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type === 'percentage' ? `${t.value}%` : t.type === 'waiver' ? '100%' : `Rs. ${t.value}`})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={assignForm.type} onChange={e => setAssignForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="percentage">Percentage</option>
                <option value="flat">Fixed Amount</option>
                <option value="waiver">Full Waiver</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input type="number" value={assignForm.value} onChange={e => setAssignForm(f => ({ ...f, value: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm" disabled={assignForm.type === 'waiver'} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apply to Fee Head (optional)</label>
            <select value={assignForm.fee_head_id} onChange={e => setAssignForm(f => ({ ...f, fee_head_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">All fee heads</option>
              {feeHeads.map(fh => <option key={fh.id} value={fh.id}>{fh.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <input type="text" value={assignForm.reason} onChange={e => setAssignForm(f => ({ ...f, reason: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Staff child discount" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!assignForm.is_permanent} onChange={e => setAssignForm(f => ({ ...f, is_permanent: e.target.checked ? 1 : 0 }))} className="rounded" />
              Permanent concession
            </label>
          </div>
          {!assignForm.is_permanent && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={assignForm.start_date} onChange={e => setAssignForm(f => ({ ...f, start_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={assignForm.end_date} onChange={e => setAssignForm(f => ({ ...f, end_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Approved By</label>
            <input type="text" value={assignForm.approved_by} onChange={e => setAssignForm(f => ({ ...f, approved_by: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Principal" />
          </div>
          <button onClick={assignConcession} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Assign Concession</button>
        </div>
      </Modal>
    </div>
  );
}
