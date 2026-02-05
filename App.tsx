import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CaseSession, SessionsByDate } from './types';
import { fetchSessions, updateSessionAssignment } from './services/api';
import CalendarView from './components/CalendarView';
import SessionDetails from './components/SessionDetails';
import { ErrorIcon, CalendarIcon, ChartBarIcon, WarningIcon, ClipboardDocumentListIcon, ArrowRightIcon, BriefcaseIcon } from './components/icons';
import UpdateModal from './components/UpdateModal';
import Dashboard from './components/Dashboard';
import SessionTable from './components/SessionTable';
import AssignmentsView from './components/AssignmentsView';
import LawyerReport from './components/LawyerReport';
import Logo from './components/Logo';
import { CalendarPageSkeleton, DashboardSkeleton, AssignmentsViewSkeleton } from './components/Skeletons';
import BottomNavBar from './components/BottomNavBar';


const App: React.FC = () => {
    const [sessions, setSessions] = useState<CaseSession[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [sessionToUpdate, setSessionToUpdate] = useState<CaseSession | null>(null);
    const [view, setView] = useState<'calendar' | 'dashboard' | 'assignments' | 'lawyer_report'>('calendar');
    const [showAllConflicts, setShowAllConflicts] = useState<boolean>(false);
    const [showOnlyConflictsInDetails, setShowOnlyConflictsInDetails] = useState<boolean>(false);
    const [lawyerFilter, setLawyerFilter] = useState<string | null>(null);
    const [showOnlyLawyerConflicts, setShowOnlyLawyerConflicts] = useState<boolean>(false);


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchSessions();
            const formattedData = data
                .filter(Boolean) 
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
            const uniqueLawyers = new Set<string>();
            
            (sessionsOnDate as CaseSession[]).forEach(session => {
                const time = session['وقت الموعد'];
                if (!timeMap.has(time)) {
                    timeMap.set(time, []);
                }
                timeMap.get(time)!.push(session);
                
                const lawyer = (session['التكليف'] || '').trim();
                if (lawyer) uniqueLawyers.add(lawyer);
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
                lawyersCount: uniqueLawyers.size,
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

    const handleLawyerSelect = (lawyerName: string, onlyConflicts: boolean = false) => {
        setLawyerFilter(lawyerName);
        setShowOnlyLawyerConflicts(onlyConflicts);
        setView('assignments');
    };
    
    return (
        <div className="bg-background min-h-screen text-text">
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-primary">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Logo />
                        <div className="leading-tight">
                            <h1 className="text-lg md:text-2xl font-bold text-dark">المحامي عبدالله آل سعد</h1>
                            <p className="text-[10px] md:text-sm text-text opacity-75 sm:block hidden">منصة إدارة الجلسات والمواعيد</p>
                        </div>
                    </div>
                     <nav className="hidden md:flex items-center space-x-2 space-x-reverse">
                        <button 
                            onClick={() => { setView('calendar'); setLawyerFilter(null); setShowOnlyLawyerConflicts(false); }}
                            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all ${view === 'calendar' ? 'bg-primary text-white shadow-md' : 'bg-light text-text hover:bg-border'}`}
                        >
                            <CalendarIcon className="w-5 h-5 ml-2" />
                            <span>التقويم</span>
                        </button>
                        <button
                             onClick={() => { setView('dashboard'); setLawyerFilter(null); setShowOnlyLawyerConflicts(false); }}
                             className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all ${view === 'dashboard' ? 'bg-primary text-white shadow-md' : 'bg-light text-text hover:bg-border'}`}
                        >
                            <ChartBarIcon className="w-5 h-5 ml-2" />
                            <span>لوحة التحكم</span>
                        </button>
                         <button
                             onClick={() => { setView('assignments'); setLawyerFilter(null); setShowOnlyLawyerConflicts(false); }}
                             className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all ${view === 'assignments' ? 'bg-primary text-white shadow-md' : 'bg-light text-text hover:bg-border'}`}
                        >
                            <ClipboardDocumentListIcon className="w-5 h-5 ml-2" />
                            <span>التكليف</span>
                        </button>
                        <button
                             onClick={() => { setView('lawyer_report'); setLawyerFilter(null); setShowOnlyLawyerConflicts(false); }}
                             className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all ${view === 'lawyer_report' ? 'bg-primary text-white shadow-md' : 'bg-light text-text hover:bg-border'}`}
                        >
                            <BriefcaseIcon className="w-5 h-5 ml-2" />
                            <span>تقرير المندوبين</span>
                        </button>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto p-4 pb-24 md:pb-6">
                {error && (
                     <div className="flex flex-col items-center justify-center h-64 bg-red-50 border-2 border-dashed border-red-200 text-red-700 rounded-xl p-6">
                        <ErrorIcon className="w-16 h-16 text-red-400" />
                        <p className="mt-4 text-xl font-bold">عذراً، حدث خطأ ما</p>
                        <p className="text-sm opacity-80">{error}</p>
                        <button onClick={fetchData} className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                            إعادة المحاولة
                        </button>
                    </div>
                )}

                {!error && (
                    <>
                        {view === 'calendar' && (
                            isLoading ? <CalendarPageSkeleton /> : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className={`lg:col-span-1 ${selectedDate || showAllConflicts ? 'hidden lg:block' : 'block'}`}>
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

                                    <div className={`lg:col-span-2 ${!selectedDate && !showAllConflicts ? 'hidden lg:block' : 'block'}`}>
                                        {showAllConflicts ? (
                                            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border-r-4 border-amber-500 overflow-hidden">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center">
                                                        <button onClick={() => setShowAllConflicts(false)} className="lg:hidden p-2 ml-2 rounded-full hover:bg-border transition-colors">
                                                            <ArrowRightIcon className="w-5 h-5 text-text" />
                                                        </button>
                                                        <WarningIcon className="w-6 h-6 text-amber-500" />
                                                        <h3 className="text-xl font-bold mr-2 text-dark">كافة التعارضات المرصودة</h3>
                                                    </div>
                                                    <span className="bg-amber-100 text-amber-800 text-[10px] md:text-xs px-2 py-1 rounded-full font-bold">
                                                        {allConflictingSessions.length} جلسة متداخلة
                                                    </span>
                                                </div>
                                                <SessionTable 
                                                    sessions={allConflictingSessions} 
                                                    onUpdateClick={handleOpenUpdateModal} 
                                                    showDateColumn={true} 
                                                    conflictingSessionIds={allConflictingSessionIds} 
                                                />
                                            </div>
                                        ) : (
                                            <SessionDetails 
                                                selectedDate={selectedDate}
                                                sessions={selectedDate ? sessionsByDate[selectedDate] : []}
                                                onUpdateClick={handleOpenUpdateModal}
                                                showOnlyConflicts={showOnlyConflictsInDetails}
                                                onBack={() => setSelectedDate(null)}
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
                            isLoading ? <AssignmentsViewSkeleton /> : <AssignmentsView sessions={sessions} onUpdateClick={handleOpenUpdateModal} conflictingSessionIds={allConflictingSessionIds} lawyerFilter={lawyerFilter} onClearFilter={() => { setLawyerFilter(null); setShowOnlyLawyerConflicts(false); }} showOnlyConflicts={showOnlyLawyerConflicts} />
                        )}
                        {view === 'lawyer_report' && (
                            isLoading ? <DashboardSkeleton /> : <LawyerReport sessions={sessions} onLawyerClick={handleLawyerSelect} />
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
            <BottomNavBar view={view} setView={setView} />
        </div>
    );
};

export default App;