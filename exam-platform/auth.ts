import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        identifier: {
          label: "Email / Roll Number",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        console.log("========== AUTHORIZE ==========");

        if (!credentials?.identifier || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const identifier = String(credentials.identifier).trim();
        const password = String(credentials.password);

        console.log("Identifier:", identifier);

        let query = supabaseAdmin.from("users").select("*");

        if (identifier.includes("@")) {
          console.log("Searching by email");
          query = query.eq("email", identifier);
        } else {
          console.log("Searching by roll number");
          query = query.eq("roll_number", identifier);
        }

        const { data: users, error } = await query;

        console.log("Supabase Error:", error);
        console.log("Users:", users);

        if (error) {
          console.error(error);
          return null;
        }

        if (!users || users.length === 0) {
          console.log("❌ User not found");
          return null;
        }

        const user = users[0];

        console.log(
          "Entered Password:",
          JSON.stringify(password)
        );

        console.log(
          "Database Password:",
          JSON.stringify(user.password_hash)
        );

        let isPasswordCorrect = false;

        // Supports both hashed and plain-text passwords
        if (
          user.password_hash.startsWith("$2a$") ||
          user.password_hash.startsWith("$2b$") ||
          user.password_hash.startsWith("$2y$")
        ) {
          console.log("Using bcrypt comparison...");
          isPasswordCorrect = await bcrypt.compare(
            password,
            user.password_hash
          );
        } else {
          console.log("Using plain text comparison...");
          isPasswordCorrect =
            password.trim() === user.password_hash.trim();
        }

        console.log("Password Match:", isPasswordCorrect);

        if (!isPasswordCorrect) {
          console.log("❌ Invalid password");
          return null;
        }

        console.log("✅ Login Success");

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          roll_number: user.roll_number,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.roll_number = (user as any).roll_number;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).roll_number = token.roll_number;
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

  secret:
    process.env.NEXTAUTH_SECRET ||
    "cissikar-auth-secret-key-321-456",
});