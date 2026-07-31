import type { CaseSession } from '../types';
import { getUmmAlQuraTodaySync } from './ummAlQura';

export const BASE_CASE_STATUS_OPTIONS = [
    'تحت الإجراء',
    'محكومة',
    'مغلقة',
    'عدم القبول',
    'تأجيل الجلسة',
    'إلغاء القرار',
    'تنفيذ حكم إلغاء القرار',
    'رفض الدعوى'
];

/**
 * Checks if a case type represents an Appeal (استئناف)
 */
export const isAppealCase = (caseType?: string): boolean => {
    return (caseType || '').toString().toLowerCase().includes('استئناف');
};

/**
 * Returns formatted case status options according to case type.
 * If appeal: option suffix is "(حكم الاستئناف)"
 * If initial / non-appeal: option suffix is "(حكم ابتدائي)"
 */
export const getCaseStatusOptions = (caseType?: string): string[] => {
    const suffix = isAppealCase(caseType) ? '(حكم الاستئناف)' : '(حكم ابتدائي)';
    return BASE_CASE_STATUS_OPTIONS.map(opt => `${opt} ${suffix}`);
};

/**
 * Finds the previous ruling/minutes for an appeal case by searching matching violation number
 */
export const getPreviousRulingForViolation = (
    allSessions: CaseSession[],
    violationNumber?: string | number,
    currentCaseNumber?: string | number
): { session: CaseSession | null; text: string; rulingDate: string } => {
    if (!allSessions || allSessions.length === 0) return { session: null, text: '', rulingDate: '' };

    const cleanViolationNo = (violationNumber || '').toString().trim();
    const cleanCaseNo = (currentCaseNumber || '').toString().trim();

    if (!cleanViolationNo && !cleanCaseNo) return { session: null, text: '', rulingDate: '' };

    // Look for matching sessions
    const matches = allSessions.filter(s => {
        const vNo = (s['رقم المخالفة'] || '').toString().trim();
        const cNo = (s['رقم الدعوى'] || '').toString().trim();

        const matchViolation = cleanViolationNo !== '' && vNo === cleanViolationNo;
        const matchCase = cleanCaseNo !== '' && cNo === cleanCaseNo;

        return matchViolation || matchCase;
    });

    if (matches.length === 0) return { session: null, text: '', rulingDate: '' };

    // Prefer non-appeal sessions (primary initial case)
    const primaryMatches = matches.filter(s => !isAppealCase(s['نوع الدعوى']));
    const candidates = primaryMatches.length > 0 ? primaryMatches : matches;

    // Sort by id descending to get the latest session
    candidates.sort((a, b) => Number(b.id) - Number(a.id));

    // Find candidate with minutes, status or reason
    const bestSession = candidates.find(s => 
        (s['محضر الجلسة'] && s['محضر الجلسة'].trim()) || 
        (s['حالة_الدعوى'] && s['حالة_الدعوى'].trim()) || 
        (s['السبب'] && s['السبب'].trim())
    ) || candidates[0];

    if (!bestSession) return { session: null, text: '', rulingDate: '' };

    const parts: string[] = [];
    if (bestSession['حالة_الدعوى']) {
        parts.push(`حالة الدعوى السابقة: ${bestSession['حالة_الدعوى']}`);
    }
    if (bestSession['محضر الجلسة'] && bestSession['محضر الجلسة'].trim()) {
        parts.push(`محضر الجلسة الابتدائي: ${bestSession['محضر الجلسة'].trim()}`);
    }
    if (bestSession['السبب'] && bestSession['السبب'].trim()) {
        parts.push(`السبب: ${bestSession['السبب'].trim()}`);
    }

    const rulingDate = bestSession['تاريخ الموعد'] || bestSession['تاريخ الدعوى'] || bestSession['التاريخ الميلادي'] || '';

    return {
        session: bestSession,
        text: parts.join('\n'),
        rulingDate
    };
};

/**
 * Helper to get the best session date string
 */
export const getBestSessionDate = (session?: CaseSession): string => {
    if (!session) return '';
    const candidates = [
        session['التاريخ'],
        session['التاريخ الميلادي'],
        session['تاريخ الدعوى'],
        session['تاريخ الموعد'],
        session['التاريخ الهجري']
    ];
    for (const cand of candidates) {
        if (cand && String(cand).trim() && String(cand).trim() !== '-') {
            return String(cand).trim();
        }
    }
    return '';
};

/**
 * Converts a Hijri date to Gregorian Date
 */
export const hijriToGregorian = (hYear: number, hMonth: number, hDay: number): Date => {
    const jd = Math.floor((11 * hYear + 3) / 30) + 354 * hYear + 30 * hMonth - Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;
    let l = jd + 68569;
    const n = Math.floor((4 * l) / 146097);
    l = l - Math.floor((146097 * n + 3) / 4);
    const i = Math.floor((4000 * (l + 1)) / 1461001);
    l = l - Math.floor((1461 * i) / 4) + 31;
    const j = Math.floor((80 * l) / 2447);
    const day = l - Math.floor((2447 * j) / 80);
    l = Math.floor(j / 11);
    const month = j + 2 - 12 * l;
    const year = 100 * (n - 49) + i + l;
    return new Date(year, month - 1, day);
};

/**
 * Calculates number of days from a given date string to today (or specified today date from Umm Al-Qura)
 */
export const calculateDaysFromDate = (dateStr?: string, customTodayDate?: Date): number | null => {
    if (!dateStr || !dateStr.trim()) return null;

    const baseToday = customTodayDate ? new Date(customTodayDate) : getUmmAlQuraTodaySync();
    baseToday.setHours(0, 0, 0, 0);

    // Convert Eastern Arabic numerals (٠-٩) to Western (0-9)
    let s = dateStr.trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

    // Extract date pattern with regex
    const match = s.match(/(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})/);
    if (!match) {
        const parsed = Date.parse(dateStr);
        if (isNaN(parsed)) return null;
        const d = new Date(parsed);
        d.setHours(0, 0, 0, 0);
        const diffMs = baseToday.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : 0;
    }

    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    const p3 = parseInt(match[3], 10);

    if (isNaN(p1) || isNaN(p2) || isNaN(p3)) return null;

    let year = 0, month = 0, day = 0;

    if (p1 > 1000) {
        // YYYY-MM-DD
        year = p1;
        month = p2;
        day = p3;
    } else if (p3 > 1000) {
        // DD-MM-YYYY
        year = p3;
        day = p1;
        month = p2;
    } else if (p3 < 100) {
        // YY-MM-DD or DD-MM-YY
        year = p3 + 2000;
        day = p1;
        month = p2;
    } else {
        return null;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    let rulingDate: Date;

    if (year >= 1300 && year <= 1500) {
        rulingDate = hijriToGregorian(year, month, day);
    } else {
        rulingDate = new Date(year, month - 1, day);
    }

    rulingDate.setHours(0, 0, 0, 0);

    const diffMs = baseToday.getTime() - rulingDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays >= 0 ? diffDays : 0;
};

