// Aberdeen AI Gateway — Auth Middleware (Vercel Edge)
// Protects the app with invite codes stored in ABERDEEN_AUTH_CODES env var
// Set ABERDEEN_AUTH_CODES="code1,code2,code3" in Vercel dashboard
// Users authenticate once, token stored in cookie for 30 days
// To disable auth entirely, don't set the env var

import { NextResponse } from 'next/server';

const AUTH_COOKIE = 'aberdeen_auth';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export const config = {
  matcher: ['/((?!api/|_next/|favicon\\.ico).*)'],
};

export default function middleware(req) {
  const authCodes = process.env.ABERDEEN_AUTH_CODES;

  // If no auth codes configured, allow all traffic
  if (!authCodes) return NextResponse.next();

  const validCodes = new Set(
    authCodes.split(',').map(c => c.trim().toLowerCase()).filter(Boolean)
  );
  if (validCodes.size === 0) return NextResponse.next();

  // Check for valid auth cookie
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && validCodes.has(cookie)) {
    return NextResponse.next();
  }
  // Check for code in query param (login link: ?code=xxx)
  const url = new URL(req.url);
  const codeParam = url.searchParams.get('code')?.toLowerCase();
  if (codeParam && validCodes.has(codeParam)) {
    // Valid code — set cookie and redirect to clean URL
    url.searchParams.delete('code');
    const res = NextResponse.redirect(url);
    res.cookies.set(AUTH_COOKIE, codeParam, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return res;
  }

  // No valid auth — show login page
  return new NextResponse(loginPage(), {
    status: 401,
    headers: { 'Content-Type': 'text/html' },
  });
}

function loginPage() {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aberdeen Gateway — Login</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;background:#0a0b0f;color:#e8eaf0;min-height:100vh;display:flex;align-items:center;justify-content:center}
.login{width:100%;max-width:380px;padding:32px;text-align:center}
.logo{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#00d4aa,#00a88a);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:#0a0b0f;margin:0 auto 24px}
h1{font-family:'Instrument Serif',serif;font-size:28px;font-weight:400;margin-bottom:8px}
h1 em{color:#00d4aa;font-style:italic}
p{color:#8b8fa3;font-size:14px;margin-bottom:24px;line-height:1.5}
form{display:flex;flex-direction:column;gap:12px}
input{padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:#12141a;color:#e8eaf0;font-size:16px;font-family:inherit;outline:none;text-align:center;letter-spacing:2px}
input:focus{border-color:rgba(0,212,170,0.4);box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
input::placeholder{color:#555873;letter-spacing:normal}
button{padding:14px;border-radius:10px;border:none;background:#00d4aa;color:#0a0b0f;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer}
button:hover{background:#00e8ba}
.err{color:#ff4d6a;font-size:13px;display:none}
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