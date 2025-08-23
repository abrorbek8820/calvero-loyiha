// supabase/functions/delete-account/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ReqBody = {
  phone?: string | null;                 // <-- qo'shdik (ixtiyoriy)
  userType?: "worker" | "client" | null; // hozircha ishlatmayapmiz
};

Deno.serve(async (req: Request) => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!url || !anon || !service) return new Response("Missing env", { status: 500 });

    // Foydalanuvchini JWT orqali aniqlash
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: getUserErr } = await userClient.auth.getUser();
    if (getUserErr || !user) return new Response("Unauthorized", { status: 401 });
    const uid = user.id;

    // Body
    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const phone = body?.phone ?? null;

    // Admin client (RLS cheklanmaydi)
    const admin = createClient(url, service);

    // 1) Worker/Client yozuvini olib, avatar_url ni aniqlaymiz
    let avatar_url: string | null = null;

    // Avval phone bo‘yicha urinib ko‘ramiz (senda shunday ishlatiladi)
    if (phone) {
      const { data: wByPhone } = await admin.from("workers")
        .select("avatar_url")
        .eq("phone", phone)
        .maybeSingle();
      if (wByPhone?.avatar_url) avatar_url = wByPhone.avatar_url;
    }

    // Hali topilmasa, auth_user_id bo‘yicha
    if (!avatar_url) {
      const { data: wByUid } = await admin.from("workers")
        .select("avatar_url")
        .eq("auth_user_id", uid)
        .maybeSingle();
      if (wByUid?.avatar_url) avatar_url = wByUid.avatar_url;
    }

    // 2) Storage: avatarni o‘chirish (agar bor bo‘lsa)
    try {
      if (avatar_url) {
        // Public URL’dan eng oxirgi segment — fayl nomi
        const filename = decodeURIComponent(avatar_url.split("/").pop() || "");
        if (filename) {
          // Agar bucket rootida saqlayotgan bo‘lsang, shu yetadi:
          await admin.storage.from("avatars").remove([filename]);

          // Agar kelajakda papkalar ishlatsang (masalan "workers/filename"),
          // unda bazaga to‘liq path saqlashni va shu path bilan remove qilishni tavsiya qilaman.
        }
      }
    } catch (e) {
      console.warn("Storage delete warn:", e);
      // storage xatosi fatal bo‘lmasin
    }

    // 3) DB yozuvlarini tozalash (jadval/ustun nomlarini loyihangga mosla)
    try { await admin.from("messages").delete().or(`sender_id.eq.${uid},receiver_id.eq.${uid}`); } catch {}
    try { await admin.from("chats").delete().or(`user1_id.eq.${uid},user2_id.eq.${uid}`); } catch {}
    try {
      // phone yoki uid bo‘yicha workers yozuvini o‘chiramiz
      if (phone) await admin.from("workers").delete().eq("phone", phone);
      await admin.from("workers").delete().eq("auth_user_id", uid);
    } catch {}
    try {
      if (phone) await admin.from("clients").delete().eq("phone", phone);
      await admin.from("clients").delete().eq("auth_user_id", uid);
    } catch {}
    try { await admin.from("sessions").delete().eq("auth_user_id", uid); } catch {}

    // 4) Auth user’ni o‘chirish (admin REST)
    const resp = await fetch(`${url}/auth/v1/admin/users/${uid}`, {
      method: "DELETE",
      headers: { apiKey: service, Authorization: `Bearer ${service}` },
    });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("Auth delete user failed:", t);
      return new Response("Auth delete failed", { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
});