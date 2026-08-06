"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authSchema, type AuthInput } from "@/lib/authSchemas";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthInput>({ resolver: zodResolver(authSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await apiClient.post(mode === "login" ? "/auth/login" : "/auth/register", values);
      router.push("/saved");
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Something went wrong");
    }
  });

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-bold text-white">
        {mode === "login" ? "Log in" : "Create your account"}
      </h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Input placeholder="you@example.com" type="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
        </div>
        <div>
          <Input placeholder="Password" type="password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
        </div>
        {serverError && <p className="text-xs text-rose-400">{serverError}</p>}
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          {mode === "login" ? "Log in" : "Sign up"}
        </Button>
      </form>
    </div>
  );
}
