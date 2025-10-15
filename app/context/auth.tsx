import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "../lib/auth.client";

interface AuthContextType {
	session: any;
	isAuthenticated: boolean;
	isLoading: boolean;
	isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data: session, isPending } = useSession();

	// Get admin email from environment (will be available via loader if needed)
	const adminEmail =
		typeof window !== "undefined"
			? (window as any).__ADMIN_EMAIL
			: undefined;

	const isAuthenticated = !!session?.user;
	const isAdmin = isAuthenticated && session.user.email === adminEmail;

	return (
		<AuthContext.Provider
			value={{
				session,
				isAuthenticated,
				isLoading: isPending,
				isAdmin,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
