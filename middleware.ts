import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const [type, credentials] = authHeader.split(" ");
    if (type === "Basic" && credentials) {
      const decoded = atob(credentials);
      const colonIndex = decoded.indexOf(":");
      const username = decoded.slice(0, colonIndex);
      const password = decoded.slice(colonIndex + 1);

      if (
        username === process.env.AUTH_USERNAME &&
        password === process.env.AUTH_PASSWORD
      ) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Be Welly Dashboard"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
