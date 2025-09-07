import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function OnlineStatus() {
  const userPhone = localStorage.getItem('userPhone');

  useEffect(() => {
    const setOnline = async () => {
      await supabase
        .from('workers')
        .update({ is_online: true })
        .eq('phone', userPhone);
    };

    const setOffline = async () => {
      await supabase
        .from('workers')
        .update({ is_online: false })
        .eq('phone', userPhone);
    };

    const handleOnline = () => setOnline();
    const handleOffline = () => setOffline();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleOffline);

    // Sahifa ochilganda avtomatik online qilish
    setOnline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleOffline);
      setOffline();
    };
  }, [userPhone]);

  return null; // Bu komponent UI ga hech narsa qoʻshmaydi
}