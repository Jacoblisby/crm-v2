/**
 * better-auth handler — alle /api/auth/* routes.
 * Aktiveres når auth-config'en kan bygges (DATABASE_URL + secrets sat).
 */
import { auth } from '@/lib/auth';

async function handler(req: Request) {
  if (!auth) {
    return new Response('Auth not configured. Set DATABASE_URL + BETTER_AUTH_SECRET.', {
      status: 503,
    });
  }
  return auth.handler(req);
}

export { handler as GET, handler as POST };
