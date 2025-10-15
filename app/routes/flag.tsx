import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useAuth } from "../context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Flag() {
	const { flagNumber } = useParams();
	const { isAuthenticated, isLoading, session } = useAuth();
	const navigate = useNavigate();

	const [flagData, setFlagData] = useState<any>(null);
	const [isFetching, setIsFetching] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showScanner, setShowScanner] = useState(false);
	const [showCaptureForm, setShowCaptureForm] = useState(false);

	// Form state
	const [capturedDate, setCapturedDate] = useState<Date>(new Date());
	const [notes, setNotes] = useState("");
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [photoUrl, setPhotoUrl] = useState<string>("");
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			navigate("/sign-in");
		}
	}, [isAuthenticated, isLoading, navigate]);

	useEffect(() => {
		if (isAuthenticated && flagNumber) {
			fetchFlagData();
		}
	}, [isAuthenticated, flagNumber]);

	const fetchFlagData = async () => {
		try {
			const response = await fetch(`/api/flags/${flagNumber}`);
			if (response.ok) {
				const data = await response.json();
				setFlagData(data);
			} else if (response.status === 404) {
				toast.error("Flag not found");
				navigate("/");
			}
		} catch (error) {
			console.error("Failed to fetch flag:", error);
			toast.error("Failed to load flag data");
		} finally {
			setIsFetching(false);
		}
	};

	const handleQRScan = (result: any) => {
		if (result && result[0]?.rawValue) {
			const scannedUrl = result[0].rawValue;
			// Extract flag number from URL
			const match = scannedUrl.match(/\/flag\/(\d+)/);
			if (match && match[1] === flagNumber) {
				setShowScanner(false);
				setShowCaptureForm(true);
				toast.success("QR code verified! Fill out the capture form.");
			} else {
				toast.error("This QR code is for a different flag");
			}
		}
	};

	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setPhotoFile(file);
		setIsUploadingPhoto(true);

		try {
			const formData = new FormData();
			formData.append("photo", file);

			const response = await fetch("/api/photos", {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				const data = await response.json();
				setPhotoUrl(data.photoUrl);
				toast.success("Photo uploaded successfully!");
			} else {
				toast.error("Failed to upload photo");
				setPhotoFile(null);
			}
		} catch (error) {
			console.error("Photo upload error:", error);
			toast.error("Failed to upload photo");
			setPhotoFile(null);
		} finally {
			setIsUploadingPhoto(false);
		}
	};

	const handleCaptureSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/captures", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					flagNumber: parseInt(flagNumber!),
					capturedAt: capturedDate.toISOString(),
					notes,
					photoUrl,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				toast.success("Flag captured successfully!");
				navigate(`/capture-success/${data.flagNumber}`);
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to capture flag");
			}
		} catch (error) {
			console.error("Capture error:", error);
			toast.error("Failed to capture flag");
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

	if (!isAuthenticated || !flagData) {
		return null;
	}

	const isOwnFlag = flagData.flag.currentOwnerId === session?.user?.id;

	return (
		<div className="min-h-screen p-4">
			<div className="container mx-auto max-w-4xl pt-8">
				<Link to="/" className="text-blue-500 hover:underline mb-4 block">
					← Back to Home
				</Link>

				<div className="space-y-6">
					{/* Flag Info */}
					<Card>
						<CardHeader>
							<div className="flex justify-between items-start">
								<div>
									<CardTitle className="text-3xl">
										Flag #{flagData.flag.flagNumber}
									</CardTitle>
									<CardDescription>
										Created:{" "}
										{new Date(flagData.flag.createdAt).toLocaleDateString()}
									</CardDescription>
								</div>
								{isOwnFlag ? (
									<Badge variant="default">You Own This Flag</Badge>
								) : (
									<Badge variant="secondary">
										Owned by {flagData.currentOwner?.name}
									</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div>
									<p className="text-sm text-gray-400">Current Owner</p>
									<p className="font-semibold">
										{flagData.currentOwner?.name || "Unknown"} (
										{flagData.currentOwner?.email})
									</p>
								</div>
								{flagData.flag.lastCapturedAt && (
									<div>
										<p className="text-sm text-gray-400">Last Captured</p>
										<p className="font-semibold">
											{new Date(
												flagData.flag.lastCapturedAt
											).toLocaleDateString()}
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Capture Actions */}
					{!isOwnFlag && (
						<Card>
							<CardHeader>
								<CardTitle>Capture This Flag</CardTitle>
								<CardDescription>
									Scan the QR code on the physical flag to capture it
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Dialog open={showScanner} onOpenChange={setShowScanner}>
									<DialogTrigger asChild>
										<Button className="w-full">Scan QR Code</Button>
									</DialogTrigger>
									<DialogContent className="max-w-md">
										<DialogHeader>
											<DialogTitle>Scan Flag QR Code</DialogTitle>
											<DialogDescription>
												Point your camera at the QR code on the flag
											</DialogDescription>
										</DialogHeader>
										<div className="w-full aspect-square">
											<Scanner
												onScan={handleQRScan}
												onError={(error) => {
													console.error("Scanner error:", error);
													toast.error("Camera access denied or unavailable");
												}}
												constraints={{
													facingMode: "environment",
												}}
												styles={{
													container: {
														width: "100%",
														height: "100%",
													},
												}}
											/>
										</div>
									</DialogContent>
								</Dialog>

								<Dialog
									open={showCaptureForm}
									onOpenChange={setShowCaptureForm}
								>
									<DialogContent className="max-w-md">
										<DialogHeader>
											<DialogTitle>Record Capture</DialogTitle>
											<DialogDescription>
												Add details about this flag capture
											</DialogDescription>
										</DialogHeader>
										<form onSubmit={handleCaptureSubmit} className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="date">Capture Date</Label>
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className="w-full justify-start text-left"
														>
															{format(capturedDate, "PPP")}
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0">
														<Calendar
															mode="single"
															selected={capturedDate}
															onSelect={(date) =>
																date && setCapturedDate(date)
															}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
											</div>

											<div className="space-y-2">
												<Label htmlFor="photo">Photo (Optional)</Label>
												<Input
													id="photo"
													type="file"
													accept="image/*"
													onChange={handlePhotoUpload}
													disabled={isUploadingPhoto}
												/>
												{isUploadingPhoto && (
													<p className="text-xs text-gray-400">
														Uploading photo...
													</p>
												)}
												{photoUrl && (
													<p className="text-xs text-green-400">
														Photo uploaded successfully!
													</p>
												)}
											</div>

											<div className="space-y-2">
												<Label htmlFor="notes">Notes (Optional)</Label>
												<Textarea
													id="notes"
													placeholder="Add any notes about the capture..."
													value={notes}
													onChange={(e) => setNotes(e.target.value)}
													rows={3}
												/>
											</div>

											<Button
												type="submit"
												className="w-full"
												disabled={isSubmitting || isUploadingPhoto}
											>
												{isSubmitting ? "Submitting..." : "Submit Capture"}
											</Button>
										</form>
									</DialogContent>
								</Dialog>
							</CardContent>
						</Card>
					)}

					{/* Capture History */}
					<Card>
						<CardHeader>
							<CardTitle>Capture History</CardTitle>
							<CardDescription>
								{flagData.captureHistory.length} capture(s) recorded
							</CardDescription>
						</CardHeader>
						<CardContent>
							{flagData.captureHistory.length === 0 ? (
								<p className="text-gray-400 text-center py-8">
									No captures yet
								</p>
							) : (
								<div className="space-y-4">
									{flagData.captureHistory.map((item: any) => (
										<div
											key={item.capture.id}
											className="p-4 border border-gray-800 rounded-lg"
										>
											<div className="flex justify-between items-start mb-2">
												<div>
													<p className="font-semibold">
														{item.capturedBy?.name || "Unknown"}
													</p>
													<p className="text-sm text-gray-400">
														{item.capturedBy?.email}
													</p>
												</div>
												<p className="text-sm text-gray-400">
													{new Date(
														item.capture.capturedAt
													).toLocaleDateString()}
												</p>
											</div>
											{item.capture.notes && (
												<p className="text-sm text-gray-300 mt-2">
													{item.capture.notes}
												</p>
											)}
											{item.capture.photoUrl && (
												<div className="mt-2">
													<a
														href={item.capture.photoUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="text-blue-500 hover:underline text-sm"
													>
														View Photo
													</a>
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
