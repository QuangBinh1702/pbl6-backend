#!/bin/bash
# 🚀 Quick Test Commands - FIXED VERSION (No jq dependency)

# ============================================
# STEP 1: Get Token
# ============================================

echo "📋 Getting token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

# Extract token manually (no jq needed)
TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "✅ Token: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: Could not get token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo ""

# ============================================
# STEP 2: Seed 6 Rules
# ============================================

echo "🌱 Seeding rules..."
echo ""

# Rule 1
echo "📝 Creating Rule 1: hoạt động sắp tới..."
curl -s -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "hoạt động sắp tới",
    "keywords": ["hoạt động", "sắp tới", "tới"],
    "responseTemplate": "Các hoạt động sắp tới bao gồm: 1) Tập huấn kỹ năng lãnh đạo (15/12), 2) Hội thảo startup (20/12), 3) Gala bế mạc năm (25/12)",
    "priority": 8,
    "type": "faq"
  }' && echo "✓ Done"

echo ""

# Rule 2
echo "📝 Creating Rule 2: giờ đăng ký..."
curl -s -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "giờ đăng ký hoạt động",
    "keywords": ["giờ", "đăng ký", "mở"],
    "responseTemplate": "Thời gian đăng ký hoạt động: Từ 8:00 AM - 5:00 PM hàng ngày, có thể đăng ký qua website hoặc tại quầy tiếp nhận",
    "priority": 8,
    "type": "faq"
  }' && echo "✓ Done"

echo ""

# Rule 3
echo "📝 Creating Rule 3: địa điểm..."
curl -s -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "địa điểm diễn ra hoạt động",
    "keywords": ["địa điểm", "nơi", "tại"],
    "responseTemplate": "Các hoạt động chủ yếu diễn ra tại: Nhà hát A (400 chỗ), Phòng hội họp B (100 chỗ), Sân vận động C",
    "priority": 7,
    "type": "faq"
  }' && echo "✓ Done"

echo ""

# Rule 4
echo "📝 Creating Rule 4: yêu cầu tham gia..."
curl -s -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "yêu cầu tham gia hoạt động",
    "keywords": ["yêu cầu", "điều kiện", "cần"],
    "responseTemplate": "Yêu cầu tham gia: Là sinh viên đang học, có hộp công dân, hoạt động tích cực, không vi phạm kỷ luật",
    "priority": 8,
    "type": "faq"
  }' && echo "✓ Done"

echo ""

# Rule 5
echo "📝 Creating Rule 5: cách đăng ký qua web..."
curl -s -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "cách đăng ký hoạt động qua web",
    "keywords": ["đăng ký", "web", "cách"],
    "responseTemplate": "Cách đăng ký: 1) Đăng nhập tài khoản, 2) Vào mục Hoạt động, 3) Click Đăng ký trên hoạt động muốn tham gia, 4) Xác nhận thông tin và gửi",
    "priority": 9,
    "type": "faq"
  }' && echo "✓ Done"

echo ""

# Rule 6
echo "📝 Creating Rule 6: liên hệ hỗ trợ..."
curl -s -X POST http://localhost:5000/api/chatbot/rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "liên hệ hỗ trợ",
    "keywords": ["liên hệ", "hỗ trợ", "gọi", "email"],
    "responseTemplate": "Liên hệ hỗ trợ: ☎️ 0123-456-789 (8:00-17:00 hàng ngày), 📧 support@university.edu.vn, 📍 Phòng 101, Tòa A",
    "priority": 7,
    "type": "faq"
  }' && echo "✓ Done"

echo ""
echo "✅ All 6 rules created!"
echo ""

# ============================================
# STEP 3: Test Questions (Examples)
# ============================================

echo "🧪 Testing questions..."
echo ""

echo "Q1: Hoạt động sắp tới là gì?"
curl -s -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Hoạt động sắp tới là gì?"}'

echo ""
echo ""

echo "Q2: Giờ đăng ký là mấy giờ?"
curl -s -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Giờ đăng ký hoạt động là mấy giờ?"}'

echo ""
echo ""

echo "Q3: Cách đăng ký qua web?"
curl -s -X POST http://localhost:5000/api/chatbot/ask-anything \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Cách đăng ký hoạt động qua web?"}'

echo ""
echo ""
echo "✅ Test complete!"
echo ""
echo "📊 Check results:"
echo "  - Should see answers (not 'Sorry...')"
echo "  - Confidence should be 80%+"
echo "  - Source should be 'rule'"
echo ""
echo "🌐 Open browser: http://localhost:3000"
echo "   Paste token and start chatting!"
