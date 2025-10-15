import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/request-flag";
import { useAuth } from "../context/auth";
import { Layout } from "@/components/Layout";
import { RequestListSkeleton } from "@/components/LoadingStates";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Flag, Send, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function RequestFlag() {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	const [requests, setRequests] = useState<any[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isFetching, setIsFetching] = useState(true);

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			navigate("/sign-in");
		}
	}, [isAuthenticated, isLoading, navigate]);

	useEffect(() => {
		if (isAuthenticated) {
			fetchRequests();
		}
	}, [isAuthenticated]);

	const fetchRequests = async () => {
		try {
			const response = await fetch("/api/flag-requests");
			if (response.ok) {
				const data = await response.json();
				setRequests(data.requests);
			}
		} catch (error) {
			console.error("Failed to fetch requests:", error);
		} finally {
			setIsFetching(false);
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			const response = await fetch("/api/flag-requests", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				toast.success("Flag request submitted successfully!");
				fetchRequests();
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to submit request");
			}
		} catch (error) {
			console.error("Request error:", error);
			toast.error("Failed to submit request");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading || isFetching) {
		return (
			<Layout maxWidth="lg">
				<Card>
					<CardHeader>
						<CardTitle>Request a Flag</CardTitle>
						<CardDescription>Loading your request history...</CardDescription>
					</CardHeader>
					<CardContent>
						<RequestListSkeleton count={3} />
					</CardContent>
				</Card>
			</Layout>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	const hasPendingRequest = requests.some((r) => r.status === "pending");
	const hasNoRequests = requests.length === 0;

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "approved":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "rejected":
				return <XCircle className="h-4 w-4 text-red-500" />;
			case "pending":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			default:
				return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const getStatusStyles = (status: string) => {
		switch (status) {
			case "approved":
				return "bg-green-900/30 text-green-400 border-green-800";
			case "rejected":
				return "bg-red-900/30 text-red-400 border-red-800";
			case "pending":
				return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	return (
		<Layout maxWidth="lg">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Flag className="h-5 w-5" />
						Request a Flag
					</CardTitle>
					<CardDescription>
						Request a physical flag to be printed and mailed to you
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Request Button/Status */}
					{hasPendingRequest ? (
						<div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
							<div className="flex items-start gap-3">
								<Clock className="h-5 w-5 text-yellow-400 mt-0.5" />
								<div>
									<p className="text-yellow-400 font-medium">
										Request Pending
									</p>
									<p className="text-sm text-yellow-400/80 mt-1">
										You already have a pending flag request. An admin will review and approve your request soon.
									</p>
								</div>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div className="p-4 bg-muted/50 rounded-lg">
								<p className="text-sm text-muted-foreground">
									Submit a request to receive a physical flag. Once approved by an admin, you'll receive a unique flag with a QR code that others can scan to capture.
								</p>
							</div>
							<Button
								onClick={handleSubmit}
								disabled={isSubmitting}
								className="w-full"
								size="lg"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Submitting Request...
									</>
								) : (
									<>
										<Send className="mr-2 h-4 w-4" />
										Submit Flag Request
									</>
								)}
							</Button>
						</div>
					)}

					{/* Request History */}
					{requests.length > 0 && (
						<div className="space-y-4">
							<div>
								<h3 className="font-semibold mb-3 flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Request History
								</h3>
								<div className="space-y-2">
									{requests.map((request) => (
										<div
											key={request.id}
											className={`p-4 border rounded-lg flex justify-between items-center ${
												request.status === "pending" 
													? "border-yellow-800 bg-yellow-900/10" 
													: "border-border"
											}`}
										>
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													{getStatusIcon(request.status)}
													<p className="font-medium capitalize">
														{request.status}
													</p>
												</div>
												<p className="text-sm text-muted-foreground">
													Requested: {new Date(request.requestedAt).toLocaleDateString()}
												</p>
												{request.processedAt && (
													<p className="text-xs text-muted-foreground">
														Processed: {new Date(request.processedAt).toLocaleDateString()}
													</p>
												)}
											</div>
											<span
												className={`px-3 py-1 rounded-full text-xs border ${getStatusStyles(
													request.status
												)}`}
											>
												{request.status}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Empty State */}
					{hasNoRequests && !hasPendingRequest && (
						<EmptyState
							icon={Flag}
							title="No Flag Requests Yet"
							description="Request your first flag to start playing! Once approved, you'll receive a unique physical flag."
							action={{
								label: "Submit Your First Request",
								onClick: handleSubmit,
							}}
						/>
					)}
				</CardContent>
			</Card>
		</Layout>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	return (
		<Layout maxWidth="lg">
			<Card>
				<CardHeader>
					<CardTitle>Error</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4">Failed to load flag requests. Please try again.</p>
					<Button onClick={() => window.location.reload()}>Retry</Button>
				</CardContent>
			</Card>
		</Layout>
	);
}
