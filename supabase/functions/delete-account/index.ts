import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  // PROD domen(lar)ni aniq yozing:
  "Access-Control-Allow-Origin": "https://calvero.work",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

type ReqBody = {
  phone?: string | null;
  userType?: "worker" | "client" | null;
};

Deno.serve(async (req: Request) => {
  // 1) CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!url || !anon || !service) {
      return new Response("Missing env", { status: 500, headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: getUserErr } = await userClient.auth.getUser();
    if (getUserErr || !user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    const uid = user.id;

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const phone = body?.phone ?? null;

    const admin = createClient(url, service);

    // ---- storage: avatar o'chirish (phone/uid orqali topish) ----
    let avatar_url: string | null = null;
    if (phone) {
      const { data } = await admin.from("workers")
        .select("avatar_url").eq("phone", phone).maybeSingle();
      avatar_url = data?.avatar_url ?? null;
    }
    if (!avatar_url) {
      const { data } = await admin.from("workers")
        .select("avatar_url").eq("auth_user_id", uid).maybeSingle();
      avatar_url = data?.avatar_url ?? null;
    }
    try {
      if (avatar_url) {
        const filename = decodeURIComponent(avatar_url.split("/").pop() || "");
        if (filename) await admin.storage.from("avatars").remove([filename]);
      }
    } catch (e) { console.warn("Storage delete warn:", e); }

    // ---- DB tozalash (loyiha nomlariga moslang) ----
    try { await admin.from("messages").delete().or(`sender_id.eq.${uid},receiver_id.eq.${uid}`); } catch {}
    try { await admin.from("chats").delete().or(`user1_id.eq.${uid},user2_id.eq.${uid}`); } catch {}
    try { if (phone) await admin.from("workers").delete().eq("phone", phone); } catch {}
    try { await admin.from("workers").delete().eq("auth_user_id", uid); } catch {}
    try { if (phone) await admin.from("clients").delete().eq("phone", phone); } catch {}
    try { await admin.from("clients").delete().eq("auth_user_id", uid); } catch {}
    try { await admin.from("sessions").delete().eq("auth_user_id", uid); } catch {}

    // ---- auth user'ni o'chirish ----
    const resp = await fetch(`${url}/auth/v1/admin/users/${uid}`, {
      method: "DELETE",
      headers: { apiKey: service, Authorization: `Bearer ${service}` },
    });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("Auth delete user failed:", t);
      return new Response(
        JSON.stringify({ ok: false, step: "auth-delete", detail: t }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("DELETE-ACCOUNT ERROR:", e);
    return new Response(
      JSON.stringify({ ok: false, step: "catch", detail: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});