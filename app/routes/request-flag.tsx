import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/request-flag";
import { useAuth } from "../context/auth";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

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
			<div className="min-h-screen flex items-center justify-center">
				<div>Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	const hasPendingRequest = requests.some((r) => r.status === "pending");

	return (
		<div className="min-h-screen p-4">
			<div className="container mx-auto max-w-2xl pt-8">
				<Link to="/" className="text-blue-500 hover:underline mb-4 block">
					← Back to Home
				</Link>

				<Card>
					<CardHeader>
						<CardTitle>Request a Flag</CardTitle>
						<CardDescription>
							Request a physical flag to be printed and mailed to you
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{hasPendingRequest ? (
							<div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
								<p className="text-yellow-400">
									You already have a pending flag request. Please wait for
									admin approval.
								</p>
							</div>
						) : (
							<div className="space-y-4">
								<p className="text-gray-400">
									Submit a request to receive a physical flag. An admin will
									review and approve your request.
								</p>
								<Button
									onClick={handleSubmit}
									disabled={isSubmitting}
									className="w-full"
								>
									{isSubmitting ? "Submitting..." : "Submit Flag Request"}
								</Button>
							</div>
						)}

						{/* Request History */}
						{requests.length > 0 && (
							<div className="mt-8">
								<h3 className="font-semibold mb-4">Request History</h3>
								<div className="space-y-2">
									{requests.map((request) => (
										<div
											key={request.id}
											className="p-3 border border-gray-800 rounded-lg flex justify-between items-center"
										>
											<div>
												<p className="text-sm text-gray-400">
													Requested:{" "}
													{new Date(request.requestedAt).toLocaleDateString()}
												</p>
												{request.processedAt && (
													<p className="text-xs text-gray-500">
														Processed:{" "}
														{new Date(request.processedAt).toLocaleDateString()}
													</p>
												)}
											</div>
											<span
												className={`px-3 py-1 rounded-full text-xs ${
													request.status === "approved"
														? "bg-green-900/30 text-green-400"
														: request.status === "rejected"
															? "bg-red-900/30 text-red-400"
															: "bg-yellow-900/30 text-yellow-400"
												}`}
											>
												{request.status}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
