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

  const monthMap = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  // 👇 Preprocess: append current year for month+keyword
  const preprocessPattern =
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(sales|revenue|report|data|analysis|performance|target|actual|budget|forecast|projection|expenses|profit|loss|growth|decline)\b(?!\s+\d{4})/gi;

  let preprocessed = false;
  inputText = inputText.replace(preprocessPattern, (match, month, word) => {
    preprocessed = true;
    return `${month} ${currentYear} ${word}`;
  });

  const numericDateRegex =
    /\b\d{1,2}[-\/.\s]\d{1,2}[-\/.\s]\d{2,4}\b|\b\d{4}[-\/.\s]\d{1,2}[-\/.\s]\d{1,2}\b/g;
  const dayMonthYearRegex =
    /\b\d{1,2}[-\s](Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-\s](\d{4})\b/gi;
  const monthYearRegex =
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-_/.,]*(\d{4})\b/gi;
  const financialYearRegex =
    /\b(?:FY|Fin(?:ancial)?\s?Year\s*)?(\d{4})[-\/–](\d{2,4})\b/gi;

  const results = [];
  const msg = "Period : ";

  const addUnique = (value) => {
    if (!results.includes(value)) results.push(value);
  };

  const formatFullDate = (d) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  let foundDate = false;

  // ✅ Parse day-month-year ("1 Apr 2025")
  const dayMonthYearMatches = inputText.match(dayMonthYearRegex) || [];
  for (const match of dayMonthYearMatches) {
    const parts = match.match(/(\d{1,2})[-\s]([A-Za-z]+)[-\s](\d{4})/);
    if (parts) {
      const [, dayStr, monthStr, yearStr] = parts;
      const monthNum = monthMap[monthStr.toLowerCase()];
      if (monthNum !== undefined) {
        const d = new Date(+yearStr, monthNum, +dayStr);
        if (!isNaN(d)) {
          addUnique(formatFullDate(d));
          foundDate = true;
        }
      }
    }
  }

  // ✅ Parse numeric "1/4/2025"
  const numericMatches = inputText.match(numericDateRegex) || [];
  for (const numeric of numericMatches) {
    const parts = numeric.split(/[-\/.\s]/);
    if (parts.length === 3) {
      let day, month, year;
      if (parts[0].length === 4) {
        year = +parts[0];
        month = +parts[1] - 1;
        day = +parts[2];
      } else {
        day = +parts[0];
        month = +parts[1] - 1;
        year =
          +parts[2] < 100
            ? +parts[2] < 50
              ? 2000 + +parts[2]
              : 1900 + +parts[2]
            : +parts[2];
      }
      const d = new Date(year, month, day);
      if (!isNaN(d)) {
        addUnique(formatFullDate(d));
        foundDate = true;
      }
    }
  }

  // ✅ Parse "April 2025" and "March 2026"
  // 🚫 Skip this block if we preprocessed (like "October sales") to avoid duplicate 01 Oct 2025
  if (!preprocessed && !foundDate) {
    const monthYearMatches = inputText.match(monthYearRegex) || [];
    if (monthYearMatches.length > 0) {
      for (let i = 0; i < monthYearMatches.length; i++) {
        const m = monthYearMatches[i].match(
          /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-_/.,]*(\d{4})/i
        );
        if (m) {
          const monthNum = monthMap[m[1].toLowerCase()];
          const year = +m[2];
          let d;
          if (i === 0) d = new Date(year, monthNum, 1);
          else if (i === monthYearMatches.length - 1)
            d = new Date(year, monthNum + 1, 0);
          else d = new Date(year, monthNum, 1);
          addUnique(formatFullDate(d));
          foundDate = true;
        }
      }
    }
  }

  // ✅ Financial Year (FY 2023–2024)
  const financialYearMatches = inputText.match(financialYearRegex) || [];
  for (const fy of financialYearMatches) {
    const match = fy.match(/(\d{4})[-\/–](\d{2,4})/);
    if (match) {
      const s = +match[1];
      const e =
        match[2].length === 2 ? +(match[1].slice(0, 2) + match[2]) : +match[2];
      addUnique(`${s}–${e}`);
      foundDate = true;
    }
  }

  // ✅ Month-only like "October" → "October 2025"
  if (!foundDate) {
    const monthOnlyMatch = inputText.match(
      /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i
    );
    if (monthOnlyMatch) {
      const monthName = monthOnlyMatch[1];
      addUnique(
        `${
          monthName.charAt(0).toUpperCase() + monthName.slice(1)
        } ${currentYear}`
      );
      foundDate = true;
    }
  }

  return results.length > 0 ? [msg + results.join(" to ")] : [];
}
