
import React, { useState } from 'react';
import type { CaseSession } from '../types';
import { EditIcon, ViewIcon } from './icons';

interface SessionTableProps {
    sessions: CaseSession[];
    onUpdateClick?: (session: CaseSession) => void;
    onViewClick?: (session: CaseSession) => void;
    showDateColumn?: boolean;
    conflictingSessionIds?: Set<number>;
    sortBy?: string;
}

const SessionTable: React.FC<SessionTableProps> = ({ 
    sessions, 
    onUpdateClick, 
    onViewClick,
    showDateColumn = false, 
    conflictingSessionIds,
    sortBy = 'datetime'
}) => {
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

    const handleRowToggle = (id: number) => {
        setExpandedRowId(prevId => (prevId === id ? null : id));
    };

    if (sessions.length === 0) {
        return <p className="text-text text-center py-8 bg-light rounded-lg border-2 border-dashed border-border">لا توجد جلسات لعرضها حالياً.</p>;
    }
    
    const sortedSessions = [...sessions].sort((a, b) => {
        if (sortBy === 'court') {
            const valA = (a['المحكمة'] || '').trim();
            const valB = (b['المحكمة'] || '').trim();
            const cmp = valA.localeCompare(valB, 'ar');
            if (cmp !== 0) return cmp;
        } else if (sortBy === 'caseType') {
            const valA = (a['نوع الدعوى'] || '').trim();
            const valB = (b['نوع الدعوى'] || '').trim();
            const cmp = valA.localeCompare(valB, 'ar');
            if (cmp !== 0) return cmp;
        } else if (sortBy === 'caseNumber') {
            const valA = (a['رقم الدعوى'] || '').trim();
            const valB = (b['رقم الدعوى'] || '').trim();
            const cmp = valA.localeCompare(valB, 'ar', { numeric: true });
            if (cmp !== 0) return cmp;
        } else if (sortBy === 'unifiedCaseNumber') {
            const valA = String(a['رقم_الدعوى_الموحد'] || a['رقم الدعوى'] || '').trim();
            const valB = String(b['رقم_الدعوى_الموحد'] || b['رقم الدعوى'] || '').trim();
            const cmp = valA.localeCompare(valB, 'ar', { numeric: true });
            if (cmp !== 0) return cmp;
        } else if (sortBy === 'litigationDegree') {
            const valA = (a['درجة_التقاضي'] || '').trim();
            const valB = (b['درجة_التقاضي'] || '').trim();
            const cmp = valA.localeCompare(valB, 'ar');
            if (cmp !== 0) return cmp;
        } else if (sortBy === 'sessionNumber') {
            const valA = (a['رقم الجلسة'] || '').trim();
            const valB = (b['رقم الجلسة'] || '').trim();
            const cmp = valA.localeCompare(valB, 'ar', { numeric: true });
            if (cmp !== 0) return cmp;
        } else if (sortBy === 'circuit') {
            const valA = (a['الدائرة'] || '').trim();
            const valB = (b['الدائرة'] || '').trim();
            const cmp = valA.localeCompare(valB, 'ar');
            if (cmp !== 0) return cmp;
        } else if (sortBy === 'lawyer') {
            const valA = (a['التكليف'] || '').trim();
            const valB = (b['التكليف'] || '').trim();
            const cmp = valA.localeCompare(valB, 'ar');
            if (cmp !== 0) return cmp;
        }

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
        
        const getTimeIn24h = (session: CaseSession) => {
            const time = session['وقت الموعد'];
            const ampm = session['ص- م'];
            if (!time || !time.includes(':')) return 0;
            let [hours, minutes] = time.split(':').map(Number);
    
            if (ampm === 'م' && hours !== 12) {
                hours += 12;
            }
            if (ampm === 'ص' && hours === 12) { 
                hours = 0;
            }
            return hours * 60 + (minutes || 0);
        };
    
        return getTimeIn24h(a) - getTimeIn24h(b);
    });


    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border text-right">
                <thead className="bg-light/50">
                    <tr>
                        {showDateColumn && <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider">التاريخ</th>}
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider">التوقيت</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider">رقم الدعوى</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider">رقم الجلسة</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-emerald-800 uppercase tracking-wider hidden sm:table-cell">نوع الموعد</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-amber-800 uppercase tracking-wider hidden md:table-cell">نوع الدعوى</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider hidden sm:table-cell">رقم المخالفة</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider hidden md:table-cell">المحكمة</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider">الدائرة</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-dark uppercase tracking-wider hidden lg:table-cell">التكليف</th>
                        <th scope="col" className="relative px-4 py-3 w-24">
                            <span className="sr-only">وظائف</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                    {sortedSessions.map((session, index) => {
                        const isConflict = conflictingSessionIds?.has(session.id);
                        const isNoShow = session['حضور الجلسة'] === 'لم أحضر';
                        const isPrecedent = session['اضافة_السوابق_القضائية'] === 'نعم';
                        const isExpanded = expandedRowId === session.id;
                        const circuitName = (session['الدائرة'] || '').trim();

                        return (
                            <React.Fragment key={`${session.id}-${index}`}>
                                <tr 
                                    className={`${isPrecedent ? 'bg-green-50/80' : isNoShow ? 'bg-red-50/80' : isConflict ? 'bg-amber-50/60' : 'bg-white'} hover:${isPrecedent ? 'bg-green-100/90' : isNoShow ? 'bg-red-100/90' : isConflict ? 'bg-amber-100/80' : 'bg-light'} transition-colors cursor-pointer md:cursor-default relative`}
                                    onClick={() => handleRowToggle(session.id)}
                                >
                                    {showDateColumn && (
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm font-bold text-primary">{session['التاريخ']}</span>
                                        </td>
                                    )}
                                    
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center text-sm font-medium text-dark gap-2">
                                            {isNoShow && (
                                                <div className="flex items-center justify-center">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                                    </span>
                                                </div>
                                            )}
                                            <span>{session['وقت الموعد']}</span>
                                            <span className="mr-1 text-[10px] text-text font-normal">{session['ص- م']}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text font-bold">
                                        <div className="flex flex-col">
                                            <span>{session['رقم_الدعوى_الموحد'] || session['رقم الدعوى']}</span>
                                            {session['رقم_الدعوى_الموحد'] && String(session['رقم_الدعوى_الموحد']) !== String(session['رقم الدعوى']) && (
                                                <span className="text-[10px] text-text/50 font-normal">فرعي: {session['رقم الدعوى']}</span>
                                            )}
                                            {session['درجة_التقاضي'] && (
                                                <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded w-fit">
                                                    {session['درجة_التقاضي']}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-600 font-black">{session['رقم الجلسة'] || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm hidden sm:table-cell">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            {session['نوع الموعد'] || 'جلسة'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm hidden md:table-cell">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                            {session['نوع الدعوى'] || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary hidden sm:table-cell">{session['رقم المخالفة'] || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text hidden md:table-cell max-w-[150px] truncate" title={session['المحكمة']}>{session['المحكمة']}</td>
                                    
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {circuitName ? (
                                            <span className="text-text font-medium">{circuitName}</span>
                                        ) : (
                                            <span className="text-text/40 italic text-xs">غير محدد</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text hidden lg:table-cell">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${session['التكليف'] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                            {session['التكليف'] || 'لم يكلف'}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            {onViewClick && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onViewClick(session);
                                                    }}
                                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="عرض كامل البيانات"
                                                >
                                                    <ViewIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                            {onUpdateClick && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdateClick(session);
                                                    }}
                                                    className="p-1.5 text-[#4a4130] hover:text-dark hover:bg-border rounded-lg transition-colors border border-transparent hover:border-border"
                                                    title="تعديل الجلسة"
                                                >
                                                    <EditIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {isExpanded && (
                                    <tr className={`md:hidden ${isPrecedent ? 'bg-green-50' : isNoShow ? 'bg-red-50' : isConflict ? 'bg-amber-50' : 'bg-white'}`}>
                                        <td colSpan={showDateColumn ? 11 : 10} className="p-0">
                                            <div className={`px-4 py-4 bg-light/80 border-r-4 ${isPrecedent ? 'border-green-500' : isNoShow ? 'border-red-500' : 'border-primary'} m-2 rounded-lg shadow-inner`}>
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60 uppercase">رقم الجلسة</p>
                                                        <p className="text-indigo-600 font-black">{session['رقم الجلسة'] || 'لا يوجد'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60 uppercase">نوع الموعد</p>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            {session['نوع الموعد'] || 'جلسة'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60 uppercase">نوع الدعوى</p>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                                            {session['نوع الدعوى'] || '-'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60 uppercase">رقم المخالفة</p>
                                                        <p className="text-primary font-bold">{session['رقم المخالفة'] || 'لا يوجد'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60">المدعي</p>
                                                        <p className="text-dark">{session['المدعي'] || 'غير مسجل'}</p>
                                                    </div>
                                                    <div className="col-span-2 pt-2 mt-2 border-t border-border/50">
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60">المحكمة</p>
                                                        <p className="text-dark">{session['المحكمة']}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text mb-1 text-[10px] opacity-60">التكليف الحالي</p>
                                                        <p className={`${session['التكليف'] ? 'text-green-700 font-bold' : 'text-text/50 italic'}`}>
                                                            {session['التكليف'] || 'لا يوجد تكليف'}
                                                        </p>
                                                    </div>
                                                    {session['حالة_الدعوى'] && (
                                                        <div>
                                                            <p className="font-bold text-text mb-1 text-[10px] opacity-60">حالة الدعوى</p>
                                                            <p className="text-primary font-bold">{session['حالة_الدعوى']}</p>
                                                        </div>
                                                    )}
                                                    {session['السبب'] && (
                                                        <div className="col-span-2">
                                                            <p className="font-bold text-text mb-1 text-[10px] opacity-60">السبب</p>
                                                            <p className="text-dark font-medium italic">{session['السبب']}</p>
                                                        </div>
                                                    )}
                                                    {isNoShow && (
                                                        <div className="col-span-2 pt-2 mt-2 border-t border-red-200">
                                                            <p className="font-bold text-red-600 mb-1 text-[10px] opacity-80">حالة الحضور</p>
                                                            <p className="text-red-700 font-black flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                                                                لم أحضر
                                                            </p>
                                                        </div>
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
