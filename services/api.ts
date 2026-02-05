
import type { CaseSession } from './types';

const API_URL = 'https://script.google.com/macros/s/AKfycbwLvFO4AGizxFWOWJVnZXr4qRebJdqTqKW5a1GBLeMcv13G3R_O-i47uLX9rsF-FpjnXw/exec';

// Helper function to clean object keys from leading/trailing spaces
const cleanObjectKeys = <T extends object,>(obj: T): T => {
    const newObj: Partial<T> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const trimmedKey = key.trim() as keyof T;
            newObj[trimmedKey] = obj[key];
        }
    }
    return newObj as T;
};

export const fetchSessions = async (): Promise<CaseSession[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error('API returned an error');
    }
    // Clean keys for each session object
    return result.data.map((item: CaseSession) => cleanObjectKeys(item));
};

export const updateSessionAssignment = async (id: number, assignment: string): Promise<any> => {
    const payload = {
        id: String(id),
        patch: {
            "التكليف": assignment
        }
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors', // Required for this specific Google Script setup
    });

    // Since it's no-cors, we can't read the response. 
    // We will optimistically assume it succeeded.
    // A more robust solution would involve a proper API that supports CORS.
    // For this use case, we simulate a successful response.
    return { success: true, id: String(id), updated: { "التكليف": assignment } };
};
