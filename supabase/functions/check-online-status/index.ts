import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔥 Funksiya har bir chaqiriqqa tayyor client yaratishdan oldin bu log ko‘rinadi
console.log("🟢 check-online-status module loaded");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  console.log("🔔 Function invoked at", new Date().toISOString());
  try {
    const now = new Date();
    console.log("⏱ Current time:", now.toISOString());

    // 1) Onlayn holatdagi ishchilarni o‘qiymiz
    const { data: workers, error: selectErr } = await supabase
      .from("workers")
      .select("phone, online_time")
      .eq("status", "online");

    if (selectErr) {
      console.error("❌ SELECT error:", selectErr.message);
      return new Response("Select error", { status: 500 });
    }
    console.log(`🔍 Found ${workers?.length ?? 0} online workers`);

    let changed = 0;

    // 2) Har bir ishchi uchun vaqt farqini hisoblaymiz (sekundlarda)
    for (const w of workers ?? []) {
      console.log(`• Worker ${w.phone}, online_time ${w.online_time}`);
      const diffSeconds =
        (now.getTime() - new Date(w.online_time).getTime()) / 1000;
      console.log(` → diffSeconds = ${diffSeconds.toFixed(1)}s`);

      // Agar >300s (5 daqiqa) bo‘lsa, holatini o‘zgartiramiz
      if (diffSeconds > 120) {
        const { error: updateErr } = await supabase
          .from("workers")
          .update({ status: "offline", is_listed: false })
          .eq("phone", w.phone);

        if (updateErr) {
          console.error(`❌ UPDATE error for ${w.phone}:, updateErr.message);
        } else {
          console.log(✅ Updated ${w.phone} to offline`);
          changed++;
        }
      }
    }

    console.log(`✅ Total workers updated: ${changed}`);
    return new Response(`OK! ${changed} worker o'chirildi`, {
      status: 200,
    });
  } catch (err) {
    console.error("🚨 Unexpected error:", err);
    return new Response("ERROR: " + (err.message || err), {
      status: 500,
    });
  }
});