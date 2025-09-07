import { supabase } from './supabaseClient';

export const generateUniqueId = async (prefix = 1, table = 'workers') => {
  let isUnique = false;
  let customId;

  while (!isUnique) {
    const randomPart = Math.floor(1000000 + Math.random() * 9000000); // 7 xonali
    customId = `${prefix}${randomPart}`;

    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('custom_id', customId)
      .maybeSingle();

    if (!data && !error) isUnique = true;
  }

  return customId;
};


export const generateRandomEmail = () => {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${randomString}@calvero.uz`; // misol uchun sizning domeningiz
};