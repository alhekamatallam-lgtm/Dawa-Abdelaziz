
import type { CaseSession, User } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycby78ZJRfnMfshphyeeFRav3RFFjgCr2eOmHyG6dp0IpvFo1JmqS4MozbWeO5G8PT2Hkig/exec';

const cleanValue = (val: any): any => {
    if (typeof val === 'string') {
        // إزالة علامات التنصيص الزائدة والمسافات من بداية ونهاية النص
        return val.replace(/[\\"]/g, '').trim();
    }
    return val;
};

const cleanObjectKeysAndValues = <T extends object,>(obj: T): T => {
    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const trimmedKey = key.trim();
            newObj[trimmedKey] = cleanValue(obj[key]);
        }
    }
    return newObj as T;
};

export const fetchInitialData = async (): Promise<{ sessions: CaseSession[], users: User[] }> => {
    console.group("🔍 فحص بيانات السيرفر الجديد");
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const result = await response.json();
    console.log("البيانات الكاملة المستلمة:", result);

    if (!result.success || !result.data) {
        console.error("خطأ من السيرفر أو البيانات غير مكتملة:", result.error);
        throw new Error('API returned an error or incomplete data');
    }
    
    // جلب الجلسات من data.dd
    const rawSessions = result.data.dd || [];
    const sessions = rawSessions.map((item: any) => {
        const cleaned = cleanObjectKeysAndValues(item) as CaseSession;
        // ضمان أن كود المدعي هو نص دائماً لتوحيد المقارنات
        if (cleaned['كود_المدعي'] !== undefined && cleaned['كود_المدعي'] !== null) {
            cleaned['كود_المدعي'] = String(cleaned['كود_المدعي']).trim();
        }
        return cleaned;
    });
    console.log(`✅ تم جلب ${sessions.length} جلسة من [data.dd]`);

    // جلب الإعدادات من data.Setting
    const rawSettings = result.data.Setting || [];
    const users = rawSettings.map((u: any): User => {
        const cleanU = cleanObjectKeysAndValues(u);
        return {
            id: String(cleanU.id || '').trim(),
            user: String(cleanU.user || '').trim(),
            role: (cleanU.role || 'محامي').trim() as any,
            name: String(cleanU['التكليف'] || cleanU['الاسم'] || '').trim(),
            plaintiffCode: String(cleanU['كود_المدعي'] || '').trim(),
            pwd: String(cleanU.pwd || '').trim()
        };
    });

    if (users.length > 0) {
        console.log("👤 مستخدمون جاهزون للدخول من [data.Setting]:", users.map(u => ({ user: u.user, role: u.role, name: u.name, plaintiffCode: u.plaintiffCode })));
    } else {
        console.error("❌ قائمة المستخدمين فارغة! تأكد من وجود بيانات في ورقة Setting.");
    }

    console.groupEnd();

    return { sessions, users };
};

export const updateSession = async (id: number, updates: Partial<CaseSession>): Promise<any> => {
    const payload = { 
        sheet: "dd",
        id: id, 
        data: updates 
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload),
        });
        
        // Google Apps Script redirects might cause issues with reading JSON 
        // if CORS isn't perfect, but text/plain often helps.
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to update session');
        }
        return result;
    } catch (error) {
        console.error("Error updating session:", error);
        throw error;
    }
};

export const updateUserSetting = async (id: string, updates: Partial<User>): Promise<any> => {
    const payload = { 
        sheet: "Setting",
        id: id, 
        data: updates 
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to update setting');
        }
        return result;
    } catch (error) {
        console.error("Error updating user setting:", error);
        throw error;
    }
};
