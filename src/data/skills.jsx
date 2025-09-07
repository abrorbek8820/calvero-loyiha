// src/data/skills.js

export const maleSkills = [
  "Alyukabond ustasi",
  "Ariston ustasi",
  "Argon svarchik",
  "Avto eshik ochish",
  "Dala ishlari",
  "Duradgor",
  "Elektrik",
  "Eshik ochish, zamok ustasi",
  "Eshik-rom ustasi",
  "Gaz plita ustasi",
  "Gilam yuvish",
  "Instruktor",
  "Karcher ustasi",
  "Kirmoshina ustasi",
  "Kladchik",
  "Kompyuter ustasi",
  "Konditsioner ustasi",
  "Kotyol ustasi",
  "Kuzatuv kamera ustasi",
  "Lazer xizmati",
  "Mebel ustasi",
  "Molyar",
  "Nalivnoy pol ustasi",
  "Nasos ustasi",
  "O‘ra kavlovchi",
  "Plitchik kafel",
  "Plitchik tsokol",
  "Podsobnik (yordamchi)",
  "Pogruzchik",
  "Prorab",
  "Quduq ustasi",
  "Quyosh panellari ustasi",
  "Santexnik",
  "Svarchik",
  "Toker",
  "Tom ustasi",
  "Universal usta",
  "Wi-Fi ustasi",
  "Xar qanday halol ish",
  "Xolodelnik ustasi",
  "Zina ustasi"
];

export const femaleSkills = [
  "Barchasini tanlash",
  "Buhgalter",
  "Hamshira",
  "Sartarosh",
  "Dizayner",
  "Dekorator",
  "Oshpaz",
  "Tikuvchi",
  "Enaga",
  "Sidelka",
  "Posuda moyka",
  "Farrosh",
  "Dala ishlari",
  "Xar qanday halol ish"
];

export const allSkills = Array.from(
  new Set([...maleSkills, ...femaleSkills].filter(skill => skill !== "Barchasini tanlash"))
);