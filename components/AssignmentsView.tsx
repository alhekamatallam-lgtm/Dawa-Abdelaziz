

import React, { useMemo, useState, useEffect } from 'react';
import type { CaseSession } from '../types';
import SessionTable from './SessionTable';
import { ClipboardDocumentListIcon, ArrowRightIcon, WarningIcon } from './icons';

interface AssignmentsViewProps {
    sessions: CaseSession[];
    onUpdateClick: (session: CaseSession) => void;
    conflictingSessionIds: Set<number>;
    lawyerFilter?: string | null;
    plaintiffFilter?: string | null;
    onClearFilter?: () => void;
    showOnlyConflicts?: boolean;
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ 
    sessions, 
    onUpdateClick, 
    conflictingSessionIds, 
    lawyerFilter, 
    plaintiffFilter,
    onClearFilter,
    showOnlyConflicts = false
}) => {
    const [selectedCircuit, setSelectedCircuit] = useState<string>('');
    const [selectedLawyer, setSelectedLawyer] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedPlaintiff, setSelectedPlaintiff] = useState<string>('');

    useEffect(() => {
        if (lawyerFilter) setSelectedLawyer(lawyerFilter);
        else setSelectedLawyer('');
    }, [lawyerFilter]);

    useEffect(() => {
        if (plaintiffFilter) setSelectedPlaintiff(plaintiffFilter);
        else setSelectedPlaintiff('');
    }, [plaintiffFilter]);

    const uniqueCircuits = useMemo(() => {
        const circuits = sessions.map(s => (s['الدائرة'] || '').trim()).filter(Boolean);
        return Array.from(new Set(circuits)).sort();
    }, [sessions]);

    const uniqueLawyers = useMemo(() => {
        const lawyers = sessions.map(s => (s['التكليف'] || '').trim()).filter(Boolean);
        return Array.from(new Set(lawyers)).sort();
    }, [sessions]);

    const uniqueDates = useMemo(() => {
        const dates = sessions.map(s => (s['التاريخ'] || '').trim()).filter(Boolean);
        const uniqueDateSet = new Set(dates);
        
        const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                return new Date(0); 
            }
            return new Date(year, month - 1, day);
        };

        // FIX: Explicitly type 'a' and 'b' as strings to resolve TypeScript inference error.
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
        if (lawyerFilter) {
            filteredByEntity = sessions.filter(s => (s['التكليف'] || '').trim() === lawyerFilter.trim());
        } else if (plaintiffFilter) {
            filteredByEntity = sessions.filter(s => (s['المدعي'] || '').trim() === plaintiffFilter.trim());
        } else {
            return conflictingSessionIds;
        }

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
        let baseSessions = sessions;
        if (!lawyerFilter && !plaintiffFilter) {
            baseSessions = sessions.filter(s => s['التكليف'] && s['التكليف'].trim() !== '');
        }
        
        let filtered = baseSessions;
        if (selectedCircuit) filtered = filtered.filter(s => (s['الدائرة'] || '').trim() === selectedCircuit);
        if (selectedDate) filtered = filtered.filter(s => (s['التاريخ'] || '').trim() === selectedDate);
        if (selectedPlaintiff) filtered = filtered.filter(s => (s['المدعي'] || '').trim() === selectedPlaintiff);
        if (selectedLawyer) filtered = filtered.filter(s => (s['التكليف'] || '').trim() === selectedLawyer);
        
        if (showOnlyConflicts) {
            filtered = filtered.filter(s => entitySpecificConflictIds.has(s.id));
        }
        
        return filtered;
    }, [sessions, selectedCircuit, selectedDate, selectedPlaintiff, selectedLawyer, lawyerFilter, plaintiffFilter, showOnlyConflicts, entitySpecificConflictIds]);
    
    const dynamicContent = useMemo(() => {
        if (plaintiffFilter) {
            return {
                title: `قضايا المدعي: ${plaintiffFilter}`,
                subtitle: `عرض جميع القضايا المرتبطة بهذا المدعي.`
            };
        }
        if (lawyerFilter) {
             return {
                title: `جلسات المحامي: ${lawyerFilter}`,
                subtitle: `عرض جميع الجلسات المكلف بها هذا المحامي.`
            };
        }
        return {
            title: 'جدول كافة التكليفات',
            subtitle: 'إدارة وتصفية مهام أعضاء المكتب'
        };
    }, [lawyerFilter, plaintiffFilter]);

    const handleResetFilters = () => {
        setSelectedCircuit('');
        setSelectedLawyer('');
        setSelectedDate('');
        setSelectedPlaintiff('');
        if (onClearFilter) onClearFilter();
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-6 border-b border-border pb-6">
                <div className="flex items-center">
                    <div className="p-3 bg-primary/10 rounded-xl ml-4">
                        <ClipboardDocumentListIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-dark">{dynamicContent.title}</h2>
                        <p className="text-sm text-text opacity-70">{dynamicContent.subtitle}</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col min-w-[140px]">
                        <label className="text-[10px] font-bold text-text mb-1 mr-1">حسب التاريخ</label>
                        <select 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-light border border-border rounded-lg px-3 py-2 text-xs font-medium text-dark focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                        >
                            <option value="">جميع التواريخ</option>
                            {uniqueDates.map(date => (<option key={date} value={date}>{date}</option>))}
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[140px]">
                        <label className="text-[10px] font-bold text-text mb-1 mr-1">حسب الدائرة</label>
                        <select value={selectedCircuit} onChange={(e) => setSelectedCircuit(e.target.value)} className="bg-light border border-border rounded-lg px-3 py-2 text-xs font-medium text-dark focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer">
                            <option value="">جميع الدوائر</option>
                            {uniqueCircuits.map(circuit => (<option key={circuit} value={circuit}>{circuit}</option>))}
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[140px]">
                        <label className="text-[10px] font-bold text-text mb-1 mr-1">حسب المدعي</label>
                        <select value={selectedPlaintiff} onChange={(e) => setSelectedPlaintiff(e.target.value)} disabled={!!plaintiffFilter} className="bg-light border border-border rounded-lg px-3 py-2 text-xs font-medium text-dark focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:opacity-50 disabled:bg-border">
                            <option value="">كل المدعين</option>
                            {uniquePlaintiffs.map(plaintiff => (<option key={plaintiff} value={plaintiff}>{plaintiff}</option>))}
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[140px]">
                        <label className="text-[10px] font-bold text-text mb-1 mr-1">حسب التكليف</label>
                        <select value={selectedLawyer} onChange={(e) => setSelectedLawyer(e.target.value)} disabled={!!lawyerFilter} className="bg-light border border-border rounded-lg px-3 py-2 text-xs font-medium text-dark focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer disabled:opacity-50 disabled:bg-border">
                            <option value="">جميع المكلفين</option>
                            {uniqueLawyers.map(lawyer => (<option key={lawyer} value={lawyer}>{lawyer}</option>))}
                        </select>
                    </div>

                    <button onClick={handleResetFilters} className="p-2.5 text-primary hover:bg-primary/5 rounded-lg transition-colors group border border-border bg-white" title="إعادة ضبط الفلاتر">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                </div>
            </div>

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
            
            <div className="min-h-[300px]">
                <SessionTable 
                    sessions={filteredSessions} 
                    onUpdateClick={onUpdateClick} 
                    showDateColumn={true}
                    conflictingSessionIds={entitySpecificConflictIds}
                />

                {filteredSessions.length === 0 && (
                    <div className="py-20 text-center bg-light/30 rounded-xl border-2 border-dashed border-border mt-2">
                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-border">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-dark">لا توجد نتائج</h3>
                        <p className="text-sm text-text mt-1 max-w-xs mx-auto">لم نعثر على أي جلسات تطابق الفلاتر المختارة حالياً.</p>
                        <button 
                            onClick={handleResetFilters}
                            className="mt-6 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-dark transition-all shadow-md shadow-primary/20"
                        >
                            إلغاء الفلاتر
                        </button>
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