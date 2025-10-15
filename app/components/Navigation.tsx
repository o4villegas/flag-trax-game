import { Link } from "react-router";
import { useAuth } from "../context/auth";
import { signOut } from "../lib/auth.client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Navigation() {
	const { isAuthenticated, session, isAdmin, isLoading } = useAuth();

	const handleSignOut = async () => {
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					toast.success("Signed out successfully");
				},
			},
		});
	};

	return (
		<nav className="border-b border-border">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<Link to="/" className="text-xl font-bold">
						Flag Capture
					</Link>

					<div className="flex items-center gap-4">
						{isLoading ? (
							<div className="text-sm text-muted-foreground">Loading...</div>
						) : isAuthenticated ? (
							<>
								<span className="text-sm text-muted-foreground">
									{session?.user?.name || session?.user?.email}
								</span>
								<Link to="/my-stats">
									<Button variant="ghost" size="sm">
										My Stats
									</Button>
								</Link>
								<Link to="/request-flag">
									<Button variant="ghost" size="sm">
										Request Flag
									</Button>
								</Link>
								{isAdmin && (
									<Link to="/admin">
										<Button variant="ghost" size="sm">
											Admin
										</Button>
									</Link>
								)}
								<Button variant="outline" size="sm" onClick={handleSignOut}>
									Sign Out
								</Button>
							</>
						) : (
							<>
								<Link to="/sign-in">
									<Button variant="ghost" size="sm">
										Sign In
									</Button>
								</Link>
								<Link to="/sign-up">
									<Button size="sm">Sign Up</Button>
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
