import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ profile }) {
      // Restrict to specific email domains for internal use
      const email = profile?.email ?? '';
      const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? 'honeycombcredit.com').split(',');
      return allowedDomains.some((domain) => email.endsWith(`@${domain.trim()}`));
    },
    async session({ session }) {
      return session;
    },
  },
});

export { handler as GET, handler as POST };
