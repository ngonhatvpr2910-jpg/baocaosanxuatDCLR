import { useState, useEffect } from 'react';
export interface FormModelItem {
  id: string;
  productId: string;
  dailyPlan?: number;
  hourlyActuals: { [slotName: string]: number };
}

export interface YearWeek {
  id: number; // e.g. 1 to 53
  days: { dateStr: string; dayNum: number; monthNum: number }[];
  label: string;
}



// Standard Friday-Thursday production month weeks mapping (4-4-5 / 4-5-4 schedule):
// Ensures every week belongs to exactly one month, perfectly matching the UI:
const PRODUCTION_MONTH_WEEKS: Record<number, string[]> = {
  1: ["W1", "W2", "W3", "W4", "W5"],
  2: ["W6", "W7", "W8", "W9"],
  3: ["W10", "W11", "W12", "W13"],
  4: ["W14", "W15", "W16", "W17", "W18"],
  5: ["W19", "W20", "W21", "W22"],
  6: ["W23", "W24", "W25", "W26"],
  7: ["W27", "W28", "W29", "W30", "W31"],
  8: ["W32", "W33", "W34", "W35"],
  9: ["W36", "W37", "W38", "W39", "W40"],
  10: ["W41", "W42", "W43", "W44"],
  11: ["W45", "W46", "W47", "W48"],
  12: ["W49", "W50", "W51", "W52", "W53"]
};

export function getFridayToThursdayWeeksForMonth(year: number, month: number): string[] {
  return PRODUCTION_MONTH_WEEKS[month] || [];
}

export function getProductionMonthFromWeek(weekStr: string): number {
  const weekNum = parseInt(weekStr.replace("W", ""), 10);
  if (weekNum <= 5) return 1;
  if (weekNum <= 9) return 2;
  if (weekNum <= 13) return 3;
  if (weekNum <= 18) return 4;
  if (weekNum <= 22) return 5;
  if (weekNum <= 26) return 6;
  if (weekNum <= 31) return 7;
  if (weekNum <= 35) return 8;
  if (weekNum <= 40) return 9;
  if (weekNum <= 44) return 10;
  if (weekNum <= 48) return 11;
  return 12;
}

export function getStandardYearWeeks(year: number): YearWeek[] {
  const weeks: YearWeek[] = [];
  let currentWeekDays: { dateStr: string; dayNum: number; monthNum: number }[] = [];
  let weekIndex = 1;

  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m - 1, d);
      const dayOfWeek = date.getDay(); // 0: CN, 1: T2, ..., 5: T6, 6: T7
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // Monday starts a new week!
      if (dayOfWeek === 1 && currentWeekDays.length > 0) {
        weeks.push({
          id: weekIndex,
          days: [...currentWeekDays],
          label: ""
        });
        weekIndex++;
        currentWeekDays = [];
      }

      currentWeekDays.push({ dateStr, dayNum: d, monthNum: m });
    }
  }

  if (currentWeekDays.length > 0) {
    weeks.push({
      id: weekIndex,
      days: [...currentWeekDays],
      label: ""
    });
  }

  const getDayName = (y: number, mon: number, day: number) => {
    const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return dayNames[new Date(y, mon - 1, day).getDay()];
  };

  return weeks.map(w => {
    const first = w.days[0];
    const last = w.days[w.days.length - 1];
    const firstLabel = `${getDayName(year, first.monthNum, first.dayNum)} ${String(first.dayNum).padStart(2, '0')}/${String(first.monthNum).padStart(2, '0')}`;
    const lastLabel = `${getDayName(year, last.monthNum, last.dayNum)} ${String(last.dayNum).padStart(2, '0')}/${String(last.monthNum).padStart(2, '0')}`;
    return {
      ...w,
      label: `Tuần W${w.id} (${firstLabel} - ${lastLabel})`
    };
  });
}

export function getYearWeeks(year: number): YearWeek[] {
  const weeks: YearWeek[] = [];
  let currentWeekDays: { dateStr: string; dayNum: number; monthNum: number }[] = [];
  let weekIndex = 1;

  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m - 1, d);
      const dayOfWeek = date.getDay(); // 0: CN, 1: T2, ..., 5: T6, 6: T7
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // Friday starts a new week!
      if (dayOfWeek === 5 && currentWeekDays.length > 0) {
        weeks.push({
          id: weekIndex,
          days: [...currentWeekDays],
          label: ""
        });
        weekIndex++;
        currentWeekDays = [];
      }

      currentWeekDays.push({ dateStr, dayNum: d, monthNum: m });
    }
  }

  if (currentWeekDays.length > 0) {
    weeks.push({
      id: weekIndex,
      days: [...currentWeekDays],
      label: ""
    });
  }

  const getDayName = (y: number, mon: number, day: number) => {
    const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return dayNames[new Date(y, mon - 1, day).getDay()];
  };

  return weeks.map(w => {
    const first = w.days[0];
    const last = w.days[w.days.length - 1];
    const firstLabel = `${getDayName(year, first.monthNum, first.dayNum)} ${String(first.dayNum).padStart(2, '0')}/${String(first.monthNum).padStart(2, '0')}`;
    const lastLabel = `${getDayName(year, last.monthNum, last.dayNum)} ${String(last.dayNum).padStart(2, '0')}/${String(last.monthNum).padStart(2, '0')}`;
    return {
      ...w,
      label: `Tuần W${w.id} (${firstLabel} - ${lastLabel})`
    };
  });
}

export function getWeeksInMonth(year: number, month: number): YearWeek[] {
  const allWeeks = getYearWeeks(year);
  return allWeeks.filter(w => w.days.some(d => d.monthNum === month));
}

export function getShiftSlots(shift: string): string[] {
  if (shift.includes("17:00")) {
    return [
      "8H - 9H", "9H - 10H", "10H - 11H", "11H - 12H",
      "13H - 14H", "14H - 15H", "15H - 16H", "16H - 17H"
    ];
  } else if (shift.includes("19h")) {
    return [
      "8H - 9H", "9H - 10H", "10H - 11H", "11H - 12H",
      "13H - 14H", "14H - 15H", "15H - 16H", "16H - 17H",
      "17H - 18H", "18H - 19H"
    ];
  } else if (shift.includes("20h00")) {
    return [
      "8H - 9H", "9H - 10H", "10H - 11H", "11H - 12H",
      "13H - 14H", "14H - 15H", "15H - 16H", "16H - 17H",
      "17H - 18H", "18H - 19H", "19H - 20H"
    ];
  }
  return [
    "8H - 9H", "9H - 10H", "10H - 11H", "11H - 12H",
    "13H - 14H", "14H - 15H", "15H - 16H", "16H - 17H"
  ];
}

export function formatSlotLabel(slot: string): string {
  let clean = slot.trim().toUpperCase().replace(/:00/g, "").replace(/\s+/g, "");
  const match = clean.match(/^(\d+)(H|H-)?-?(\d+)(H)?$/);
  if (match) {
    const start = parseInt(match[1]);
    const end = parseInt(match[3]);
    return `${start}H - ${end}H`;
  }
  return slot.trim();
}

export function getProductModelCode(name: string): string {
  // Extract clean model code (e.g. SHA76222KL, SHA75102LA, SHB2106, MMBB0787B, etc.)
  const words = name.replace(/[()]/g, ' ').split(/\s+/);
  for (const word of words) {
    const cleanWord = word.trim();
    if (/^(SHA|SHB|MMB|BBD)[A-Z0-9-]+$/i.test(cleanWord)) {
      return cleanWord.toUpperCase();
    }
  }
  for (const word of words) {
    const cleanWord = word.trim();
    if (/[A-Z]/.test(cleanWord) && /[0-9]/.test(cleanWord) && cleanWord.length >= 4) {
      return cleanWord;
    }
  }
  return name;
}

export const YAXIS_DOMAIN: [number, "auto"] = [0, "auto"];



export const DigitalClock = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour12: false }));
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("vi-VN", { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="text-rose-500 font-bold ml-1">{time}</span>;
};

