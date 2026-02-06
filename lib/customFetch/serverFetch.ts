import { cookies } from 'next/headers';

export async function serverFetch(url: string, options?: RequestInit) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    
    return fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/backend/api${url}`, {
        ...options,
        headers: {
            ...options?.headers,
            Cookie: cookieHeader,
        },
    });
}