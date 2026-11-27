import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// RetroFlow is internal-only, so there is no public landing page:
// signed-in users go straight to the dashboard, everyone else to sign in.
// If the cookie is stale, the dashboard's own auth check sends the user to /login.
export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('retroflow_token')?.value;
  redirect(token ? '/dashboard' : '/login');
}
