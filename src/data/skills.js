// src/data/skills.js

export const maleSkills = [
  "Barchasini tanlash",
  "Prorab",
  "Universal usta",
  "Svarchik",
  "Argon svarchik",
  "Molyar",
  "Konditsioner ustasi",
  "Santexnik",
  "Plitchik (kafel, cokol, bruschatka)",
  "Kladchik",
  "Eshik-rom ustasi",
  "Tom ustasi",
  "Duradgor",
  "Elektrik",
  "Pogruzchik",
  "Quduq ustasi",
  "Nasos ustasi",
  "Podsobnik (yordamchi)",
  "Dala ishlari",
  "Xar qanday halol ish"
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