import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { CaseSession } from '../types';
import SessionTable from './SessionTable';
import { ClipboardDocumentListIcon, WarningIcon, CheckBadgeIcon } from './icons';

// --- New MultiSelectFilter Component ---
interface MultiSelectFilterProps {
    label: string;
    options: string[];
    selectedOptions: string[];
    onChange: (selected: string[]) => void;
    disabled?: boolean;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({ label, options, selectedOptions, onChange, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleOptionToggle = (option: string) => {
        const newSelectedOptions = selectedOptions.includes(option)
            ? selectedOptions.filter(o => o !== option)
            : [...selectedOptions, option];
        onChange(newSelectedOptions);
    };

    const isAllSelected = options.length > 0 && selectedOptions.length === options.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            onChange([]);
        } else {
            onChange([...options]);
        }
    };

    const displayValue = () => {
        if (disabled && selectedOptions.length > 0) return selectedOptions[0];
        if (selectedOptions.length === 0) return `لم يتم اختيار أي ${label}`;
        if (isAllSelected) return `كل ${label}`;
        if (selectedOptions.length === 1) return selectedOptions[0];
        return `${selectedOptions.length} اختيارات`;
    };

    return (
        <div className="relative min-w-[160px]" ref={wrapperRef}>
            <div className="flex flex-col">
                <label className="text-[10px] font-bold text-text mb-1 mr-1">{label}</label>
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className="w-full bg-light border border-border rounded-lg px-3 py-2 text-xs font-medium text-dark focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:opacity-50 disabled:bg-border flex justify-between items-center h-[34px]"
                >
                    <span className="truncate">{displayValue()}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-primary/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                </button>
            </div>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-white border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <ul className="p-2 space-y-1">
                        <li className="border-b border-border mb-1 pb-1">
                            <label className="flex items-center gap-2 p-2 rounded-md hover:bg-light cursor-pointer font-bold text-primary">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                                />
                                <span className="text-xs">الكل</span>
                            </label>
                        </li>
                        {options.map(option => (
                            <li key={option}>
                                <label className="flex items-center gap-2 p-2 rounded-md hover:bg-light cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedOptions.includes(option)}
                                        onChange={() => handleOptionToggle(option)}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                                    />
                                    <span className="text-xs font-medium text-dark">{option}</span>
                                </label>
                            </li>
                        ))}
                         {options.length > 3 && (
                             <li className="border-t border-border mt-2 pt-2">
                                <button onClick={() => onChange([])} className="text-xs text-center w-full font-bold text-red-500 p-2 hover:bg-red-50 rounded">
                                    إلغاء تحديد الكل
                                </button>
                             </li>
                         )}
                    </ul>
                </div>
            )}
        </div>
    );
};
// --- End MultiSelectFilter Component ---

interface AssignmentFilters {
    lawyer?: string;
    plaintiff?: string;
    special?: 'correctly_linked' | 'unlinked' | 'duplicates';
    onlyConflicts?: boolean;
}

interface AssignmentsViewProps {
    sessions: CaseSession[]; // User's filtered sessions
    allSessions: CaseSession[]; // All sessions for special filters
    onUpdateClick?: (session: CaseSession) => void;
    onViewClick: (session: CaseSession) => void;
    conflictingSessionIds: Set<number>;
    filters: AssignmentFilters;
    onClearFilters: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ 
    sessions, 
    allSessions,
    onUpdateClick, 
    onViewClick,
    conflictingSessionIds, 
    filters,
    onClearFilters,
    searchQuery,
    onSearchChange
}) => {
    const { lawyerFilter, plaintiffFilter, specialFilter, onlyConflicts: showOnlyConflicts } = filters;
    
    const [pendingCircuits, setPendingCircuits] = useState<string[]>([]);
    const [pendingLawyers, setPendingLawyers] = useState<string[]>([]);
    const [pendingDates, setPendingDates] = useState<string[]>([]);
    const [pendingPlaintiffs, setPendingPlaintiffs] = useState<string[]>([]);

    const [appliedCircuits, setAppliedCircuits] = useState<string[]>([]);
    const [appliedLawyers, setAppliedLawyers] = useState<string[]>([]);
    const [appliedDates, setAppliedDates] = useState<string[]>([]);
    const [appliedPlaintiffs, setAppliedPlaintiffs] = useState<string[]>([]);

    // Removed automatic "Select All" initialization to keep table empty by default
    // as per user request.
    
    useEffect(() => {
        const lawyers = lawyerFilter ? [lawyerFilter] : [];
        setPendingLawyers(lawyers);
        setAppliedLawyers(lawyers);
        // Reset other local filters when lawyer changes
        setPendingCircuits([]);
        setAppliedCircuits([]);
        setPendingDates([]);
        setAppliedDates([]);
        setPendingPlaintiffs([]);
        setAppliedPlaintiffs([]);
    }, [lawyerFilter]);

    useEffect(() => {
        const plaintiffs = plaintiffFilter ? [plaintiffFilter] : [];
        setPendingPlaintiffs(plaintiffs);
        setAppliedPlaintiffs(plaintiffs);
        // Reset other local filters when plaintiff changes
        setPendingCircuits([]);
        setAppliedCircuits([]);
        setPendingDates([]);
        setAppliedDates([]);
        setPendingLawyers([]);
        setAppliedLawyers([]);
    }, [plaintiffFilter]);
    
    useEffect(() => {
        // Reset local filters when a special filter is applied from another page
        if (specialFilter) {
             handleResetFilters(false); // don't clear the special filter itself
        }
    }, [specialFilter]);

    const hasPendingChanges = useMemo(() => {
        return JSON.stringify(pendingCircuits) !== JSON.stringify(appliedCircuits) ||
               JSON.stringify(pendingLawyers) !== JSON.stringify(appliedLawyers) ||
               JSON.stringify(pendingDates) !== JSON.stringify(appliedDates) ||
               JSON.stringify(pendingPlaintiffs) !== JSON.stringify(appliedPlaintiffs);
    }, [pendingCircuits, appliedCircuits, pendingLawyers, appliedLawyers, pendingDates, appliedDates, pendingPlaintiffs, appliedPlaintiffs]);

    const handleApplyFilters = () => {
        setAppliedCircuits([...pendingCircuits]);
        setAppliedLawyers([...pendingLawyers]);
        setAppliedDates([...pendingDates]);
        setAppliedPlaintiffs([...pendingPlaintiffs]);
    };

    const uniqueCircuits = useMemo(() => {
        const circuits = sessions.map(s => (s['الدائرة'] || '').trim()).filter(Boolean);
        return Array.from(new Set(circuits)).sort();
    }, [sessions]);

    const uniqueLawyers = useMemo(() => {
        const lawyers = sessions.map(s => (s['التكليف'] || '').trim()).filter(Boolean);
        return Array.from(new Set(lawyers)).sort();
    }, [sessions]);

    const uniqueDates = useMemo(() => {
        const normalize = (d: string) => (d || '').replace(/[^\d-]/g, '').trim();
        const dates = sessions.map(s => normalize(s['التاريخ'])).filter(Boolean);
        const uniqueDateSet = new Set(dates);
        
        const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date(0); 
            return new Date(year, month - 1, day);
        };

        return Array.from(uniqueDateSet).sort((a: string, b: string) => {
            return parseDate(a).getTime() - parseDate(b).getTime();
        });
    }, [sessions]);
    
    const uniquePlaintiffs = useMemo(() => {
        const plaintiffs = sessions.map(s => (s['المدعي'] || '').trim()).filter(Boolean);
        return Array.from(new Set(plaintiffs)).sort();
    }, [sessions]);

    const entitySpecificConflictIds = useMemo(() => {
        if (!showOnlyConflicts) return conflictingSessionIds;

        let filteredByEntity: CaseSession[];
        if (lawyerFilter) filteredByEntity = sessions.filter(s => (s['التكليف'] || '').trim() === lawyerFilter.trim());
        else if (plaintiffFilter) filteredByEntity = sessions.filter(s => (s['المدعي'] || '').trim() === plaintiffFilter.trim());
        else return conflictingSessionIds;

        const timeMap = new Map<string, number[]>();
        filteredByEntity.forEach(s => {
            const key = `${s['التاريخ']}_${s['وقت الموعد']}_${s['ص- م']}`;
            if (!timeMap.has(key)) timeMap.set(key, []);
            timeMap.get(key)!.push(s.id);
        });

        const specificIds = new Set<number>();
        timeMap.forEach(ids => {
            if (ids.length > 1) ids.forEach(id => specificIds.add(id));
        });
        return specificIds;
    }, [sessions, lawyerFilter, plaintiffFilter, showOnlyConflicts, conflictingSessionIds]);

    const filteredSessions = useMemo(() => {
        // If no filters are applied and no search/special filter, return empty array as requested
        const hasActiveFilters = appliedCircuits.length > 0 || 
                                appliedDates.length > 0 || 
                                appliedPlaintiffs.length > 0 || 
                                appliedLawyers.length > 0 || 
                                searchQuery.trim() !== '' || 
                                !!specialFilter || 
                                !!lawyerFilter || 
                                !!plaintiffFilter;

        if (!hasActiveFilters) return [];

        let filtered = sessions;

        // 1. Special filters (duplicates, unlinked, correctly_linked)
        if (specialFilter) {
            const caseNumberCounts = new Map<string, number[]>();
            const violationNumberCounts = new Map<string, number[]>();
            sessions.forEach(s => {
                const caseNum = String(s['رقم الدعوى'] || '').trim();
                if (caseNum) {
                    if (!caseNumberCounts.has(caseNum)) caseNumberCounts.set(caseNum, []);
                    caseNumberCounts.get(caseNum)!.push(s.id);
                }
                const violationNum = String(s['رقم المخالفة'] || '').trim();
                if (violationNum) {
                    if (!violationNumberCounts.has(violationNum)) violationNumberCounts.set(violationNum, []);
                    violationNumberCounts.get(violationNum)!.push(s.id);
                }
            });
            const duplicateIds = new Set<number>();
            caseNumberCounts.forEach(ids => { if (ids.length > 1) ids.forEach(id => duplicateIds.add(id)); });
            violationNumberCounts.forEach(ids => { if (ids.length > 1) ids.forEach(id => duplicateIds.add(id)); });

            if (specialFilter === 'duplicates') filtered = sessions.filter(s => duplicateIds.has(s.id));
            else if (specialFilter === 'unlinked') filtered = sessions.filter(s => (!!s['رقم الدعوى'] && !s['رقم المخالفة']) || (!s['رقم الدعوى'] && !!s['رقم المخالفة']));
            else if (specialFilter === 'correctly_linked') filtered = sessions.filter(s => !!s['رقم الدعوى'] && !!s['رقم المخالفة'] && !duplicateIds.has(s.id));
        } else {
            // Default: Hide unassigned sessions if no specific lawyer/plaintiff filter is active
            if (!lawyerFilter && !plaintiffFilter) {
                filtered = sessions.filter(s => s['التكليف'] && s['التكليف'].trim() !== '');
            }
        }
        
        // 2. Search Query (Global filter)
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(s => {
                const caseNum = String(s['رقم الدعوى'] || '').toLowerCase();
                const sessionNum = String(s['رقم الجلسة'] || '').toLowerCase();
                const violationNum = String(s['رقم المخالفة'] || '').toLowerCase();
                return caseNum.includes(query) || sessionNum.includes(query) || violationNum.includes(query);
            });
        }
        
        // 3. Other Filters (Circuits, Dates, Plaintiffs, Lawyers)
        if (appliedCircuits.length > 0) {
            filtered = filtered.filter(s => appliedCircuits.includes((s['الدائرة'] || '').trim()));
        }
        if (appliedDates.length > 0) {
            const normalize = (d: string) => (d || '').replace(/[^\d-]/g, '').trim();
            filtered = filtered.filter(s => {
                const sessionDate = normalize(s['التاريخ']);
                return appliedDates.some(d => normalize(d) === sessionDate);
            });
        }
        if (appliedPlaintiffs.length > 0) {
            filtered = filtered.filter(s => appliedPlaintiffs.includes((s['المدعي'] || '').trim()));
        }
        if (appliedLawyers.length > 0) {
            filtered = filtered.filter(s => appliedLawyers.includes((s['التكليف'] || '').trim()));
        }
        
        // 4. Conflicts filter
        if (showOnlyConflicts) filtered = filtered.filter(s => entitySpecificConflictIds.has(s.id));
        
        return filtered;
    }, [allSessions, sessions, filters, appliedCircuits, appliedDates, appliedPlaintiffs, appliedLawyers, searchQuery, entitySpecificConflictIds, specialFilter, lawyerFilter, plaintiffFilter, showOnlyConflicts]);
    
    const dynamicContent = useMemo(() => {
        if (specialFilter === 'correctly_linked') return { title: 'الجلسات الصحيحة', subtitle: 'عرض الجلسات المكتملة البيانات والفريدة.' };
        if (specialFilter === 'unlinked') return { title: 'الجلسات غير المرتبطة', subtitle: 'جلسات ينقصها رقم دعوى أو رقم مخالفة.' };
        if (specialFilter === 'duplicates') return { title: 'الجلسات المكررة', subtitle: 'جلسات لها نفس رقم الدعوى أو رقم المخالفة.' };
        if (plaintiffFilter) return { title: `قضايا المدعي: ${plaintiffFilter}`, subtitle: `عرض جميع القضايا المرتبطة بهذا المدعي.` };
        if (lawyerFilter) return { title: `جلسات المحامي: ${lawyerFilter}`, subtitle: `عرض جميع الجلسات المكلف بها هذا المحامي.` };
        return { title: 'جدول كافة التكليفات', subtitle: 'إدارة وتصفية مهام أعضاء المكتب' };
    }, [filters]);

    const handleResetFilters = (clearSpecial = true) => {
        setPendingCircuits([]);
        setAppliedCircuits([]);
        setPendingLawyers([]);
        setAppliedLawyers([]);
        setPendingDates([]);
        setAppliedDates([]);
        setPendingPlaintiffs([]);
        setAppliedPlaintiffs([]);
        onSearchChange('');
        if (clearSpecial) onClearFilters();
    };

    const specialFilterBanners = {
        correctly_linked: { icon: <CheckBadgeIcon className="w-5 h-5 text-green-600" />, text: "عرض الجلسات الصحيحة والمكتملة فقط.", style: "bg-green-50 border-green-200 text-green-800" },
        unlinked: { icon: <WarningIcon className="w-5 h-5 text-amber-600" />, text: "عرض الجلسات غير المرتبطة (التي ينقصها رقم دعوى أو مخالفة).", style: "bg-amber-50 border-amber-200 text-amber-800" },
        duplicates: { icon: <WarningIcon className="w-5 h-5 text-red-600" />, text: "عرض الجلسات المكررة (حسب رقم الدعوى أو المخالفة).", style: "bg-red-50 border-red-200 text-red-800" }
    };
    
    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md animate-in fade-in slide-in-from-left-4 duration-500">
            <div className={`flex flex-col xl:flex-row xl:items-start justify-between mb-6 gap-6 ${!specialFilter && 'border-b border-border pb-6'}`}>
                <div className="flex items-start">
                    <div className="p-3 bg-primary/10 rounded-xl ml-4 shrink-0">
                        <ClipboardDocumentListIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <h2 className="text-2xl font-bold text-dark">{dynamicContent.title}</h2>
                            <span className="bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-full text-sm shrink-0">
                                {filteredSessions.length} نتيجة
                            </span>
                        </div>
                        <p className="text-sm text-text opacity-70 mt-1">{dynamicContent.subtitle}</p>
                    </div>
                </div>
                
                {!specialFilter && <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col min-w-[200px] relative">
                        <label className="text-[10px] font-bold text-text mb-1 mr-1">بحث برقم الدعوى / الجلسة / المخالفة</label>
                        <div className="relative">
                            <input type="text" placeholder="ادخل الرقم هنا..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="w-full bg-light border border-border rounded-lg pl-3 pr-10 py-2 text-xs font-medium text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"/>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-primary opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                        </div>
                    </div>
                    <MultiSelectFilter label="التواريخ" options={uniqueDates} selectedOptions={pendingDates} onChange={setPendingDates} />
                    <MultiSelectFilter label="الدوائر" options={uniqueCircuits} selectedOptions={pendingCircuits} onChange={setPendingCircuits} />
                    <MultiSelectFilter label="المدعين" options={uniquePlaintiffs} selectedOptions={pendingPlaintiffs} onChange={setPendingPlaintiffs} disabled={!!plaintiffFilter} />
                    <MultiSelectFilter label="المكلفين" options={uniqueLawyers} selectedOptions={pendingLawyers} onChange={setPendingLawyers} disabled={!!lawyerFilter} />

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleApplyFilters}
                            disabled={!hasPendingChanges}
                            className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                                hasPendingChanges 
                                ? 'bg-primary text-white hover:bg-dark' 
                                : 'bg-light text-text opacity-50 cursor-not-allowed border border-border'
                            }`}
                        >
                            تطبيق
                        </button>
                        <button onClick={() => handleResetFilters()} className="p-2.5 text-primary hover:bg-primary/5 rounded-lg transition-colors group border border-border bg-white" title="إعادة ضبط الفلاتر"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg></button>
                    </div>
                </div>}
            </div>

            {specialFilter && specialFilterBanners[specialFilter] && (
                <div className={`mb-6 p-4 rounded-xl flex items-center justify-between border ${specialFilterBanners[specialFilter].style}`}>
                    <div className="flex items-center">
                        {specialFilterBanners[specialFilter].icon}
                        <div className="mr-3">
                            <h4 className="text-sm font-bold">{specialFilterBanners[specialFilter].text}</h4>
                        </div>
                    </div>
                    <button onClick={onClearFilters} className="text-xs font-bold hover:underline opacity-70 hover:opacity-100">إلغاء الفلتر</button>
                </div>
            )}
            
            {showOnlyConflicts && (
                <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center"><WarningIcon className="w-5 h-5 text-red-600 ml-3" /><div><h4 className="text-sm font-bold text-red-800">وضع تدقيق التعارضات مفعل</h4><p className="text-xs text-red-700 opacity-80">يتم عرض الجلسات المتداخلة زمنياً فقط بناءً على الفلاتر الحالية.</p></div></div>
                </div>
            )}
            
            <div className="min-h-[300px]">
                <SessionTable sessions={filteredSessions} onUpdateClick={onUpdateClick} onViewClick={onViewClick} showDateColumn={true} conflictingSessionIds={entitySpecificConflictIds}/>
                {filteredSessions.length === 0 && (
                    <div className="py-20 text-center bg-light/30 rounded-xl border-2 border-dashed border-border mt-2">
                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-border"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg></div>
                        <h3 className="text-lg font-bold text-dark">لا توجد نتائج</h3>
                        <p className="text-sm text-text mt-1 max-w-xs mx-auto">لم نعثر على أي جلسات تطابق الفلاتر أو البحث الحالي.</p>
                        <button onClick={() => handleResetFilters()} className="mt-6 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-dark transition-all shadow-md shadow-primary/20">إلغاء البحث والفلترة</button>
                    </div>
                )}
            </div>

            {filteredSessions.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-[10px] text-text">
                    <span className="font-medium italic">تم العثور على {filteredSessions.length} جلسة مطابقة</span>
                    <span className="opacity-50">آخر تحديث: الآن</span>
                </div>
            )}
        </div>
    );
};

export default AssignmentsView;
