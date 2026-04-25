
import React from 'react';
import type { CaseSession } from '../types';

interface ViewModalProps {
    session: CaseSession;
    onClose: () => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ session, onClose }) => {
    // Re-ordered to match the visual layout in the image
    const details = [
        { label: 'رقم الدعوى', value: session['رقم الدعوى'] },
        { label: 'رقم المخالفة', value: session['رقم المخالفة'] || 'لا يوجد' },
        { label: 'المدعي', value: session['المدعي'] || 'غير محدد' },
        { label: 'المدعي عليه', value: session['المدعي عليه'] || 'غير محدد' },
        { label: 'المحكمة', value: session['المحكمة'] },
        { label: 'الدائرة', value: session['الدائرة'] || 'غير محددة' },
        { label: 'نوع الموعد', value: session['نوع الموعد'] },
        { label: 'وقت الموعد', value: `${session['وقت الموعد']} ${session['ص- م']}` },
        { label: 'حالة الدعوى', value: session['حالة_الدعوى'] || 'لم تحدد' },
        { label: 'السبب', value: session['السبب'] || 'لا يوجد' },
        { label: 'إضافة السوابق القضائية', value: session['اضافة_السوابق_القضائية'] === 'نعم' ? 'نعم' : 'لا' },
    ];

    const attendanceStatus = session['حضور الجلسة'];
    const sessionMinutes = session['محضر الجلسة']?.trim();
    const showPostSessionInfo = attendanceStatus || sessionMinutes;

    const attendanceColor = attendanceStatus === 'حضرت' 
        ? 'bg-green-100 text-green-800 border-green-200'
        : attendanceStatus === 'لم أحضر'
        ? 'bg-red-100 text-red-800 border-red-200'
        : 'bg-light text-dark border-border/50';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white rounded-[1.75rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-border/50 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                <header className="bg-primary p-5 sm:p-6 text-white flex justify-between items-start flex-shrink-0">
                    <div className="text-right flex-1 mr-4">
                        <h2 className="text-xl sm:text-2xl font-black">تفاصيل الجلسة</h2>
                        <p className="text-xs sm:text-sm opacity-80 mt-1 font-bold">بيانات القضية والموعد المختار</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                
                <main className="p-5 sm:p-8 bg-white overflow-y-auto">
                    {/* Responsive Grid: 1 column on mobile, 2 on desktop (sm and up) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
                        {details.map((item, index) => (
                            <div key={index} className="text-center">
                                <label className="text-xs font-bold text-text/70 mb-2 block">
                                    {item.label}
                                </label>
                                <div className="text-base font-bold text-dark bg-light p-4 rounded-xl border border-border/50 shadow-inner min-h-[60px] flex items-center justify-center">
                                    <p>{String(item.value)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Post-Session Info Section */}
                    {showPostSessionInfo && (
                        <div className="mt-8 pt-6 border-t border-border">
                            <div className="text-center">
                                <label className="text-xs font-bold text-text/70 mb-2 block">حضور الجلسة</label>
                                <div className={`text-base font-bold p-4 rounded-xl border shadow-inner min-h-[60px] flex items-center justify-center max-w-sm mx-auto ${attendanceColor}`}>
                                    <p>{attendanceStatus || 'لم تحدد الحالة بعد'}</p>
                                </div>
                            </div>
                            
                            {sessionMinutes && (
                                <div className="mt-6 text-center">
                                    <label className="text-xs font-bold text-text/70 mb-2 block">محضر الجلسة</label>
                                    <div className="text-sm text-right font-medium text-dark bg-light p-4 rounded-xl border border-border/50 shadow-inner min-h-[100px] whitespace-pre-wrap leading-relaxed">
                                        <p>{sessionMinutes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer className="p-5 sm:p-8 bg-white border-t border-border/50 flex justify-center flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-10 py-3 bg-dark text-white rounded-xl font-bold text-base hover:bg-primary transition-all shadow-lg shadow-dark/20 active:scale-95 w-full max-w-xs"
                    >
                        إغلاق العرض
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ViewModal;
