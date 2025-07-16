const axios = require('axios');

const email = 'abrorbek8820@gmail.com'; // ← Eskiz login
const password = 'ufNyR6xsEpK836ssqw3XP1EKP4A5MN16r7bgQfM8'; // ← Eskiz paroling (Sekretniy klyuch)

// Token olish
async function getToken() {
  try {
    const res = await axios.post('https://notify.eskiz.uz/api/auth/login', {
      email,
      password,
    });

    const token = res.data.data.token;
    console.log('✅ TOKEN:', token);
    return token;
  } catch (err) {
    console.error('❌ Xatolik:', err.response?.data || err.message);
  }
}

getToken();