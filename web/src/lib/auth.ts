import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { isDatabaseConfigured, isDemoAuthEnabled } from "./config";
import { touchUserSession } from "./session";

async function upsertUserProfile(params: {
  loginId: string;
  email: string;
  name: string | null | undefined;
  pictureUrl: string | null | undefined;
  authProvider: string;
}) {
  const now = new Date();
  const { loginId, email, name, pictureUrl, authProvider } = params;

  if (!isDatabaseConfigured()) {
    return null;
  }

  let dbUser = await prisma.users.findFirst({
    where: { OR: [{ google_sub: loginId }, { email }] },
  });

  try {
  if (!dbUser) {
    dbUser = await prisma.users.create({
      data: {
        email,
        google_sub: loginId,
        name: name ?? null,
        picture_url: pictureUrl ?? null,
        created_at: now,
        updated_at: now,
        last_login_at: now,
      },
    });
  } else {
    dbUser = await prisma.users.update({
      where: { id: dbUser.id },
      data: {
        google_sub: loginId,
        email,
        name: name ?? dbUser.name,
        picture_url: pictureUrl ?? dbUser.picture_url,
        updated_at: now,
        last_login_at: now,
      },
    });
  }

  await touchUserSession(dbUser.id, authProvider);
  return dbUser;
  } catch (error) {
    console.error("[auth] MySQL upsert failed:", error);
    throw error;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      id: "demo",
      name: "Demo",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!isDemoAuthEnabled()) return null;

        const email = credentials?.email?.trim().toLowerCase() || "demo@example.com";
        const name = credentials?.name?.trim() || "Demo User";
        const loginId = `demo:${email}`;

        const dbUser = await upsertUserProfile({
          loginId,
          email,
          name,
          pictureUrl: null,
          authProvider: "demo",
        });

        return {
          id: dbUser ? String(dbUser.id) : loginId,
          email,
          name,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "demo") return true;
      if (!user.email) return false;

      await upsertUserProfile({
        loginId: (profile as { sub?: string })?.sub || user.id,
        email: user.email,
        name: user.name,
        pictureUrl: user.image,
        authProvider: "google",
      });
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.email) {
        token.email = user.email;
      }
      if (account?.provider === "demo" && user?.email) {
        token.demo = true;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user?.email && token.email) {
        session.user.email = token.email as string;
      }

      if (session.user?.email && isDatabaseConfigured()) {
        const dbUser = await prisma.users.findUnique({
          where: { email: session.user.email },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.name = dbUser.name ?? session.user.name;
          session.user.image = dbUser.picture_url ?? session.user.image;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};
