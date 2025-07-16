const axios = require('axios');

const email = 'abrorbekrahmonov@gmail.com'; // Eskiz login 
const password = 'NeLJZ0Yn9zL9z5QiRUgqd3wGbiVDAz5tF5IggXmY'; // Eskiz API password

const codes = new Map();

async function getToken() { try { const res = await axios.post('https://notify.eskiz.uz/api/auth/login', { email, password, }); return res.data.data.token; } catch (err) { console.error('❌ Token olishda xatolik:', err.response?.data || err.message); throw new Error('Token olishda xatolik'); } }

function generateCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }

function saveCode(phone, code) { const expires = Date.now() + 5 * 60 * 1000;  codes.set(phone, { code, expires }); }

function verifyCode(phone, code) { const record = codes.get(phone);

if (!record) return { success: false, message: 'Kod topilmadi' }; if (Date.now() > record.expires) { codes.delete(phone); return { success: false, message: 'Kod eskirgan' }; } if (record.code !== code) return { success: false, message: 'Kod notoʻgʻri' };

codes.delete(phone); return { success: true, message: 'Kod tasdiqlandi' }; }

async function sendSms(phoneNumber) { const code = generateCode(); console.log('📨 Yuborilayotgan kod:', code);

const token = await getToken(); if (!token) throw new Error('Token olinmadi');

try { const res = await axios.post( 'https://notify.eskiz.uz/api/message/sms/send', { mobile_phone: phoneNumber, message: 'Bu Eskiz dan test', from: '4546', }, { headers: { Authorization: `Bearer ${token}`, }, } );

console.log('✅ SMS yuborildi:', res.data);

// Kodni saqlaymiz
saveCode(phoneNumber, code);

return { code, eskiz: res.data };

} catch (err) { console.error('❌ SMS yuborishda xatolik:', err.response?.data || err.message); throw new Error('SMS yuborishda xatolik'); } }

module.exports = { sendSms, verifyCode };