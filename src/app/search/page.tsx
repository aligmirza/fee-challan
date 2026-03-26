'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import { Student, Class, Section } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import {
  Search,
  Users,
  BookOpen,
  FileText,
  Receipt,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  UserCheck,
  X,
} from 'lucide-react';

type SearchMode = 'name' | 'class';
type SortKey = 'name' | 'father_name' | 'roll_no' | 'status';
type SortDir = 'asc' | 'desc';

export default function SearchPage() {
  const { selectedCampusId } = useCampus();

  // Mode state
  const [mode, setMode] = useState<SearchMode>('name');

  // Name search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [nameResults, setNameResults] = useState<Student[]>([]);
  const [nameLoading, setNameLoading] = useState(false);

  // Class browse state
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classLoading, setClassLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Sibling modal state
  const [siblingModalStudent, setSiblingModalStudent] = useState<Student | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!searchQuery.trim()) {
      setDebouncedQuery('');
      setNameResults([]);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  // Fetch name search results
  useEffect(() => {
    if (!debouncedQuery) return;
    setNameLoading(true);
    setError(null);
    fetch(`/api/students?campus_id=${selectedCampusId}&search=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to search students');
        return res.json();
      })
      .then((data: Student[]) => setNameResults(data))
      .catch((err) => setError(err.message))
      .finally(() => setNameLoading(false));
  }, [debouncedQuery, selectedCampusId]);

  // Fetch classes on campus change
  useEffect(() => {
    setClassesLoading(true);
    setSelectedClassId(null);
    setSelectedSectionId(null);
    setSections([]);
    setClassStudents([]);
    fetch(`/api/classes?campus_id=${selectedCampusId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch classes');
        return res.json();
      })
      .then((data: Class[]) => setClasses(data))
      .catch((err) => setError(err.message))
      .finally(() => setClassesLoading(false));
  }, [selectedCampusId]);

  // Fetch sections when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      setSelectedSectionId(null);
      return;
    }
    setSectionsLoading(true);
    setSelectedSectionId(null);
    fetch(`/api/sections?class_id=${selectedClassId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch sections');
        return res.json();
      })
      .then((data: Section[]) => setSections(data))
      .catch((err) => setError(err.message))
      .finally(() => setSectionsLoading(false));
  }, [selectedClassId]);

  // Fetch students when class or section changes
  useEffect(() => {
    if (!selectedClassId) {
      setClassStudents([]);
      return;
    }
    setClassLoading(true);
    setError(null);
    setSelectedIds(new Set());
    let url = `/api/students?campus_id=${selectedCampusId}&class_id=${selectedClassId}`;
    if (selectedSectionId) url += `&section_id=${selectedSectionId}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch students');
        return res.json();
      })
      .then((data: Student[]) => setClassStudents(data))
      .catch((err) => setError(err.message))
      .finally(() => setClassLoading(false));
  }, [selectedClassId, selectedSectionId, selectedCampusId]);

  // Sort handler
  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  // Sort students
  const sortStudents = useCallback(
    (students: Student[]) => {
      return [...students].sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    },
    [sortKey, sortDir]
  );

  // Toggle selection
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (students: Student[]) => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  // Handle challan action with sibling check
  const handleChallanAction = (student: Student) => {
    if (student.family_id && (student.sibling_count ?? 0) > 0) {
      setSiblingModalStudent(student);
    } else {
      window.location.href = `/challan?student_id=${student.id}`;
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronDown className="w-3.5 h-3.5 text-gray-300" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  const StudentRow = ({ student, showCheckbox = false }: { student: Student; showCheckbox?: boolean }) => (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      {showCheckbox && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={selectedIds.has(student.id)}
            onChange={() => toggleSelect(student.id)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{student.name}</span>
          {student.family_id && (student.sibling_count ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
              <Users className="w-3 h-3" />
              {(student.sibling_count ?? 0) + 1}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600">{student.father_name ?? '—'}</td>
      <td className="px-4 py-3 text-gray-600">{student.class_name ?? '—'}</td>
      <td className="px-4 py-3 text-gray-600">{student.section_name ?? '—'}</td>
      <td className="px-4 py-3 text-gray-600">{student.roll_no ?? '—'}</td>
      <td className="px-4 py-3">
        <StatusBadge status={student.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleChallanAction(student)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            title="Generate Challan"
          >
            <FileText className="w-3.5 h-3.5" />
            Challan
          </button>
          {student.family_id && (
            <Link
              href={`/family-voucher?family_id=${student.family_id}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
              title="Family Voucher"
            >
              <Receipt className="w-3.5 h-3.5" />
              Family
            </Link>
          )}
          <Link
            href={`/fee-tracker?student_id=${student.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            title="View History"
          >
            <History className="w-3.5 h-3.5" />
            History
          </Link>
        </div>
      </td>
    </tr>
  );

  const TableHeader = ({ showCheckbox = false, students = [] as Student[] }) => (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        {showCheckbox && (
          <th className="px-4 py-3 w-10">
            <input
              type="checkbox"
              checked={students.length > 0 && selectedIds.size === students.length}
              onChange={() => toggleSelectAll(students)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </th>
        )}
        <th
          className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none"
          onClick={() => handleSort('name')}
        >
          <div className="flex items-center gap-1">
            Student Name <SortIcon column="name" />
          </div>
        </th>
        <th
          className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none"
          onClick={() => handleSort('father_name')}
        >
          <div className="flex items-center gap-1">
            Father Name <SortIcon column="father_name" />
          </div>
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Class
        </th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Section
        </th>
        <th
          className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none"
          onClick={() => handleSort('roll_no')}
        >
          <div className="flex items-center gap-1">
            Roll No <SortIcon column="roll_no" />
          </div>
        </th>
        <th
          className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none"
          onClick={() => handleSort('status')}
        >
          <div className="flex items-center gap-1">
            Status <SortIcon column="status" />
          </div>
        </th>
        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Search</h1>
        <p className="text-sm text-gray-500 mt-1">Search students by name or browse by class to generate challans</p>
      </div>

      {/* Mode Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode('name')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors ${
              mode === 'name'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Search className="w-4 h-4" />
            Name Search
          </button>
          <button
            onClick={() => setMode('class')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors ${
              mode === 'class'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Class Browse
          </button>
        </div>

        <div className="p-5">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mode A: Name Search */}
          {mode === 'name' && (
            <div className="space-y-4">
              <div className="relative max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name, father name, or roll number..."
                  className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setNameResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {nameLoading && (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Searching...
                </div>
              )}

              {!nameLoading && debouncedQuery && nameResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <UserCheck className="w-10 h-10 mb-2" />
                  <p className="text-sm">No students found for &quot;{debouncedQuery}&quot;</p>
                </div>
              )}

              {!nameLoading && nameResults.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <TableHeader />
                    <tbody className="divide-y divide-gray-100">
                      {sortStudents(nameResults).map((student) => (
                        <StudentRow key={student.id} student={student} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!debouncedQuery && !nameLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Search className="w-10 h-10 mb-3" />
                  <p className="text-sm font-medium text-gray-500">Start typing to search students</p>
                  <p className="text-xs text-gray-400 mt-1">Search by name, father name, or roll number</p>
                </div>
              )}
            </div>
          )}

          {/* Mode B: Class Browse */}
          {mode === 'class' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {/* Class Dropdown */}
                <div className="w-64">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Class</label>
                  <select
                    value={selectedClassId ?? ''}
                    onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
                    disabled={classesLoading}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Dropdown */}
                <div className="w-64">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Section</label>
                  <select
                    value={selectedSectionId ?? ''}
                    onChange={(e) => setSelectedSectionId(e.target.value ? Number(e.target.value) : null)}
                    disabled={!selectedClassId || sectionsLoading}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">All Sections</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedIds.size > 0 && (
                  <div className="flex items-end">
                    <span className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                      <UserCheck className="w-4 h-4" />
                      {selectedIds.size} selected
                    </span>
                  </div>
                )}
              </div>

              {classLoading && (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading students...
                </div>
              )}

              {!classLoading && selectedClassId && classStudents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Users className="w-10 h-10 mb-2" />
                  <p className="text-sm">No students found in this class/section</p>
                </div>
              )}

              {!classLoading && classStudents.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <TableHeader showCheckbox students={classStudents} />
                    <tbody className="divide-y divide-gray-100">
                      {sortStudents(classStudents).map((student) => (
                        <StudentRow key={student.id} student={student} showCheckbox />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!selectedClassId && !classLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <BookOpen className="w-10 h-10 mb-3" />
                  <p className="text-sm font-medium text-gray-500">Select a class to browse students</p>
                  <p className="text-xs text-gray-400 mt-1">Optionally filter by section</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sibling Choice Modal */}
      <Modal
        isOpen={!!siblingModalStudent}
        onClose={() => setSiblingModalStudent(null)}
        title="Student has siblings"
        size="sm"
      >
        {siblingModalStudent && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{siblingModalStudent.name}</span> has{' '}
              {siblingModalStudent.sibling_count ?? 0} sibling(s) registered. How would you like to proceed?
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Link
                href={`/challan?student_id=${siblingModalStudent.id}`}
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                onClick={() => setSiblingModalStudent(null)}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Individual Challan</p>
                  <p className="text-xs text-gray-500">Generate challan for this student only</p>
                </div>
              </Link>
              <Link
                href={`/family-voucher?family_id=${siblingModalStudent.family_id}`}
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
                onClick={() => setSiblingModalStudent(null)}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Receipt className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Family Voucher</p>
                  <p className="text-xs text-gray-500">Generate combined voucher for all siblings</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
