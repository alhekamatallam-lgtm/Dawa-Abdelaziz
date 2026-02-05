import React, { useMemo } from 'react';
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
    // حساب التعارضات الخاصة بهذا المحامي تحديداً
    const lawyerSpecificConflictIds = useMemo(() => {
        if (!lawyerFilter || !showOnlyConflicts) return conflictingSessionIds;

        const lawyerSessions = sessions.filter(s => s['التكليف']?.trim() === lawyerFilter.trim());
        const timeMap = new Map<string, number[]>(); // مفتاح: التاريخ_الوقت ، قيمة: مصفوفة معرفات الجلسات
        
        lawyerSessions.forEach(s => {
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
    }, [sessions, lawyerFilter, showOnlyConflicts, conflictingSessionIds]);

    const assignedSessions = useMemo(() => {
        let baseSessions = sessions.filter(session => session['التكليف'] && session['التكليف'].trim() !== '');
        
        if (lawyerFilter) {
            baseSessions = baseSessions.filter(s => s['التكليف'].trim() === lawyerFilter.trim());
        }
        
        if (showOnlyConflicts && lawyerFilter) {
            // تصفية الجلسات لتشمل فقط تلك التي تتعارض مع جلسات أخرى لنفس المحامي
            baseSessions = baseSessions.filter(s => lawyerSpecificConflictIds.has(s.id));
        } else if (showOnlyConflicts) {
            // تعارضات عامة في حال عدم وجود فلتر محامي
            baseSessions = baseSessions.filter(s => conflictingSessionIds.has(s.id));
        }
        
        return baseSessions;
    }, [sessions, lawyerFilter, showOnlyConflicts, lawyerSpecificConflictIds, conflictingSessionIds]);

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md animate-in fade-in slide-in-from-left-4 duration-500">
            {lawyerFilter ? (
                <div className="mb-6">
                    <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border gap-4 ${showOnlyConflicts ? 'bg-red-50 border-red-100' : 'bg-primary/5 border-primary/10'}`}>
                        <div className="flex items-center">
                            <div className={`p-2 rounded-lg ml-3 ${showOnlyConflicts ? 'bg-red-600 text-white animate-pulse' : 'bg-primary text-white'}`}>
                                {showOnlyConflicts ? <WarningIcon className="w-5 h-5" /> : <ClipboardDocumentListIcon className="w-5 h-5" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-dark">
                                    {showOnlyConflicts ? `تدقيق تعارضات: ${lawyerFilter}` : `جدول أعمال: ${lawyerFilter}`}
                                </h2>
                                <p className="text-xs text-text opacity-70">
                                    {showOnlyConflicts 
                                        ? 'يتم عرض الجلسات التي تتداخل زمنياً في جدول هذا المحامي فقط' 
                                        : 'يتم عرض كافة الجلسات المكلفة لهذا المحامي'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClearFilter}
                            className="flex items-center justify-center px-4 py-2 bg-white text-primary border border-primary/20 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                            <span>إلغاء الفرز</span>
                            <ArrowRightIcon className="w-4 h-4 mr-2" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center mb-6 border-b border-border pb-4">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-primary" />
                    <div className="mr-3">
                        <h2 className="text-2xl font-bold text-dark">جدول كافة التكليفات</h2>
                        <p className="text-sm text-text opacity-70">استعراض وتعديل تكليفات جميع أعضاء المكتب</p>
                    </div>
                </div>
            )}
            
            <SessionTable 
                sessions={assignedSessions} 
                onUpdateClick={onUpdateClick} 
                showDateColumn={true}
                conflictingSessionIds={lawyerSpecificConflictIds}
            />

            {assignedSessions.length === 0 && showOnlyConflicts && lawyerFilter && (
                <div className="py-12 text-center">
                    <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-dark">لا يوجد تعارضات شخصية</h3>
                    <p className="text-sm text-text mt-1">جدول {lawyerFilter} منظم وخالٍ من التداخلات الزمنية.</p>
                </div>
            )}

            {assignedSessions.length > 0 && (
                <div className="mt-4 p-3 bg-light/50 rounded-lg text-[10px] text-text text-center italic">
                    تم العثور على {assignedSessions.length} جلسة تطابق معايير الفرز الحالية.
                </div>
            )}
        </div>
    );
};

export default AssignmentsView;