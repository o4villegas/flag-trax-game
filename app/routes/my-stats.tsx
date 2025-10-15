import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/auth";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/EmptyState";
import { StatsCardSkeleton, FlagListSkeleton } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, Trophy, Target, Plus } from "lucide-react";

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
			<Layout maxWidth="xl">
				<h1 className="text-3xl font-bold mb-6">My Stats</h1>
				<StatsCardSkeleton />
				<div className="mt-8">
					<Card>
						<CardHeader>
							<CardTitle>Loading Flags...</CardTitle>
						</CardHeader>
						<CardContent>
							<FlagListSkeleton count={3} />
						</CardContent>
					</Card>
				</div>
			</Layout>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<Layout maxWidth="xl">
			<h1 className="text-3xl font-bold mb-6">My Stats</h1>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<Card>
					<CardHeader>
						<CardDescription className="flex items-center gap-2">
							<Flag className="h-4 w-4" />
							Flags Owned
						</CardDescription>
						<CardTitle className="text-3xl">
							{stats?.flagsOwned || 0}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription className="flex items-center gap-2">
							<Target className="h-4 w-4" />
							Total Captures
						</CardDescription>
						<CardTitle className="text-3xl">
							{stats?.totalCaptures || 0}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription className="flex items-center gap-2">
							<Trophy className="h-4 w-4" />
							Flags Requested
						</CardDescription>
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
						<EmptyState
							icon={Flag}
							title="No Flags Yet"
							description="You don't own any flags yet. Start by requesting a flag or capturing one from another player!"
							action={{
								label: "Request Your First Flag",
								onClick: () => navigate("/request-flag"),
							}}
						/>
					) : (
						<div className="space-y-2">
							{flags.map((flag) => (
								<Link
									key={flag.id}
									to={`/flag/${flag.flagNumber}`}
									className="block p-4 border border-border rounded-lg hover:border-muted-foreground transition-colors"
								>
									<div className="flex justify-between items-center">
										<div>
											<p className="font-semibold flex items-center gap-2">
												<Flag className="h-4 w-4" />
												Flag #{flag.flagNumber}
											</p>
											<p className="text-sm text-muted-foreground">
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
		</Layout>
	);
}
