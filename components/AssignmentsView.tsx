
import React, { useMemo } from 'react';
import type { CaseSession } from '../types';
import SessionTable from './SessionTable';
import { ClipboardDocumentListIcon } from './icons';

interface AssignmentsViewProps {
    sessions: CaseSession[];
    onUpdateClick: (session: CaseSession) => void;
    conflictingSessionIds: Set<number>;
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ sessions, onUpdateClick, conflictingSessionIds }) => {
    const assignedSessions = useMemo(() => {
        return sessions.filter(session => session['التكليف'] && session['التكليف'].trim() !== '');
    }, [sessions]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4 border-b pb-4">
                <ClipboardDocumentListIcon className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-bold mr-3 text-dark">جدول التكليفات</h2>
            </div>
            <p className="mb-6 text-text">
                هنا يتم عرض جميع الجلسات التي تم تكليفها. يمكنك تعديل أي تكليف بالضغط على زر التعديل.
            </p>
            <SessionTable 
                sessions={assignedSessions} 
                onUpdateClick={onUpdateClick} 
                showDateColumn={true}
                conflictingSessionIds={conflictingSessionIds}
            />
        </div>
    );
};

export default AssignmentsView;
