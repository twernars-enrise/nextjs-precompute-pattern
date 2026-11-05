import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/i18n";
import { defaultSegment, isSegment, segmentCookie } from "@/segment";

const preferredLocale = (request: NextRequest) => {
  const accepted = request.headers.get("accept-language") ?? "";

  return accepted.toLowerCase().startsWith("fr") ? "fr-BE" : defaultLocale;
};

const targetGroup = (request: NextRequest) => {
  const value = request.cookies.get(segmentCookie)?.value;

  return isSegment(value) ? value : defaultSegment;
};

export function proxy(request: NextRequest) {
  const [, locale, segment, ...rest] = request.nextUrl.pathname.split("/");

  if (!locale || !isLocale(locale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${request.nextUrl.pathname}`;

    return NextResponse.redirect(url);
  }

  // The home page: serve the prerendered variant of the visitor's target group. The browser keeps
  // seeing /<locale>. A proxy runs once per request, so it never sees its own rewrite.
  if (!segment && rest.length === 0) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/${targetGroup(request)}`;

    return NextResponse.rewrite(url);
  }

  // The variant paths are internal. Keep one URL per page, so a CDN cannot cache them separately.
  if (isSegment(segment) && rest.length === 0) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next|favicon.ico).*)"],
};
