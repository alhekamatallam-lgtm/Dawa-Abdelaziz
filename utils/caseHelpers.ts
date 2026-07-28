import type { CaseSession } from '../types';

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
): { session: CaseSession | null; text: string } => {
    if (!allSessions || allSessions.length === 0) return { session: null, text: '' };

    const cleanViolationNo = (violationNumber || '').toString().trim();
    const cleanCaseNo = (currentCaseNumber || '').toString().trim();

    if (!cleanViolationNo && !cleanCaseNo) return { session: null, text: '' };

    // Look for matching sessions
    const matches = allSessions.filter(s => {
        const vNo = (s['رقم المخالفة'] || '').toString().trim();
        const cNo = (s['رقم الدعوى'] || '').toString().trim();

        const matchViolation = cleanViolationNo !== '' && vNo === cleanViolationNo;
        const matchCase = cleanCaseNo !== '' && cNo === cleanCaseNo;

        return matchViolation || matchCase;
    });

    if (matches.length === 0) return { session: null, text: '' };

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

    if (!bestSession) return { session: null, text: '' };

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

    return {
        session: bestSession,
        text: parts.join('\n')
    };
};
