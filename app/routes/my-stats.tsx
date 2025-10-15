import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/auth";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MyStats() {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	const [stats, setStats] = useState<any>(null);
	const [flags, setFlags] = useState<any[]>([]);
	const [isFetching, setIsFetching] = useState(true);

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			navigate("/sign-in");
		}
	}, [isAuthenticated, isLoading, navigate]);

	useEffect(() => {
		if (isAuthenticated) {
			fetchData();
		}
	}, [isAuthenticated]);

	const fetchData = async () => {
		try {
			// Fetch stats
			const statsResponse = await fetch("/api/stats/me");
			if (statsResponse.ok) {
				const statsData = await statsResponse.json();
				setStats(statsData.stats);
			}

			// Fetch owned flags
			const flagsResponse = await fetch("/api/flags/mine");
			if (flagsResponse.ok) {
				const flagsData = await flagsResponse.json();
				setFlags(flagsData.flags);
			}
		} catch (error) {
			console.error("Failed to fetch data:", error);
		} finally {
			setIsFetching(false);
		}
	};

	if (isLoading || isFetching) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div>Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="min-h-screen p-4">
			<div className="container mx-auto max-w-4xl pt-8">
				<Link to="/" className="text-blue-500 hover:underline mb-4 block">
					← Back to Home
				</Link>

				<h1 className="text-3xl font-bold mb-6">My Stats</h1>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<Card>
						<CardHeader>
							<CardDescription>Flags Owned</CardDescription>
							<CardTitle className="text-3xl">
								{stats?.flagsOwned || 0}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<CardDescription>Total Captures</CardDescription>
							<CardTitle className="text-3xl">
								{stats?.totalCaptures || 0}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<CardDescription>Flags Requested</CardDescription>
							<CardTitle className="text-3xl">
								{stats?.flagsRequested || 0}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>

				{/* Owned Flags */}
				<Card>
					<CardHeader>
						<CardTitle>Flags You Own</CardTitle>
						<CardDescription>
							These are the flags currently in your possession
						</CardDescription>
					</CardHeader>
					<CardContent>
						{flags.length === 0 ? (
							<p className="text-gray-400 text-center py-8">
								You don't own any flags yet. Start capturing!
							</p>
						) : (
							<div className="space-y-2">
								{flags.map((flag) => (
									<Link
										key={flag.id}
										to={`/flag/${flag.flagNumber}`}
										className="block p-4 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
									>
										<div className="flex justify-between items-center">
											<div>
												<p className="font-semibold">Flag #{flag.flagNumber}</p>
												<p className="text-sm text-gray-400">
													{flag.lastCapturedAt
														? `Last captured: ${new Date(
																flag.lastCapturedAt
															).toLocaleDateString()}`
														: "Never captured"}
												</p>
											</div>
											<Badge>View Details</Badge>
										</div>
									</Link>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
