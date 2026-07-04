export async function onRequestGet(context: { env?: Record<string, string> }) {
  return new Response(JSON.stringify({
    ok: true,
    biliLoggedIn: !!context.env?.BILI_SESSDATA
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}