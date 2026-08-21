// Normalization utilities for search and comparisons

export const normalizeSearchText = (text: any): string => {
    if (text === undefined || text === null) return '';
    return String(text)
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()) // convert Arabic-Indic digits ٠-٩ to 0-9
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()) // convert Persian digits ۰-۹ to 0-9
        .replace(/أ|إ|آ|ٱ/g, 'ا') // normalize Alef
        .replace(/ة/g, 'ه')      // normalize Ta Marbuta
        .replace(/ى/g, 'ي')      // normalize Ya/Alef Maqsura
        .replace(/[\u064B-\u065F]/g, '') // remove Tashkeel
        .replace(/[#\-_\/\s]/g, '') // remove #, dashes, underscores, slashes, spaces
        .toLowerCase()
        .trim();
};

export const matchSessionSearch = (session: any, rawQuery: string): boolean => {
    if (!rawQuery || !rawQuery.trim()) return true;
    const query = normalizeSearchText(rawQuery);
    if (!query) return true;

    const fieldsToMatch = [
        session['رقم_الدعوى_الموحد'],
        session['رقم الدعوى الموحد'],
        session['رقم القضية الموحد'],
        session['رقم الدعوى'],
        session['رقم الجلسة'],
        session['رقم المخالفة'],
        session['درجة_التقاضي'],
        session['درجة التقاضي'],
        session['المدعي'],
        session['المدعي عليه'],
        session['التكليف'],
        session['المحكمة'],
        session['الدائرة'],
        session['نوع الدعوى'],
        session['نوع الموعد'],
        session['حالة_الدعوى'],
        session['التصنيف'],
        session['التاريخ']
    ];

    return fieldsToMatch.some(val => {
        if (val === undefined || val === null) return false;
        const normalized = normalizeSearchText(val);
        return normalized.includes(query);
    });
};
