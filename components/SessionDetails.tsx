
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

    useEffect(() => {
        setSelectedCircuit(null);
    }, [selectedDate, showOnlyConflicts]);

    const conflictingSessionIds = useMemo(() => {
        if (!sessions || sessions.length === 0) return new Set<number>();
        const timeMap = new Map<string, CaseSession[]>();
        sessions.forEach(session => {
            const time = (session['وقت الموعد'] || '') + (session['ص- م'] || '');
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

    const conflictFilteredSessions = useMemo(() => {
        return showOnlyConflicts 
            ? sessions.filter(s => conflictingSessionIds.has(s.id))
            : sessions;
    }, [sessions, showOnlyConflicts, conflictingSessionIds]);

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
        return conflictFilteredSessions.filter(s => (s['الدائرة'] || '').trim() === selectedCircuit);
    }, [conflictFilteredSessions, selectedCircuit]);

    if (!selectedDate) {
        return (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-1000">
                <div className="w-32 h-32 bg-[#f9f8f6] rounded-full flex items-center justify-center mb-10 shadow-inner">
                    <ClockIcon className="w-16 h-16 text-[#e2dfd9]" />
                </div>
                <h3 className="text-4xl font-black text-[#4a4130] mb-5 tracking-tight">اختر يوماً من القائمة</h3>
                <p className="text-[#6b5f4c] opacity-50 max-w-sm mx-auto leading-relaxed text-lg">لعرض تفاصيل الجلسات والدوائر المتاحة للموعد المختار في الجدول الزمني.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-3 duration-500 overflow-hidden flex flex-col">
            <div className="flex flex-col gap-8 mb-10 w-full">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button onClick={onBack} className="lg:hidden p-3 rounded-full hover:bg-[#f7f5f2] transition-colors border border-border">
                                <ArrowRightIcon className="w-6 h-6 text-[#6b5f4c]" />
                            </button>
                        )}
                        <h3 className="text-4xl font-black text-[#4a4130] tracking-tight">{selectedDate}</h3>
                        {showOnlyConflicts && (
                            <span className="bg-[#fef7ec] text-[#b45d0b] text-sm font-bold px-4 py-1.5 rounded-full border border-[#fbd38d] flex items-center gap-2">
                                <WarningIcon className="w-4 h-4" />
                                تعارضات فقط
                            </span>
                        )}
                    </div>
                </div>
                
                {availableCircuits.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 p-2.5 bg-[#f7f5f2] rounded-[1.5rem] w-fit shadow-inner">
                        <button
                            onClick={() => setSelectedCircuit(null)}
                            className={`px-6 py-2.5 text-sm font-bold rounded-[1rem] transition-all ${
                                selectedCircuit === null 
                                ? 'bg-[#8c7851] text-white shadow-lg' 
                                : 'text-[#6b5f4c] hover:bg-white hover:shadow-sm'
                            }`}
                        >
                            الكل ({conflictFilteredSessions.length})
                        </button>
                        {availableCircuits.map(([name, count]) => (
                            <button
                                key={name}
                                onClick={() => setSelectedCircuit(name)}
                                className={`px-6 py-2.5 text-sm font-bold rounded-[1rem] transition-all ${
                                    selectedCircuit === name 
                                    ? 'bg-[#8c7851] text-white shadow-lg' 
                                    : 'text-[#6b5f4c] hover:bg-white hover:shadow-sm'
                                }`}
                            >
                                {name} ({count})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
                {sessionsToDisplay.length > 0 ? (
                    <SessionTable 
                        sessions={sessionsToDisplay} 
                        onUpdateClick={onUpdateClick} 
                        conflictingSessionIds={conflictingSessionIds}
                    />
                ) : (
                    <div className="py-24 text-center opacity-40">
                        <WarningIcon className="w-20 h-20 mx-auto mb-6" />
                        <p className="font-bold text-2xl">لا توجد بيانات متاحة لهذا اليوم</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionDetails;
