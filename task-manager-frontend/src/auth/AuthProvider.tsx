import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AUTH_EXPIRED_EVENT, TOKEN_KEY, authApi, getStoredToken } from "../api";
import { AuthContext } from "./AuthContext";

const saveToken = (token: string | null) => {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {
        // Storage can be unavailable (private mode); the session just won't persist.
    }
};

// Auth state lives in React, so the navbar and routes update the moment
// you log in or out instead of only after a page reload.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(getStoredToken);

    const login = useCallback(async (username: string, password: string) => {
        const newToken = await authApi.login(username, password);
        saveToken(newToken);
        setToken(newToken);
    }, []);

    const logout = useCallback(() => {
        saveToken(null);
        setToken(null);
    }, []);

    useEffect(() => {
        // Fired by the API client when the server rejects the token.
        window.addEventListener(AUTH_EXPIRED_EVENT, logout);

        // Logging out in one tab logs out the others.
        const onStorage = (e: StorageEvent) => {
            if (e.key === TOKEN_KEY) setToken(e.newValue);
        };
        window.addEventListener("storage", onStorage);

        return () => {
            window.removeEventListener(AUTH_EXPIRED_EVENT, logout);
            window.removeEventListener("storage", onStorage);
        };
    }, [logout]);

    const value = useMemo(() => ({ isAuthenticated: Boolean(token), login, logout }), [token, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
