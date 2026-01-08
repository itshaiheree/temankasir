'use server';

import { cookies } from 'next/headers';

export default async function setCookie(hitam, sessionValue) {
  const cookieStore = await cookies(); // ✅ WAJIB await
  cookieStore.set(hitam, sessionValue);
}
