import React, { useMemo, useState, useEffect } from 'react';
import type { CaseSession } from '../types';
import SessionTable from './SessionTable';
import { ClipboardDocumentListIcon, ArrowRightIcon, WarningIcon } from './icons';

interface AssignmentsViewProps {
    sessions: CaseSession[];
    onUpdateClick: (session: CaseSession) => void;
    conflictingSessionIds: Set<number>;
    lawyerFilter?: string | null;
    onClearFilter?: () => void;
    showOnlyConflicts?: boolean;
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ 
    sessions, 
    onUpdateClick, 
    conflictingSessionIds, 
    lawyerFilter, 
    onClearFilter,
    showOnlyConflicts = false
}) => {
    // حالات الفلترة المحلية
    const [selectedCircuit, setSelectedCircuit] = useState<string>('');
    const [selectedLawyer, setSelectedLawyer] = useState<string>('');

    // تزامن الفلتر القادم من التقارير مع القائمة المنسدلة
    useEffect(() => {
        if (lawyerFilter) {
            setSelectedLawyer(lawyerFilter);
        } else {
            setSelectedLawyer('');
        }
    }, [lawyerFilter]);

    // استخراج الدوائر الفريدة للفلتر
    const uniqueCircuits = useMemo(() => {
        const circuits = sessions
            .map(s => (s['الدائرة'] || '').trim())
            .filter(Boolean);
        return Array.from(new Set(circuits)).sort();
    }, [sessions]);

    // استخراج المحامين الفريدين للفلتر
    const uniqueLawyers = useMemo(() => {
        const lawyers = sessions
            .map(s => (s['التكليف'] || '').trim())
            .filter(Boolean);
        return Array.from(new Set(lawyers)).sort();
    }, [sessions]);

    // حساب التعارضات الخاصة بناءً على الفلاتر المختارة
    const lawyerSpecificConflictIds = useMemo(() => {
        const currentLawyer = selectedLawyer || lawyerFilter;
        if (!currentLawyer || !showOnlyConflicts) return conflictingSessionIds;

        const filteredByLawyer = sessions.filter(s => (s['التكليف'] || '').trim() === currentLawyer.trim());
        const timeMap = new Map<string, number[]>();
        
        filteredByLawyer.forEach(s => {
            const key = `${s['التاريخ']}_${s['وقت الموعد']}`;
            if (!timeMap.has(key)) timeMap.set(key, []);
            timeMap.get(key)!.push(s.id);
        });

        const specificIds = new Set<number>();
        timeMap.forEach(ids => {
            if (ids.length > 1) {
                ids.forEach(id => specificIds.add(id));
            }
        });

        return specificIds;
    }, [sessions, selectedLawyer, lawyerFilter, showOnlyConflicts, conflictingSessionIds]);

    const assignedSessions = useMemo(() => {
        // نبدأ بالجلسات التي تحتوي على تكليف فقط
        let baseSessions = sessions.filter(session => session['التكليف'] && session['التكليف'].trim() !== '');
        
        // تطبيق فلتر الدائرة
        if (selectedCircuit) {
            baseSessions = baseSessions.filter(s => (s['الدائرة'] || '').trim() === selectedCircuit);
        }

        // تطبيق فلتر المحامي (الأولوية للمختار من القائمة، ثم القادم من البروبس)
        const activeLawyer = selectedLawyer || lawyerFilter;
        if (activeLawyer) {
            baseSessions = baseSessions.filter(s => (s['التكليف'] || '').trim() === activeLawyer.trim());
        }
        
        // تطبيق فلتر التعارضات
        if (showOnlyConflicts) {
            baseSessions = baseSessions.filter(s => lawyerSpecificConflictIds.has(s.id));
        }
        
        return baseSessions;
    }, [sessions, selectedCircuit, selectedLawyer, lawyerFilter, showOnlyConflicts, lawyerSpecificConflictIds]);

    const handleResetFilters = () => {
        setSelectedCircuit('');
        setSelectedLawyer('');
        if (onClearFilter) onClearFilter();
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-border pb-6">
                <div className="flex items-center">
                    <div className="p-3 bg-primary/10 rounded-xl ml-4">
                        <ClipboardDocumentListIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-dark">جدول كافة التكليفات</h2>
                        <p className="text-sm text-text opacity-70">إدارة وتصفية مهام أعضاء المكتب</p>
                    </div>
                </div>
                
                {/* Filters Section */}
                <div className="flex flex-wrap gap-3">
                    {/* Circuit Filter */}
                    <div className="flex flex-col min-w-[150px]">
                        <label className="text-[10px] font-bold text-text mb-1 mr-1">تصفية حسب الدائرة</label>
                        <select 
                            value={selectedCircuit}
                            onChange={(e) => setSelectedCircuit(e.target.value)}
                            className="bg-light border border-border rounded-lg px-3 py-2 text-sm font-medium text-dark focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                        >
                            <option value="">جميع الدوائر</option>
                            {uniqueCircuits.map(circuit => (
                                <option key={circuit} value={circuit}>{circuit}</option>
                            ))}
                        </select>
                    </div>

                    {/* Lawyer Filter */}
                    <div className="flex flex-col min-w-[150px]">
                        <label className="text-[10px] font-bold text-text mb-1 mr-1">تصفية حسب التكليف</label>
                        <select 
                            value={selectedLawyer}
                            onChange={(e) => setSelectedLawyer(e.target.value)}
                            className="bg-light border border-border rounded-lg px-3 py-2 text-sm font-medium text-dark focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                        >
                            <option value="">جميع المكلفين</option>
                            {uniqueLawyers.map(lawyer => (
                                <option key={lawyer} value={lawyer}>{lawyer}</option>
                            ))}
                        </select>
                    </div>

                    {/* Reset Button */}
                    <div className="flex items-end">
                        <button 
                            onClick={handleResetFilters}
                            className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors group"
                            title="إعادة ضبط الفلاتر"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Special Mode Banner (Conflicts) */}
            {showOnlyConflicts && (
                <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center">
                        <WarningIcon className="w-5 h-5 text-red-600 ml-3" />
                        <div>
                            <h4 className="text-sm font-bold text-red-800">وضع تدقيق التعارضات مفعل</h4>
                            <p className="text-xs text-red-700 opacity-80">يتم عرض الجلسات المتداخلة زمنياً فقط بناءً على الفلاتر الحالية.</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Table Area */}
            <div className="min-h-[300px]">
                <SessionTable 
                    sessions={assignedSessions} 
                    onUpdateClick={onUpdateClick} 
                    showDateColumn={true}
                    conflictingSessionIds={lawyerSpecificConflictIds}
                />

                {/* Empty State */}
                {assignedSessions.length === 0 && (
                    <div className="py-20 text-center bg-light/30 rounded-xl border-2 border-dashed border-border mt-2">
                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-border">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-dark">لا توجد نتائج</h3>
                        <p className="text-sm text-text mt-1 max-w-xs mx-auto">لم نعثر على أي جلسات مكلفة تطابق الفلاتر المختارة حالياً.</p>
                        <button 
                            onClick={handleResetFilters}
                            className="mt-6 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-dark transition-all shadow-md shadow-primary/20"
                        >
                            عرض جميع التكليفات
                        </button>
                    </div>
                )}
            </div>

            {assignedSessions.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-[10px] text-text">
                    <span className="font-medium italic">تم العثور على {assignedSessions.length} جلسة مطابقة</span>
                    <span className="opacity-50">آخر تحديث: الآن</span>
                </div>
            )}
        </div>
    );
};

export default AssignmentsView;