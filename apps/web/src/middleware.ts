import { NextResponse } from "next/server";

// Autorise uniquement l'origine de l'API (appels fetch du dashboard) —
// aucune police/image/script externe n'est chargee ailleurs dans l'app
// (next/font/google auto-heberge les polices, pas de next/image externe,
// pas de <script> tiers).
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// 'unsafe-eval' n'est necessaire qu'en dev (React Fast Refresh) — jamais en
// production.
const isDev = process.env.NODE_ENV !== "production";

// script-src reste en 'unsafe-inline' plutot qu'un nonce + 'strict-dynamic' :
// teste en direct (build de prod, `next start`), le nonce genere ici n'est
// pas propage aux chunks/scripts injectes par Turbopack (page blanche,
// tous les scripts bloques) — Next.js documente ce pattern pour Webpack,
// pas Turbopack. 'unsafe-inline' reste une nette amelioration par rapport a
// l'absence totale de CSP, sans le risque de casser l'app.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data:`,
  `font-src 'self' data:`,
  `connect-src 'self' ${API_ORIGIN}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join("; ");

export function middleware() {
  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Exclut les assets statiques Next (_next/static, _next/image) et le
    // favicon — leur poser des headers ne sert a rien et coute une passe
    // de middleware inutile sur chaque fichier.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
