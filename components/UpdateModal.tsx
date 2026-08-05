
import React, { useState, useMemo } from 'react';
import type { CaseSession } from '../types';
import { getCaseStatusOptions, isAppealCase, getPreviousRulingForViolation } from '../utils/caseHelpers';
import { ScaleIcon, CalendarIcon } from './icons';

interface UpdateModalProps {
    session: CaseSession;
    allSessions?: CaseSession[];
    onClose: () => void;
    onUpdate: (updates: Partial<CaseSession>) => Promise<void>;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ session, allSessions = [], onClose, onUpdate }) => {
    const [assignment, setAssignment] = useState(session['التكليف'] || '');
    const [attendance, setAttendance] = useState(session['حضور الجلسة'] || '');
    const [minutes, setMinutes] = useState(session['محضر الجلسة'] || '');
    const [caseStatus, setCaseStatus] = useState(session['حالة_الدعوى'] || '');
    const [finalJudgment, setFinalJudgment] = useState(session['حكم_نهائي'] || '');
    const [violationDate, setViolationDate] = useState(session['تاريخ المخالفة'] || '');
    const [reason, setReason] = useState(session['السبب'] || '');
    const [addPrecedent, setAddPrecedent] = useState(session['اضافة_السوابق_القضائية'] === 'نعم');
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAppeal = useMemo(() => isAppealCase(session['نوع الدعوى']), [session]);
    const statusOptions = useMemo(() => getCaseStatusOptions(session['نوع الدعوى']), [session]);
    const previousRulingInfo = useMemo(() => {
        if (!isAppeal || !allSessions || allSessions.length === 0) return { session: null, text: '' };
        return getPreviousRulingForViolation(allSessions, session['رقم المخالفة'], session['رقم الدعوى']);
    }, [isAppeal, allSessions, session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (attendance === 'حضرت' && !minutes.trim()) {
            setError('يجب تعبئة محضر الجلسة عند اختيار حالة "حضرت".');
            return;
        }

        if (caseStatus && !reason.trim()) {
            setError('يجب ذكر السبب عند اختيار حالة للدعوى.');
            return;
        }

        setIsUpdating(true);
        try {
            await onUpdate({
                "التكليف": assignment,
                "حضور الجلسة": attendance,
                "محضر الجلسة": attendance === 'حضرت' ? minutes : '',
                "حالة_الدعوى": caseStatus,
                "حكم_نهائي": finalJudgment,
                "تاريخ المخالفة": violationDate,
                "السبب": reason,
                "اضافة_السوابق_القضائية": addPrecedent ? 'نعم' : 'لا'
            });
        } catch (err) {
            setError('حدث خطأ أثناء التحديث.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="bg-primary p-4 text-white font-bold flex justify-between items-center">
                    <span>تحديث الجلسة - رقم الدعوى: {session['رقم الدعوى']}</span>
                    <button type="button" onClick={onClose} className="text-white/80 hover:text-white font-bold">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold mb-1">المكلف بالجلسة</label>
                        <input type="text" value={assignment} onChange={e => setAssignment(e.target.value)} className="w-full p-2 border rounded-lg bg-light" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">حضور الجلسة</label>
                        <select value={attendance} onChange={e => setAttendance(e.target.value)} className="w-full p-2 border rounded-lg">
                            <option value="">-- اختر الحالة --</option>
                            <option value="حضرت">حضرت</option>
                            <option value="لم أحضر">لم أحضر</option>
                        </select>
                    </div>

                    {/* Previous Ruling Display for Appeals */}
                    {isAppeal && (
                        <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/80 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-amber-200/60 pb-2">
                                <label className="text-xs font-black text-amber-900 flex items-center gap-2">
                                    <ScaleIcon className="w-4 h-4 text-amber-700" />
                                    نص الحكم السابق (من المحضر الابتدائي - رقم المخالفة: {session['رقم المخالفة'] || '-'})
                                </label>
                                {previousRulingInfo.rulingDate && (
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-md border border-amber-300/60 w-fit">
                                        <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
                                        <span>تاريخ الحكم السابق: {previousRulingInfo.rulingDate}</span>
                                    </div>
                                )}
                            </div>
                            {previousRulingInfo.text ? (
                                <div className="bg-white p-3 rounded-lg border border-amber-200 text-dark font-medium text-xs whitespace-pre-wrap leading-relaxed shadow-inner">
                                    {previousRulingInfo.text}
                                </div>
                            ) : (
                                <p className="text-xs font-bold text-amber-800/70 italic">
                                    لم يتم العثور على محضر جلسة سابق أو حكم ابتدائي مسجل لهذه المخالفة.
                                </p>
                            )}
                        </div>
                    )}

                    {attendance === 'حضرت' && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">محضر الجلسة (إلزامي)</label>
                                <textarea value={minutes} onChange={e => setMinutes(e.target.value)} className="w-full p-2 border rounded-lg h-24" placeholder="ماذا حدث في الجلسة؟" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">حالة الدعوى</label>
                                <select value={caseStatus} onChange={e => setCaseStatus(e.target.value)} className="w-full p-2 border rounded-lg">
                                    <option value="">-- اختر حالة الدعوى --</option>
                                    {statusOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">حالة الحكم النهائي (حكم_نهائي)</label>
                                <select value={finalJudgment} onChange={e => setFinalJudgment(e.target.value)} className="w-full p-2 border rounded-lg bg-light font-bold">
                                    <option value="">-- اختر حالة الحكم النهائي --</option>
                                    <option value="قيد المداولة">قيد المداولة</option>
                                    <option value="حكم نهائي إلغاء القرار">حكم نهائي إلغاء القرار</option>
                                    <option value="حكم نهائي عدم القبول">حكم نهائي عدم القبول</option>
                                    <option value="حكم نهائي رفض الدعوى">حكم نهائي رفض الدعوى</option>
                                    <option value="حكم نهائي تأييد القرار">حكم نهائي تأييد القرار</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">تاريخ المخالفة</label>
                                <input type="text" value={violationDate} onChange={e => setViolationDate(e.target.value)} className="w-full p-2 border rounded-lg bg-light" placeholder="مثال: 2024-05-12" />
                            </div>
                            {caseStatus && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-bold mb-1">السبب (إلزامي)</label>
                                    <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="اكتب السبب هنا..." required />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="addPrecedent" 
                            checked={addPrecedent} 
                            onChange={e => setAddPrecedent(e.target.checked)}
                            className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                        <label htmlFor="addPrecedent" className="text-sm font-bold cursor-pointer select-none">إضافة السوابق القضائية</label>
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                    <div className="flex gap-2 pt-4">
                        <button type="submit" disabled={isUpdating} className="flex-1 bg-primary text-white p-2 rounded-lg font-bold">{isUpdating ? 'جاري الحفظ...' : 'حفظ'}</button>
                        <button type="button" onClick={onClose} className="bg-light p-2 rounded-lg font-bold">إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateModal;
