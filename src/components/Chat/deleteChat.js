import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async (req, res) => {
  const { chat_id } = req.body;

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chat_id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({ success: true });
};