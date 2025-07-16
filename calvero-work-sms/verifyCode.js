// Bu oddiy vaqtinchalik xotira (RAM) bazasi
const codes = new Map(); // key: phoneNumber, value: { code, expires }

function saveCode(phoneNumber, code) {
  const expires = Date.now() + 5 * 60 * 1000; // 5 daqiqa amal qiladi
  codes.set(phoneNumber, { code, expires });
  console.log(`💾 Kod saqlandi: ${code} → ${phoneNumber}`);
}

function verifyCode(phoneNumber, userCode) {
  const record = codes.get(phoneNumber);

  if (!record) return { success: false, message: 'Kod topilmadi' };
  if (Date.now() > record.expires) return { success: false, message: 'Kod eskirgan' };
  if (record.code !== userCode) return { success: false, message: 'Kod noto‘g‘ri' };

  // Kod to‘g‘ri
  codes.delete(phoneNumber); // faqat bir marta ishlatiladi
  return { success: true, message: '✅ Kod tasdiqlandi' };
}

// Test qilish uchun
const phone = '998935668820';
const testCode = '123456';

saveCode(phone, testCode);

// 3 soniyadan keyin tekshiramiz
setTimeout(() => {
  const result = verifyCode(phone, '123456'); // <- bu yerga foydalanuvchi kiritgan kod
  console.log(result);
}, 3000);