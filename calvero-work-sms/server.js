const express = require('express');
const cors = require('cors');
const { sendSms, verifyCode } = require('./sendSms');

const app = express();

app.use(cors());
app.use(express.json());

// SMS yuborish uchun endpoint
app.post('/api/send-sms', async (req, res) => {
  const { phone } = req.body;
  console.log('📲 SMS yuborish uchun raqam keldi:', phone);

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Telefon raqam kerak' });
  }

  try {
    const result = await sendSms(phone);
    res.json({ success: true, message: 'Kod yuborildi', code: result.code });
  } catch (error) {
    console.error('❌ SMS yuborishda xatolik backendda:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kodni tekshirish uchun endpoint
app.post('/api/verify-code', (req, res) => {
  const { phone, code } = req.body;

  console.log('Backendga kelgan malumotlar:', { phone, code });

  if (!phone || !code) {
    return res.status(400).json({ success: false, message: "Ma'lumotlar to'liq emas" });
  }

  const result = verifyCode(phone, code);

  if (!result.success) {
    console.log('Kod tekshirishda xatolik:', result);
    return res.status(400).json(result);
  }
  console.log('Kod muvaffaqiyatli tasdiqlandi:', result);

  res.json(result);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server http://localhost:${PORT} da ishga tushdi`);
});