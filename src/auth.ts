import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user?.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
  events: {
    // OAuth signups get a generated username; profile can be edited later.
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      const base = (user.email.split("@")[0] ?? "builder")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20) || "builder";
      let username = base;
      for (let i = 0; i < 5; i++) {
        const taken = await prisma.user.findUnique({ where: { username } });
        if (!taken || taken.id === user.id) break;
        username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { username, name: user.name ?? base },
      });
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        });
        token.username = dbUser?.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.username) session.user.username = token.username as string;
      return session;
    },
  },
});
