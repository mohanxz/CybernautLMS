const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');

const router = express.Router();
const verifyAccessToken = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });



function excelDateToJSDate(serial) {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(excelEpoch.getTime() + (serial) * 86400000);
  return date;
}

router.post('/upload', verifyAccessToken, upload.single('file'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0]; // First sheet
    const rows = [];
    const headers = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = row.values.slice(1); // Skip index 0 (ExcelJS starts at 1)

      if (rowNumber === 1) {
        headers.push(...values);
      } else {
        const rowData = {};
        values.forEach((value, index) => {
          let header = headers[index];
          if (header) {
            // Convert dob if needed
            if (header.toLowerCase() === 'dob') {
              if (typeof value === 'number') {
                rowData[header] = excelDateToJSDate(value);
              } else {
                rowData[header] = new Date(value);
              }
            } else {
              rowData[header] = value;
            }
          }
        });
        rows.push(rowData);
      }
    });

    res.json({ students: rows });
  } catch (error) {
    console.error("Excel parsing error:", error);
    res.status(500).json({ error: "Failed to parse Excel file" });
  }
});

module.exports = router;
