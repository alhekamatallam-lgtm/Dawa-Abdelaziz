import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CaseSession, SessionsByDate } from './types';
import { fetchSessions, updateSessionAssignment } from './services/api';
import CalendarView from './components/CalendarView';
import SessionDetails from './components/SessionDetails';
import { ErrorIcon, CalendarIcon, ChartBarIcon, WarningIcon, ClipboardDocumentListIcon } from './components/icons';
import UpdateModal from './components/UpdateModal';
import Dashboard from './components/Dashboard';
import SessionTable from './components/SessionTable';
import AssignmentsView from './components/AssignmentsView';
import Logo from './components/Logo';
import { CalendarPageSkeleton, DashboardSkeleton, AssignmentsViewSkeleton } from './components/Skeletons';


const App: React.FC = () => {
    const [sessions, setSessions] = useState<CaseSession[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [sessionToUpdate, setSessionToUpdate] = useState<CaseSession | null>(null);
    const [view, setView] = useState<'calendar' | 'dashboard' | 'assignments'>('calendar');
    const [showAllConflicts, setShowAllConflicts] = useState<boolean>(false);
    const [showOnlyConflictsInDetails, setShowOnlyConflictsInDetails] = useState<boolean>(false);


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchSessions();
            const formattedData = data
                .filter(Boolean) // Filter out any null or undefined session entries
                .map(session => {
                    const newSession = { ...session };
                    const dateStr = newSession['التاريخ'];
                    if (dateStr && typeof dateStr === 'string' && dateStr.includes('T')) {
                        try {
                            const datePart = dateStr.split('T')[0];
                            const [year, month, day] = datePart.split('-');
                            if (year && month && day) {
                                newSession['التاريخ'] = `${day}-${month}-${year}`;
                            }
                        } catch (e) {
                            console.warn('Could not format date:', dateStr);
                        }
                    }
                    return newSession;
                });
            setSessions(formattedData);
        } catch (err) {
            setError('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sessionsByDate = useMemo<SessionsByDate>(() => {
        return sessions.reduce((acc, session) => {
            const date = session['التاريخ'];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(session);
            return acc;
        }, {} as SessionsByDate);
    }, [sessions]);
    
    const calendarData = useMemo(() => {
        return Object.entries(sessionsByDate).map(([date, sessionsOnDate]) => {
            const timeMap = new Map<string, CaseSession[]>();
            (sessionsOnDate as CaseSession[]).forEach(session => {
                const time = session['وقت الموعد'];
                if (!timeMap.has(time)) {
                    timeMap.set(time, []);
                }
                timeMap.get(time)!.push(session);
            });

            const conflictingSessionIds = new Set<number>();
            timeMap.forEach((sessionsAtTime) => {
                if (sessionsAtTime.length > 1) {
                    sessionsAtTime.forEach(s => conflictingSessionIds.add(s.id));
                }
            });

            return {
                date,
                total: (sessionsOnDate as CaseSession[]).length,
                conflicts: conflictingSessionIds.size,
            };
        });
    }, [sessionsByDate]);

    const allConflictingSessions = useMemo(() => {
        const conflicts: CaseSession[] = [];
        Object.keys(sessionsByDate).forEach(date => {
            const sessionsOnDate = sessionsByDate[date];
            const timeMap = new Map<string, CaseSession[]>();
            sessionsOnDate.forEach(session => {
                const time = session['وقت الموعد'];
                if (!timeMap.has(time)) {
                    timeMap.set(time, []);
                }
                timeMap.get(time)!.push(session);
            });
            timeMap.forEach((sessionsAtTime: CaseSession[]) => {
                if (sessionsAtTime.length > 1) {
                    conflicts.push(...sessionsAtTime);
                }
            });
        });
         const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        };

        return conflicts.sort((a, b) => {
            const dateAStr = parseDate(a['التاريخ']);
            const dateBStr = parseDate(b['التاريخ']);
            if (dateAStr !== dateBStr) {
                return dateAStr.localeCompare(dateBStr);
            }
            return a['وقت الموعد'].localeCompare(b['وقت الموعد']);
        });
    }, [sessionsByDate]);

    const allConflictingSessionIds = useMemo(() => new Set(allConflictingSessions.map(s => s.id)), [allConflictingSessions]);

    const handleDateSelect = (date: string, showConflictsOnly = false) => {
        if (selectedDate === date && showOnlyConflictsInDetails === showConflictsOnly) {
            setSelectedDate(null);
        } else {
            setSelectedDate(date);
            setShowOnlyConflictsInDetails(showConflictsOnly);
        }
        setShowAllConflicts(false);
    };

    const handleOpenUpdateModal = (session: CaseSession) => {
        setSessionToUpdate(session);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSessionToUpdate(null);
    };

    const handleUpdateAssignment = async (newAssignment: string) => {
        if (!sessionToUpdate) return;
        
        try {
            await updateSessionAssignment(sessionToUpdate.id, newAssignment);
            setSessions(prevSessions => 
                prevSessions.map(s => 
                    s.id === sessionToUpdate.id ? { ...s, 'التكليف': newAssignment } : s
                )
            );
            handleCloseModal();
        } catch (err) {
            console.error("Failed to update session:", err);
        }
    };
    
    return (
        <div className="bg-background min-h-screen text-text">
            <header className="bg-white shadow-md sticky top-0 z-10 border-b-4 border-primary">
                <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Logo />
                        <div>
                            <h1 className="text-2xl font-bold text-dark">المحامي عبد الله سعود آل سعد</h1>
                            <p className="text-text opacity-90">نظرة عامة على جدول الجلسات والمواعيد</p>
                        </div>
                    </div>
                     <nav className="flex items-center space-x-2 space-x-reverse">
                        <button 
                            onClick={() => setView('calendar')}
                            className={`flex items-center px-4 py-2 rounded-md font-semibold transition-colors ${view === 'calendar' ? 'bg-primary text-white' : 'bg-light text-text hover:bg-border'}`}
                        >
                            <CalendarIcon className="w-5 h-5 ml-2" />
                            <span>التقويم</span>
                        </button>
                        <button
                             onClick={() => setView('dashboard')}
                             className={`flex items-center px-4 py-2 rounded-md font-semibold transition-colors ${view === 'dashboard' ? 'bg-primary text-white' : 'bg-light text-text hover:bg-border'}`}
                        >
                            <ChartBarIcon className="w-5 h-5 ml-2" />
                            <span>لوحة التحكم</span>
                        </button>
                         <button
                             onClick={() => setView('assignments')}
                             className={`flex items-center px-4 py-2 rounded-md font-semibold transition-colors ${view === 'assignments' ? 'bg-primary text-white' : 'bg-light text-text hover:bg-border'}`}
                        >
                            <ClipboardDocumentListIcon className="w-5 h-5 ml-2" />
                            <span>التكليف</span>
                        </button>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto p-4">
                {error && (
                     <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                        <ErrorIcon className="w-12 h-12" />
                        <p className="mt-4 text-lg font-semibold">حدث خطأ</p>
                        <p>{error}</p>
                        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                            إعادة المحاولة
                        </button>
                    </div>
                )}

                {!error && (
                    <>
                        {view === 'calendar' && (
                            isLoading ? (
                                <CalendarPageSkeleton />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1">
                                    <CalendarView 
                                            calendarData={calendarData} 
                                            onDateSelect={handleDateSelect}
                                            selectedDate={selectedDate}
                                            onShowAllConflictsToggle={() => {
                                                setShowAllConflicts(!showAllConflicts);
                                                setSelectedDate(null);
                                            }}
                                            isShowingAllConflicts={showAllConflicts}
                                            showOnlyConflictsInDetails={showOnlyConflictsInDetails}
                                        />
                                    </div>
                                    <div className="lg:col-span-2">
                                        {showAllConflicts ? (
                                            <div className="bg-white p-4 rounded-lg shadow-md border-r-4 border-amber-500">
                                                <div className="flex items-center mb-4">
                                                    <WarningIcon className="w-6 h-6 text-amber-500" />
                                                    <h3 className="text-xl font-bold mr-2 text-amber-700">كافة المواعيد المتعارضة</h3>
                                                </div>
                                                <SessionTable sessions={allConflictingSessions} onUpdateClick={handleOpenUpdateModal} showDateColumn={true} conflictingSessionIds={allConflictingSessionIds} />
                                            </div>
                                        ) : (
                                            <SessionDetails 
                                                selectedDate={selectedDate}
                                                sessions={selectedDate ? sessionsByDate[selectedDate] : []}
                                                onUpdateClick={handleOpenUpdateModal}
                                                showOnlyConflicts={showOnlyConflictsInDetails}
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                        {view === 'dashboard' && (
                            isLoading ? <DashboardSkeleton /> : <Dashboard sessions={sessions} />
                        )}
                        {view === 'assignments' && (
                            isLoading ? <AssignmentsViewSkeleton /> : <AssignmentsView sessions={sessions} onUpdateClick={handleOpenUpdateModal} conflictingSessionIds={allConflictingSessionIds} />
                        )}
                    </>
                )}
            </main>
            {isModalOpen && sessionToUpdate && (
                <UpdateModal 
                    session={sessionToUpdate}
                    onClose={handleCloseModal}
                    onUpdate={handleUpdateAssignment}
                />
            )}
        </div>
    );
};

export default App;