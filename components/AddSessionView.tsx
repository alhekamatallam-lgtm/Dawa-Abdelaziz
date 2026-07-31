import React, { useState, useMemo } from 'react';
import type { CaseSession, User } from '../types';
import { SearchIcon, PlusIcon, CheckIcon, ClipboardDocumentIcon, UserIcon, BriefcaseIcon, AcademicCapIcon, MapPinIcon, ScaleIcon, CalendarIcon } from './icons';
import { getCaseStatusOptions, isAppealCase, getPreviousRulingForViolation } from '../utils/caseHelpers';

interface AddSessionViewProps {
    allSessions: CaseSession[];
    currentUser: User;
    onAddSession: (sessionData: Partial<CaseSession>) => Promise<void>;
}

const SESSION_NUMBERS = [
    'الجلسة الثانية',
    'الجلسة الثالثة',
    'الجلسة الرابعة',
    'الجلسة الخامسة',
];

const ATTENDANCE_OPTIONS = ['حضرت', 'لم أحضر'];

const AddSessionView: React.FC<AddSessionViewProps> = ({ allSessions, currentUser, onAddSession }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [foundCase, setFoundCase] = useState<CaseSession | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form state
    const [recordId, setRecordId] = useState<string | number>('');
    const [sessionNumber, setSessionNumber] = useState(SESSION_NUMBERS[0]);
    const [attendance, setAttendance] = useState(ATTENDANCE_OPTIONS[0]);
    const [minutes, setMinutes] = useState('');
    const [precedents, setPrecedents] = useState(false);
    const [status, setStatus] = useState('');
    const [reason, setReason] = useState('');

    const isAppeal = useMemo(() => foundCase ? isAppealCase(foundCase["نوع الدعوى"]) : false, [foundCase]);

    const caseStatusOptions = useMemo(() => {
        return getCaseStatusOptions(foundCase?.["نوع الدعوى"]);
    }, [foundCase]);

    const previousRulingInfo = useMemo(() => {
        if (!foundCase) return { session: null, text: '' };
        return getPreviousRulingForViolation(allSessions, foundCase["رقم المخالفة"], foundCase["رقم الدعوى"]);
    }, [foundCase, allSessions]);

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        
        // Find the most recent session for this case number
        const match = allSessions.find(s => String(s['رقم الدعوى']) === searchQuery.trim());
        if (match) {
            setFoundCase(match);
        } else {
            setFoundCase(null);
        }
    };

    const handleStartAdding = () => {
        // Calculate next ID
        const maxId = allSessions.reduce((max, s) => (s.id > max ? s.id : max), 0);
        setRecordId(maxId + 1);
        setIsAdding(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foundCase) return;

        setIsSubmitting(true);
        try {
            const newSession: Partial<CaseSession> = {
                "id": Number(recordId),
                "رقم الدعوى": foundCase["رقم الدعوى"],
                "رقم المخالفة": foundCase["رقم المخالفة"],
                "المدعي": foundCase["المدعي"],
                "كود_المدعي": foundCase["كود_المدعي"],
                "المدعي عليه": foundCase["المدعي عليه"],
                "المحكمة": foundCase["المحكمة"],
                "الدائرة": foundCase["الدائرة"],
                "نوع الموعد": foundCase["نوع الموعد"],
                "نوع الدعوى": foundCase["نوع الدعوى"],
                "التكليف": foundCase["التكليف"],
                "رقم الجلسة": sessionNumber,
                "حضور الجلسة": attendance,
                "محضر الجلسة": minutes,
                "اضافة_السوابق_القضائية": precedents ? 'نعم' : 'لا',
                "حالة_الدعوى": status,
                "السبب": reason,
                "التاريخ": new Date().toLocaleDateString('ar-SA').replace(/\//g, '-'), 
            };

            await onAddSession(newSession);
            
            // Show success notification instead of hard alert
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setIsAdding(false);
                setFoundCase(null);
                setSearchQuery('');
                // Reset form
                setMinutes('');
                setPrecedents(false);
                setStatus('');
                setReason('');
            }, 2000);

        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 relative">
            {/* Soft Success Notification */}
            {showSuccess && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
                    <div className="bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black">
                        <CheckIcon className="w-6 h-6" />
                        تمت إضافة الجلسة وتحديث البيانات بنجاح
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h2 className="text-3xl font-black text-dark tracking-tight">إضافة جلسة جديدة</h2>
                    <p className="text-sm font-bold text-text/60 mt-1">البحث عن دعوى قائمة وإضافة جلسة مكملة</p>
                </div>
            </div>

            {!isAdding ? (
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Search Section */}
                    <div className="bg-white p-2 rounded-[2rem] border-2 border-primary/20 shadow-sm flex items-center gap-2 focus-within:border-primary transition-all">
                        <div className="p-3">
                            <SearchIcon className="w-6 h-6 text-primary" />
                        </div>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="أدخل رقم الدعوى للبحث..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-bold text-dark"
                        />
                        <button 
                            onClick={handleSearch}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-[1.5rem] font-black transition-all active:scale-95 shadow-md shadow-primary/20"
                        >
                            بحث
                        </button>
                    </div>

                    {foundCase && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-[#fcfbf7] rounded-[2.5rem] border border-border p-8 space-y-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-dark flex items-center gap-2">
                                        <ClipboardDocumentIcon className="w-6 h-6 text-primary" />
                                        بيانات الدعوى المستهدفة
                                    </h3>
                                    <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black">جاهزة للإضافة</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailItem label="رقم الدعوى" value={foundCase["رقم الدعوى"]} icon={<ClipboardDocumentIcon className="w-5 h-5" />} />
                                    <DetailItem label="رقم المخالفة" value={foundCase["رقم المخالفة"] || '-'} icon={<ClipboardDocumentIcon className="w-5 h-5" />} />
                                    <DetailItem label="المدعي" value={foundCase["المدعي"]} icon={<UserIcon className="w-5 h-5" />} />
                                    <DetailItem label="المحكمة" value={foundCase["المحكمة"]} icon={<MapPinIcon className="w-5 h-5" />} />
                                    <DetailItem label="الدائرة" value={foundCase["الدائرة"]} icon={<ScaleIcon className="w-5 h-5" />} />
                                    <DetailItem label="التكليف" value={foundCase["التكليف"]} icon={<BriefcaseIcon className="w-5 h-5" />} />
                                </div>

                                <div className="pt-6 border-t border-border">
                                    <button 
                                        onClick={handleStartAdding}
                                        className="w-full bg-dark hover:bg-black text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-dark/10"
                                    >
                                        <PlusIcon className="w-6 h-6" />
                                        إضافة جلسة مكملة لهذه الدعوى
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                foundCase && (
                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-white rounded-[2.5rem] border border-border p-10 space-y-8 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <PlusIcon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-dark">تفاصيل الجلسة الجديدة</h3>
                                        <p className="text-xs font-bold text-text/50">رقم الدعوى: {foundCase["رقم الدعوى"]}</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="text-text/40 hover:text-red-500 font-bold text-sm transition-colors"
                                >
                                    إلغاء العملية
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Session Number */}
                                <div>
                                    <label className="block text-sm font-black text-dark mb-3 mr-1">رقم الجلسة</label>
                                    <select 
                                        value={sessionNumber}
                                        onChange={(e) => setSessionNumber(e.target.value)}
                                        className="w-full bg-[#f8f7f4] border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl p-4 font-bold text-dark transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        {SESSION_NUMBERS.map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Attendance */}
                                <div>
                                    <label className="block text-sm font-black text-dark mb-3 mr-1">حضور الجلسة</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ATTENDANCE_OPTIONS.map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setAttendance(opt)}
                                                className={`p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                                                    attendance === opt 
                                                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                                    : 'bg-[#f8f7f4] text-text/60 hover:bg-border'
                                                }`}
                                            >
                                                {attendance === opt && <CheckIcon className="w-4 h-4" />}
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Case Status */}
                                <div>
                                    <label className="block text-sm font-black text-dark mb-3 mr-1">حالة الدعوى</label>
                                    <select 
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-[#f8f7f4] border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl p-4 font-bold text-dark transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">اختر حالة الدعوى (اختياري)</option>
                                        {caseStatusOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-black text-dark mb-3 mr-1">السبب</label>
                                    <input 
                                        type="text" 
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="اكتب السبب هنا..."
                                        className="w-full bg-[#f8f7f4] border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl p-4 font-bold text-dark transition-all outline-none"
                                    />
                                </div>

                                {/* Previous Ruling Display for Appeals */}
                                {isAppeal && (
                                    <div className="md:col-span-2 bg-amber-50/80 p-5 rounded-2xl border border-amber-200/80 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                                            <label className="text-sm font-black text-amber-900 flex items-center gap-2">
                                                <ScaleIcon className="w-5 h-5 text-amber-700" />
                                                نص الحكم السابق (من المحضر الابتدائي - رقم المخالفة: {foundCase["رقم المخالفة"] || '-'})
                                            </label>
                                            {previousRulingInfo.rulingDate && (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-lg border border-amber-300/60 w-fit">
                                                    <CalendarIcon className="w-4 h-4 text-amber-700" />
                                                    <span>تاريخ الحكم السابق: {previousRulingInfo.rulingDate}</span>
                                                </div>
                                            )}
                                        </div>
                                        {previousRulingInfo.text ? (
                                            <div className="bg-white p-4 rounded-xl border border-amber-200 text-dark font-medium text-xs md:text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                                                {previousRulingInfo.text}
                                            </div>
                                        ) : (
                                            <p className="text-xs font-bold text-amber-800/70 italic">
                                                لم يتم العثور على محضر جلسة سابق أو حكم ابتدائي مسجل لهذه المخالفة.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Precedents Checkbox */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-black text-dark mb-3 mr-1">السوابق القضائية</label>
                                    <label className="flex items-center gap-3 bg-[#f8f7f4] p-4 rounded-2xl border-2 border-transparent hover:border-primary/20 cursor-pointer transition-all">
                                        <input 
                                            type="checkbox" 
                                            checked={precedents}
                                            onChange={(e) => setPrecedents(e.target.checked)}
                                            className="w-6 h-6 rounded border-border text-primary focus:ring-primary accent-primary"
                                        />
                                        <span className="font-bold text-dark">إضافة السوابق القضائية</span>
                                    </label>
                                </div>

                                {/* Session Minutes */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-black text-dark mb-3 mr-1">محضر الجلسة</label>
                                    <textarea 
                                        value={minutes}
                                        onChange={(e) => setMinutes(e.target.value)}
                                        placeholder="اكتب ملخص محضر الجلسة هنا..."
                                        rows={4}
                                        className="w-full bg-[#f8f7f4] border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl p-4 font-bold text-dark transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white p-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-xl shadow-primary/30"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="w-7 h-7" />
                                        حفظ وإضافة الجلسة
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )
            )}
        </div>
    );
};

interface DetailItemProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon }) => (
    <div className="flex items-start gap-4">
        <div className="mt-1 w-10 h-10 bg-white border border-border rounded-xl flex items-center justify-center text-primary/60 shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-text/40 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-base font-bold text-dark">{value}</p>
        </div>
    </div>
);

export default AddSessionView;
