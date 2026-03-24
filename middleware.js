// Aberdeen AI Gateway — Auth Middleware (Vercel Edge)
// Uses Web API (no Next.js dependency)
// Set ABERDEEN_AUTH_CODES="code1,code2,code3" in Vercel dashboard
// To disable auth, don't set the env var

export const config = {
  matcher: ['/((?!api/|_next/|favicon\\.ico|js/).*)'],
};

export default function middleware(req) {
  const authCodes = process.env.ABERDEEN_AUTH_CODES;

  // No auth codes configured — allow all traffic
  if (!authCodes) return;

  const validCodes = new Set(
    authCodes.split(',').map(c => c.trim().toLowerCase()).filter(Boolean)
  );
  if (validCodes.size === 0) return;

  // Parse cookies manually (no next/server)
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }).filter(([k]) => k)
  );
  // Check for valid auth cookie
  const authCookie = cookies['aberdeen_auth'];
  if (authCookie && validCodes.has(authCookie)) return;

  // Check for code in query param (?code=xxx)
  const url = new URL(req.url);
  const codeParam = url.searchParams.get('code')?.toLowerCase();
  if (codeParam && validCodes.has(codeParam)) {
    url.searchParams.delete('code');
    return new Response(null, {
      status: 302,
      headers: {
        'Location': url.toString(),
        'Set-Cookie': `aberdeen_auth=${codeParam}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30*24*60*60}`,
      },
    });
  }

  // No valid auth — return login page
  return new Response(loginPage(), {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function loginPage() {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aberdeen Gateway — Login</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;background:#000000;color:#e8eaf0;min-height:100vh;display:flex;align-items:center;justify-content:center}
.login{width:100%;max-width:380px;padding:32px;text-align:center}
.logo{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#41B6E6,#DB3EB1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:#000;margin:0 auto 24px}
h1{font-size:28px;font-weight:400;margin-bottom:8px}
h1 em{color:#41B6E6;font-style:italic}
p{color:#8b8fa3;font-size:14px;margin-bottom:24px;line-height:1.5}
form{display:flex;flex-direction:column;gap:12px}
input{padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:#0a0a0a;color:#e8eaf0;font-size:16px;font-family:inherit;outline:none;text-align:center;letter-spacing:2px}
input:focus{border-color:rgba(65,182,230,0.4);box-shadow:0 0 0 3px rgba(65,182,230,0.12)}
input::placeholder{color:#555873;letter-spacing:normal}
button{padding:14px;border-radius:10px;border:none;background:#41B6E6;color:#000;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer}
button:hover{background:#5ac4ed}
.err{color:#DB3EB1;font-size:13px;display:none}
</style></head><body>
<div class="login">
<div class="logo">AG</div>
<h1>Aberdeen <em>Gateway</em></h1>
<p>Enter your invite code to access the platform.</p>
<form method="GET" onsubmit="var c=document.getElementById('c').value.trim();if(!c){document.getElementById('e').style.display='block';return false}window.location.href='?code='+encodeURIComponent(c);return false">
<input id="c" type="text" placeholder="Invite code" autocomplete="off" autofocus>
<div id="e" class="err">Please enter a code</div>
<button type="submit">Enter</button>
</form>
<p style="margin-top:24px;font-size:11px">Contact your admin for an invite code</p>
</div></body></html>`;
}
