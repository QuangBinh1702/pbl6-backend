import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import styles from '../styles/BulkImportStudents.module.css';

const BulkImportStudents = () => {
  const [file, setFile] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState(false);

  // Parse Excel file
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Get raw data to inspect column names
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (data.length === 0) {
          setError('File Excel không có dữ liệu');
          return;
        }

        // Get the actual column names from the first row
        const firstRow = data[0];
        const actualKeys = Object.keys(firstRow);

        // Map columns flexibly to handle different naming conventions
        const parsedStudents = data.map((row) => {
          // Try to find matching columns
          let studentCode = '';
          let fullName = '';
          let className = '';
          let faculty = '';

          // Check for student code column
          for (const key of actualKeys) {
            const lowerKey = key.toLowerCase();
            if (
              key === 'Mã sinh viên' ||
              lowerKey.includes('mã') ||
              lowerKey.includes('code') ||
              lowerKey.includes('student')
            ) {
              studentCode = row[key] || '';
              break;
            }
          }

          // Check for full name column
          for (const key of actualKeys) {
            const lowerKey = key.toLowerCase();
            if (
              key === 'Họ và tên' ||
              lowerKey.includes('tên') ||
              lowerKey.includes('name') ||
              lowerKey.includes('họ')
            ) {
              fullName = row[key] || '';
              break;
            }
          }

          // Check for faculty column
          for (const key of actualKeys) {
            const lowerKey = key.toLowerCase();
            if (
              key === 'Khoa' ||
              lowerKey.includes('khoa') ||
              lowerKey.includes('faculty') ||
              lowerKey.includes('department')
            ) {
              faculty = row[key] || '';
              break;
            }
          }

          // Check for class column
          for (const key of actualKeys) {
            const lowerKey = key.toLowerCase();
            if (
              key === 'Lớp' ||
              lowerKey.includes('lớp') ||
              lowerKey.includes('class') ||
              lowerKey.includes('classname')
            ) {
              className = row[key] || '';
              break;
            }
          }

          return {
            studentCode: String(studentCode).trim(),
            fullName: String(fullName).trim(),
            className: String(className).trim(),
            faculty: String(faculty).trim(),
          };
        }).filter((s) => s.studentCode || s.fullName); // Filter out completely empty rows

        if (parsedStudents.length === 0) {
          setError('Không tìm thấy dữ liệu sinh viên hợp lệ trong file');
          return;
        }

        setStudents(parsedStudents);
        setFile(uploadedFile.name);
        setError(null);
      } catch (err) {
        setError('Lỗi khi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  // Add manual student row
  const addManualStudent = () => {
    setStudents([...students, {
      studentCode: '',
      fullName: '',
      className: '',
      faculty: '',
    }]);
  };

  // Update student row
  const updateStudent = (index, field, value) => {
    const updated = [...students];
    updated[index][field] = value;
    setStudents(updated);
  };

  // Remove student row
  const removeStudent = (index) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  // Submit to API
  const handleSubmit = async () => {
    if (students.length === 0) {
      setError('Vui lòng thêm sinh viên để import');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('http://localhost:5000/api/auth/bulk-import-students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students }),
      });

      const data = await res.json();
      setResponse(data);

      if (!data.success) {
        setError(data.message || 'Lỗi không xác định');
      }
    } catch (err) {
      setError('Lỗi kết nối: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        'Mã sinh viên': 'SV001',
        'Họ và tên': 'Nguyễn Văn A',
        'Khoa': 'Công nghệ thông tin',
        'Lớp': 'CNTT1',
      },
      {
        'Mã sinh viên': 'SV002',
        'Họ và tên': 'Trần Thị B',
        'Khoa': 'Kinh tế',
        'Lớp': 'KT2',
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'template_import_students.xlsx');
  };

  return (
    <div className={styles.container}>
      <h1>Import Sinh Viên Hàng Loạt</h1>

      {/* Tab selection */}
      <div className={styles.tabButtons}>
        <button
          className={!manualInput ? styles.active : ''}
          onClick={() => setManualInput(false)}
        >
          📁 Upload Excel
        </button>
        <button
          className={manualInput ? styles.active : ''}
          onClick={() => setManualInput(true)}
        >
          ✏️ Nhập Thủ Công
        </button>
      </div>

      {/* Upload section */}
      {!manualInput && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadBox}>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              id="fileInput"
              className={styles.fileInput}
            />
            <label htmlFor="fileInput" className={styles.uploadLabel}>
              <span>📤 Chọn file Excel hoặc kéo thả vào đây</span>
              {file && <p>File: {file}</p>}
            </label>
          </div>
          <button onClick={downloadTemplate} className={styles.downloadBtn}>
            📥 Tải template
          </button>
        </div>
      )}

      {/* Manual input section */}
      {manualInput && (
        <button onClick={addManualStudent} className={styles.addBtn}>
          ➕ Thêm sinh viên
        </button>
      )}

      {/* Students table */}
      {students.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.studentsTable}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã sinh viên</th>
                <th>Họ và tên</th>
                <th>Khoa</th>
                <th>Lớp</th>
                {manualInput && <th>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    {manualInput ? (
                      <input
                        type="text"
                        value={student.studentCode}
                        onChange={(e) => updateStudent(index, 'studentCode', e.target.value)}
                        placeholder="SV001"
                      />
                    ) : (
                      student.studentCode
                    )}
                  </td>
                  <td>
                    {manualInput ? (
                      <input
                        type="text"
                        value={student.fullName}
                        onChange={(e) => updateStudent(index, 'fullName', e.target.value)}
                        placeholder="Nguyễn Văn A"
                      />
                    ) : (
                      student.fullName
                    )}
                  </td>
                  <td>
                    {manualInput ? (
                      <input
                        type="text"
                        value={student.faculty}
                        onChange={(e) => updateStudent(index, 'faculty', e.target.value)}
                        placeholder="Công nghệ thông tin"
                      />
                    ) : (
                      student.faculty
                    )}
                  </td>
                  <td>
                    {manualInput ? (
                      <input
                        type="text"
                        value={student.className}
                        onChange={(e) => updateStudent(index, 'className', e.target.value)}
                        placeholder="CNTT1"
                      />
                    ) : (
                      student.className
                    )}
                  </td>
                  {manualInput && (
                    <td>
                      <button
                        onClick={() => removeStudent(index)}
                        className={styles.deleteBtn}
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.count}>Tổng: {students.length} sinh viên</p>
        </div>
      )}

      {/* Submit button */}
      {students.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? '⏳ Đang xử lý...' : '✅ Import'}
        </button>
      )}

      {/* Error message */}
      {error && (
        <div className={styles.errorBox}>
          <strong>❌ Lỗi:</strong> {error}
        </div>
      )}

      {/* Response display */}
      {response && (
        <div className={styles.responseBox}>
          <h2>{response.success ? '✅ Thành công' : '❌ Thất bại'}</h2>
          <p className={styles.message}>{response.message}</p>

          {response.data && (
            <>
              {response.data.summary && (
                <div className={styles.summary}>
                  <div>Tổng: <strong>{response.data.summary.total}</strong></div>
                  <div>Thành công: <strong>{response.data.summary.successful}</strong></div>
                  <div>Thất bại: <strong>{response.data.summary.failed}</strong></div>
                </div>
              )}

              {response.data.successful && response.data.successful.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>✅ Thành công ({response.data.successful.length})</h3>
                  <table className={styles.detailTable}>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ và tên</th>
                        <th>Username</th>
                        <th>Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {response.data.successful.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.studentCode}</td>
                          <td>{item.fullName}</td>
                          <td>{item.username}</td>
                          <td className={styles.password}>{item.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {response.data.failed && response.data.failed.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>❌ Thất bại ({response.data.failed.length})</h3>
                  <table className={styles.detailTable}>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ và tên</th>
                        <th>Lý do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {response.data.failed.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.studentCode}</td>
                          <td>{item.fullName}</td>
                          <td className={styles.reason}>{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <button
            onClick={() => {
              setResponse(null);
              setStudents([]);
              setFile(null);
            }}
            className={styles.resetBtn}
          >
            🔄 Nhập lại
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkImportStudents;
