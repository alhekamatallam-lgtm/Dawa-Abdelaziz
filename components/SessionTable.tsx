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
        return <p className="text-text text-center py-8 bg-light rounded-lg border-2 border-dashed border-border">لا توجد جلسات لعرضها حالياً.</p>;
    }
    
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
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-light/50">
                    <tr>
                        {showDateColumn && <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider">التاريخ واليوم</th>}
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider">التوقيت</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider">رقم الدعوى</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider hidden md:table-cell">المحكمة</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider">الدائرة</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider hidden lg:table-cell">نوع الموعد</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider hidden md:table-cell">التكليف</th>
                        <th scope="col" className="relative px-4 py-3 w-10">
                            <span className="sr-only">تعديل</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                    {sortedSessions.map((session) => {
                        const isConflict = conflictingSessionIds?.has(session.id);
                        const isExpanded = expandedRowId === session.id;
                        const circuitName = (session['الدائرة'] || '').trim();

                        return (
                            <React.Fragment key={session.id}>
                                <tr 
                                    className={`${isConflict ? 'bg-amber-50/60' : 'bg-white'} hover:${isConflict ? 'bg-amber-100/80' : 'bg-light'} transition-colors cursor-pointer md:cursor-default`}
                                    onClick={() => handleRowToggle(session.id)}
                                >
                                    {showDateColumn && (
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-primary">{session['التاريخ']}</span>
                                                <span className="text-[10px] text-text opacity-70">{session['اليوم']}</span>
                                            </div>
                                        </td>
                                    )}
                                    
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center text-sm font-medium text-dark">
                                            <span>{session['وقت الموعد']}</span>
                                            <span className="mr-1 text-[10px] text-text font-normal">{session['ص- م']}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text">{session['رقم الدعوى']}</td>
                                    
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text hidden md:table-cell max-w-[150px] truncate">{session['المحكمة']}</td>
                                    
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {circuitName ? (
                                            <span className="text-text font-medium">{circuitName}</span>
                                        ) : (
                                            <span className="text-text/40 italic text-xs">غير محدد</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text hidden lg:table-cell">{session['نوع الموعد']}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text hidden md:table-cell">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${session['التكليف'] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                            {session['التكليف'] || 'لم يكلف'}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateClick(session);
                                            }}
                                            className="p-1.5 text-primary hover:text-dark hover:bg-border rounded-lg transition-colors border border-transparent hover:border-border"
                                        >
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className={`md:hidden ${isConflict ? 'bg-amber-50' : 'bg-white'}`}>
                                        <td colSpan={showDateColumn ? 6 : 5} className="p-0">
                                            <div className="px-4 py-4 bg-light/80 border-r-4 border-primary m-2 rounded-lg shadow-inner">
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60">المحكمة</p>
                                                        <p className="text-dark">{session['المحكمة']}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60">نوع الموعد</p>
                                                        <p className="text-dark">{session['نوع الموعد']}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60">التكليف الحالي</p>
                                                        <p className={`${session['التكليف'] ? 'text-green-700 font-bold' : 'text-text/50 italic'}`}>
                                                            {session['التكليف'] || 'لا يوجد تكليف'}
                                                        </p>
                                                    </div>
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