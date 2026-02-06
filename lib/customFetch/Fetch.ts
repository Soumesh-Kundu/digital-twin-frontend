export function Fetch(url: string, options?: RequestInit) {
    return fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/backend/api${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
            ...options?.headers,
        },
        mode: 'cors',
        credentials: 'include',
    });
}

