import React, { useMemo } from 'react';
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
    const conflictingSessionIds = useMemo(() => {
        if (!sessions || sessions.length === 0) return new Set<number>();

        const timeMap = new Map<string, CaseSession[]>();
        sessions.forEach(session => {
            const time = session['وقت الموعد'];
            if (!timeMap.has(time)) {
                timeMap.set(time, []);
            }
            timeMap.get(time)!.push(session);
        });

        const conflictIds = new Set<number>();
        timeMap.forEach((sessionsAtTime) => {
            if (sessionsAtTime.length > 1) {
                sessionsAtTime.forEach(session => conflictIds.add(session.id));
            }
        });
        
        return conflictIds;
    }, [sessions]);

    const sessionsToDisplay = useMemo(() => {
        if (showOnlyConflicts) {
            return sessions.filter(s => conflictingSessionIds.has(s.id));
        }
        return sessions;
    }, [sessions, showOnlyConflicts, conflictingSessionIds]);

    if (!selectedDate) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center justify-center text-center">
                <ClockIcon className="w-16 h-16 text-border" />
                <h3 className="text-xl font-bold mt-4 text-dark">اختر يوماً من القائمة</h3>
                <p className="text-text opacity-75 mt-2">لعرض تفاصيل الجلسات أو المواعيد المتعارضة.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold mb-4 text-dark flex items-center">
                    {onBack && (
                        <button onClick={onBack} className="lg:hidden p-2 mr-2 -ml-2 rounded-full hover:bg-border transition-colors">
                            <ArrowRightIcon className="w-5 h-5 text-text" />
                        </button>
                    )}
                    <span>
                        {showOnlyConflicts 
                            ? `المواعيد المتعارضة لليوم: ${selectedDate}`
                            : `كافة جلسات اليوم: ${selectedDate}`
                        }
                    </span>
                </h3>
                {conflictingSessionIds.size > 0 && !showOnlyConflicts && (
                     <div className="flex items-center p-3 mb-4 text-sm text-amber-800 rounded-lg bg-amber-50 border border-amber-200" role="alert">
                        <WarningIcon className="w-5 h-5 ml-2 flex-shrink-0" />
                        <div>
                            <span className="font-bold">تنبيه:</span> تم تمييز المواعيد المتعارضة في الجدول لسهولة التعرف عليها.
                        </div>
                    </div>
                )}
                <SessionTable 
                    sessions={sessionsToDisplay} 
                    onUpdateClick={onUpdateClick} 
                    conflictingSessionIds={conflictingSessionIds}
                />
            </div>
        </div>
    );
};

export default SessionDetails;