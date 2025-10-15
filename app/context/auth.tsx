import { createContext, useContext, type ReactNode, useEffect, useState } from "react";

interface AuthContextType {
	session: any;
	isAuthenticated: boolean;
	isLoading: boolean;
	isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		
		// Dynamic import to avoid SSR issues
		import("../lib/auth.client").then(({ authClient }) => {
			// Get initial session
			authClient.getSession().then((sessionData) => {
				setSession(sessionData);
				setIsLoading(false);
			}).catch(() => {
				setIsLoading(false);
			});

			// Subscribe to session changes
			const unsubscribe = authClient.subscribe((sessionData) => {
				setSession(sessionData);
				setIsLoading(false);
			});

			return () => {
				unsubscribe();
			};
		});
	}, []);

	// Get admin email from environment
	const adminEmail = typeof window !== "undefined" 
		? (window as any).__ADMIN_EMAIL 
		: undefined;

	const isAuthenticated = !!session?.user;
	const isAdmin = isAuthenticated && session?.user?.email === adminEmail;

	// During SSR, provide default values
	if (!mounted) {
		return (
			<AuthContext.Provider
				value={{
					session: null,
					isAuthenticated: false,
					isLoading: true,
					isAdmin: false,
				}}
			>
				{children}
			</AuthContext.Provider>
		);
	}

	return (
		<AuthContext.Provider
			value={{
				session,
				isAuthenticated,
				isLoading,
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
