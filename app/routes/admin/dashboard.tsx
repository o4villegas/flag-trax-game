import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/auth";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import QRCode from "qrcode";

export default function AdminDashboard() {
	const { isAuthenticated, isAdmin, isLoading } = useAuth();
	const navigate = useNavigate();

	const [requests, setRequests] = useState<any[]>([]);
	const [flags, setFlags] = useState<any[]>([]);
	const [captures, setCaptures] = useState<any[]>([]);
	const [isFetching, setIsFetching] = useState(true);

	// QR Code state
	const [showQRDialog, setShowQRDialog] = useState(false);
	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const [currentFlagNumber, setCurrentFlagNumber] = useState<number | null>(
		null
	);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!isLoading && (!isAuthenticated || !isAdmin)) {
			navigate("/");
			toast.error("Access denied");
		}
	}, [isAuthenticated, isAdmin, isLoading, navigate]);

	useEffect(() => {
		if (isAuthenticated && isAdmin) {
			fetchData();
		}
	}, [isAuthenticated, isAdmin]);

	const fetchData = async () => {
		try {
			// Fetch flag requests
			const requestsRes = await fetch("/api/admin/flag-requests");
			if (requestsRes.ok) {
				const data = await requestsRes.json();
				setRequests(data.requests);
			}

			// Fetch all flags
			const flagsRes = await fetch("/api/admin/flags");
			if (flagsRes.ok) {
				const data = await flagsRes.json();
				setFlags(data.flags);
			}

			// Fetch all captures
			const capturesRes = await fetch("/api/admin/captures");
			if (capturesRes.ok) {
				const data = await capturesRes.json();
				setCaptures(data.captures);
			}
		} catch (error) {
			console.error("Failed to fetch admin data:", error);
			toast.error("Failed to load admin data");
		} finally {
			setIsFetching(false);
		}
	};

	const handleApprove = async (requestId: number) => {
		try {
			const response = await fetch(
				`/api/admin/flag-requests/${requestId}/approve`,
				{
					method: "POST",
				}
			);

			if (response.ok) {
				const data = await response.json();
				toast.success(`Flag request approved! Flag #${data.flagNumber} created`);

				// Show QR code dialog
				await generateQRCode(data.flagNumber);

				// Refresh data
				fetchData();
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to approve request");
			}
		} catch (error) {
			console.error("Approve error:", error);
			toast.error("Failed to approve request");
		}
	};

	const handleReject = async (requestId: number) => {
		try {
			const response = await fetch(
				`/api/admin/flag-requests/${requestId}/reject`,
				{
					method: "POST",
				}
			);

			if (response.ok) {
				toast.success("Flag request rejected");
				fetchData();
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to reject request");
			}
		} catch (error) {
			console.error("Reject error:", error);
			toast.error("Failed to reject request");
		}
	};

	const handleDeleteFlag = async (flagId: number, flagNumber: number) => {
		if (
			!confirm(
				`Are you sure you want to delete Flag #${flagNumber}? This will also delete all associated captures.`
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/flags/${flagId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success(`Flag #${flagNumber} deleted`);
				fetchData();
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to delete flag");
			}
		} catch (error) {
			console.error("Delete flag error:", error);
			toast.error("Failed to delete flag");
		}
	};

	const handleDeleteCapture = async (captureId: number) => {
		if (
			!confirm(
				"Are you sure you want to delete this capture? Flag ownership will revert to the previous owner."
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/captures/${captureId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Capture deleted");
				fetchData();
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to delete capture");
			}
		} catch (error) {
			console.error("Delete capture error:", error);
			toast.error("Failed to delete capture");
		}
	};

	const generateQRCode = async (flagNumber: number) => {
		try {
			const flagUrl = `${window.location.origin}/flag/${flagNumber}`;
			const qrDataUrl = await QRCode.toDataURL(flagUrl, {
				width: 400,
				margin: 2,
				color: {
					dark: "#000000",
					light: "#FFFFFF",
				},
			});

			setQrCodeUrl(qrDataUrl);
			setCurrentFlagNumber(flagNumber);
			setShowQRDialog(true);
		} catch (error) {
			console.error("QR generation error:", error);
			toast.error("Failed to generate QR code");
		}
	};

	const downloadQRCode = () => {
		if (!qrCodeUrl || !currentFlagNumber) return;

		const link = document.createElement("a");
		link.href = qrCodeUrl;
		link.download = `flag-${currentFlagNumber}-qr.png`;
		link.click();
		toast.success("QR code downloaded");
	};

	if (isLoading || isFetching) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div>Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated || !isAdmin) {
		return null;
	}

	const pendingRequests = requests.filter((r) => r.request.status === "pending");

	return (
		<div className="min-h-screen p-4">
			<div className="container mx-auto max-w-6xl pt-8">
				<Link to="/" className="text-blue-500 hover:underline mb-4 block">
					← Back to Home
				</Link>

				<h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

				<Tabs defaultValue="requests" className="space-y-4">
					<TabsList>
						<TabsTrigger value="requests">
							Flag Requests
							{pendingRequests.length > 0 && (
								<Badge variant="destructive" className="ml-2">
									{pendingRequests.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="flags">Flags ({flags.length})</TabsTrigger>
						<TabsTrigger value="captures">
							Captures ({captures.length})
						</TabsTrigger>
					</TabsList>

					{/* Flag Requests Tab */}
					<TabsContent value="requests">
						<Card>
							<CardHeader>
								<CardTitle>Flag Requests</CardTitle>
								<CardDescription>
									Approve or reject user requests for new flags
								</CardDescription>
							</CardHeader>
							<CardContent>
								{requests.length === 0 ? (
									<p className="text-gray-400 text-center py-8">
										No flag requests yet
									</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>User</TableHead>
												<TableHead>Requested</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Processed</TableHead>
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{requests.map((item) => (
												<TableRow key={item.request.id}>
													<TableCell>
														<div>
															<p className="font-medium">
																{item.requestedBy?.name || "Unknown"}
															</p>
															<p className="text-sm text-gray-400">
																{item.requestedBy?.email}
															</p>
														</div>
													</TableCell>
													<TableCell>
														{new Date(
															item.request.requestedAt
														).toLocaleDateString()}
													</TableCell>
													<TableCell>
														<Badge
															variant={
																item.request.status === "approved"
																	? "default"
																	: item.request.status === "rejected"
																		? "destructive"
																		: "secondary"
															}
														>
															{item.request.status}
														</Badge>
													</TableCell>
													<TableCell>
														{item.request.processedAt
															? new Date(
																	item.request.processedAt
																).toLocaleDateString()
															: "-"}
													</TableCell>
													<TableCell>
														{item.request.status === "pending" && (
															<div className="flex gap-2">
																<Button
																	size="sm"
																	onClick={() => handleApprove(item.request.id)}
																>
																	Approve
																</Button>
																<Button
																	size="sm"
																	variant="destructive"
																	onClick={() => handleReject(item.request.id)}
																>
																	Reject
																</Button>
															</div>
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Flags Tab */}
					<TabsContent value="flags">
						<Card>
							<CardHeader>
								<CardTitle>All Flags</CardTitle>
								<CardDescription>
									View and manage all flags in the system
								</CardDescription>
							</CardHeader>
							<CardContent>
								{flags.length === 0 ? (
									<p className="text-gray-400 text-center py-8">
										No flags created yet
									</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Flag #</TableHead>
												<TableHead>Current Owner</TableHead>
												<TableHead>Created</TableHead>
												<TableHead>Last Captured</TableHead>
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{flags.map((item) => (
												<TableRow key={item.flag.id}>
													<TableCell>
														<Link
															to={`/flag/${item.flag.flagNumber}`}
															className="font-medium text-blue-500 hover:underline"
														>
															#{item.flag.flagNumber}
														</Link>
													</TableCell>
													<TableCell>
														<div>
															<p className="font-medium">
																{item.currentOwner?.name || "Unknown"}
															</p>
															<p className="text-sm text-gray-400">
																{item.currentOwner?.email}
															</p>
														</div>
													</TableCell>
													<TableCell>
														{new Date(
															item.flag.createdAt
														).toLocaleDateString()}
													</TableCell>
													<TableCell>
														{item.flag.lastCapturedAt
															? new Date(
																	item.flag.lastCapturedAt
																).toLocaleDateString()
															: "Never"}
													</TableCell>
													<TableCell>
														<div className="flex gap-2">
															<Button
																size="sm"
																variant="outline"
																onClick={() =>
																	generateQRCode(item.flag.flagNumber)
																}
															>
																QR Code
															</Button>
															<Button
																size="sm"
																variant="destructive"
																onClick={() =>
																	handleDeleteFlag(
																		item.flag.id,
																		item.flag.flagNumber
																	)
																}
															>
																Delete
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Captures Tab */}
					<TabsContent value="captures">
						<Card>
							<CardHeader>
								<CardTitle>All Captures</CardTitle>
								<CardDescription>
									View and manage all flag captures
								</CardDescription>
							</CardHeader>
							<CardContent>
								{captures.length === 0 ? (
									<p className="text-gray-400 text-center py-8">
										No captures recorded yet
									</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Flag #</TableHead>
												<TableHead>Captured By</TableHead>
												<TableHead>Captured At</TableHead>
												<TableHead>Notes</TableHead>
												<TableHead>Photo</TableHead>
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{captures.map((item) => (
												<TableRow key={item.capture.id}>
													<TableCell>
														<Link
															to={`/flag/${item.flag?.flagNumber}`}
															className="font-medium text-blue-500 hover:underline"
														>
															#{item.flag?.flagNumber}
														</Link>
													</TableCell>
													<TableCell>
														<div>
															<p className="font-medium">
																{item.capturedBy?.name || "Unknown"}
															</p>
															<p className="text-sm text-gray-400">
																{item.capturedBy?.email}
															</p>
														</div>
													</TableCell>
													<TableCell>
														{new Date(
															item.capture.capturedAt
														).toLocaleDateString()}
													</TableCell>
													<TableCell>
														{item.capture.notes ? (
															<p className="text-sm max-w-xs truncate">
																{item.capture.notes}
															</p>
														) : (
															<span className="text-gray-500">-</span>
														)}
													</TableCell>
													<TableCell>
														{item.capture.photoUrl ? (
															<a
																href={item.capture.photoUrl}
																target="_blank"
																rel="noopener noreferrer"
																className="text-blue-500 hover:underline text-sm"
															>
																View
															</a>
														) : (
															<span className="text-gray-500">-</span>
														)}
													</TableCell>
													<TableCell>
														<Button
															size="sm"
															variant="destructive"
															onClick={() =>
																handleDeleteCapture(item.capture.id)
															}
														>
															Delete
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* QR Code Dialog */}
				<Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Flag #{currentFlagNumber} QR Code</DialogTitle>
							<DialogDescription>
								Download this QR code and print it on the physical flag
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col items-center space-y-4">
							{qrCodeUrl && (
								<img
									src={qrCodeUrl}
									alt={`QR Code for Flag #${currentFlagNumber}`}
									className="w-full max-w-sm border-4 border-white rounded-lg"
								/>
							)}
							<div className="flex gap-2 w-full">
								<Button onClick={downloadQRCode} className="flex-1">
									Download QR Code
								</Button>
								<Button
									variant="outline"
									onClick={() => setShowQRDialog(false)}
									className="flex-1"
								>
									Close
								</Button>
							</div>
							<p className="text-xs text-gray-400 text-center">
								URL: {window.location.origin}/flag/{currentFlagNumber}
							</p>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
