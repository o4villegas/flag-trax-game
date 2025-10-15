import { useEffect } from "react";
import { Link, useParams } from "react-router";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Trophy, Flag, Home, BarChart3, Sparkles } from "lucide-react";
import type { Route } from "./+types/capture-success";

export default function CaptureSuccess() {
	const { flagNumber } = useParams();

	useEffect(() => {
		// Trigger confetti animation
		const duration = 3000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

		function randomInRange(min: number, max: number) {
			return Math.random() * (max - min) + min;
		}

		const interval: any = setInterval(function () {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			const particleCount = 50 * (timeLeft / duration);

			// Fire confetti from two locations
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
			});
		}, 250);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
			<Card className="max-w-lg w-full border-2 border-primary/20">
				<CardHeader className="text-center pb-2">
					<div className="mb-4 relative">
						<Trophy className="h-20 w-20 mx-auto text-yellow-500 animate-pulse" />
						<Sparkles className="h-8 w-8 absolute top-0 right-1/4 text-yellow-400 animate-pulse" />
						<Sparkles className="h-6 w-6 absolute bottom-0 left-1/4 text-yellow-400 animate-pulse delay-150" />
					</div>
					<CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
						Flag Captured!
					</CardTitle>
					<CardDescription className="text-lg mt-2">
						Congratulations! You've successfully captured
					</CardDescription>
					<div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
						<Flag className="h-5 w-5" />
						<span className="font-bold text-lg">Flag #{flagNumber}</span>
					</div>
				</CardHeader>
				
				<CardContent className="space-y-6 pt-6">
					<div className="text-center space-y-2">
						<p className="text-muted-foreground">
							The flag ownership has been transferred to you.
						</p>
						<p className="text-sm text-muted-foreground">
							Check your stats to see your progress!
						</p>
					</div>

					<div className="grid gap-3">
						<Link to={`/flag/${flagNumber}`}>
							<Button className="w-full" size="lg" variant="default">
								<Flag className="mr-2 h-4 w-4" />
								View Flag Details
							</Button>
						</Link>
						
						<Link to="/my-stats">
							<Button variant="outline" className="w-full" size="lg">
								<BarChart3 className="mr-2 h-4 w-4" />
								View My Stats
							</Button>
						</Link>
						
						<Link to="/">
							<Button variant="ghost" className="w-full" size="lg">
								<Home className="mr-2 h-4 w-4" />
								Back to Home
							</Button>
						</Link>
					</div>

					<div className="text-center pt-4 border-t">
						<p className="text-xs text-muted-foreground">
							Share your achievement with friends!
						</p>
						<div className="flex justify-center gap-2 mt-3">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									navigator.clipboard.writeText(
										`I just captured Flag #${flagNumber} in Flag Capture Game! 🚩`
									);
									// You could add a toast notification here
								}}
							>
								Copy Message
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card>
				<CardHeader>
					<CardTitle>Celebration Error</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4">Something went wrong with the celebration. But you still captured the flag!</p>
					<Link to="/my-stats">
						<Button>View My Stats</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
