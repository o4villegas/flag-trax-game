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
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="max-w-lg w-full">
				<CardHeader className="text-center">
					<div className="mb-4 text-6xl">🎉</div>
					<CardTitle className="text-3xl">Flag Captured!</CardTitle>
					<CardDescription className="text-lg">
						Congratulations! You've successfully captured Flag #{flagNumber}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-center text-gray-400">
						The flag ownership has been transferred to you. Check your stats to
						see your progress!
					</p>
					<div className="flex flex-col gap-2">
						<Link to={`/flag/${flagNumber}`}>
							<Button className="w-full">View Flag Details</Button>
						</Link>
						<Link to="/my-stats">
							<Button variant="outline" className="w-full">
								View My Stats
							</Button>
						</Link>
						<Link to="/">
							<Button variant="ghost" className="w-full">
								Back to Home
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
