import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: { institution: true },
        });

        if (!user || !user.isActive) return null;

        const isValid = await compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          institutionId: user.institutionId,
          institutionName: user.institution?.name || null,
          institutionLogo: user.institution?.logoUrl || null,
          institutionAccent: user.institution?.accentColor || "#2563eb",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.institutionId = (user as any).institutionId;
        token.institutionName = (user as any).institutionName;
        token.institutionLogo = (user as any).institutionLogo;
        token.institutionAccent = (user as any).institutionAccent;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).institutionId = token.institutionId;
        (session.user as any).institutionName = token.institutionName;
        (session.user as any).institutionLogo = token.institutionLogo;
        (session.user as any).institutionAccent = token.institutionAccent;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || "okit-ltms-secret-key-change-in-production",
});
