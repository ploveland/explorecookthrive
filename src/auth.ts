import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";
import { AUTH_NEXT_COOKIE } from "@/server/accounts/constants";
import { googleAuthConfigured, resolveGoogleLogin } from "@/server/accounts/google";
import { getUserByGoogleId, verifyUser } from "@/server/accounts/users";
import { env } from "@/server/env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: env("AUTH_SECRET") || "ect-local-dev-secret-change-me",
  session: { strategy: "jwt" },
  pages: { signIn: "/signin", error: "/signin" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        const user = await verifyUser(email, password);
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    ...(googleAuthConfigured()
      ? [
          Google({
            clientId: env("AUTH_GOOGLE_ID"),
            clientSecret: env("AUTH_GOOGLE_SECRET"),
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const jar = await cookies();
      const next = jar.get(AUTH_NEXT_COOKIE)?.value ?? null;
      jar.delete({ name: AUTH_NEXT_COOKIE, path: "/" });

      const result = await resolveGoogleLogin(
        {
          sub: account.providerAccountId,
          email: user.email,
          email_verified: (profile as { email_verified?: boolean | string } | undefined)?.email_verified,
          name: user.name,
        },
        { next },
      );

      if (result.status === "ok") return true;
      if (result.status === "link") {
        return `/signin/connect-google?token=${encodeURIComponent(result.token)}`;
      }
      return `/signin?reason=google_${result.reason}`;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        const kitchen = await getUserByGoogleId(account.providerAccountId);
        if (!kitchen) {
          throw new Error("Google kitchen was not created.");
        }
        token.sub = kitchen.id;
        token.email = kitchen.email;
        token.name = kitchen.name;
        return token;
      }
      if (user?.id) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = (token.email as string) ?? "";
        session.user.name = (token.name as string) ?? "";
      }
      return session;
    },
  },
});
