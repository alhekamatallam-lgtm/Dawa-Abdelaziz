export interface UmmAlQuraDateResponse {
    date?: string;
    gregorianDate?: {
        year: number;
        month: number;
        day: number;
        nameAr: string;
    };
    hijriDate?: {
        year: number;
        month: number;
        day: number;
        nameAr: string;
    };
    solarHijriDate?: {
        year: number;
        month: number;
        day: number;
        nameAr: string;
    };
    prayerTimes?: Record<string, string>;
}

let cachedUmmAlQuraToday: {
    gregorianDateObj: Date;
    hijriDateObj: { year: number; month: number; day: number; nameAr: string };
    gregorianDateInfo: { year: number; month: number; day: number; nameAr: string };
    fetchedAt: number;
} | null = null;

/**
 * Fetches today's date info from KACST Umm Al-Qura API
 */
export const fetchUmmAlQuraToday = async (): Promise<{
    gregorianDateObj: Date;
    hijriDateObj: { year: number; month: number; day: number; nameAr: string } | null;
    gregorianDateInfo: { year: number; month: number; day: number; nameAr: string } | null;
}> => {
    const now = new Date();
    
    // Check if cache is valid (same calendar day)
    if (cachedUmmAlQuraToday) {
        const cacheDate = new Date(cachedUmmAlQuraToday.fetchedAt);
        if (
            cacheDate.getFullYear() === now.getFullYear() &&
            cacheDate.getMonth() === now.getMonth() &&
            cacheDate.getDate() === now.getDate()
        ) {
            return cachedUmmAlQuraToday;
        }
    }

    const yg = now.getFullYear();
    const mg = now.getMonth() + 1;
    const dg = now.getDate();

    // Try API endpoints (direct and proxy)
    const directUrl = `https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayers?lang=ar&format=12&yg=${yg}&mg=${mg}&dg=${dg}&lon=39.831666&lat=21.426666&zone=3`;
    const proxyUrl = `/api/umq/GetPrayers?lang=ar&format=12&yg=${yg}&mg=${mg}&dg=${dg}&lon=39.831666&lat=21.426666&zone=3`;

    let data: UmmAlQuraDateResponse | null = null;

    try {
        const res = await fetch(proxyUrl, { method: 'GET' });
        if (res.ok) {
            data = await res.json();
        }
    } catch {
        // Fallback to direct URL if proxy fails or not running in Vite proxy
    }

    if (!data) {
        try {
            const res = await fetch(directUrl, { method: 'GET' });
            if (res.ok) {
                data = await res.json();
            }
        } catch {
            // Network or CORS error fallback
        }
    }

    if (data && data.gregorianDate && data.hijriDate) {
        const gregDateObj = new Date(
            data.gregorianDate.year,
            data.gregorianDate.month - 1,
            data.gregorianDate.day
        );
        gregDateObj.setHours(0, 0, 0, 0);

        const result = {
            gregorianDateObj: gregDateObj,
            hijriDateObj: data.hijriDate,
            gregorianDateInfo: data.gregorianDate,
            fetchedAt: Date.now()
        };

        cachedUmmAlQuraToday = result;
        return result;
    }

    // Fallback if API unavailable: construct standard local today date
    const fallbackToday = new Date();
    fallbackToday.setHours(0, 0, 0, 0);

    return {
        gregorianDateObj: fallbackToday,
        hijriDateObj: null,
        gregorianDateInfo: {
            year: fallbackToday.getFullYear(),
            month: fallbackToday.getMonth() + 1,
            day: fallbackToday.getDate(),
            nameAr: ''
        }
    };
};

/**
 * Returns current sync/cached Umm Al-Qura date object or standard local today
 */
export const getUmmAlQuraTodaySync = (): Date => {
    if (cachedUmmAlQuraToday) {
        return cachedUmmAlQuraToday.gregorianDateObj;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};
