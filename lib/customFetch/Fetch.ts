export function Fetch(url: string, options?: RequestInit) {
    return fetch(`/backend/api${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
            ...options?.headers,
        },
        mode: 'cors',
        credentials: 'include',
    });
}

