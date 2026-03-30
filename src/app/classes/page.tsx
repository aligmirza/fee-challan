'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import { Plus, Pencil, Trash2, CheckCircle, X, ChevronRight } from 'lucide-react';

interface Campus { id: number; name: string; }
interface Class { id: number; campus_id: number; name: string; display_order: number; academic_year: string; is_active: number; }
interface Section { id: number; class_id: number; name: string; class_teacher: string; }

export default function ClassManagementPage() {
  const { selectedCampusId } = useCampus();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Add Class form
  const [showAddClass, setShowAddClass] = useState(false);
  const [classForm, setClassForm] = useState({ name: '', display_order: '', academic_year: '' });
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // Add Section form
  const [showAddSection, setShowAddSection] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: '', class_teacher: '' });
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(null), 4000); };

  useEffect(() => {
    fetch('/api/campuses').then(r => r.json()).then(d => { if (Array.isArray(d)) setCampuses(d); }).catch(() => {});
  }, []);

  const loadClasses = useCallback(() => {
    fetch(`/api/classes?campus_id=${selectedCampusId}`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setClasses(d); }).catch(() => {});
  }, [selectedCampusId]);

  useEffect(() => { loadClasses(); setSelectedClassId(null); }, [loadClasses]);

  const loadSections = useCallback((classId: number) => {
    fetch(`/api/sections?class_id=${classId}`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setSections(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedClassId) loadSections(selectedClassId);
    else setSections([]);
  }, [selectedClassId, loadSections]);

  // --- Class CRUD ---
  const addClass = async () => {
    if (!classForm.name.trim()) return;
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campus_id: selectedCampusId,
        name: classForm.name.trim(),
        display_order: Number(classForm.display_order) || 0,
        academic_year: classForm.academic_year || null,
      }),
    });
    if (res.ok) {
      setClassForm({ name: '', display_order: '', academic_year: '' });
      setShowAddClass(false);
      loadClasses();
      showToast('Class added');
    }
  };

  const updateClass = async () => {
    if (!editingClass || !editingClass.name.trim()) return;
    const res = await fetch(`/api/classes/${editingClass.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingClass.name,
        display_order: editingClass.display_order,
        academic_year: editingClass.academic_year,
        is_active: editingClass.is_active,
      }),
    });
    if (res.ok) { setEditingClass(null); loadClasses(); showToast('Class updated'); }
  };

  const deleteClass = async (id: number) => {
    if (!confirm('Delete this class and all its sections?')) return;
    const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      if (selectedClassId === id) setSelectedClassId(null);
      loadClasses();
      showToast('Class deleted');
    } else {
      showError(data.error || 'Failed to delete');
    }
  };

  // --- Section CRUD ---
  const addSection = async () => {
    if (!sectionForm.name.trim() || !selectedClassId) return;
    const res = await fetch('/api/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_id: selectedClassId,
        name: sectionForm.name.trim(),
        class_teacher: sectionForm.class_teacher || null,
      }),
    });
    if (res.ok) {
      setSectionForm({ name: '', class_teacher: '' });
      setShowAddSection(false);
      loadSections(selectedClassId);
      showToast('Section added');
    }
  };

  const updateSection = async () => {
    if (!editingSection || !editingSection.name.trim()) return;
    const res = await fetch(`/api/sections/${editingSection.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingSection.name, class_teacher: editingSection.class_teacher }),
    });
    if (res.ok) { setEditingSection(null); if (selectedClassId) loadSections(selectedClassId); showToast('Section updated'); }
  };

  const deleteSection = async (id: number) => {
    if (!confirm('Delete this section?')) return;
    const res = await fetch(`/api/sections/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { if (selectedClassId) loadSections(selectedClassId); showToast('Section deleted'); }
    else showError(data.error || 'Failed to delete');
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const campusName = campuses.find(c => c.id === selectedCampusId)?.name || 'Campus';

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle size={16} /> {toast}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Classes Panel ── */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="font-semibold text-gray-900">Classes</h2>
              <p className="text-xs text-gray-400 mt-0.5">{campusName} · {classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
            </div>
            <button onClick={() => { setShowAddClass(!showAddClass); setEditingClass(null); }}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
              <Plus size={15} /> Add Class
            </button>
          </div>

          {showAddClass && (
            <div className="px-5 py-4 bg-blue-50 border-b space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class Name *</label>
                  <input type="text" placeholder="e.g. Class 1, Nursery" value={classForm.name}
                    onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addClass()}
                    className="w-full border rounded-lg px-3 py-2 text-sm" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                  <input type="number" placeholder="0" value={classForm.display_order}
                    onChange={e => setClassForm(f => ({ ...f, display_order: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
                  <input type="text" placeholder="2025-2026" value={classForm.academic_year}
                    onChange={e => setClassForm(f => ({ ...f, academic_year: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addClass} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
                <button onClick={() => setShowAddClass(false)} className="text-sm text-gray-500 hover:text-gray-700 px-2">Cancel</button>
              </div>
            </div>
          )}

          <div className="divide-y">
            {classes.length === 0 && (
              <p className="text-gray-400 text-center py-10 text-sm">No classes yet. Add one above.</p>
            )}
            {classes.map(cls => (
              <div key={cls.id}>
                {editingClass?.id === cls.id ? (
                  <div className="px-5 py-3 bg-yellow-50 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={editingClass.name}
                        onChange={e => setEditingClass(ec => ec ? { ...ec, name: e.target.value } : ec)}
                        className="col-span-2 border rounded-lg px-3 py-1.5 text-sm" autoFocus />
                      <input type="number" placeholder="Order" value={editingClass.display_order}
                        onChange={e => setEditingClass(ec => ec ? { ...ec, display_order: Number(e.target.value) } : ec)}
                        className="border rounded-lg px-3 py-1.5 text-sm" />
                      <input type="text" placeholder="Academic Year" value={editingClass.academic_year || ''}
                        onChange={e => setEditingClass(ec => ec ? { ...ec, academic_year: e.target.value } : ec)}
                        className="border rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editingClass.is_active === 1}
                        onChange={e => setEditingClass(ec => ec ? { ...ec, is_active: e.target.checked ? 1 : 0 } : ec)} />
                      Active
                    </label>
                    <div className="flex gap-2">
                      <button onClick={updateClass} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                      <button onClick={() => setEditingClass(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setSelectedClassId(cls.id === selectedClassId ? null : cls.id)}
                    className={`w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition cursor-pointer ${selectedClassId === cls.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ChevronRight size={16} className={`text-blue-400 transition-transform flex-shrink-0 ${selectedClassId === cls.id ? 'rotate-90' : ''}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{cls.name}</span>
                          {!cls.is_active && <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Inactive</span>}
                        </div>
                        {cls.academic_year && <p className="text-xs text-gray-400">{cls.academic_year}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditingClass(cls); setShowAddClass(false); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteClass(cls.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Sections Panel ── */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="font-semibold text-gray-900">Sections</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedClass ? `${selectedClass.name} · ${sections.length} section${sections.length !== 1 ? 's' : ''}` : 'Select a class'}
              </p>
            </div>
            {selectedClassId && (
              <button onClick={() => { setShowAddSection(!showAddSection); setEditingSection(null); }}
                className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                <Plus size={15} /> Add Section
              </button>
            )}
          </div>

          {showAddSection && selectedClassId && (
            <div className="px-5 py-4 bg-blue-50 border-b space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section Name *</label>
                  <input type="text" placeholder="e.g. A, B, Blue" value={sectionForm.name}
                    onChange={e => setSectionForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addSection()}
                    className="w-full border rounded-lg px-3 py-2 text-sm" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class Teacher</label>
                  <input type="text" placeholder="Teacher name" value={sectionForm.class_teacher}
                    onChange={e => setSectionForm(f => ({ ...f, class_teacher: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addSection} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
                <button onClick={() => setShowAddSection(false)} className="text-sm text-gray-500 hover:text-gray-700 px-2">Cancel</button>
              </div>
            </div>
          )}

          {!selectedClassId ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ChevronRight size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Select a class to manage its sections</p>
            </div>
          ) : sections.length === 0 ? (
            <p className="text-gray-400 text-center py-10 text-sm">No sections yet. Add one above.</p>
          ) : (
            <div className="divide-y">
              {sections.map(sec => (
                <div key={sec.id}>
                  {editingSection?.id === sec.id ? (
                    <div className="px-5 py-3 bg-yellow-50 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={editingSection.name}
                          onChange={e => setEditingSection(es => es ? { ...es, name: e.target.value } : es)}
                          placeholder="Section name" className="border rounded-lg px-3 py-1.5 text-sm" autoFocus />
                        <input type="text" value={editingSection.class_teacher || ''}
                          onChange={e => setEditingSection(es => es ? { ...es, class_teacher: e.target.value } : es)}
                          placeholder="Class teacher" className="border rounded-lg px-3 py-1.5 text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={updateSection} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                        <button onClick={() => setEditingSection(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                      <div>
                        <span className="font-medium text-sm">Section {sec.name}</span>
                        {sec.class_teacher && <p className="text-xs text-gray-400">Teacher: {sec.class_teacher}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingSection(sec); setShowAddSection(false); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteSection(sec.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
