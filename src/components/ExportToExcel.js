// src/utils/ExportToExcel.js
import { Alert } from 'react-native';
import XLSX from 'xlsx';
import ReactNativeBlobUtil from 'react-native-blob-util';   // ← Use this (not rn-fetch-blob)

const formatCellValue = (value, columnName, columnType) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return value;
  return String(value);
};

export const exportToExcelAndOpen = async (data) => {
  if (!data || !data.Columns || !data.Rows || data.Rows.length === 0) {
    Alert.alert('No Data', 'There is no data to export.');
    return;
  }

  try {
    // 1. Prepare data
    const header = data.Columns.map(col => col.Name || col.name || '');
    const rows = data.Rows.map(row =>
      row.map((cell, i) => {
        const col = data.Columns[i] || {};
        return formatCellValue(cell, col.Name || col.name, col.Type || col.type);
      })
    );
    const sheetData = [header, ...rows];

    // 2. Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // ========== AUTO-FIT COLUMNS (This is the magic part) ==========
    const colWidths = [];

    sheetData.forEach((row) => {
      row.forEach((cell, colIndex) => {
        const cellValue = cell === null || cell === undefined ? '' : String(cell);
        const cellLength = cellValue.length;

        // Keep track of the longest value in each column
        if (!colWidths[colIndex] || cellLength > colWidths[colIndex].length) {
          colWidths[colIndex] = { length: cellLength };
        }
      });
    });

    // Apply calculated widths (add some padding + convert to Excel units)
    ws['!cols'] = colWidths.map(item => ({
      wch: Math.min(Math.max(item.length + 5, 10), 50)   // min 10, max 50 chars wide
    }));
    // =================================================================

    // Optional: Auto-fit row heights (for wrapped text)
    // ws['!rows'] = [{ hpt: 20 }, ...]; // you can set fixed or dynamic height if needed

    // 3. Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // 4. Generate file
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    // 5. Save to Downloads
    const dirs = ReactNativeBlobUtil.fs.dirs;
    const fileName = `table_data.xlsx`;
    const path = `${dirs.DownloadDir}/${fileName}`;

    await ReactNativeBlobUtil.fs.writeFile(path, wbout, 'base64');

    // 6. Success + Auto-open
    // Alert.alert(
    //   'Excel Ready! ✅',
    //   `Saved: ${fileName}\nColumns auto-sized perfectly!`,
    //   [
    //     { text: 'Cancel', style: 'cancel' },
    //     { text: 'Open in Excel', onPress: () => openFile(path) },
    //   ]
    // );

    // Auto-open immediately (recommended)
    openFile(path);

  } catch (error) {
    console.error('Export error:', error);
    Alert.alert('Failed', error.message || 'Something went wrong');
  }
};

const openFile = (filePath) => {
  ReactNativeBlobUtil.android
    .actionViewIntent(filePath, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .catch(() => {
      Alert.alert('No App', 'Please install Microsoft Excel or Google Sheets');
    });
};