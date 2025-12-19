# Frontend Bulk Student Import Implementation Guide

## Overview

This guide explains how to implement the Excel parsing and bulk student import functionality on the frontend.

## Step 1: Install Required Dependencies

```bash
cd frontend
npm install xlsx
```

## Step 2: Create Excel Parser Service

Create `src/services/excelParser.js`:

```javascript
import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract student data
 * Expected columns: Mã sinh viên, Họ và tên, Khoa, Lớp
 */
export const parseStudentExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to expected format
        const students = jsonData
          .filter(row => row['Mã sinh viên'] && row['Họ và tên']) // Filter empty rows
          .map(row => ({
            studentCode: String(row['Mã sinh viên']).trim(),
            fullName: String(row['Họ và tên']).trim(),
            className: row['Lớp'] ? String(row['Lớp']).trim() : null,
            faculty: row['Khoa'] ? String(row['Khoa']).trim() : null
          }));

        resolve(students);
      } catch (error) {
        reject(new Error(`Failed to parse Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};
```

## Step 3: Create API Service

Create `src/services/api/bulkImportAPI.js`:

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000'; // or your API URL

/**
 * Bulk import students
 * @param {Array} students - Array of student objects with studentCode, fullName, className, faculty
 * @param {String} token - JWT token for authentication
 * @returns {Promise} Response with success/failure details
 */
export const bulkImportStudents = async (students, token) => {
  try {
    const response = await axios.post(
      `${API_BASE}/auth/bulk-import-students`,
      { students },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'Bulk import failed');
    }
    throw error;
  }
};
```

## Step 4: Create Bulk Import Component

Create `src/components/BulkImportStudents/BulkImportStudents.jsx`:

```javascript
import React, { useState } from 'react';
import { parseStudentExcel } from '../../services/excelParser';
import { bulkImportStudents } from '../../services/api/bulkImportAPI';
import styles from './BulkImportStudents.module.css';

const BulkImportStudents = () => {
  const [file, setFile] = useState(null);
  const [parsedStudents, setParsedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token'); // Get from your auth context/state

  // Handle file selection
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError(null);
    setResult(null);

    try {
      setLoading(true);
      const students = await parseStudentExcel(selectedFile);
      
      if (students.length === 0) {
        throw new Error('No valid student data found in Excel file');
      }

      setFile(selectedFile);
      setParsedStudents(students);
    } catch (err) {
      setError(err.message);
      setParsedStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk import
  const handleImport = async () => {
    if (parsedStudents.length === 0) {
      setError('No students to import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await bulkImportStudents(parsedStudents, token);
      setResult(response);
      setParsedStudents([]); // Clear preview after successful import
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Bulk Import Students</h2>

      {/* File Input */}
      <div className={styles.fileInput}>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={loading}
        />
        <p className={styles.hint}>
          Upload Excel file with columns: Mã sinh viên, Họ và tên, Khoa, Lớp
        </p>
      </div>

      {/* Preview Table */}
      {parsedStudents.length > 0 && (
        <div className={styles.preview}>
          <h3>Preview ({parsedStudents.length} students)</h3>
          <table>
            <thead>
              <tr>
                <th>Mã sinh viên</th>
                <th>Họ và tên</th>
                <th>Khoa</th>
                <th>Lớp</th>
              </tr>
            </thead>
            <tbody>
              {parsedStudents.map((student, idx) => (
                <tr key={idx}>
                  <td>{student.studentCode}</td>
                  <td>{student.fullName}</td>
                  <td>{student.faculty || '-'}</td>
                  <td>{student.className || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleImport}
            disabled={loading}
            className={styles.importBtn}
          >
            {loading ? 'Importing...' : 'Import Students'}
          </button>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className={`${styles.message} ${styles.error}`}>
          ❌ {error}
        </div>
      )}

      {/* Success Results */}
      {result && (
        <div className={styles.results}>
          <h3>Import Results</h3>
          
          <div className={styles.summary}>
            <p><strong>Total:</strong> {result.data.summary.total}</p>
            <p><strong>✅ Successful:</strong> {result.data.summary.successful}</p>
            <p><strong>❌ Failed:</strong> {result.data.summary.failed}</p>
          </div>

          {/* Successful Accounts */}
          {result.data.successful.length > 0 && (
            <div className={styles.successful}>
              <h4>Created Accounts</h4>
              <table>
                <thead>
                  <tr>
                    <th>Student Code</th>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Default Password</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.successful.map((student, idx) => (
                    <tr key={idx}>
                      <td>{student.studentCode}</td>
                      <td>{student.fullName}</td>
                      <td>{student.username}</td>
                      <td className={styles.password}>{student.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Failed Accounts */}
          {result.data.failed.length > 0 && (
            <div className={styles.failed}>
              <h4>Failed Imports</h4>
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Student Code</th>
                    <th>Full Name</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.failed.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.rowIndex}</td>
                      <td>{item.studentCode}</td>
                      <td>{item.fullName}</td>
                      <td className={styles.reason}>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImportStudents;
```

## Step 5: Create Styles

Create `src/components/BulkImportStudents/BulkImportStudents.module.css`:

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.container h2 {
  color: #333;
  margin-bottom: 20px;
}

.fileInput {
  margin-bottom: 30px;
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.fileInput input {
  display: block;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  max-width: 400px;
}

.hint {
  color: #666;
  font-size: 12px;
  margin: 0;
}

.preview {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.preview h3 {
  margin-top: 0;
  color: #333;
}

.preview table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  margin-bottom: 15px;
}

.preview table th,
.preview table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  font-size: 13px;
}

.preview table th {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #333;
}

.preview table tr:hover {
  background-color: #f9f9f9;
}

.importBtn {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.importBtn:hover:not(:disabled) {
  background-color: #0056b3;
}

.importBtn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.message {
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.results {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.results h3 {
  margin-top: 0;
  color: #333;
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #eee;
}

.summary p {
  margin: 0;
  font-size: 14px;
}

.summary strong {
  color: #333;
}

.successful,
.failed {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
  background-color: white;
}

.successful h4 {
  color: #28a745;
  margin-top: 0;
}

.failed h4 {
  color: #dc3545;
  margin-top: 0;
}

.successful table,
.failed table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

.successful table th,
.successful table td,
.failed table th,
.failed table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  font-size: 13px;
}

.successful table th,
.failed table th {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #333;
}

.successful table tr:hover,
.failed table tr:hover {
  background-color: #f9f9f9;
}

.password {
  font-family: monospace;
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 2px;
}

.reason {
  color: #dc3545;
  font-weight: 500;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .summary {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .preview table,
  .successful table,
  .failed table {
    font-size: 12px;
  }

  .preview table th,
  .preview table td,
  .successful table th,
  .successful table td,
  .failed table th,
  .failed table td {
    padding: 8px;
  }
}
```

## Step 6: Use Component in Your Page

In your admin dashboard or settings page:

```javascript
import BulkImportStudents from '../components/BulkImportStudents/BulkImportStudents';

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <BulkImportStudents />
    </div>
  );
}
```

## Excel Template

Your Excel file should look like this:

| Mã sinh viên | Họ và tên | Khoa | Lớp |
|-------|-----------|------|-----|
| SV001 | Nguyễn Văn A | Công nghệ thông tin | CNTT1 |
| SV002 | Trần Thị B | Kinh tế | KT2 |
| SV003 | Phạm Văn C | Công nghệ thông tin | CNTT1 |

**Important Notes:**
- Column headers must match exactly: "Mã sinh viên", "Họ và tên", "Khoa", "Lớp"
- Mã sinh viên (Student Code) and Họ và tên (Full Name) are required
- Khoa (Faculty) and Lớp (Class) are optional

## Features & Validations

✅ **Frontend Validations:**
- Empty rows are filtered out
- Invalid data is rejected
- File must be .xlsx, .xls, or .csv

✅ **Backend Validations:**
- Student code must be unique
- Student code must be provided
- Full name must be provided
- Duplicate codes in batch are rejected
- Duplicate codes in database are rejected

✅ **User Feedback:**
- Real-time preview of parsed students
- Clear error messages for invalid files
- Detailed success/failure report
- Default credentials shown for created accounts

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| "Failed to parse Excel" | Ensure file format is .xlsx or .xls |
| "No valid student data found" | Check column headers match exactly |
| "Unauthorized" | Verify JWT token is valid and not expired |
| "Student code already exists" | Check for duplicates in the file or database |
| "Maximum 1000 students" | Split import into multiple batches |

## Security Considerations

⚠️ **Important:**
- Default passwords (student code) should be changed on first login
- Consider sending credentials via secure email instead of displaying them
- Log all bulk import operations for audit purposes
- Implement rate limiting to prevent abuse
- Validate file size to prevent large uploads

## Performance Tips

- For large batches (500+ students), show a progress indicator
- Implement pagination for results display
- Consider splitting very large imports (1000+) into multiple requests
- Cache faculty/class data to speed up matching
