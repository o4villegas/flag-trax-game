import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp } from "../../lib/auth.client";
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
	FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";
import { UserPlus, Mail, Lock, User, Loader2, Check, X } from "lucide-react";
import type { Route } from "./+types/sign-up";

const signUpSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Please enter a valid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			"Password must contain at least one uppercase letter, one lowercase letter, and one number"
		),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
	const navigate = useNavigate();
	
	const form = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		mode: "onBlur", // Validate on blur for better UX
	});

	const onSubmit = async (data: SignUpForm) => {
		try {
			await signUp.email(
				{
					name: data.name,
					email: data.email,
					password: data.password,
				},
				{
					onSuccess: () => {
						toast.success("Account created successfully!");
						navigate("/");
					},
					onError: (ctx) => {
						toast.error(ctx.error.message || "Failed to create account");
					},
				}
			);
		} catch (error) {
			console.error("Sign up error:", error);
			toast.error("An unexpected error occurred");
		}
	};

	const isLoading = form.formState.isSubmitting;
	const password = form.watch("password");

	// Password strength indicators
	const hasMinLength = password.length >= 8;
	const hasUpperCase = /[A-Z]/.test(password);
	const hasLowerCase = /[a-z]/.test(password);
	const hasNumber = /\d/.test(password);

	const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
		<div className="flex items-center gap-1 text-xs">
			{met ? (
				<Check className="h-3 w-3 text-green-500" />
			) : (
				<X className="h-3 w-3 text-muted-foreground" />
			)}
			<span className={met ? "text-green-500" : "text-muted-foreground"}>
				{text}
			</span>
		</div>
	);

	return (
		<Layout showNav={false} maxWidth="md">
			<div className="min-h-[80vh] flex items-center justify-center py-8">
				<Card className="w-full">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl font-bold flex items-center gap-2">
							<UserPlus className="h-6 w-6" />
							Sign Up
						</CardTitle>
						<CardDescription>
							Create an account to start capturing flags
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												<User className="h-4 w-4" />
												Name
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Your name"
													autoComplete="name"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

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
													placeholder="Create a strong password"
													autoComplete="new-password"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												{password && (
													<div className="mt-2 space-y-1">
														<PasswordRequirement met={hasMinLength} text="At least 8 characters" />
														<PasswordRequirement met={hasUpperCase} text="One uppercase letter" />
														<PasswordRequirement met={hasLowerCase} text="One lowercase letter" />
														<PasswordRequirement met={hasNumber} text="One number" />
													</div>
												)}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="confirmPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												<Lock className="h-4 w-4" />
												Confirm Password
											</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder="Re-enter your password"
													autoComplete="new-password"
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
											Creating account...
										</>
									) : (
										<>
											<UserPlus className="mr-2 h-4 w-4" />
											Sign Up
										</>
									)}
								</Button>
							</form>
						</Form>

						<div className="mt-6 text-center">
							<p className="text-sm text-muted-foreground">
								Already have an account?{" "}
								<Link 
									to="/sign-in" 
									className="text-primary hover:underline font-medium"
								>
									Sign in
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
						<CardTitle>Sign Up Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4">An error occurred during sign up. Please try again.</p>
						<Button onClick={() => window.location.reload()}>Retry</Button>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
}
