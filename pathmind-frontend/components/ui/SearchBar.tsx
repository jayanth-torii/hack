"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { topicSearchSchema, type TopicSearchInput } from "@/lib/zod-schemas";
import { Input } from "./Input";
import { Button } from "./Button";
import { useGenerateRoadmap } from "@/hooks/useRoadmapQuery";

const EXAMPLE_TOPICS = ["Dynamic Programming", "React", "System Design", "Machine Learning"];

/**
 * Adapted from reactbits.dev/aceternity's animated search input pattern:
 * a glowing focus ring + example-topic chips, wired to RHF+Zod validation
 * and the generate-roadmap mutation. On success, routes to the 3D journey.
 */
export function SearchBar() {
  const router = useRouter();
  const generate = useGenerateRoadmap();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TopicSearchInput>({
    resolver: zodResolver(topicSearchSchema),
    defaultValues: { topic: "" },
  });

  const onSubmit = handleSubmit(async ({ topic }) => {
    const roadmap = await generate.mutateAsync(topic);
    router.push(`/roadmap/${roadmap.id}`);
  });

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Type any topic — e.g. Dynamic Programming, React, System Design"
            {...register("topic")}
          />
          {errors.topic && <p className="mt-1.5 text-xs text-rose-400">{errors.topic.message}</p>}
          {generate.isError && (
            <p className="mt-1.5 text-xs text-rose-400">
              Couldn&apos;t generate a roadmap. Please try again.
            </p>
          )}
        </div>
        <Button type="submit" isLoading={generate.isPending} className="sm:w-40">
          {generate.isPending ? "Generating…" : "Build my path"}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLE_TOPICS.map((topic) => (
          <motion.button
            key={topic}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setValue("topic", topic)}
            className="rounded-full border border-slate-700 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:border-brand-400/50 hover:text-brand-300"
          >
            {topic}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
