import React, { useState } from 'react';
import { View, Text,TouchableOpacity,ScrollView,StyleSheet } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Allchart from "../botchart/allchart";

  const {
    LineChartComponent,
    MultiLineChartComponent,
    BarChartComponent,
    PieChartComponent,
    MultiBarChartComponent,
  } = Allchart();

// Constants
const NUMERIC_DATA_TYPES = [
  "tinyint",
  "smallint",
  "mediumint",
  "int",
  "integer",
  "bigint",
  "double",
  "real",
  "decimal",
  "numeric",
  "money",
  "smallmoney",
  "serial",
  "smallserial",
  "number",
  "short",
  "long",
  "long long",
  "float",
  "double precision",
  "long double",
  "decimal.Decimal",
  "BigDecimal",
  "mpz",
  "bigint",
  "unsigned int",
  "bool",
  "complex",
];

const DATE_DATA_FORMATS = [
  "date",
  "datetime",
  "timestamp",
  "timestamp without time zone",
];

const DATE_KEYWORDS = ["date", "month", "year", "day", "quarter", "period"];

const brightColors = [
"#052C6B",
"#2D9FE6",
"#227481",
"#5AC48F",
"#ABC856",
"#FFD747",
"#F58B00",
"#A44813",
"#7D1212",
"#53284E",
"#0A53CA",
"#62B7ED",
"#34B2C5",
"#83D2AB",
"#C0D680",
"#FFE175",
"#FFA938",
"#E56B24",
"#CD1D1D",
"#94478C",
"#3981F6",
"#92CDF2",
"#6FCBD9",
"#A8E0C4",
"#D3E2A6",
"#FFEA9F",
"#FFC374",
"#ED9766",
"#E75656",
"#BD76B6",
];

const yearRegex = /^(19|20)\d{2}$/;
const financialYearRegex = /^(19|20)\d{2}[-/](19|20)?\d{2}$/;

// Helper Functions
function tokenize(name) {
  return name
    ? name
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_\s-]+/g, " ")
        .toLowerCase()
        .split(" ")
    : [];
}

function validateQueryResponse(response, returnFields = false, chartType) {
  const { Columns, Rows } = response || {};
  if (!Columns || !Columns.length || !Rows || !Rows.length) return false;
  if (Columns.length >= 4) return false;
  if (Rows.length <= 1) return false;

  const hasDateColumn = Columns.some((col) => {
    const tokens = tokenize(col.Name);
    return (
      DATE_DATA_FORMATS.some((item) =>
        item.includes(col.Type?.toLowerCase?.() || "")
      ) || tokens.some((token) => DATE_KEYWORDS.includes(token))
    );
  });

  const hasNumberColumn = Columns.some((col, index) => {
    const type = col.Type?.toLowerCase?.() || "";
    const name = col.Name?.toLowerCase?.() || "";
    const value = Rows[0]?.[index]?.toString()?.trim() ?? "";

    const isDateLike = DATE_KEYWORDS.some(
      (keyword) => name.includes(keyword) || type.includes(keyword)
    );
    if (isDateLike) return false;

    const isNumericType = NUMERIC_DATA_TYPES.includes(type);
    const isParseableNumber =
      !isNaN(value) && Number.isFinite(parseFloat(value.replace(/,/g, "")));
    return isNumericType || isParseableNumber;
  });

  const textColumns = [];
  const numberColumns = [];
  const dateColumns = [];

  Columns.forEach((col, index) => {
    const tokens = tokenize(col.Name);
    const type = col.Type?.toLowerCase?.() || "";
    const name = col.Name?.toLowerCase?.() || "";
    const columnInfo = { name: col.Name, index };

    // Check if it's a date column
    const isDateColumn = DATE_DATA_FORMATS.includes(type) || 
                        tokens.some((token) => DATE_KEYWORDS.includes(token));
    
    // Check if it's a text column
    const isTextColumn = type === "text" && 
                        !tokens.some((token) => DATE_KEYWORDS.includes(token));
    
    // Check if it's a number column
    const isNumberColumn = NUMERIC_DATA_TYPES.includes(type) && 
                          !tokens.some((token) => DATE_KEYWORDS.includes(token));

    if (isDateColumn) {
      dateColumns.push(columnInfo);
    } else if (isTextColumn) {
      textColumns.push(columnInfo);
    } else if (isNumberColumn) {
      numberColumns.push(columnInfo);
    }
  });

  // Keep backward compatibility with count properties
  const textColumnCount = textColumns.length;
  const numberColumnCount = numberColumns.length;
  const dateColumnCount = dateColumns.length;

  if (returnFields) {
    return {
      hasDateColumn,
      hasNumberColumn,
      dateColumnCount,
      textColumnCount,
      numberColumnCount,
      dateColumns,
      textColumns,
      numberColumns,
      numRows: Rows.length,
    };
  }

  if (chartType) {
    switch (chartType) {
      case "linechart":
      case "multilinechart":
        if (!hasDateColumn) return false;
        if (numberColumnCount < 1) return false;
        if (Columns.length < 2 || Columns.length > 3) return false;
        if (Rows.length < 2 || Rows.length > 200) return false;
        return true;
      case "barchart":
      case "multibarchart":
        if (Rows.length < 2 || Rows.length > 32) return false;
        return true;
      case "piechart":
        if (Rows.length < 2 || Rows.length > 32) return false;
        if (numberColumnCount > 1) return false;
        return true;
      default:
        return false;
    }
  }

  return (
    (hasDateColumn &&
      Columns.length === 2 &&
      hasNumberColumn &&
      Rows.length > 0 &&
      Rows.length < 200) ||
    (textColumnCount <= 2 &&
      textColumnCount > 0 &&
      (numberColumnCount === 1 || numberColumnCount === 2) &&
      Rows.length > 0 &&
      Rows.length <= 30)
  );
}

function formatNumber(number) {
  return Number.isFinite(number)
    ? new Intl.NumberFormat("en-IN", {
        style: "decimal",
        maximumFractionDigits: 2,
      }).format(number)
    : "0";
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "Unknown";
  const match = dateTimeString.toString().match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[0] : dateTimeString.toString();
}

function formatDate(date, fieldName) {
  if (!date || !fieldName) return "Unknown";
  if (
    fieldName.toString().toLowerCase().includes("date") &&
    !isNaN(new Date(date).getTime())
  ) {
    return new Date(date).toISOString().split("T")[0];
  }
  return date.toString();
}

function sortByFinancialMonth(data) {
  if (!data || !data.Columns || !data.Rows || data.Rows.length === 0)
    return data;

  let isMonthCol = -1,
    isYearCol = -1,
    isQuarterCol = -1,
    isDateCol = -1,
    isDayCol = -1;
  isMonthCol = data.Columns.findIndex((item) =>
    item.Name?.toString().toLowerCase().includes("month")
  );
  isYearCol = data.Columns.findIndex((item) =>
    item.Name?.toString().toLowerCase().includes("year")
  );
  isQuarterCol = data.Columns.findIndex((item) =>
    item.Name?.toString().toLowerCase().includes("quarter")
  );
  isDateCol = data.Columns.findIndex((item) =>
    item.Name?.toString().toLowerCase().includes("date")
  );
  isDayCol = data.Columns.findIndex((item) =>
    item.Name?.toString().toLowerCase().includes("day")
  );

  if (
    isMonthCol === -1 &&
    isYearCol === -1 &&
    isQuarterCol === -1 &&
    isDateCol === -1 &&
    isDayCol === -1
  ) {
    return data;
  }

  const monthMap = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  data.Rows.sort((a, b) => {
    let yearA = isYearCol !== -1 ? parseInt(a[isYearCol], 10) || 0 : 0;
    let yearB = isYearCol !== -1 ? parseInt(b[isYearCol], 10) || 0 : 0;
    let quarterA =
      isQuarterCol !== -1
        ? a[isQuarterCol]?.toString().match(/q([1-4])/i)?.[1] || 99
        : 99;
    let quarterB =
      isQuarterCol !== -1
        ? b[isQuarterCol]?.toString().match(/q([1-4])/i)?.[1] || 99
        : 99;
    let monthA =
      isMonthCol !== -1
        ? monthMap[a[isMonthCol]?.toString().toLowerCase().trim()] || 99
        : 99;
    let monthB =
      isMonthCol !== -1
        ? monthMap[b[isMonthCol]?.toString().toLowerCase().trim()] || 99
        : 99;
    let dayA = isDayCol !== -1 ? parseInt(a[isDayCol], 10) || 99 : 99;
    let dayB = isDayCol !== -1 ? parseInt(b[isDayCol], 10) || 99 : 99;
    let dateA =
      isDateCol !== -1
        ? new Date(a[isDateCol]).getTime() || Number.MAX_SAFE_INTEGER
        : Number.MAX_SAFE_INTEGER;
    let dateB =
      isDateCol !== -1
        ? new Date(b[isDateCol]).getTime() || Number.MAX_SAFE_INTEGER
        : Number.MAX_SAFE_INTEGER;

    if (yearA !== yearB) return yearA - yearB;
    if (quarterA !== quarterB) return quarterA - quarterB;
    if (monthA !== monthB) return monthA - monthB;
    if (dayA !== dayB) return dayA - dayB;
    return dateA - dateB;
  });

  return data;
}

function roundFloatAndDoubleValues(response) {
  const rowsKey = response.Rows ? "Rows" : response.rows ? "rows" : null;
  const columnsKey = response.Columns
    ? "Columns"
    : response.columns
    ? "columns"
    : null;

  if (!rowsKey || !columnsKey || !response[rowsKey] || !response[columnsKey])
    return response;

  const columnTypes = new Map(
    response[columnsKey].map((col) => [
      col.Name || col.name || "",
      (col.Type || col.type)?.toLowerCase?.() || "",
    ])
  );

  response[rowsKey] = response[rowsKey].map((row) =>
    row.map((value, index) => {
      const column = response[columnsKey][index];
      const columnName = column?.Name || column?.name || "";
      const columnType = columnTypes.get(columnName);
      const valueStr = value?.toString?.() || "";

      if (
        columnName.toLowerCase().includes("year") &&
        (yearRegex.test(valueStr) || financialYearRegex.test(valueStr))
      ) {
        return valueStr;
      }

      const tokens = tokenize(columnName);
      if (
        DATE_DATA_FORMATS.some((format) => format.includes(columnType)) ||
        tokens.some((token) => DATE_KEYWORDS.includes(token))
      ) {
        return formatDateTime(value) || value;
      }

      switch (columnType) {
        case "float":
        case "double":
          return Number.isFinite(parseFloat(valueStr))
            ? formatNumber(+parseFloat(valueStr).toFixed(3))
            : "0";
        case "long":
          return Number.isFinite(parseInt(valueStr, 10))
            ? formatNumber(parseInt(valueStr, 10))
            : "0";
        default:
          if (Number.isFinite(+valueStr) && +valueStr % 1 !== 0) {
            return formatNumber(+parseFloat(valueStr).toFixed(2));
          }
          return valueStr || "0";
      }
    })
  );

  return response;
}
function processRawData(data) {
  if (!data || !Array.isArray(data.Rows)) {
    console.error("Error: data.Rows is undefined or not an array", data);
    return { groupedData: {}, allLabels: [], dateFieldName: "", dateOrder: [] };
  }

  const dateFieldName = data.Columns.find(col => col.Type.toLowerCase() === "text" && col.Name === "Finance_Year")?.Name || "Finance_Year";
  const valueFieldName = data.Columns.find(col => col.Type.toLowerCase() === "number")?.Name || "Total_Stock_Quantity";
  const stateFieldName = data.Columns.find(col => col.Type.toLowerCase() === "text" && col.Name === "State")?.Name || "State";

  const allLabels = [];
  const groupedData = {};
  const dateOrder = [];

  // Get unique states
  const states = [...new Set(data.Rows.map(row => row[0]))]; // State is first column
  allLabels.push(...states);

  // Group by Finance_Year
  data.Rows.forEach(row => {
    const state = row[0]; // State
    const date = row[1]; // Finance_Year
    const value = parseFloat(row[2].replace(/,/g, "")); // Total_Stock_Quantity, remove commas

    if (!dateOrder.includes(date)) {
      dateOrder.push(date);
    }

    groupedData[date] = groupedData[date] || {};
    groupedData[date][state] = Number.isFinite(value) ? value : 0;
  });

  return { groupedData, allLabels, dateFieldName, dateOrder };
}

// function formatDate(date, dateFieldName) {
//   return date.toString(); // Assuming years are strings like "2020"
// }

function prepareLineChartData(data) {
  // console.log("data line chart", data);
  
  // Get column information dynamically
  const columnInfo = validateQueryResponse(data, true);
  if (!columnInfo) return null;
  
  const { dateColumns, numberColumns } = columnInfo;
  
  // Find the first date column and first number column
  const dateColumnIndex = dateColumns.length > 0 ? dateColumns[0].index : 0;
  const valueColumnIndex = numberColumns.length > 0 ? numberColumns[0].index : 1;
  
  // Get column names
  const dateColumnName = data.Columns[dateColumnIndex]?.Name || 'Date';
  const valueColumnName = data.Columns[valueColumnIndex]?.Name || 'Value';
  
  // Process the data to group by date if needed
  const groupedData = {};
  const dateOrder = [];
  
  data.Rows.forEach(row => {
    const dateValue = row[dateColumnIndex];
    const numericValue = Number.parseFloat(row[valueColumnIndex].toString().split(",").join(""));
    
    if (!groupedData[dateValue]) {
      groupedData[dateValue] = numericValue;
      dateOrder.push(dateValue);
    } else {
      // If duplicate dates, sum the values
      groupedData[dateValue] += numericValue;
    }
  });
  
  // Sort dates if they're actual date strings
  dateOrder.sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    if (!isNaN(dateA) && !isNaN(dateB)) {
      return dateA - dateB;
    }
    return a.localeCompare(b); // Fallback to string comparison
  });
  
  // Map data to include xAxisLabel and yAxisLabel in each data point
  const chartData = dateOrder.map((date) => ({
    value: Number.isFinite(groupedData[date]) ? groupedData[date] : 0,
    label: formatDate(date, dateColumnName),
    xAxisLabel: dateColumnName,
    yAxisLabel: valueColumnName
  }));
  
  // console.log("line chart data transformed");
  
  return {
    data: chartData
  };
}

function prepareMultiLineChartData(data) {
  // console.log("Raw input data:", data);
  const { groupedData, allLabels, dateFieldName, dateOrder } = processRawData(data);
  // console.log("Processed data:", { groupedData, allLabels, dateFieldName, dateOrder });
  if (!groupedData || !dateOrder.length) {
    console.error("Error: No grouped data or dates available");
    return null;
  }

  const datasets = Array.from(allLabels).map((label, index) => ({
    data: dateOrder.map((date) => ({
      value: Number.isFinite(groupedData[date]?.[label]) ? groupedData[date][label] : 0,
      label: formatDate(date, dateFieldName),
    })),
    color: brightColors[index % brightColors.length],
    label: label || "Unknown",
  }));

  const result = {
    data: datasets,
    xAxisLabel: dateFieldName,
    yAxisLabel: data.Columns.find((col) =>
      NUMERIC_DATA_TYPES.includes(col.Type?.toLowerCase?.() || "")
    )?.Name || "Value",
  };
  // console.log("Prepared chartData:", result);
  return result;
}
// Updated prepareBarChartData function
// Modified prepareBarChartData function to handle single or dual chart scenarios
function prepareBarChartData(data, chartIndex = 0) {
  // console.log("data bar chart", data);
  
  // Get column information dynamically
  const columnInfo = validateQueryResponse(data, true);
  if (!columnInfo) return null;
  
  const { textColumns, numberColumns } = columnInfo;
  
  // Find the first text column for categories by default
  let categoryColumnIndex = textColumns.length > 0 ? textColumns[0].index : 0;
  
  // For dual charts, use chartIndex to determine which number column to use
  const valueColumnIndex = numberColumns.length > chartIndex ? numberColumns[chartIndex].index : numberColumns[0].index;
  
  // Check if we have exactly 2 string columns and 1 number column
  const isTwoStringsOneNumber = textColumns.length === 2 && numberColumns.length === 1;
  
  // Get column names
  const categoryColumnName = isTwoStringsOneNumber 
    ? `${data.Columns[textColumns[0].index]?.Name || 'Category1'}_${data.Columns[textColumns[1].index]?.Name || 'Category2'}`
    : data.Columns[categoryColumnIndex]?.Name || 'Category';
  const valueColumnName = data.Columns[valueColumnIndex]?.Name || 'Value';
  
  // Map rows to chart data, assigning a color and axis labels to each bar
  const chartData = data.Rows.map((row, index) => {
    // Concatenate two string columns if condition is met
    const labelText = isTwoStringsOneNumber
      ? `${row[textColumns[0].index]}-${row[textColumns[1].index]}`
      : row[categoryColumnIndex];
    
    return {
      value: Number.parseFloat(row[valueColumnIndex].toString().split(",").join("")),
      label: labelText,
      color: brightColors[index % brightColors.length], // Cycle through colors
      // xAxisLabel: categoryColumnName,
      yAxisLabel: valueColumnName
    };
  });
  
  // console.log("bar chart data transformed", chartData);
  
  return {
    data: chartData
  };
}

// New function to prepare data for dual charts
function prepareDualBarChartData(data) {
  const columnInfo = validateQueryResponse(data, true);
  if (!columnInfo) return null;
  
  const { textColumns, numberColumns } = columnInfo;
  
  // Only proceed if we have 1 text column and 2 number columns
  if (textColumns.length !== 1 || numberColumns.length !== 2) {
    return null;
  }
  
  // Prepare data for both charts
  const chart1Data = prepareBarChartData(data, 0); // First number column
  const chart2Data = prepareBarChartData(data, 1); // Second number column
  
  return {
    chart1: chart1Data,
    chart2: chart2Data
  };
}

function prepareMultiBarChartData(data) {
  // console.log("Raw input data:", data);
  const { groupedData, allLabels, dateFieldName, dateOrder } = processRawData(data);
  // console.log("Processed data:", { groupedData, allLabels, dateFieldName, dateOrder });
  if (!groupedData || !dateOrder.length) {
    console.error("Error: No grouped data or dates available");
    return null;
  }

  const datasets = Array.from(allLabels).map((label, index) => ({
    data: dateOrder.map((date) => ({
      value: Number.isFinite(groupedData[date]?.[label]) ? groupedData[date][label] : 0,
      label: formatDate(date, dateFieldName),
    })),
    color: brightColors[index % brightColors.length],
    label: label || "Unknown",
  }));

  const result = {
    data: datasets,
    xAxisLabel: dateFieldName,
    yAxisLabel: data.Columns.find((col) =>
      NUMERIC_DATA_TYPES.includes(col.Type?.toLowerCase?.() || "")
    )?.Name || "Value",
  };
  // console.log("Prepared chartData:", result);
  return result;
}

function preparePieChartData(data) {
  // console.log("data pai", data);
  const columnInfo = validateQueryResponse(data, true);
  if (!columnInfo) return null;
  
  const { textColumns, numberColumns } = columnInfo;
  
  // Default indices
  let labelColumnIndex = textColumns.length > 0 ? textColumns[0].index : 0;
  const valueColumnIndex = numberColumns.length > 0 ? numberColumns[0].index : 1;
  
  // Check if we have exactly 2 string columns and 1 number column
  const isTwoStringsOneNumber = textColumns.length === 2 && numberColumns.length === 1;
  
  // Get column names
  const labelColumnName = isTwoStringsOneNumber 
    ? `${data.Columns[textColumns[0].index]?.Name || 'Category1'}_${data.Columns[textColumns[1].index]?.Name || 'Category2'}`
    : data.Columns[labelColumnIndex]?.Name || 'Category';
  const valueColumnName = data.Columns[valueColumnIndex]?.Name || 'Value';
  
  const chartData = data.Rows.map((row, index) => {
    // Concatenate two string columns if condition is met
    const labelText = isTwoStringsOneNumber
      ? `${row[textColumns[0].index]}-${row[textColumns[1].index]}`
      : row[labelColumnIndex];
    
    return {
      value: Number.parseFloat(row[valueColumnIndex].toString().split(",").join("")),
      text: labelText,
      color: brightColors[index % brightColors.length],
    };
  });
  
  // console.log("data transformed");
  
  return {
    data: chartData,
    xAxisLabel: valueColumnName,
    yAxisLabel: labelColumnName,
  };
}

function getErrorMessage(response, type) {
  const fields = validateQueryResponse(response, true, type);

  if (!fields) return "Invalid data structure";

  if (type === "linechart" || type === "multilinechart") {
    if (!fields.hasDateColumn)
      return "Data set must contain at least one date field.";
    if (fields.numberColumnCount < 1)
      return "Line chart requires at least one numeric field.";
    if (
      fields.textColumnCount !== 1 ||
      (type === "linechart" && fields.numberColumnCount !== 1)
    )
      return "Line chart requires exactly 1 string field and 1 numeric field.";
    if (fields.numRows > 200)
      return "Line chart cannot have more than 200 rows.";
  }

  if (type === "barchart" || type === "multibarchart" || type === "piechart") {
    if (
      fields.textColumnCount > 2 ||
      (type !== "multibarchart" && fields.numberColumnCount > 1)
    )
      return "Chart can have at most 2 string fields and 1 numeric field.";
    if (fields.numRows > 32) return "Chart cannot have more than 32 rows.";
  }

  return "Invalid data for the selected chart type";
}

function determineChartType(data) {
  const fields = validateQueryResponse(data, true);
  if (!fields) {
    return { chartType: null, error: "Invalid data structure" };
  }

  const {
    hasDateColumn,
    textColumnCount,
    numberColumnCount,
    dateColumnCount,
    dateColumns,
    textColumns,
    numberColumns,
    numRows
  } = fields;

  // Case 1: 2 string columns, 1 number column -> Concatenate strings, prefer bar chart
  if (
    !hasDateColumn &&
    textColumnCount === 2 &&
    numberColumnCount === 1 &&
    numRows >= 2 &&
    numRows <= 32
  ) {
    return {
      chartType: "barchart",
      error: null,
      notes: "Concatenate the two string columns to form labels"
    };
  }

  // Case 2: 1 string column, 2 number columns -> Two bar charts
  if (
    !hasDateColumn &&
    textColumnCount === 1 &&
    numberColumnCount === 2 &&
    numRows >= 2 &&
    numRows <= 32
  ) {
    return {
      chartType: ["barchart", "barchart"],
      error: null,
      notes:
        "Create two charts: one for the string column with the first number column, another for the string column with the second number column"
    };
  }

  // Case 3: Date-based data
  if (hasDateColumn && numRows >= 2 && numRows <= 200) {
    if (dateColumnCount === 1 && textColumnCount === 1 && numberColumnCount === 1) {
      return { chartType: "multilinechart", error: null };
    }
    if (numberColumnCount === 1 && (textColumnCount === 1 || dateColumnCount === 1)) {
      return { chartType: "linechart", error: null };
    }
  }

  // Case 4: 1 string + 1 number -> Prefer bar chart over pie
  if (
    !hasDateColumn &&
    textColumnCount === 1 &&
    numberColumnCount === 1 &&
    numRows >= 2 &&
    numRows <= 32
  ) {
    return { chartType: "barchart", error: null };
  }

  // Case 5: Flexible: 1–2 text + 1–2 number -> multibarchart
  if (
    !hasDateColumn &&
    textColumnCount >= 1 &&
    textColumnCount <= 2 &&
    numberColumnCount >= 1 &&
    numberColumnCount <= 2 &&
    numRows >= 2 &&
    numRows <= 32
  ) {
    return { chartType: "multibarchart", error: null };
  }

  return {
    chartType: null,
    error: "No suitable chart type found for the data",
  };
}

// DynamicChart Component
const DynamicChart = ({ data }) => {
  const [selectedChartType, setSelectedChartType] = useState(null);

  if (!data) {
    return 
  }

  // Preprocess data
  const processedData = roundFloatAndDoubleValues(sortByFinancialMonth(data));

  // Determine initial chart type if not already selected
  const { chartType: initialChartType, error } = determineChartType(processedData);

  // Use selectedChartType if set, otherwise fall back to initialChartType
  const currentChartType = selectedChartType || initialChartType;

  if (!currentChartType) {
    return 
  }

  // Check if we need to render dual charts
  const isDualChart = Array.isArray(currentChartType);

  if (isDualChart) {
    // Prepare data for dual charts
    const dualChartData = prepareDualBarChartData(processedData);
    
    if (!dualChartData) {
      return 
    }

    return (
      <View style={styles.container}>
        <ScrollView 
          horizontal={false} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.dualChartContainer}>
            {/* First Chart */}
            <View style={styles.chartWrapper}>
              <BarChartComponent
                chartData={{ data: dualChartData.chart1.data }}
              />
            </View>
            <View style={styles.chartSeparator} />
            <View style={styles.chartWrapper}>
              <BarChartComponent
                chartData={{ data: dualChartData.chart2.data }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Validate data for the selected chart type
  const isValid = validateQueryResponse(processedData, false, currentChartType);

  if (!isValid) {
    const errorMessage = getErrorMessage(processedData, currentChartType);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {errorMessage}</Text>
      </View>
    );
  }

  // Prepare chart data for single chart
  let chartData;
  switch (currentChartType) {
    case "linechart":
      chartData = prepareLineChartData(processedData);
      break;
    case "multilinechart":
      chartData = prepareMultiLineChartData(processedData);
      break;
    case "barchart":
      chartData = prepareBarChartData(processedData);
      break;
    case "multibarchart":
      chartData = prepareMultiBarChartData(processedData);
      break;
    case "piechart":
      chartData = preparePieChartData(processedData);
      break;
    default:
      return 
  }

  if (!chartData || !chartData.data || !chartData.data.length) {
    return 
  }

  // Define all possible chart types with icons
  const singleSeriesCharts = [
    { label: 'Line Chart', value: 'linechart', icon: <Icon name="chart-line" size={24} /> },
    { label: 'Bar Chart', value: 'barchart', icon: <Icon name="chart-bar" size={24} /> },
    { label: 'Pie Chart', value: 'piechart', icon: <Icon name="chart-pie" size={24} /> },
  ];

  const multiSeriesCharts = [
    { label: 'Multi Line Chart', value: 'multilinechart', icon: <Icon name="chart-line" size={24} /> },
    { label: 'Multi Bar Chart', value: 'multibarchart', icon: <Icon name="chart-bar" size={24} /> },
  ];

  // Determine if data is multi-series or single-series based on initialChartType
  const isMultiSeries = ['multilinechart', 'multibarchart'].includes(initialChartType);

  // Filter available chart types based on whether data is single-series or multi-series
  const availableChartTypes = isMultiSeries
    ? multiSeriesCharts.filter(chart => validateQueryResponse(processedData, false, chart.value))
    : singleSeriesCharts.filter(chart => validateQueryResponse(processedData, false, chart.value));

  return (
    <View style={styles.container}>
      {/* Chart Type Switcher with Buttons */}
      {availableChartTypes.length > 1 && (
        <View style={styles.controlPanel}>
          <View style={styles.buttonContainer}>
            {availableChartTypes.map((chart) => (
              <TouchableOpacity
                key={chart.value}
                style={[
                  styles.button,
                  currentChartType === chart.value && styles.selectedButton,
                ]}
                onPress={() => setSelectedChartType(chart.value)}
              >
                {React.cloneElement(chart.icon, {
                  color: currentChartType === chart.value ? '#fff' : '#000',
                  size: 24,
                })}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Render Chart based on selected type */}
      {currentChartType === "linechart" && (
        <LineChartComponent
          title="Line Chart"
          chartData={{ data: chartData.data }}
        />
      )}
      {currentChartType === "multilinechart" && (
        <MultiLineChartComponent
          title="Multi Line Chart"
          chartData={{ data: chartData.data }}
        />
      )}
      {currentChartType === "barchart" && (
        <BarChartComponent
          title="Bar Chart"
          chartData={{ data: chartData.data }}
        />
      )}
      {currentChartType === "multibarchart" && (
        <MultiBarChartComponent
          title="Multi Bar Chart"
          chartData={{ data: chartData.data }}
        />
      )}
      {currentChartType === "piechart" && (
        <PieChartComponent
          title="Pie Chart"
          chartData={{ data: chartData.data }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    padding: 5,
  },
  controlPanel: {
    width: 200, // Fixed width to control the button container size
    alignSelf: 'flex-end',
    marginBottom:10,// Anchors the panel to the left
    marginTop:10
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#174054',
  },
  dualChartContainer: {
    flexDirection: 'cal',
    justifyContent: 'space-between',
    gap: 20,
    // Or for vertical layout:
    // flexDirection: 'column',
  },

  chartWrapper: {
    flex: 1,
    minWidth: 0, 
  }
});


export default DynamicChart;
