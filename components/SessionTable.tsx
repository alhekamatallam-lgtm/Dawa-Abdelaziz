
import React, { useState } from 'react';
import type { CaseSession } from '../types';
import { EditIcon } from './icons';

interface SessionTableProps {
    sessions: CaseSession[];
    onUpdateClick: (session: CaseSession) => void;
    showDateColumn?: boolean;
    conflictingSessionIds?: Set<number>;
}

const SessionTable: React.FC<SessionTableProps> = ({ sessions, onUpdateClick, showDateColumn = false, conflictingSessionIds }) => {
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

    const handleRowToggle = (id: number) => {
        setExpandedRowId(prevId => (prevId === id ? null : id));
    };

    if (sessions.length === 0) {
        return <p className="text-text text-center py-4">لا توجد جلسات لعرضها.</p>;
    }
    
    // Sort sessions by date (if shown) and then by time
    const sortedSessions = [...sessions].sort((a, b) => {
        if (showDateColumn) {
            const parseDate = (dateStr: string) => {
                const [day, month, year] = dateStr.split('-').map(Number);
                return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            };
            const dateAStr = parseDate(a['التاريخ']);
            const dateBStr = parseDate(b['التاريخ']);
            if (dateAStr !== dateBStr) {
                return dateAStr.localeCompare(dateBStr);
            }
        }
        return a['وقت الموعد'].localeCompare(b['وقت الموعد']);
    });


    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-light">
                    <tr>
                        {showDateColumn && <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text hidden md:table-cell">التاريخ</th>}
                        <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text">وقت الموعد</th>
                        <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text">رقم الدعوى</th>
                        <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text hidden md:table-cell">المحكمة</th>
                        <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text">الدائرة</th>
                        <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text hidden md:table-cell">نوع الموعد</th>
                        <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-text hidden md:table-cell">التكليف</th>
                        <th scope="col" className="relative px-6 py-4">
                            <span className="sr-only">تعديل</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                    {sortedSessions.map((session) => {
                        const isConflict = conflictingSessionIds?.has(session.id);
                        const isExpanded = expandedRowId === session.id;

                        const rowClasses = [
                            isConflict ? 'bg-amber-50' : 'bg-white',
                            'hover:' + (isConflict ? 'bg-amber-100' : 'bg-light'),
                            'transition-colors duration-150',
                            'cursor-pointer md:cursor-default',
                        ].join(' ');

                        return (
                            <React.Fragment key={session.id}>
                                <tr 
                                    className={rowClasses}
                                    onClick={() => handleRowToggle(session.id)}
                                >
                                    {showDateColumn && <td className="px-6 py-4 whitespace-nowrap text-sm text-text hidden md:table-cell">{session['التاريخ']}</td>}
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark">{session['وقت الموعد']} {session['ص- م']}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{session['رقم الدعوى']}</td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text hidden md:table-cell">{session['المحكمة']}</td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{session['الدائرة'] || <span className="text-text opacity-75 italic">غير محدد</span>}</td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text hidden md:table-cell">{session['نوع الموعد']}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text hidden md:table-cell">
                                        {session['التكليف'] || <span className="text-text opacity-75 italic">لم يتم التكليف</span>}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click from firing
                                                onUpdateClick(session);
                                            }}
                                            className="p-2 text-primary hover:text-dark hover:bg-border rounded-full transition-colors"
                                            aria-label={`تعديل تكليف الدعوى ${session['رقم الدعوى']}`}
                                        >
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className={`md:hidden ${isConflict ? 'bg-amber-50' : 'bg-white'}`}>
                                        <td colSpan={4} className="p-0"> {/* Mobile has 4 cols: Time, Case, Circuit, Edit */}
                                            <div className="px-6 py-4 bg-light border-l-4 border-primary">
                                                <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                                                    <div className="font-semibold text-text">المحكمة:</div>
                                                    <div className="text-dark">{session['المحكمة']}</div>

                                                    <div className="font-semibold text-text">نوع الموعد:</div>
                                                    <div className="text-dark">{session['نوع الموعد']}</div>

                                                    <div className="font-semibold text-text">التكليف:</div>
                                                    <div className="text-dark">{session['التكليف'] || <span className="text-text opacity-75 italic">لم يتم التكليف</span>}</div>

                                                    {showDateColumn && (
                                                        <>
                                                            <div className="font-semibold text-text">التاريخ:</div>
                                                            <div className="text-dark">{session['التاريخ']}</div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default SessionTable;
