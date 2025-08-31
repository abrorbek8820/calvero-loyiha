import React from 'react';
import './Yoriqnoma.css';
import { Helmet } from 'react-helmet';

function Yoriqnoma() {
  return (
    <div className="yoriqnoma-container">
      <Helmet>
        <title>Yo‘riqnoma — Calvero Work</title>
      </Helmet>

      <h1>📘 Yo‘riqnoma</h1>
      <p className="intro">
        Albatta, tizim sodda va tushunarli tuzilgan. Lekin ushbu yoʻriqnoma bilan tanishib chiqishingiz 
        yashirin funksiyalarni bilishingiz hamda yanada unumli foydalanishingiz uchun xizmat qiladi.
      </p>

      <h2>🔵 START</h2>
      <p>
        Bu tugma bosilganda sizga <b>5 soatlik vaqt</b> beriladi va shu vaqt ichida siz <b>mijozlar uchun koʻrinasiz</b>.<br />
        Tugmani <b>faqat 1 marta bosish kifoya.</b> Ba'zida internet pastligi sababli bosilmagandek tuyulishi mumkin. 
        Qayta-qayta bosishga hojat yoʻq. Bosing va kutib turing. Agar START ishlamasa: internetni oʻchirib yoqing, sahifani yangilang va qayta kiring.
      </p>

      <h2>🟢 ONLINE</h2>
      <p>
        Agar siz tugma ustida <b>ONLINE</b> yozuvini koʻrayotgan boʻlsangiz — siz onlayn ishchilar roʻyxatidasiz.<br />
        Siz eng yaqin mijozlarga birinchi boʻlib koʻrsatilasiz. Ilovadan chiqib ketishingiz yoki internetni oʻchirishingiz mumkin, 
        baribir mijozlar sizni koʻradi. Ammo ilovada qolishingiz tavsiya qilinadi — chunki chat orqali takliflar tushishi mumkin.
      </p>
      <p>
        Agar ish topsangiz, <b>ONLINE tugmasi ustiga bir marta bosing</b> va statusingizni BAND qiling.
      </p>

      <h2>🔴 BAND</h2>
      <p>
        Bu holatda siz mijozlarga ko‘rinmayapsiz. Bu sizga ish vaqtida bezovta qilinmasligingizni ta’minlaydi.
        Ish tugagach yoki tugashiga oz vaqt qolganda <b>yana ONLINE holatga o‘ting</b> va yangi takliflarni qabul qiling.
      </p>

      <h2>📍 Manzil haqida diqqat!</h2>
      <p>
        Mijozlar faqat siz <b>START bosganingizdagi manzil</b>ni ko‘radi. Agar boshqa joyga borgan bo‘lsangiz, hanuz eski joyda ko‘rinib turasiz.<br />
        <b>Manzilni yangilash uchun:</b> BAND qiling → qayta ONLINE bosing.
      </p>

      <h2>🖼 AVATAR</h2>
      <p>
        Profil rasmini o‘zgartirish uchun profilga kirib, rasm ustiga bosing. Faqat 1 dona rasm saqlanadi.
        Yangi rasm yuklansa, eski avtomatik o‘chadi.
      </p>

      <h2>✍️ O‘zingiz haqingizda</h2>
      <p>
        Profil sahifasida o‘zingiz haqingizda yozing. Masalan:
        <i>"Men professional elektrikman. 10 yil tajriba. Har qanday elektrik xizmatlarini professional bajaraman."</i><br />
        Bu mijozlarda qiziqish va ishonch uyg‘otadi.
      </p>

      <h2>🛠 Tahrirlash</h2>
<p>
  Agar profilingizdagi <b>maʼlumotlarni yoki kasbingizni o‘zgartirmoqchi</b> bo‘lsangiz, 
  <b>“Tahrirlash”</b> tugmasi orqali osonlik bilan yangilashingiz mumkin.
</p>
<p>
  Agar kerakli kasb <b>ro‘yxatda yo‘q</b> bo‘lsa yoki sizda <b>yangi takliflar</b> bo‘lsa, 
  iltimos <b>operatorcalvero@gmail.com</b> manziliga murojaat qiling.
</p>

      <h2>🚪 Tizimdan chiqish</h2>
      <p>
        Telefoningizni almashtirmoqchi bo‘lsangiz, eski telefoningizda tizimdan chiqing. 
        Yangi telefoningizda o‘sha raqam bilan tizimga kirib, ishlashni davom ettiring. 
        Balans va vaqt saqlanib qoladi.
      </p>

      <h2>🗑 Akkauntni oʻchirish</h2>
      <p>
        Agar yangi raqamga o‘tmoqchi bo‘lsangiz va hisobingizda mablag‘ bo‘lsa, 
        <b>operatorcalvero@gmail.com</b> manziliga yozing.  
        Xabarda <b>eski raqam, yangi raqam va hisobdagi mablag‘</b>ni yozing.<br />
        <b>Diqqat:</b> xabar yubormasdan akkauntni oʻchirsangiz, mablag‘ qaytarilmaydi.
      </p>

      <div className="tilak-box">
        <h2>🤝 Tilagimiz</h2>
        <p>
          <b>Sizga omad tilaymiz!</b><br />
          Calvero Work bilan ishingiz <b>barakali</b>, <b>serdaromad</b> va <b>halol mehnatga boy</b> bo‘lsin.<br />
          Biz siz bilan faxrlanamiz. Siz ishlayotganingizda — biz sizga xizmat qilamiz!
        </p>
        <p className="closing">— Calvero jamoasi</p>
      </div>
    </div>
  );
}

export default Yoriqnoma;