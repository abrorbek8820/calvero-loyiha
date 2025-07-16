import { supabase } from './supabaseClient';

export const generateUniqueId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};


export const generateRandomEmail = () => {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${randomString}@calvero.uz`; // misol uchun sizning domeningiz
};