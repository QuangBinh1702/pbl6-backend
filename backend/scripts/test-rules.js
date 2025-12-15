/**
 * Test Chatbot Rules - No dependencies needed
 * Run: node test-rules.js
 */

const http = require('http');

// Config
const API_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Helper to make HTTP requests
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Main test flow
async function runTests() {
  console.log('\n📋 Getting token...\n');
  
  try {
    // Step 1: Login
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!loginRes.data.data?.token) {
      console.error('❌ Could not get token');
      console.error('Response:', loginRes.data);
      return;
    }

    const TOKEN = loginRes.data.data.token;
    console.log(`✅ Token: ${TOKEN.substring(0, 20)}...`);
    console.log('');

    // Step 2: Seed 6 rules
    console.log('🌱 Seeding rules...\n');

    const rules = [
      {
        pattern: "hoạt động sắp tới",
        keywords: ["hoạt động", "sắp tới", "tới"],
        responseTemplate: "Các hoạt động sắp tới bao gồm: 1) Tập huấn kỹ năng lãnh đạo (15/12), 2) Hội thảo startup (20/12), 3) Gala bế mạc năm (25/12)",
        priority: 8,
        type: "faq"
      },
      {
        pattern: "giờ đăng ký hoạt động",
        keywords: ["giờ", "đăng ký", "mở"],
        responseTemplate: "Thời gian đăng ký hoạt động: Từ 8:00 AM - 5:00 PM hàng ngày, có thể đăng ký qua website hoặc tại quầy tiếp nhận",
        priority: 8,
        type: "faq"
      },
      {
        pattern: "địa điểm diễn ra hoạt động",
        keywords: ["địa điểm", "nơi", "tại"],
        responseTemplate: "Các hoạt động chủ yếu diễn ra tại: Nhà hát A (400 chỗ), Phòng hội họp B (100 chỗ), Sân vận động C",
        priority: 7,
        type: "faq"
      },
      {
        pattern: "yêu cầu tham gia hoạt động",
        keywords: ["yêu cầu", "điều kiện", "cần"],
        responseTemplate: "Yêu cầu tham gia: Là sinh viên đang học, có hộp công dân, hoạt động tích cực, không vi phạm kỷ luật",
        priority: 8,
        type: "faq"
      },
      {
        pattern: "cách đăng ký hoạt động qua web",
        keywords: ["đăng ký", "web", "cách"],
        responseTemplate: "Cách đăng ký: 1) Đăng nhập tài khoản, 2) Vào mục Hoạt động, 3) Click Đăng ký trên hoạt động muốn tham gia, 4) Xác nhận thông tin và gửi",
        priority: 9,
        type: "faq"
      },
      {
        pattern: "liên hệ hỗ trợ",
        keywords: ["liên hệ", "hỗ trợ", "gọi", "email"],
        responseTemplate: "Liên hệ hỗ trợ: ☎️ 0123-456-789 (8:00-17:00 hàng ngày), 📧 support@university.edu.vn, 📍 Phòng 101, Tòa A",
        priority: 7,
        type: "faq"
      }
    ];

    let rulesCreated = 0;
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      console.log(`📝 Creating Rule ${i + 1}: ${rule.pattern}...`);
      
      const res = await makeRequest('POST', '/api/chatbot/rules', rule, TOKEN);
      
      if (res.status === 201 && res.data.data?._id) {
        console.log(`✓ Created (ID: ${res.data.data._id})`);
        rulesCreated++;
      } else {
        console.log(`✗ Failed (Status: ${res.status})`);
        console.log(`  Response:`, res.data);
      }
      console.log('');
    }

    console.log(`✅ ${rulesCreated}/${rules.length} rules created!\n`);

    // Step 3: Test questions
    console.log('🧪 Testing questions...\n');

    const questions = [
      "Hoạt động sắp tới là gì?",
      "Giờ đăng ký hoạt động là mấy giờ?",
      "Cách đăng ký hoạt động qua web?"
    ];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`Q${i + 1}: ${q}`);
      
      const res = await makeRequest('POST', '/api/chatbot/ask-anything', { question: q }, TOKEN);
      
      if (res.data.success && res.data.data) {
        console.log(`Answer: ${res.data.data.answer}`);
        console.log(`Confidence: ${(res.data.data.confidence * 100).toFixed(0)}%`);
        console.log(`Source: ${res.data.data.source}`);
      } else {
        console.log(`✗ Failed:`, res.data);
      }
      console.log('');
    }

    console.log('✅ Test complete!\n');
    console.log('📊 Summary:');
    console.log(`  - Rules created: ${rulesCreated}/6`);
    console.log(`  - Questions tested: ${questions.length}`);
    console.log('');
    console.log('🌐 Open browser: http://localhost:3000');
    console.log('   Paste token and start chatting!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Run
runTests();
