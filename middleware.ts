import NextAuth from "next-auth";

import { authConfig } from "@/app/(auth)/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/chat", "/:id", "/api/chat", "/api/chat/:path*",  "/login", "/flight/edit", "/train/edit"],
};
