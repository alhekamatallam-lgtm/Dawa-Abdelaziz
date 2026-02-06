import React, { useMemo, useState, useEffect } from 'react';
import type { CaseSession } from '../types';
import SessionTable from './SessionTable';
import { ClockIcon, WarningIcon, ArrowRightIcon } from './icons';

interface SessionDetailsProps {
    selectedDate: string | null;
    sessions: CaseSession[];
    onUpdateClick: (session: CaseSession) => void;
    showOnlyConflicts: boolean;
    onBack?: () => void;
}

const SessionDetails: React.FC<SessionDetailsProps> = ({ selectedDate, sessions, onUpdateClick, showOnlyConflicts, onBack }) => {
    const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);

    // إعادة ضبط الفلتر عند تغيير التاريخ أو وضع التعارضات
    useEffect(() => {
        setSelectedCircuit(null);
    }, [selectedDate, showOnlyConflicts]);

    const conflictingSessionIds = useMemo(() => {
        if (!sessions || sessions.length === 0) return new Set<number>();
        const timeMap = new Map<string, CaseSession[]>();
        sessions.forEach(session => {
            const time = session['وقت الموعد'];
            if (!timeMap.has(time)) timeMap.set(time, []);
            timeMap.get(time)!.push(session);
        });
        const conflictIds = new Set<number>();
        timeMap.forEach(sessionsAtTime => {
            if (sessionsAtTime.length > 1) {
                sessionsAtTime.forEach(s => conflictIds.add(s.id));
            }
        });
        return conflictIds;
    }, [sessions]);

    // الجلسات التي تمر من خلال فلتر "التعارضات فقط"
    const conflictFilteredSessions = useMemo(() => {
        return showOnlyConflicts 
            ? sessions.filter(s => conflictingSessionIds.has(s.id))
            : sessions;
    }, [sessions, showOnlyConflicts, conflictingSessionIds]);

    // استخراج الدوائر بناءً على الجلسات المتاحة في الوضع الحالي (تعارض أو كل)
    const availableCircuits = useMemo(() => {
        const circuits = new Map<string, number>();
        conflictFilteredSessions.forEach(s => {
            const name = (s['الدائرة'] || '').trim() || 'غير محدد';
            circuits.set(name, (circuits.get(name) || 0) + 1);
        });
        return Array.from(circuits.entries()).sort((a, b) => b[1] - a[1]);
    }, [conflictFilteredSessions]);

    const sessionsToDisplay = useMemo(() => {
        if (!selectedCircuit) return conflictFilteredSessions;
        return conflictFilteredSessions.filter(s => {
            const name = (s['الدائرة'] || '').trim() || 'غير محدد';
            return name === selectedCircuit;
        });
    }, [conflictFilteredSessions, selectedCircuit]);

    if (!selectedDate) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center justify-center text-center">
                <ClockIcon className="w-16 h-16 text-border" />
                <h3 className="text-xl font-bold mt-4 text-dark">اختر يوماً من القائمة</h3>
                <p className="text-text opacity-75 mt-2">لعرض تفاصيل الجلسات والدوائر المتاحة.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border-r-4 border-primary min-h-[400px]">
                 <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {onBack && (
                                <button onClick={onBack} className="lg:hidden p-2 rounded-full hover:bg-light transition-colors">
                                    <ArrowRightIcon className="w-5 h-5 text-text" />
                                </button>
                            )}
                            <h3 className="text-xl font-bold text-dark">{selectedDate}</h3>
                            {showOnlyConflicts && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                                    <WarningIcon className="w-3 h-3 ml-1" />
                                    تعارضات فقط
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-bold text-text opacity-60">
                            {sessionsToDisplay.length} من أصل {conflictFilteredSessions.length} جلسة
                        </span>
                    </div>
                    
                    {/* طبقة الفرز الثانية: الدوائر المتاحة فقط في الوضع الحالي */}
                    {availableCircuits.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 p-1 bg-light/30 rounded-lg">
                            <button
                                onClick={() => setSelectedCircuit(null)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                                    selectedCircuit === null 
                                    ? 'bg-primary text-white border-primary shadow-sm' 
                                    : 'bg-white text-text border-border hover:border-primary/50'
                                }`}
                            >
                                الكل ({conflictFilteredSessions.length})
                            </button>
                            {availableCircuits.map(([name, count]) => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedCircuit(name)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                                        selectedCircuit === name 
                                        ? 'bg-primary text-white border-primary shadow-sm' 
                                        : 'bg-white text-text border-border hover:border-primary/50'
                                    }`}
                                >
                                    {name} ({count})
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {sessionsToDisplay.length > 0 ? (
                    <>
                        {conflictingSessionIds.size > 0 && !showOnlyConflicts && (
                             <div className="flex items-center p-3 mb-4 text-xs text-amber-800 rounded-lg bg-amber-50 border border-amber-100">
                                <WarningIcon className="w-4 h-4 ml-2 flex-shrink-0" />
                                <p>توجد تعارضات زمنية في هذا اليوم، تم تمييزها باللون الأصفر في الجدول.</p>
                            </div>
                        )}
                        <SessionTable 
                            sessions={sessionsToDisplay} 
                            onUpdateClick={onUpdateClick} 
                            conflictingSessionIds={conflictingSessionIds}
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-light/30 rounded-xl border-2 border-dashed border-border">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <WarningIcon className="w-8 h-8 text-amber-400" />
                        </div>
                        <h4 className="text-lg font-bold text-dark">لا توجد نتائج مطابقة</h4>
                        <p className="text-sm text-text max-w-xs mx-auto mt-2">
                            {showOnlyConflicts 
                                ? "لا توجد جلسات متعارضة في هذه الدائرة لهذا اليوم." 
                                : "لا توجد جلسات مسجلة لهذه الدائرة في هذا اليوم."}
                        </p>
                        <button 
                            onClick={() => {setSelectedCircuit(null)}}
                            className="mt-6 text-sm font-bold text-primary hover:underline"
                        >
                            عرض جميع جلسات اليوم
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionDetails;