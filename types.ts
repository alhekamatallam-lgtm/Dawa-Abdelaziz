
export interface CaseSession {
  id: number;
  "رقم الدعوى": number;
  "رقم الجلسة"?: string | number;
  "رقم المخالفة"?: string | number;
  "المحكمة": string;
  "الدائرة": string;
  "نوع الموعد": string;
  "نوع الدعوى"?: string;
  "وقت الموعد": string;
  "وقت الجلسة"?: string;
  "تاريخ الدعوى": string;
  "تاريخ الموعد": string;
  "تعارضات في المواعيد": string;
  "موعد": string;
  "ص- م": string;
  "اليوم": string;
  "الشهر": number;
  "التاريخ": string;
  "التكليف": string;
  "المدعي": string;
  "كود_المدعي"?: string | number;
  "المدعي عليه": string;
  "التاريخ الهجري"?: string;
  "التاريخ الميلادي"?: string;
  "حضور الجلسة"?: string;
  "محضر الجلسة"?: string;
  "حالة_الدعوى"?: string;
  "السبب"?: string;
  "اضافة_السوابق_القضائية"?: string;
  "قيمة المخالفة"?: string | number;
  "التصنيف"?: string;
  "طلب_استئناف"?: string;
  "البحث_عن_الدعوى"?: string;
}

export interface SessionsByDate {
  [date: string]: CaseSession[];
}

export interface User {
  id: string;
  user: string;
  role: 'مشرف' | 'محامي' | 'مدعي';
  name: string; // يطابق 'التكليف' للمحامي
  plaintiffCode: string; // يطابق 'كود_المدعي' للموكل
  pwd: string;
}
