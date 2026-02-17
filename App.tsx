
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CaseSession, SessionsByDate, User } from './types';
import { fetchInitialData, updateSession } from './services/api';
import CalendarView from './components/CalendarView';
import SessionDetails from './components/SessionDetails';
import { ErrorIcon, CalendarIcon, ChartBarIcon, ClipboardDocumentListIcon, BriefcaseIcon, UserGroupIcon } from './components/icons';
import UpdateModal from './components/UpdateModal';
import ViewModal from './components/ViewModal';
import Dashboard from './components/Dashboard';
import AssignmentsView from './components/AssignmentsView';
import LawyerReport from './components/LawyerReport';
import PlaintiffReport from './components/PlaintiffReport';
import BottomNavBar from './components/BottomNavBar';
import LoadingScreen from './components/LoadingScreen';
import LoginScreen from './components/LoginScreen';
import Logo from './components/Logo';

const App: React.FC = () => {
    const [allSessions, setAllSessions] = useState<CaseSession[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'calendar' | 'dashboard' | 'assignments' | 'lawyer_report' | 'plaintiff_report'>('calendar');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [sessionToUpdate, setSessionToUpdate] = useState<CaseSession | null>(null);
    const [sessionToView, setSessionToView] = useState<CaseSession | null>(null);

    const [showOnlyUpcomingDays, setShowOnlyUpcomingDays] = useState<boolean>(true);
    const [showOnlyConflictsInSidebar, setShowOnlyConflictsInSidebar] = useState<boolean>(false);

    const handleLogin = useCallback((u: string, p: string, remember: boolean = false) => {
        const found = users.find(user => 
            String(user.user).toLowerCase() === u.trim().toLowerCase() && 
            String(user.pwd) === p.trim()
        );

        if (found) { 
            setCurrentUser(found); 
            setView('calendar'); 
            if (remember) {
                localStorage.setItem('alsaad_user', u.trim());
                localStorage.setItem('alsaad_pwd', p.trim());
            } else {
                localStorage.removeItem('alsaad_user');
                localStorage.removeItem('alsaad_pwd');
            }
        } else { 
            if (!isLoading) alert('اسم المستخدم أو كلمة المرور غير صحيحة.'); 
        }
    }, [users, isLoading]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { sessions, users: fetchedUsers } = await fetchInitialData();
            const cleaned = sessions.map(s => {
                const dateStr = String(s['التاريخ']).replace(/["']/g, "").trim();
                return { ...s, 'التاريخ': dateStr };
            }).sort((a, b) => {
                const parse = (d: string) => {
                    const parts = d.split('-');
                    if (parts.length !== 3) return 0;
                    const [day, month, year] = parts.map(Number);
                    return new Date(year, month - 1, day).getTime();
                };
                return parse(a['التاريخ']) - parse(b['التاريخ']);
            });
            setAllSessions(cleaned);
            setUsers(fetchedUsers);

            const savedU = localStorage.getItem('alsaad_user');
            const savedP = localStorage.getItem('alsaad_pwd');
            if (savedU && savedP) {
                const found = fetchedUsers.find(user => 
                    String(user.user).toLowerCase() === savedU.toLowerCase() && 
                    String(user.pwd) === savedP
                );
                if (found) setCurrentUser(found);
            }

        } catch (err) {
            setError('فشل تحميل البيانات. يرجى التحقق من اتصال الإنترنت.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredSessions = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'مشرف') return allSessions;
        const userNameClean = (currentUser.name || '').trim();
        return allSessions.filter(s => {
            if (currentUser.role === 'محامي') return (s['التكليف'] || '').trim() === userNameClean;
            if (currentUser.role === 'مدعي') return (s['المدعي'] || '').trim() === userNameClean;
            return false;
        });
    }, [allSessions, currentUser]);

    const sessionsByDate = useMemo(() => {
        return filteredSessions.reduce((acc, s) => {
            const d = s['التاريخ'];
            if (!acc[d]) acc[d] = [];
            acc[d].push(s);
            return acc;
        }, {} as SessionsByDate);
    }, [filteredSessions]);

    const calendarData = useMemo(() => {
        return (Object.entries(sessionsByDate) as [string, CaseSession[]][]).map(([date, sessions]) => ({
            date,
            total: sessions.length,
            conflicts: sessions.filter((s, idx, self) => 
                self.some((other, oIdx) => idx !== oIdx && s['وقت الموعد'] === other['وقت الموعد'] && s['ص- م'] === other['ص- م'])
            ).length,
            lawyersCount: new Set(sessions.map(s => s['التكليف']).filter(Boolean)).size,
            sessions 
        }));
    }, [sessionsByDate]);

    if (isLoading) return <LoadingScreen />;
    if (error) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <ErrorIcon className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-dark mb-2">{error}</h2>
            <button onClick={loadData} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">إعادة المحاولة</button>
        </div>
    );
    
    if (!currentUser) return <LoginScreen onLogin={handleLogin} hasUsers={users.length > 0} />;

    const navItems = [
        { id: 'calendar', label: 'التقويم', icon: CalendarIcon },
        { id: 'dashboard', label: 'لوحة التحكم', icon: ChartBarIcon },
        { id: 'assignments', label: 'التكليف', icon: ClipboardDocumentListIcon },
        { id: 'lawyer_report', label: 'تقرير المندوبين', icon: BriefcaseIcon },
        { id: 'plaintiff_report', label: 'تقرير المدعين', icon: UserGroupIcon },
    ];

    const handleLogout = () => {
        localStorage.removeItem('alsaad_user');
        localStorage.removeItem('alsaad_pwd');
        setCurrentUser(null);
    };

    return (
        <div className="bg-[#fdfcf9] min-h-screen text-text">
            <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50 py-4 px-6 lg:px-12">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    
                    <div className="flex items-center gap-4 text-right">
                        <Logo className="h-14 w-14" />
                        <div>
                            <h1 className="text-2xl font-black text-[#4a4130] leading-none">المحامي عبدالله آل سعد</h1>
                            <p className="text-[10px] text-primary font-bold mt-1 opacity-70 uppercase tracking-wide">منصة إدارة الجلسات والمواعيد</p>
                        </div>
                    </div>

                    <nav className="hidden lg:flex items-center gap-2">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id as any)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    view === item.id ? 'bg-primary text-white shadow-md' : 'bg-[#f7f5f2] text-[#6b5f4c] hover:bg-border'
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex-shrink-0">
                        <button onClick={handleLogout} className="px-4 py-2 bg-white border border-red-100 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-all active:scale-95">خروج</button>
                    </div>

                </div>
            </header>

            <main className="max-w-[1600px] mx-auto mt-8 px-4 md:px-8 pb-20">
                {view === 'calendar' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-4">
                            <CalendarView 
                                calendarData={calendarData} 
                                onDateSelect={(d) => setSelectedDate(prev => prev === d ? null : d)} 
                                selectedDate={selectedDate}
                                onShowAllConflictsToggle={() => setShowOnlyConflictsInSidebar(!showOnlyConflictsInSidebar)}
                                isShowingAllConflicts={showOnlyConflictsInSidebar}
                                showOnlyConflictsInDetails={false}
                                showOnlyUpcomingDays={showOnlyUpcomingDays}
                                onShowOnlyUpcomingDaysToggle={() => setShowOnlyUpcomingDays(!showOnlyUpcomingDays)}
                            />
                        </div>
                        <div className="lg:col-span-8 min-h-[650px] bg-white rounded-[2.5rem] border border-border flex flex-col p-10 shadow-sm overflow-hidden">
                            <SessionDetails 
                                selectedDate={selectedDate} 
                                sessions={selectedDate ? sessionsByDate[selectedDate] : []} 
                                onUpdateClick={(s) => { setSessionToUpdate(s); setIsModalOpen(true); }}
                                onViewClick={(s) => { setSessionToView(s); setIsViewModalOpen(true); }}
                                showOnlyConflicts={false}
                                onBack={() => setSelectedDate(null)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full bg-white rounded-[2.5rem] border border-border flex flex-col p-10 shadow-sm overflow-hidden animate-in fade-in duration-500">
                        {view === 'dashboard' && <Dashboard sessions={allSessions} />}
                        {view === 'assignments' && (
                            <AssignmentsView 
                                sessions={filteredSessions} 
                                onUpdateClick={(s) => { setSessionToUpdate(s); setIsModalOpen(true); }} 
                                onViewClick={(s) => { setSessionToView(s); setIsViewModalOpen(true); }}
                                conflictingSessionIds={new Set()} 
                            />
                        )}
                        {view === 'lawyer_report' && <LawyerReport sessions={allSessions} onLawyerClick={() => setView('assignments')} />}
                        {view === 'plaintiff_report' && <PlaintiffReport sessions={allSessions} onPlaintiffClick={() => setView('assignments')} />}
                    </div>
                )}
            </main>

            {isModalOpen && sessionToUpdate && (
                <UpdateModal 
                    session={sessionToUpdate} 
                    onClose={() => setIsModalOpen(false)} 
                    onUpdate={async (upd) => {
                        await updateSession(sessionToUpdate.id, upd);
                        setAllSessions(prev => prev.map(s => s.id === sessionToUpdate.id ? { ...s, ...upd } : s));
                        setIsModalOpen(false);
                    }} 
                />
            )}

            {isViewModalOpen && sessionToView && (
                <ViewModal 
                    session={sessionToView} 
                    onClose={() => setIsViewModalOpen(false)} 
                />
            )}
            <BottomNavBar view={view} setView={setView} role={currentUser.role} />
        </div>
    );
};

export default App;
