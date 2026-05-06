import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: [
    // Protect all app routes except auth and cron
    '/((?!auth|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)',
  ],
};
