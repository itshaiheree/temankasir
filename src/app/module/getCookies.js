'use server';

import { cookies } from 'next/headers';

export default async function getCookie(hitam) {
  const cookieStore = await cookies(); // ✅ WAJIB await
  const session = cookieStore.get(hitam);

  return session?.value ?? null;
}
