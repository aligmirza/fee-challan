'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import { Plus, Search, Edit2, UserX, UserCheck, Upload, Download, Users, Phone, X, UserPlus } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Student {
  id: number; name: string; father_name: string; mother_name: string; gender: string; dob: string;
  class_name: string; section_name: string; roll_no: string; status: string;
  family_id: string | null; family_name: string | null; guardian_name: string | null; guardian_phone: string | null;
  contact_phone: string; cnic_bform: string; enrollment_date: string; class_id: number; section_id: number;
}

interface FamilyGroup {
  contact_phone: string;
  family_name: string;
  guardian_name: string;
  address: string;
  members: Student[];
}

export default function StudentManagement() {
  const { selectedCampusId } = useCampus();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Partial<Student & { family_name_input: string; guardian_name_input: string }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'family'>('list');
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<FamilyGroup | null>(null);
  const [familySiblings, setFamilySiblings] = useState<Student[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => { fetch(`/api/classes?campus_id=${selectedCampusId}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setClasses(d); }).catch(() => {}); }, [selectedCampusId]);

  const loadStudents = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ campus_id: String(selectedCampusId), status: filterStatus });
    if (search) params.set('search', search);
    if (filterClass) params.set('class_id', filterClass);
    fetch(`/api/students?${params}`).then(r => r.json()).then(d => { setStudents(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, [selectedCampusId, search, filterClass, filterStatus]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  useEffect(() => {
    if (editStudent?.class_id) {
      fetch(`/api/sections?class_id=${editStudent.class_id}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setSections(d); }).catch(() => {});
    }
  }, [editStudent?.class_id]);

  const openAdd = () => {
    setEditStudent({ name: '', father_name: '', mother_name: '', gender: 'M', dob: '', class_id: undefined, section_id: undefined, roll_no: '', contact_phone: '', cnic_bform: '', enrollment_date: new Date().toISOString().split('T')[0], family_id: '', family_name_input: '', guardian_name_input: '' });
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent({ ...s, family_name_input: s.family_name || '', guardian_name_input: s.guardian_name || '' });
    setShowModal(true);
  };

  const saveStudent = async () => {
    if (!editStudent) return;
    const url = editStudent.id ? `/api/students/${editStudent.id}` : '/api/students';
    const method = editStudent.id ? 'PUT' : 'POST';
    const payload = {
      ...editStudent,
      campus_id: selectedCampusId,
      family_name: editStudent.family_name_input,
      guardian_name: editStudent.guardian_name_input || editStudent.father_name,
    };
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setShowModal(false);
    setEditStudent(null);
    loadStudents();
  };

  const toggleStatus = async (s: Student) => {
    const newStatus = s.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/students/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    setStudents(prev => prev.map(st => st.id === s.id ? { ...st, status: newStatus } : st));
  };

  // Group students by family_id (guardian contact)
  const familyGroups: FamilyGroup[] = [];
  const ungrouped: Student[] = [];
  const familyMap = new Map<string, Student[]>();

  students.forEach(s => {
    if (s.family_id) {
      if (!familyMap.has(s.family_id)) familyMap.set(s.family_id, []);
      familyMap.get(s.family_id)!.push(s);
    } else {
      ungrouped.push(s);
    }
  });

  familyMap.forEach((members, phone) => {
    familyGroups.push({
      contact_phone: phone,
      family_name: members[0].family_name || `${members[0].father_name}'s Family`,
      guardian_name: members[0].guardian_name || members[0].father_name,
      address: '',
      members,
    });
  });

  const openFamilyView = async (group: FamilyGroup) => {
    setSelectedFamily(group);
    setFamilySiblings(group.members);
    setShowFamilyModal(true);
  };

  const removeSibling = async (studentId: number) => {
    await fetch(`/api/students/${studentId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family_id: null }),
    });
    loadStudents();
    setFamilySiblings(prev => prev.filter(s => s.id !== studentId));
  };

  const addSiblingToFamily = (familyId: string) => {
    setShowFamilyModal(false);
    setEditStudent({
      name: '', father_name: selectedFamily?.guardian_name || '', mother_name: '', gender: 'M', dob: '',
      class_id: undefined, section_id: undefined, roll_no: '', contact_phone: '',
      cnic_bform: '', enrollment_date: new Date().toISOString().split('T')[0],
      family_id: familyId, family_name_input: selectedFamily?.family_name || '', guardian_name_input: selectedFamily?.guardian_name || '',
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>List</button>
            <button onClick={() => setViewMode('family')} className={`px-3 py-2 text-sm ${viewMode === 'family' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>Families</button>
          </div>
          <button onClick={() => { setShowImportModal(true); setImportResult(null); setImportFile(null); }} className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"><Upload size={14} /> Import</button>
          <a href={`/api/students/export?campus_id=${selectedCampusId}`} download className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"><Download size={14} /> Export</a>
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><Plus size={16} /> Add Student</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, roll number, or guardian contact..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="active">Active</option><option value="inactive">Inactive</option><option value="">All</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : viewMode === 'list' ? (
        /* ===== LIST VIEW ===== */
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">
              <th className="text-left py-3 px-4">Roll #</th><th className="text-left py-3 px-4">Name</th><th className="text-left py-3 px-4">Father Name</th>
              <th className="text-left py-3 px-4">Class</th><th className="text-left py-3 px-4">Gender</th>
              <th className="text-left py-3 px-4">Guardian Contact</th><th className="text-center py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono">{s.roll_no}</td>
                  <td className="py-3 px-4 font-medium">{s.name}</td>
                  <td className="py-3 px-4">{s.father_name}</td>
                  <td className="py-3 px-4">{s.class_name} {s.section_name}</td>
                  <td className="py-3 px-4">{s.gender === 'M' ? 'Male' : 'Female'}</td>
                  <td className="py-3 px-4">
                    {s.family_id ? (
                      <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs font-medium">
                        <Phone size={10} /> {s.family_id}
                      </span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                      {s.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={14} className="text-blue-600" /></button>
                      <button onClick={() => toggleStatus(s)} className="p-1.5 hover:bg-gray-100 rounded" title={s.status === 'active' ? 'Deactivate' : 'Reactivate'}>
                        {s.status === 'active' ? <UserX size={14} className="text-red-500" /> : <UserCheck size={14} className="text-green-600" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && <p className="text-gray-400 text-center py-12">No students found</p>}
        </div>
      ) : (
        /* ===== FAMILY GROUP VIEW ===== */
        <div className="space-y-4">
          {familyGroups.map(group => (
            <div key={group.contact_phone} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-purple-50 border-b border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users size={20} /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.family_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Guardian: {group.guardian_name}</span>
                      <span className="inline-flex items-center gap-1 text-purple-600"><Phone size={12} /> {group.contact_phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{group.members.length} siblings</span>
                  <button onClick={() => openFamilyView(group)} className="text-sm text-blue-600 hover:underline px-2">Manage</button>
                </div>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {group.members.map(s => (
                    <tr key={s.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono w-16">{s.roll_no}</td>
                      <td className="py-2.5 px-4 font-medium">{s.name}</td>
                      <td className="py-2.5 px-4 text-gray-500">{s.class_name} {s.section_name}</td>
                      <td className="py-2.5 px-4 text-gray-500">{s.gender === 'M' ? 'Male' : 'Female'}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button onClick={() => openEdit(s)} className="p-1 hover:bg-blue-50 rounded"><Edit2 size={13} className="text-blue-600" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {ungrouped.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-700">Ungrouped Students (No Guardian Contact)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Edit these students and add a guardian contact number to create family groups</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {ungrouped.map(s => (
                    <tr key={s.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono w-16">{s.roll_no}</td>
                      <td className="py-2.5 px-4 font-medium">{s.name}</td>
                      <td className="py-2.5 px-4">{s.father_name}</td>
                      <td className="py-2.5 px-4 text-gray-500">{s.class_name} {s.section_name}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button onClick={() => openEdit(s)} className="p-1 hover:bg-blue-50 rounded"><Edit2 size={13} className="text-blue-600" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {familyGroups.length === 0 && ungrouped.length === 0 && (
            <p className="text-gray-400 text-center py-12">No students found</p>
          )}
        </div>
      )}

      {/* Add/Edit Student Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditStudent(null); }} title={editStudent?.id ? 'Edit Student' : 'Add Student'} size="lg">
        {editStudent && (
          <div className="space-y-4">
            {/* Student Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Student Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1">Student Name *</label><input type="text" value={editStudent.name || ''} onChange={e => setEditStudent(p => ({ ...p!, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium mb-1">Gender</label><select value={editStudent.gender || 'M'} onChange={e => setEditStudent(p => ({ ...p!, gender: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="M">Male</option><option value="F">Female</option></select></div>
                <div><label className="block text-xs font-medium mb-1">Father Name</label><input type="text" value={editStudent.father_name || ''} onChange={e => setEditStudent(p => ({ ...p!, father_name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium mb-1">Mother Name</label><input type="text" value={editStudent.mother_name || ''} onChange={e => setEditStudent(p => ({ ...p!, mother_name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium mb-1">Date of Birth</label><input type="date" value={editStudent.dob || ''} onChange={e => setEditStudent(p => ({ ...p!, dob: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium mb-1">CNIC/B-Form</label><input type="text" value={editStudent.cnic_bform || ''} onChange={e => setEditStudent(p => ({ ...p!, cnic_bform: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Academic Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Academic Information</h4>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium mb-1">Class *</label><select value={editStudent.class_id || ''} onChange={e => setEditStudent(p => ({ ...p!, class_id: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-xs font-medium mb-1">Section</label><select value={editStudent.section_id || ''} onChange={e => setEditStudent(p => ({ ...p!, section_id: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Select</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-xs font-medium mb-1">Roll No</label><input type="text" value={editStudent.roll_no || ''} onChange={e => setEditStudent(p => ({ ...p!, roll_no: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Family / Guardian Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Users size={14} className="text-purple-600" /> Family Group
              </h4>
              <div className="bg-purple-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-purple-700">Students with the same <strong>Guardian Contact Number</strong> are automatically grouped as siblings. Enter the guardian&apos;s phone number to link siblings together.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Guardian Contact Number (Family ID) *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input type="text" value={editStudent.family_id || ''} onChange={e => setEditStudent(p => ({ ...p!, family_id: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="03001234567" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" maxLength={11} />
                  </div>
                </div>
                <div><label className="block text-xs font-medium mb-1">Guardian Name</label><input type="text" value={editStudent.guardian_name_input || ''} onChange={e => setEditStudent(p => ({ ...p!, guardian_name_input: e.target.value }))} placeholder="Auto-filled from father name" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="col-span-2"><label className="block text-xs font-medium mb-1">Family Name</label><input type="text" value={editStudent.family_name_input || ''} onChange={e => setEditStudent(p => ({ ...p!, family_name_input: e.target.value }))} placeholder="e.g. Ahmed Family (auto-generated if blank)" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            <button onClick={saveStudent} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">{editStudent.id ? 'Update Student' : 'Add Student'}</button>
          </div>
        )}
      </Modal>

      {/* Family Management Modal */}
      <Modal isOpen={showFamilyModal} onClose={() => setShowFamilyModal(false)} title={`Manage Family: ${selectedFamily?.family_name || ''}`} size="lg">
        {selectedFamily && (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Guardian: <span className="font-medium text-gray-700">{selectedFamily.guardian_name}</span></div>
                  <div className="flex items-center gap-1 text-sm text-purple-700 mt-1"><Phone size={13} /> {selectedFamily.contact_phone}</div>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">{familySiblings.length} siblings</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Siblings</h4>
              {familySiblings.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.class_name} {s.section_name} · Roll #{s.roll_no} · {s.gender === 'M' ? 'Male' : 'Female'}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setShowFamilyModal(false); openEdit(s); }} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => removeSibling(s.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Remove from family"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => addSiblingToFamily(selectedFamily.contact_phone)} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-300 text-purple-600 py-3 rounded-lg hover:bg-purple-50 text-sm font-medium transition">
              <UserPlus size={16} /> Add Sibling to This Family
            </button>
          </div>
        )}
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Students from CSV">
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">CSV Format Required:</p>
            <p className="text-xs">Name, Father Name, Mother Name, DOB, Gender (M/F), CNIC/B-Form, Class, Section, Roll No, Guardian Contact, Contact Phone, Address</p>
            <p className="text-xs mt-1">First row should be headers. Class names must match existing classes.</p>
          </div>
          <div>
            <input type="file" accept=".csv" onChange={e => setImportFile(e.target.files?.[0] || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          {importResult && (
            <div className={`rounded-lg p-3 text-sm ${importResult.imported > 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
              <p className="font-medium">{importResult.imported} imported, {importResult.skipped} skipped</p>
              {importResult.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto text-xs space-y-0.5">
                  {importResult.errors.slice(0, 20).map((err, i) => <p key={i}>{err}</p>)}
                  {importResult.errors.length > 20 && <p>...and {importResult.errors.length - 20} more</p>}
                </div>
              )}
            </div>
          )}
          <button onClick={async () => {
            if (!importFile) return;
            setImporting(true);
            try {
              const text = await importFile.text();
              const lines = text.split('\n').filter(l => l.trim());
              if (lines.length < 2) { alert('CSV must have headers and at least one data row'); setImporting(false); return; }
              const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, '_'));
              const rows = lines.slice(1).map(line => {
                const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const row: Record<string, string> = {};
                headers.forEach((h, i) => { row[h] = vals[i] || ''; });
                return {
                  name: row.name || row.student_name || '',
                  father_name: row.father_name || row.father || '',
                  mother_name: row.mother_name || row.mother || '',
                  dob: row.dob || row.date_of_birth || '',
                  gender: row.gender || '',
                  cnic_bform: row.cnic_bform || row.cnic || row.b_form || '',
                  class_name: row.class || row.class_name || '',
                  section_name: row.section || row.section_name || '',
                  roll_no: row.roll_no || row.roll || '',
                  guardian_contact: row.guardian_contact || row.guardian_phone || row.family_id || '',
                  contact_phone: row.contact_phone || row.phone || '',
                  address: row.address || '',
                };
              });
              const res = await fetch('/api/students/import', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows, campus_id: selectedCampusId }),
              });
              const data = await res.json();
              setImportResult(data);
              if (data.imported > 0) loadStudents();
            } catch { alert('Failed to parse CSV'); }
            setImporting(false);
          }} disabled={!importFile || importing}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {importing ? 'Importing...' : 'Import Students'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
