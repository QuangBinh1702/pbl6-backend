1.Lọc điểm bị sai khi kết hợp khoa ,lớp ,...

2.Thêm API sau để làm dashboard cho admin:
Thống kê theo năm : 
+Request sẽ gửi năm 
+Response nhận về sẽ gồm các dữ liệu sau : 
Với hoạt động thì sẽ theo tháng và theo khoa , theo tháng thì sẽ list tổng hoạt động của 12 tháng trong năm đó, theo khoa sẽ list tổng hoạt động của từng khoa trong năm đó
Với điểm thì list điểm trung bình của sinh viên từng khoa
 Ví dụ như sau 
[return [
  {
    year: 2023,
    // Thống kê hoạt động
    activity: {
      monthly: [
        { month: "Th1", totalActivities: 12 },
        { month: "Th2", totalActivities: 9 },
        { month: "Th3", totalActivities: 15 },
        { month: "Th4", totalActivities: 18 },
        { month: "Th5", totalActivities: 22 },
        { month: "Th6", totalActivities: 17 },
        { month: "Th7", totalActivities: 11 },
        { month: "Th8", totalActivities: 14 },
        { month: "Th9", totalActivities: 25 },
        { month: "Th10", totalActivities: 28 },
        { month: "Th11", totalActivities: 20 },
        { month: "Th12", totalActivities: 23 },
      ],
      byOrganization: [
        { organization: "CLB Tình Nguyện", totalActivities: 42 },
        { organization: "Đoàn Khoa CNTT", totalActivities: 31 },
        { organization: "Đoàn Khoa Điện", totalActivities: 27 },
        { organization: "Hội Sinh Viên", totalActivities: 38 },
        { organization: "CLB Học Thuật", totalActivities: 19 },
        { organization: "CLB Kỹ Năng", totalActivities: 12 },
        { organization: "CLB Thể Thao", totalActivities: 25 },
      ],
    },
    // Điểm phục vụ cộng đồng theo khoa
    communityPoint: [
      { faculty: "Khoa CNTT", avgCPoint: 82 },
      { faculty: "Khoa Điện - Điện tử", avgCPoint: 75 },
      { faculty: "Khoa Cơ khí", avgCPoint: 71 },
      { faculty: "Khoa Hóa", avgCPoint: 79 },
      { faculty: "Khoa Kinh tế", avgCPoint: 85 },
    ]
  }
]]

Giao diện bên front end:


3.Update lại logic nghiệp vụ phần phân quyền (thêm yêu cầu sau)
4. Update ảnh ở thông tin sinh viên và staff
5.Đề xuất hoạt động chưa lưu được requirement
Đang gửi yêu cầu theo dạng này:
{
  "capacity": 30,
  "description": "Worksop",
  "end_time": "2025-12-11T16:00:00.000Z",
  "field": "691d5c6cf46edc8ea94f09ec",
  "location": "Hội trường F, ĐHBK",
  "org_unit_id": {
    "_id": "691d5c6df46edc8ea94f09fd",
    "name": "Phòng Đào tạo",
    "type": "department",
    "leader_id": "691d5c6df46edc8ea94f09fa",
    "achievements": "Array(3)"
  },
  "points": 30,
  "requirements": [
    {
      "type": "faculty",
      "id": "691d62ffdb9ec83878f1b630"
    },
    {
      "type": "cohort",
      "id": "691d5c6cf46edc8ea94f09f5"
    }
  ],
  "requires_approval": true,
  "start_time": "2025-12-10T11:00:00.000Z",
  "title": "Workshop Data3"
}
- Kết quả:

6. Cập nhật hoạt động chưa cập nhật requirement

Hiển thị cập nhật thành công nhưng requirement chưa thay đổi

7.Lọc trạng thái ở danh sách hoạt động sinh viên chưa lọc theo trạng thái được
API:
 const response = await axios.get(`${API_URL}/activities/student/${studentId}/filter`, {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });


8. Danh sách hoạt động của tổ chức:
API: const response = await axios.get(`${API_URL}/activities`, {
      params: { org_unit_id },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
 
param gồm có những gì
9.Cần thêm các API sau 
+Thêm tổ chức ( gồm tên , các thông tin tổ chức : ngày thành lập, giới thiệu, thành tựu) ( mục type k cần thiết thì nên tối ưu lại cho hợp lý )
+ tương tự API sửa tổ chức sẽ sửa được các thông tin trên
10.tạo nhìu user request cần những tham số nào 
 



