import { Link } from "react-router";
import type { Route } from "./+types/home";
import { useAuth } from "../context/auth";
import { signOut } from "../lib/auth.client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Flag Capture Game" },
		{ name: "description", content: "Capture flags, track your journey!" },
	];
}

export default function Home() {
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
		<div className="min-h-screen flex flex-col">
			{/* Navigation */}
			<nav className="border-b border-gray-800">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<Link to="/" className="text-xl font-bold">
							Flag Capture
						</Link>

						<div className="flex items-center gap-4">
							{isLoading ? (
								<div className="text-sm text-gray-400">Loading...</div>
							) : isAuthenticated ? (
								<>
									<span className="text-sm text-gray-400">
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
									<Button
										variant="outline"
										size="sm"
										onClick={handleSignOut}
									>
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

			{/* Hero Section */}
			<main className="flex-1 flex items-center justify-center p-4">
				<div className="max-w-2xl text-center space-y-6">
					<h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
						Flag Capture Game
					</h1>
					<p className="text-xl text-gray-400">
						Request physical flags, find them in the wild, capture them with
						QR codes, and track your journey!
					</p>

					{!isAuthenticated && !isLoading && (
						<div className="flex gap-4 justify-center pt-4">
							<Link to="/sign-up">
								<Button size="lg">Get Started</Button>
							</Link>
							<Link to="/sign-in">
								<Button size="lg" variant="outline">
									Sign In
								</Button>
							</Link>
						</div>
					)}

					{isAuthenticated && (
						<div className="flex gap-4 justify-center pt-4">
							<Link to="/request-flag">
								<Button size="lg">Request a Flag</Button>
							</Link>
							<Link to="/my-stats">
								<Button size="lg" variant="outline">
									View My Stats
								</Button>
							</Link>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
