'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Building2, Users, FileText, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface CampusInfo {
  id: number; name: string; code: string; address: string; contact_phone: string;
  email: string; tagline: string; is_active: number;
  student_count?: number; challan_count?: number; defaulter_count?: number; total_collected?: number;
}

export default function CampusManagement() {
  const [campuses, setCampuses] = useState<CampusInfo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCampus, setEditCampus] = useState<Partial<CampusInfo> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetch('/api/campuses').then(r => r.json());
      // Enrich each campus with stats
      const enriched = await Promise.all((list || []).map(async (c: CampusInfo) => {
        try {
          const detail = await fetch(`/api/campuses/${c.id}`).then(r => r.json());
          return { ...c, ...detail };
        } catch { return c; }
      }));
      setCampuses(enriched);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditCampus({ name: '', code: '', address: '', contact_phone: '', email: '', tagline: '' }); setShowModal(true); };
  const openEdit = (c: CampusInfo) => { setEditCampus({ ...c }); setShowModal(true); };

  const saveCampus = async () => {
    if (!editCampus) return;
    if (editCampus.id) {
      // Update existing
      await fetch(`/api/campuses/${editCampus.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCampus) });
    } else {
      // Create new
      await fetch('/api/campuses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCampus) });
    }
    setShowModal(false); setEditCampus(null); load();
  };

  const toggleActive = async (c: CampusInfo) => {
    await fetch(`/api/campuses/${c.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: c.is_active ? 0 : 1 }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campus Management</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><Plus size={16} /> Add Campus</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campuses.map(c => (
            <div key={c.id} className={`bg-white rounded-xl shadow-sm border p-6 ${!c.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={24} /></div>
                  <div>
                    <h3 className="font-semibold text-lg">{c.name}</h3>
                    <span className="text-sm text-gray-500 font-mono">Code: {c.code}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => toggleActive(c)} className="p-1.5 hover:bg-gray-100 rounded" title={c.is_active ? 'Deactivate' : 'Activate'}>
                    {c.is_active ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} className="text-gray-400" />}
                  </button>
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 size={14} /></button>
                </div>
              </div>

              <div className="text-sm text-gray-500 space-y-1 mb-4">
                {c.address && <p>{c.address}</p>}
                {c.contact_phone && <p>{c.contact_phone}</p>}
                {c.email && <p>{c.email}</p>}
                {c.tagline && <p className="italic">&quot;{c.tagline}&quot;</p>}
              </div>

              <div className="grid grid-cols-4 gap-3 pt-4 border-t">
                <div className="text-center">
                  <Users size={16} className="mx-auto text-blue-500 mb-1" />
                  <div className="text-lg font-bold">{c.student_count ?? 0}</div>
                  <div className="text-xs text-gray-500">Students</div>
                </div>
                <div className="text-center">
                  <FileText size={16} className="mx-auto text-green-500 mb-1" />
                  <div className="text-lg font-bold">{c.challan_count ?? 0}</div>
                  <div className="text-xs text-gray-500">Challans</div>
                </div>
                <div className="text-center">
                  <AlertTriangle size={16} className="mx-auto text-red-500 mb-1" />
                  <div className="text-lg font-bold">{c.defaulter_count ?? 0}</div>
                  <div className="text-xs text-gray-500">Defaulters</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Collected</div>
                  <div className="text-sm font-bold text-green-700">Rs. {(c.total_collected ?? 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditCampus(null); }} title={editCampus?.id ? 'Edit Campus' : 'Add Campus'}>
        {editCampus && (
          <div className="space-y-3">
            <div><label className="block text-xs font-medium mb-1">Campus Name *</label><input type="text" value={editCampus.name || ''} onChange={e => setEditCampus(p => ({ ...p!, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1">Campus Code *</label><input type="text" value={editCampus.code || ''} onChange={e => setEditCampus(p => ({ ...p!, code: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., GUL" /></div>
            <div><label className="block text-xs font-medium mb-1">Address</label><textarea value={editCampus.address || ''} onChange={e => setEditCampus(p => ({ ...p!, address: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium mb-1">Phone</label><input type="text" value={editCampus.contact_phone || ''} onChange={e => setEditCampus(p => ({ ...p!, contact_phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium mb-1">Email</label><input type="text" value={editCampus.email || ''} onChange={e => setEditCampus(p => ({ ...p!, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div><label className="block text-xs font-medium mb-1">Tagline</label><input type="text" value={editCampus.tagline || ''} onChange={e => setEditCampus(p => ({ ...p!, tagline: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <button onClick={saveCampus} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">{editCampus.id ? 'Update Campus' : 'Add Campus'}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
