'use server';

import { revalidatePath } from 'next/cache';
import { afvis } from '@/lib/uplaceret';

export async function afvisAction(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await afvis(id);
  revalidatePath('/admin/uplacerede');
  revalidatePath('/pipeline');
}
