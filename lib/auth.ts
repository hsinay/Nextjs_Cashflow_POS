// lib/auth.ts

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      roles: string[];
      permissions: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
  }
}

/**
 * NextAuth configuration with Credentials provider
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'Enter username' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password are required');
        }

        try {
          // Find user by username or email
          // @ts-ignore - Prisma types out of sync with schema
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: credentials.username.toLowerCase() },
                { email: credentials.username.toLowerCase() },
              ],
            },
            include: {
              roles: {
                include: {
                  role: true,
                },
              },
            },
          });

          if (!user) {
            throw new Error('Invalid credentials');
          }

          // @ts-ignore
          if (!user.isActive) {
            throw new Error('Your account has been deactivated');
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            throw new Error('Invalid credentials');
          }

          // Update last login time
          // @ts-ignore
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Collect all permissions from roles
          const permissions: string[] = [];
          const userRoles = user.roles as Array<{ role: { permissions: unknown } }>;
          userRoles.forEach((userRole) => {
            if (userRole.role?.permissions && Array.isArray(userRole.role.permissions)) {
              permissions.push(...(userRole.role.permissions as string[]));
            }
          });

          // Return user object for token
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            roles: (user.roles as Array<{ role: { name: string } }>).map((ur) => ur.role.name),
            permissions: [...new Set(permissions)], // Remove duplicates
          };
        } catch (error) {
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    /**
     * JWT callback - called when JWT is created or updated
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // User just signed in
        token.userId = user.id;
        token.username = (user as any).username;
        token.roles = (user as any).roles || [];
        token.permissions = (user as any).permissions || [];
      }

      // Handle session update (e.g., password change)
      if (trigger === 'update' && session) {
        token.permissions = session.permissions || token.permissions;
      }

      return token;
    },

    /**
     * Session callback - called when session is used
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.username = token.username;
        session.user.roles = token.roles;
        session.user.permissions = token.permissions;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update every day
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  events: {
    /**
     * Log sign in events
     */
    async signIn({ user }) {
      console.log(`User signed in: ${(user as any).username}`);
    },

    /**
     * Log sign out events
     */
    async signOut() {
      console.log('User signed out');
    },
  },

  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
};

