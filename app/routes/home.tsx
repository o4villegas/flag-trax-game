import { Link } from "react-router";
import type { Route } from "./+types/home";
import { useAuth } from "../context/auth";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Flag, Trophy } from "lucide-react";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Flag Capture Game" },
		{ name: "description", content: "Capture flags, track your journey!" },
	];
}

export default function Home() {
	const { isAuthenticated, isLoading } = useAuth();

	return (
		<Layout maxWidth="2xl">
			{/* Hero Section */}
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="max-w-2xl text-center space-y-6">
					<h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
						Flag Capture Game
					</h1>
					<p className="text-xl text-muted-foreground">
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
								<Button size="lg">
									<Flag className="mr-2 h-5 w-5" />
									Request a Flag
								</Button>
							</Link>
							<Link to="/my-stats">
								<Button size="lg" variant="outline">
									<Trophy className="mr-2 h-5 w-5" />
									View My Stats
								</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</Layout>
	);
}
