'use client';

import { useEffect, useState } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import { Layers, CheckCircle, Printer, Download } from 'lucide-react';

interface ClassOption { id: number; name: string; }
interface SectionOption { id: number; name: string; }
interface StudentPreview { id: number; name: string; father_name: string; roll_no: string; family_id: number | null; excluded: boolean; }

export default function BulkGenerationPage() {
  const { selectedCampusId } = useCampus();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(2026);
  const [familyMode, setFamilyMode] = useState('smart');
  const [students, setStudents] = useState<StudentPreview[]>([]);
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ challansGenerated: number; vouchersGenerated: number; totalAmount: number } | null>(null);

  useEffect(() => {
    fetch(`/api/classes?campus_id=${selectedCampusId}`).then(r => r.json()).then(setClasses).catch(() => {});
  }, [selectedCampusId]);

  useEffect(() => {
    if (!selectedClass) { setSections([]); return; }
    fetch(`/api/sections?class_id=${selectedClass}`).then(r => r.json()).then(setSections).catch(() => {});
  }, [selectedClass]);

  const loadPreview = async () => {
    const params = new URLSearchParams({ campus_id: String(selectedCampusId), class_id: selectedClass });
    if (selectedSection) params.set('section_id', selectedSection);
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    setStudents((data || []).map((s: StudentPreview) => ({ ...s, excluded: false })));
    setStep(2);
  };

  const toggleExclude = (id: number) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, excluded: !s.excluded } : s));
  };

  const generate = async () => {
    setGenerating(true);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 500);
    try {
      const res = await fetch('/api/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campus_id: selectedCampusId, class_id: Number(selectedClass),
          section_id: selectedSection ? Number(selectedSection) : null,
          month, year, family_mode: familyMode,
        }),
      });
      const data = await res.json();
      clearInterval(interval);
      setProgress(100);
      setResult(data);
      setStep(3);
    } catch {
      clearInterval(interval);
    }
    setGenerating(false);
  };

  const activeStudents = students.filter(s => !s.excluded);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Challan Generation</h1>
          <p className="text-gray-500 mt-1">Generate challans for entire classes at once</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{step > s ? '✓' : s}</div>
            <span className="text-sm font-medium">{s === 1 ? 'Select Class' : s === 2 ? 'Preview & Configure' : 'Results'}</span>
            {s < 3 && <div className={`w-16 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Selection */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                <option value="">All Sections</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2">
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2">
                <option value={2025}>2025</option><option value={2026}>2026</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Family Handling Mode</label>
            <div className="flex gap-4">
              {[
                { value: 'individual', label: 'Individual Only', desc: 'Generate separate challans for each student' },
                { value: 'family', label: 'Family Voucher Only', desc: 'Group siblings into family vouchers' },
                { value: 'smart', label: 'Smart (Default)', desc: 'Auto-detect siblings and group them' },
              ].map(opt => (
                <label key={opt.value} className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition ${familyMode === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="familyMode" value={opt.value} checked={familyMode === opt.value} onChange={e => setFamilyMode(e.target.value)} className="text-blue-600" />
                    <span className="font-medium text-sm">{opt.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          <button onClick={loadPreview} disabled={!selectedClass}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
            Preview Students
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Student Preview ({activeStudents.length} of {students.length} selected)</h3>
              <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">Back to Selection</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3">Include</th>
                    <th className="text-left py-2 px-3">Roll #</th>
                    <th className="text-left py-2 px-3">Student Name</th>
                    <th className="text-left py-2 px-3">Father Name</th>
                    <th className="text-left py-2 px-3">Family</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className={`border-t ${s.excluded ? 'opacity-40' : ''}`}>
                      <td className="py-2 px-3"><input type="checkbox" checked={!s.excluded} onChange={() => toggleExclude(s.id)} /></td>
                      <td className="py-2 px-3">{s.roll_no}</td>
                      <td className="py-2 px-3 font-medium">{s.name}</td>
                      <td className="py-2 px-3">{s.father_name}</td>
                      <td className="py-2 px-3">{s.family_id ? <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">Has Siblings</span> : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Progress */}
          {generating && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Generating challans...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {!generating && (
            <button onClick={generate} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium">
              <Layers size={18} /> Generate {activeStudents.length} Challans
            </button>
          )}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Bulk Generation Complete</h2>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-6">
              <div><div className="text-2xl font-bold text-green-700">{result.challansGenerated}</div><div className="text-sm text-green-600">Challans</div></div>
              <div><div className="text-2xl font-bold text-purple-700">{result.vouchersGenerated}</div><div className="text-sm text-purple-600">Family Vouchers</div></div>
              <div><div className="text-2xl font-bold text-blue-700">Rs. {result.totalAmount.toLocaleString()}</div><div className="text-sm text-blue-600">Total Amount</div></div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"><Printer size={18} /> Print All</button>
            <button className="flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium"><Download size={18} /> Download PDF</button>
            <button onClick={() => { setStep(1); setResult(null); setStudents([]); }} className="px-6 py-3 text-blue-600 hover:underline">Generate More</button>
          </div>
        </div>
      )}
    </div>
  );
}
