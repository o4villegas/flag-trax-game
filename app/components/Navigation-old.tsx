import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/auth";
import { signOut } from "../lib/auth.client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Menu, User, Flag, Trophy, Shield, LogOut } from "lucide-react";

export function Navigation() {
	const { isAuthenticated, session, isAdmin, isLoading } = useAuth();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleSignOut = async () => {
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					toast.success("Signed out successfully");
					setMobileMenuOpen(false);
				},
			},
		});
	};

	const UserInfo = () => {
		if (!isAuthenticated || !session) return null;
		
		return (
			<div className="flex items-center gap-2">
				<User className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm text-muted-foreground">
					{session.user?.name || session.user?.email}
				</span>
			</div>
		);
	};

	const NavigationLinks = ({ mobile = false }: { mobile?: boolean }) => (
		<>
			{isLoading ? (
				<div className="text-sm text-muted-foreground">Loading...</div>
			) : isAuthenticated ? (
				<>
					<Link to="/my-stats" onClick={() => setMobileMenuOpen(false)}>
						<Button 
							variant={mobile ? "ghost" : "ghost"} 
							size="sm" 
							className={mobile ? "w-full justify-start" : ""}
						>
							<Trophy className="mr-2 h-4 w-4" />
							My Stats
						</Button>
					</Link>
					<Link to="/request-flag" onClick={() => setMobileMenuOpen(false)}>
						<Button 
							variant="ghost" 
							size="sm" 
							className={mobile ? "w-full justify-start" : ""}
						>
							<Flag className="mr-2 h-4 w-4" />
							Request Flag
						</Button>
					</Link>
					{isAdmin && (
						<Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
							<Button 
								variant="ghost" 
								size="sm" 
								className={mobile ? "w-full justify-start" : ""}
							>
								<Shield className="mr-2 h-4 w-4" />
								Admin
							</Button>
						</Link>
					)}
				</>
			) : (
				<>
					<Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
						<Button 
							variant="ghost" 
							size="sm" 
							className={mobile ? "w-full" : ""}
						>
							Sign In
						</Button>
					</Link>
					<Link to="/sign-up" onClick={() => setMobileMenuOpen(false)}>
						<Button 
							size="sm" 
							className={mobile ? "w-full" : ""}
						>
							Sign Up
						</Button>
					</Link>
				</>
			)}
		</>
	);

	return (
		<nav className="border-b border-border">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<Link to="/" className="text-xl font-bold">
						Flag Capture
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-4">
						<UserInfo />
						<NavigationLinks />
						{isAuthenticated && (
							<Button 
								variant="outline" 
								size="sm" 
								onClick={handleSignOut}
								className="ml-2"
							>
								<LogOut className="mr-2 h-4 w-4" />
								Sign Out
							</Button>
						)}
					</div>

					{/* Mobile Navigation */}
					<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="md:hidden"
								aria-label="Toggle navigation menu"
							>
								<Menu className="h-5 w-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-[300px] sm:w-[350px]">
							<SheetHeader>
								<SheetTitle>Menu</SheetTitle>
							</SheetHeader>
							
							<div className="mt-6 space-y-4">
								{/* User Info */}
								{isAuthenticated && (
									<>
										<UserInfo />
										<Separator />
									</>
								)}
								
								{/* Navigation Links */}
								<div className="space-y-1">
									<NavigationLinks mobile={true} />
								</div>
								
								{/* Sign Out Button */}
								{isAuthenticated && (
									<>
										<Separator />
										<Button 
											variant="outline" 
											size="sm" 
											onClick={handleSignOut}
											className="w-full justify-start"
										>
											<LogOut className="mr-2 h-4 w-4" />
											Sign Out
										</Button>
									</>
								)}
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</nav>
	);
}
