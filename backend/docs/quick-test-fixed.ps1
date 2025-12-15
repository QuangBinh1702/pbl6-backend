# Quick Test Commands - PowerShell Version (Windows)

Write-Host "📋 Getting token..." -ForegroundColor Cyan

$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"password123"}' `
  -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$TOKEN = $loginData.data.token

if ($null -eq $TOKEN -or $TOKEN -eq "") {
  Write-Host "❌ Error: Could not get token" -ForegroundColor Red
  Write-Host "Response: $($loginResponse.Content)" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Token: $TOKEN" -ForegroundColor Green
Write-Host ""

# Seed 6 Rules
Write-Host "🌱 Seeding rules..." -ForegroundColor Cyan
Write-Host ""

$rules = @(
  @{
    pattern = "hoạt động sắp tới"
    keywords = @("hoạt động", "sắp tới", "tới")
    responseTemplate = "Các hoạt động sắp tới bao gồm: 1) Tập huấn kỹ năng lãnh đạo (15/12), 2) Hội thảo startup (20/12), 3) Gala bế mạc năm (25/12)"
    priority = 8
    type = "faq"
  },
  @{
    pattern = "giờ đăng ký hoạt động"
    keywords = @("giờ", "đăng ký", "mở")
    responseTemplate = "Thời gian đăng ký hoạt động: Từ 8:00 AM - 5:00 PM hàng ngày, có thể đăng ký qua website hoặc tại quầy tiếp nhận"
    priority = 8
    type = "faq"
  },
  @{
    pattern = "địa điểm diễn ra hoạt động"
    keywords = @("địa điểm", "nơi", "tại")
    responseTemplate = "Các hoạt động chủ yếu diễn ra tại: Nhà hát A (400 chỗ), Phòng hội họp B (100 chỗ), Sân vận động C"
    priority = 7
    type = "faq"
  },
  @{
    pattern = "yêu cầu tham gia hoạt động"
    keywords = @("yêu cầu", "điều kiện", "cần")
    responseTemplate = "Yêu cầu tham gia: Là sinh viên đang học, có hộp công dân, hoạt động tích cực, không vi phạm kỷ luật"
    priority = 8
    type = "faq"
  },
  @{
    pattern = "cách đăng ký hoạt động qua web"
    keywords = @("đăng ký", "web", "cách")
    responseTemplate = "Cách đăng ký: 1) Đăng nhập tài khoản, 2) Vào mục Hoạt động, 3) Click Đăng ký trên hoạt động muốn tham gia, 4) Xác nhận thông tin và gửi"
    priority = 9
    type = "faq"
  },
  @{
    pattern = "liên hệ hỗ trợ"
    keywords = @("liên hệ", "hỗ trợ", "gọi", "email")
    responseTemplate = "Liên hệ hỗ trợ: ☎️ 0123-456-789 (8:00-17:00 hàng ngày), 📧 support@university.edu.vn, 📍 Phòng 101, Tòa A"
    priority = 7
    type = "faq"
  }
)

$i = 1
foreach ($rule in $rules) {
  Write-Host "📝 Creating Rule $i : $($rule.pattern)..." -ForegroundColor Yellow
  
  $body = $rule | ConvertTo-Json
  
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/chatbot/rules" `
      -Method POST `
      -Headers @{
        "Authorization"="Bearer $TOKEN"
        "Content-Type"="application/json"
      } `
      -Body $body `
      -UseBasicParsing
    
    Write-Host "✓ Success (HTTP $($response.StatusCode))" -ForegroundColor Green
  } catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
  }
  
  $i++
  Write-Host ""
}

Write-Host "✅ All 6 rules seeded!" -ForegroundColor Green
Write-Host ""

# Test Questions
Write-Host "🧪 Testing questions..." -ForegroundColor Cyan
Write-Host ""

$questions = @(
  "Hoạt động sắp tới là gì?",
  "Giờ đăng ký hoạt động là mấy giờ?",
  "Cách đăng ký hoạt động qua web?"
)

$q = 1
foreach ($question in $questions) {
  Write-Host "Q$q : $question" -ForegroundColor Yellow
  
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/chatbot/ask-anything" `
      -Method POST `
      -Headers @{
        "Authorization"="Bearer $TOKEN"
        "Content-Type"="application/json"
      } `
      -Body "{`"question`":`"$question`"}" `
      -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Answer: $($data.data.answer)" -ForegroundColor Cyan
    Write-Host "Confidence: $($data.data.confidence)" -ForegroundColor Green
    Write-Host "Source: $($data.data.source)" -ForegroundColor Green
  } catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
  }
  
  Write-Host ""
  $q++
}

Write-Host "✅ Test complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Open browser: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Paste token and start chatting!" -ForegroundColor Cyan
