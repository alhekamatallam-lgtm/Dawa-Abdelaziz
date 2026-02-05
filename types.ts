
export interface CaseSession {
  id: number;
  "رقم الدعوى": number;
  "المحكمة": string;
  "الدائرة": string;
  "نوع الموعد": string;
  "وقت الموعد": string;
  "تاريخ الدعوى": string;
  "تاريخ الموعد": string;
  "تعارضات في المواعيد": string;
  "موعد": string;
  "ص- م": string;
  "اليوم": string;
  "الشهر": number;
  "التاريخ": string;
  "التكليف": string;
}

export interface SessionsByDate {
  [date: string]: CaseSession[];
}