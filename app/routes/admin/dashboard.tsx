import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/auth";
import { Layout } from "@/components/Layout";
import { TableRowSkeleton } from "@/components/LoadingStates";
import { EmptyState } from "@/components/EmptyState";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
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
// QRCode removed from top-level import to fix SSR issue
// It will be dynamically imported when needed (client-side only)
import { 
	Shield, 
	Flag, 
	Users, 
	Camera,
	Download,
	ExternalLink,
	QrCode,
	Trash2,
	Check,
	X as XIcon,
	Clock,
	AlertCircle,
	Loader2,
	FileText,
	Image as ImageIcon
} from "lucide-react";
import type { Route } from "./+types/dashboard";

export default function AdminDashboard() {
	const { isAuthenticated, isAdmin, isLoading } = useAuth();
	const navigate = useNavigate();

	const [requests, setRequests] = useState<any[]>([]);
	const [flags, setFlags] = useState<any[]>([]);
	const [captures, setCaptures] = useState<any[]>([]);
	const [isFetching, setIsFetching] = useState(true);
	const [processingId, setProcessingId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [previewImage, setPreviewImage] = useState<string | null>(null);

	// QR Code state
	const [showQRDialog, setShowQRDialog] = useState(false);
	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const [currentFlagNumber, setCurrentFlagNumber] = useState<number | null>(null);
	const [generatingQR, setGeneratingQR] = useState(false);

	useEffect(() => {
		if (!isLoading && (!isAuthenticated || !isAdmin)) {
			navigate("/");
			toast.error("Access denied - Admin only");
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
		setProcessingId(requestId);
		try {
			const response = await fetch(
				`/api/admin/flag-requests/${requestId}/approve`,
				{ method: "POST" }
			);

			if (response.ok) {
				const data = await response.json();
				toast.success(`Flag request approved! Flag #${data.flagNumber} created`);
				await generateQRCode(data.flagNumber);
				fetchData();
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to approve request");
			}
		} catch (error) {
			console.error("Approve error:", error);
			toast.error("Failed to approve request");
		} finally {
			setProcessingId(null);
		}
	};

	const handleReject = async (requestId: number) => {
		setProcessingId(requestId);
		try {
			const response = await fetch(
				`/api/admin/flag-requests/${requestId}/reject`,
				{ method: "POST" }
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
		} finally {
			setProcessingId(null);
		}
	};

	const handleDeleteFlag = async (flagId: number, flagNumber: number) => {
		if (!confirm(
			`Are you sure you want to delete Flag #${flagNumber}? This will also delete all associated captures.`
		)) {
			return;
		}

		setDeletingId(flagId);
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
		} finally {
			setDeletingId(null);
		}
	};

	const handleDeleteCapture = async (captureId: number) => {
		if (!confirm(
			"Are you sure you want to delete this capture? Flag ownership will revert to the previous owner."
		)) {
			return;
		}

		setDeletingId(captureId);
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
		} finally {
			setDeletingId(null);
		}
	};

	const generateQRCode = async (flagNumber: number) => {
		setGeneratingQR(true);
		try {
			// Dynamic import of QRCode to avoid SSR issues
			// The qrcode library uses Node.js streams which aren't available during SSR
			// Loading it client-side only prevents the "superCtor.prototype" error
			if (typeof window === 'undefined') {
				throw new Error('QR code generation is only available in the browser');
			}
			
			const QRCode = (await import('qrcode')).default;
			
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
		} finally {
			setGeneratingQR(false);
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
			<Layout maxWidth="full">
				<div className="space-y-6">
					<div>
						<h1 className="text-3xl font-bold flex items-center gap-2">
							<Shield className="h-8 w-8" />
							Admin Dashboard
						</h1>
						<p className="text-muted-foreground mt-2">Loading admin data...</p>
					</div>
					<Card>
						<CardHeader>
							<CardTitle>Loading...</CardTitle>
						</CardHeader>
						<CardContent>
							<TableRowSkeleton rows={5} />
						</CardContent>
					</Card>
				</div>
			</Layout>
		);
	}

	if (!isAuthenticated || !isAdmin) {
		return null;
	}

	const pendingRequests = requests.filter((r) => r.request.status === "pending");

	return (
		<Layout maxWidth="full">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Shield className="h-8 w-8" />
						Admin Dashboard
					</h1>
					<p className="text-muted-foreground mt-2">
						Manage flag requests, flags, and captures
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Pending Requests</CardDescription>
							<CardTitle className="text-3xl">{pendingRequests.length}</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Flags</CardDescription>
							<CardTitle className="text-3xl">{flags.length}</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Total Captures</CardDescription>
							<CardTitle className="text-3xl">{captures.length}</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Active Players</CardDescription>
							<CardTitle className="text-3xl">
								{new Set(flags.map(f => f.currentOwner?.id)).size}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>

				<Tabs defaultValue="requests" className="space-y-4">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="requests" className="relative">
							<FileText className="mr-2 h-4 w-4" />
							Flag Requests
							{pendingRequests.length > 0 && (
								<Badge 
									variant="destructive" 
									className="ml-2 h-5 px-1.5 text-xs"
								>
									{pendingRequests.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="flags">
							<Flag className="mr-2 h-4 w-4" />
							Flags ({flags.length})
						</TabsTrigger>
						<TabsTrigger value="captures">
							<Camera className="mr-2 h-4 w-4" />
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
									<EmptyState
										icon={FileText}
										title="No Flag Requests"
										description="No flag requests have been submitted yet."
									/>
								) : (
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>User</TableHead>
													<TableHead>Requested</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Processed</TableHead>
													<TableHead className="text-right">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{requests.map((item) => (
													<TableRow key={item.request.id}>
														<TableCell>
															<div className="flex items-center gap-2">
																<Users className="h-4 w-4 text-muted-foreground" />
																<div>
																	<p className="font-medium">
																		{item.requestedBy?.name || "Unknown"}
																	</p>
																	<p className="text-sm text-muted-foreground">
																		{item.requestedBy?.email}
																	</p>
																</div>
															</div>
														</TableCell>
														<TableCell>
															{new Date(item.request.requestedAt).toLocaleDateString()}
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
																{item.request.status === "pending" && (
																	<Clock className="mr-1 h-3 w-3" />
																)}
																{item.request.status === "approved" && (
																	<Check className="mr-1 h-3 w-3" />
																)}
																{item.request.status === "rejected" && (
																	<XIcon className="mr-1 h-3 w-3" />
																)}
																{item.request.status}
															</Badge>
														</TableCell>
														<TableCell>
															{item.request.processedAt
																? new Date(item.request.processedAt).toLocaleDateString()
																: "-"}
														</TableCell>
														<TableCell className="text-right">
															{item.request.status === "pending" && (
																<div className="flex gap-2 justify-end">
																	<Button
																		size="sm"
																		onClick={() => handleApprove(item.request.id)}
																		disabled={processingId === item.request.id}
																	>
																		{processingId === item.request.id ? (
																			<Loader2 className="h-4 w-4 animate-spin" />
																		) : (
																			<>
																				<Check className="mr-1 h-3 w-3" />
																				Approve
																			</>
																		)}
																	</Button>
																	<Button
																		size="sm"
																		variant="destructive"
																		onClick={() => handleReject(item.request.id)}
																		disabled={processingId === item.request.id}
																	>
																		{processingId === item.request.id ? (
																			<Loader2 className="h-4 w-4 animate-spin" />
																		) : (
																			<>
																				<XIcon className="mr-1 h-3 w-3" />
																				Reject
																			</>
																		)}
																	</Button>
																</div>
															)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
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
									<EmptyState
										icon={Flag}
										title="No Flags Created"
										description="No flags have been created yet. Approve some requests to get started!"
									/>
								) : (
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Flag #</TableHead>
													<TableHead>Current Owner</TableHead>
													<TableHead>Created</TableHead>
													<TableHead>Last Captured</TableHead>
													<TableHead className="text-right">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{flags.map((item) => (
													<TableRow key={item.flag.id}>
														<TableCell>
															<a
																href={`/flag/${item.flag.flagNumber}`}
																className="font-medium text-primary hover:underline flex items-center gap-1"
															>
																<Flag className="h-4 w-4" />
																#{item.flag.flagNumber}
															</a>
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-2">
																<Users className="h-4 w-4 text-muted-foreground" />
																<div>
																	<p className="font-medium">
																		{item.currentOwner?.name || "Unknown"}
																	</p>
																	<p className="text-sm text-muted-foreground">
																		{item.currentOwner?.email}
																	</p>
																</div>
															</div>
														</TableCell>
														<TableCell>
															{new Date(item.flag.createdAt).toLocaleDateString()}
														</TableCell>
														<TableCell>
															{item.flag.lastCapturedAt
																? new Date(item.flag.lastCapturedAt).toLocaleDateString()
																: "Never"}
														</TableCell>
														<TableCell className="text-right">
															<div className="flex gap-2 justify-end">
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => generateQRCode(item.flag.flagNumber)}
																	disabled={generatingQR}
																>
																	<QrCode className="mr-1 h-3 w-3" />
																	QR
																</Button>
																<Button
																	size="sm"
																	variant="destructive"
																	onClick={() => handleDeleteFlag(item.flag.id, item.flag.flagNumber)}
																	disabled={deletingId === item.flag.id}
																>
																	{deletingId === item.flag.id ? (
																		<Loader2 className="h-4 w-4 animate-spin" />
																	) : (
																		<Trash2 className="h-3 w-3" />
																	)}
																</Button>
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
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
									<EmptyState
										icon={Camera}
										title="No Captures Yet"
										description="No flags have been captured yet."
									/>
								) : (
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Flag #</TableHead>
													<TableHead>Captured By</TableHead>
													<TableHead>Captured At</TableHead>
													<TableHead>Notes</TableHead>
													<TableHead>Photo</TableHead>
													<TableHead className="text-right">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{captures.map((item) => (
													<TableRow key={item.capture.id}>
														<TableCell>
															<a
																href={`/flag/${item.flag?.flagNumber}`}
																className="font-medium text-primary hover:underline flex items-center gap-1"
															>
																<Flag className="h-4 w-4" />
																#{item.flag?.flagNumber}
															</a>
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-2">
																<Users className="h-4 w-4 text-muted-foreground" />
																<div>
																	<p className="font-medium">
																		{item.capturedBy?.name || "Unknown"}
																	</p>
																	<p className="text-sm text-muted-foreground">
																		{item.capturedBy?.email}
																	</p>
																</div>
															</div>
														</TableCell>
														<TableCell>
															{new Date(item.capture.capturedAt).toLocaleDateString()}
														</TableCell>
														<TableCell>
															{item.capture.notes ? (
																<p className="text-sm max-w-xs truncate" title={item.capture.notes}>
																	{item.capture.notes}
																</p>
															) : (
																<span className="text-muted-foreground">-</span>
															)}
														</TableCell>
														<TableCell>
															{item.capture.photoUrl ? (
																<Button
																	variant="link"
																	size="sm"
																	className="p-0 h-auto"
																	onClick={() => setPreviewImage(item.capture.photoUrl)}
																>
																	<ImageIcon className="mr-1 h-3 w-3" />
																	View
																</Button>
															) : (
																<span className="text-muted-foreground">-</span>
															)}
														</TableCell>
														<TableCell className="text-right">
															<Button
																size="sm"
																variant="destructive"
																onClick={() => handleDeleteCapture(item.capture.id)}
																disabled={deletingId === item.capture.id}
															>
																{deletingId === item.capture.id ? (
																	<Loader2 className="h-4 w-4 animate-spin" />
																) : (
																	<Trash2 className="h-3 w-3" />
																)}
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* QR Code Dialog */}
				<Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<QrCode className="h-5 w-5" />
								Flag #{currentFlagNumber} QR Code
							</DialogTitle>
							<DialogDescription>
								Download this QR code and print it on the physical flag
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col items-center space-y-4">
							{qrCodeUrl && (
								<div className="p-4 bg-white rounded-lg">
									<img
										src={qrCodeUrl}
										alt={`QR Code for Flag #${currentFlagNumber}`}
										className="w-full max-w-sm"
									/>
								</div>
							)}
							<div className="flex gap-2 w-full">
								<Button onClick={downloadQRCode} className="flex-1">
									<Download className="mr-2 h-4 w-4" />
									Download QR Code
								</Button>
								<Button
									variant="outline"
									onClick={() => window.open(qrCodeUrl, "_blank")}
									className="flex-1"
								>
									<ExternalLink className="mr-2 h-4 w-4" />
									Open in New Tab
								</Button>
							</div>
							<p className="text-xs text-muted-foreground text-center break-all">
								URL: {window.location.origin}/flag/{currentFlagNumber}
							</p>
						</div>
					</DialogContent>
				</Dialog>

				{/* Image Preview Modal */}
				<ImagePreviewModal
					imageUrl={previewImage || ""}
					alt="Capture photo"
					title="Capture Photo"
					isOpen={!!previewImage}
					onClose={() => setPreviewImage(null)}
				/>
			</div>
		</Layout>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	return (
		<Layout maxWidth="full">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5" />
						Admin Dashboard Error
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4">Failed to load the admin dashboard. Please try again.</p>
					<Button onClick={() => window.location.reload()}>
						<AlertCircle className="mr-2 h-4 w-4" />
						Retry
					</Button>
				</CardContent>
			</Card>
		</Layout>
	);
}