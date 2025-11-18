export function dateKeywordReplace(value) {
  if (!value && value !== "") return value;
  // ensure string
  value = String(value);

  // Helper: normalize month to 3-letter capitalized if possible
  const normalizeMonth = (m) => {
    if (!m) return m;
    const map = {
      january: "Jan",
      february: "Feb",
      march: "Mar",
      april: "Apr",
      may: "May",
      june: "Jun",
      july: "Jul",
      august: "Aug",
      september: "Sep",
      october: "Oct",
      november: "Nov",
      december: "Dec",
      jan: "Jan",
      feb: "Feb",
      mar: "Mar",
      apr: "Apr",
      jun: "Jun",
      jul: "Jul",
      aug: "Aug",
      sep: "Sep",
      oct: "Oct",
      nov: "Nov",
      dec: "Dec",
    };
    const key = m.toLowerCase();
    return map[key] || m.charAt(0).toUpperCase() + m.slice(1, 3).toLowerCase();
  };

  // Regex to find two dates with "to" or dash between them.
  // - day: 1-2 digits
  // - sep: optional space/dash/dot
  // - month: 3-9 letters (Apr or April)
  // - year: 2 or 4 digits
  // Allow colon/other chars before the first date.
  const rangeRegex =
    /(?:[:#\s,-]*?)?(\d{1,2})[.\-\s]?(?:([A-Za-z]{3,9}))[.\-\s]?(\d{2,4})\s*(?:to|[-–—])\s*(\d{1,2})[.\-\s]?(?:([A-Za-z]{3,9}))[.\-\s]?(\d{2,4})/i;

  const m = value.match(rangeRegex);
  if (m) {
    // m groups: 1=startDay 2=startMonth 3=startYear 4=endDay 5=endMonth 6=endYear
    let [, sDay, sMonth, sYear, eDay, eMonth, eYear] = m;

    // pad day
    sDay = sDay.padStart(2, "0");
    eDay = eDay.padStart(2, "0");

    // normalize month to 3-letter
    sMonth = normalizeMonth(sMonth);
    eMonth = normalizeMonth(eMonth);

    // normalize year: if 2 digits, assume 20xx for years < 70 else 19xx (optional — here assume 20xx)
    const normalizeYear = (y) => {
      if (y.length === 2) {
        const n = parseInt(y, 10);
        return n < 70 ? `20${y}` : `19${y}`;
      }
      return y;
    };
    sYear = normalizeYear(sYear);
    eYear = normalizeYear(eYear);

    // final normalized strings
    const start = `${sDay}-${sMonth}-${sYear}`;
    const end = `${eDay}-${eMonth}-${eYear}`;
    return `${start} to ${end}`;
  }

  // ---------- FALLBACK: original placeholder replacements ----------
  const now = new Date();

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const day = now.getDate().toString().padStart(2, "0");
  const month = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  const sysDate = `${day}-${month}-${year}`;
  const yearMonth = `${month}-${year}`;
  const sysDateTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

  const today = formatDate(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDate(yesterdayDate);

  const lastMonthSameDate = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    now.getDate()
  );
  const lastMonth = `${lastMonthSameDate.toLocaleString("en-US", {
    month: "long",
  })}-${lastMonthSameDate.getFullYear()}`;

  const lastYear = now.getFullYear() - 1;

  const fyStartYear = now.getMonth() + 1 >= 4 ? year : year - 1;
  const fyEndYear = fyStartYear + 1;
  const financialYear = `${fyStartYear}-${fyEndYear.toString().slice(-2)}`;
  const lastfinancialYear = `${fyStartYear - 1}-${(fyEndYear - 1)
    .toString()
    .slice(-2)}`;

  return value
    .replace(/@yearmonth/g, yearMonth)
    .replace(/@year/gi, year.toString())
    .replace(/@sysdatetime/gi, sysDateTime)
    .replace(/@sysdate/gi, sysDate)
    .replace(/@financialyear/gi, financialYear)
    .replace(/@month/gi, month.toString())
    .replace(/@lastmonth/gi, lastMonth.toString())
    .replace(/@lastyear/gi, lastYear.toString())
    .replace(/@yesterday/gi, yesterday.toString())
    .replace(/@lastfinancialyear/gi, lastfinancialYear)
    .replace(/@today/gi, today.toString());
}

export function extractPeriod(inputText) {
  if (!inputText || typeof inputText !== "string") return [];
 
  const currentYear = new Date().getFullYear();
  const results = [];
  let foundDate = false;
 
  const monthMap = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };
 
  const addUnique = (value) => {
    if (!results.includes(value)) results.push(value);
  };
 
  const formatFullDate = (d) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
 
  // 1️⃣ RANGE: "1 April 2024 to 30 May 2025" or "Apr 2024 to May 2025"
  const fullRangeRegex =
    /(\d{1,2})?\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\s+to\s+(\d{1,2})?\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i;
 
  const rangeMatch = inputText.match(fullRangeRegex);
  if (rangeMatch) {
    const [, d1, m1, y1, d2, m2, y2] = rangeMatch;
 
    if (d1 && d2) {
      // Full date range: "1 Apr 2024 to 30 May 2025"
      const month1 = monthMap[m1.toLowerCase()];
      const month2 = monthMap[m2.toLowerCase()];
      const startDate = new Date(parseInt(y1), month1, parseInt(d1));
      const endDate = new Date(parseInt(y2), month2, parseInt(d2));
      addUnique(`${formatFullDate(startDate)} to ${formatFullDate(endDate)}`);
    } else {
      // Month-Year range: "Apr 2024 to May 2025"
      const m1Short = m1.slice(0, 3);
      const m2Short = m2.slice(0, 3);
      addUnique(`${m1Short.charAt(0).toUpperCase() + m1Short.slice(1).toLowerCase()} ${y1} to ${m2Short.charAt(0).toUpperCase() + m2Short.slice(1).toLowerCase()} ${y2}`);
    }
    foundDate = true;
  }
 
  // 2️⃣ FULL DATE: "1 Nov 2025" or "1-Nov-2025"
  if (!foundDate) {
    const dayMonthYearRegex =
      /\b(\d{1,2})[-\s](Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-\s](\d{4})\b/gi;
 
    const dayMonthYearMatches = inputText.match(dayMonthYearRegex) || [];
    for (const match of dayMonthYearMatches) {
      const parts = match.match(/(\d{1,2})[-\s](Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-\s](\d{4})/i);
      if (parts) {
        const [, day, monthStr, yearStr] = parts;
        const monthIndex = monthMap[monthStr.toLowerCase()];
        const d = new Date(parseInt(yearStr), monthIndex, parseInt(day));
        if (!isNaN(d)) {
          addUnique(formatFullDate(d));
          foundDate = true;
        }
      }
    }
  }
 
  // 3️⃣ NUMERIC DATE: "1/10/2025" or "2025-10-1"
  if (!foundDate) {
    const numericDateRegex =
      /\b\d{1,2}[-\/.\s]\d{1,2}[-\/.\s]\d{2,4}\b|\b\d{4}[-\/.\s]\d{1,2}[-\/.\s]\d{1,2}\b/g;
 
    const numericMatches = inputText.match(numericDateRegex) || [];
    for (const numeric of numericMatches) {
      const parts = numeric.split(/[-\/.\s]/);
      if (parts.length === 3) {
        let day, month, year;
        if (parts[0].length === 4) {
          // Format: YYYY-MM-DD
          year = +parts[0];
          month = +parts[1] - 1;
          day = +parts[2];
        } else {
          // Format: DD/MM/YYYY
          day = +parts[0];
          month = +parts[1] - 1;
          year = +parts[2] < 100 ? (+parts[2] < 50 ? 2000 + +parts[2] : 1900 + +parts[2]) : +parts[2];
        }
        const d = new Date(year, month, day);
        if (!isNaN(d)) {
          addUnique(formatFullDate(d));
          foundDate = true;
        }
      }
    }
  }
 
  // 4️⃣ MONTH + YEAR: "Oct 2025" or "October-2025"
  if (!foundDate) {
    const monthYearRegex =
      /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-_/.,]*(\d{4})\b/gi;
 
    const monthYearMatches = inputText.match(monthYearRegex) || [];
    if (monthYearMatches.length > 0) {
      for (const m of monthYearMatches) {
        const match = m.match(
          /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-_/.,]*(\d{4})/i
        );
        if (match) {
          const [, monthName, year] = match;
          const shortMonth = monthName.slice(0, 3);
          addUnique(`${shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1).toLowerCase()} ${year}`);
          foundDate = true;
        }
      }
    }
  }
 
  // 5️⃣ ONLY MONTH NAME: "October" → "Oct {currentYear}"
  if (!foundDate) {
    const monthOnlyRegex =
      /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i;
 
    const monthOnlyMatch = inputText.match(monthOnlyRegex);
    if (monthOnlyMatch) {
      const monthName = monthOnlyMatch[1];
      const shortMonth = monthName.slice(0, 3);
      addUnique(`${shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1).toLowerCase()} ${currentYear}`);
      foundDate = true;
    }
  }
 
  // 6️⃣ ONLY YEAR: "2024" → "2024" (no date shown)
  if (!foundDate) {
    const yearOnlyRegex = /\b(20\d{2}|19\d{2})\b/;
    const yearMatch = inputText.match(yearOnlyRegex);
    if (yearMatch) {
      addUnique(yearMatch[1]);
      foundDate = true;
    }
  }
 
  // 7️⃣ FINANCIAL YEAR: "FY 2023-2024" or "2023-24"
  if (!foundDate) {
    const financialYearRegex = /\b(?:FY|Fin(?:ancial)?\s?Year\s*)?(\d{4})[-\/–](\d{2,4})\b/gi;
    const financialYearMatches = inputText.match(financialYearRegex) || [];
    for (const fy of financialYearMatches) {
      const match = fy.match(/(\d{4})[-\/–](\d{2,4})/);
      if (match) {
        const s = +match[1];
        const e = match[2].length === 2 ? +(match[1].slice(0, 2) + match[2]) : +match[2];
        addUnique(`${s}–${e}`);
        foundDate = true;
      }
    }
  }
 
   // 8️⃣ SPECIAL KEYWORDS
   if (!foundDate) {
    if (/\bcurrent year\b/i.test(inputText)) {
      // Current year: 1 April 2025 to today
      const today = new Date();
      const currentFYStart = new Date(today.getFullYear(), 3, 1); // 1 Apr current year
      addUnique(`${formatFullDate(currentFYStart)} to ${formatFullDate(today)}`);
      foundDate = true;
    } else if (/\b(last year|previous year|prev year)\b/i.test(inputText)) {
      // Last year / Previous year: 1 April 2024 to 31 March 2025 (only once)
      const lastYearStart = new Date(currentYear - 1, 3, 1); // 1 Apr last year
      const lastYearEnd = new Date(currentYear, 2, 31); // 31 Mar current year
      addUnique(`${formatFullDate(lastYearStart)} to ${formatFullDate(lastYearEnd)}`);
      foundDate = true;
    } else if (/\ball years?\b/i.test(inputText)) {
      // All years: show nothing (empty period)
      foundDate = true;
      return [];
    }
  }
 
 
  return results.length > 0 ? [`Period : ${results.join(" to ")}`] : [];
}
