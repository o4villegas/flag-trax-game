import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "../../lib/auth.client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import type { Route } from "./+types/sign-in";

const signInSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignIn() {
	const navigate = useNavigate();
	
	const form = useForm<SignInForm>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: SignInForm) => {
		try {
			await signIn.email(
				{
					email: data.email,
					password: data.password,
				},
				{
					onSuccess: () => {
						toast.success("Signed in successfully!");
						navigate("/");
					},
					onError: (ctx) => {
						toast.error(ctx.error.message || "Invalid email or password");
					},
				}
			);
		} catch (error) {
			console.error("Sign in error:", error);
			toast.error("An unexpected error occurred");
		}
	};

	const isLoading = form.formState.isSubmitting;

	return (
		<Layout showNav={false} maxWidth="md">
			<div className="min-h-[80vh] flex items-center justify-center">
				<Card className="w-full">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl font-bold flex items-center gap-2">
							<LogIn className="h-6 w-6" />
							Sign In
						</CardTitle>
						<CardDescription>
							Enter your email and password to access your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												<Mail className="h-4 w-4" />
												Email
											</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="you@example.com"
													autoComplete="email"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												<Lock className="h-4 w-4" />
												Password
											</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder="Enter your password"
													autoComplete="current-password"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button 
									type="submit" 
									className="w-full" 
									disabled={isLoading}
									size="lg"
								>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Signing in...
										</>
									) : (
										<>
											<LogIn className="mr-2 h-4 w-4" />
											Sign In
										</>
									)}
								</Button>
							</form>
						</Form>

						<div className="mt-6 text-center">
							<p className="text-sm text-muted-foreground">
								Don't have an account?{" "}
								<Link 
									to="/sign-up" 
									className="text-primary hover:underline font-medium"
								>
									Sign up
								</Link>
							</p>
						</div>

						<div className="mt-4 text-center">
							<Link
								to="/"
								className="text-sm text-muted-foreground hover:text-primary"
							>
								← Back to Home
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	return (
		<Layout showNav={false} maxWidth="md">
			<div className="min-h-[80vh] flex items-center justify-center">
				<Card>
					<CardHeader>
						<CardTitle>Sign In Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4">An error occurred during sign in. Please try again.</p>
						<Button onClick={() => window.location.reload()}>Retry</Button>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
}
