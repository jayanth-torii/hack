"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { topicSearchSchema, type TopicSearchInput } from "@/lib/zod-schemas";
import { Input } from "./Input";
import { Button } from "./Button";
import { useGenerateRoadmap } from "@/hooks/useRoadmapQuery";
import { ApiClientError } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

const EXAMPLE_TOPICS = ["Dynamic Programming", "React", "System Design", "Machine Learning"];

/**
 * Adapted from reactbits.dev/aceternity's animated search input pattern:
 * a glowing focus ring + example-topic chips, wired to RHF+Zod validation
 * and the generate-roadmap mutation. On success, routes to the 3D journey.
 *
 * Restyled to the Acjon template's pill CTA language: a bordered pill input
 * paired with the signature lime `accent` button (tp-btn-green).
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
    try {
      const roadmap = await generate.mutateAsync(topic);
      toast.success("Roadmap generated 🎉", `${roadmap.stages.length} stages ready — start your journey.`);
      router.push(`/roadmap/${roadmap.id}`);
    } catch (err) {
      toast.error(
        "Couldn't generate your roadmap",
        err instanceof ApiClientError ? err.message : "Please try again in a moment."
      );
    }
  });

  return (
    <div className="w-full max-w-xl">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-full border border-line/10 bg-card/50 p-2 backdrop-blur-sm transition-colors focus-within:border-accent/60 sm:flex-row sm:items-center"
      >
        <Input
          placeholder="Type any topic — e.g. Dynamic Programming, React"
          className="border-0 bg-transparent px-4 py-3 text-paper placeholder:text-muted focus:ring-0"
          {...register("topic")}
        />
        <Button
          type="submit"
          variant="accent"
          isLoading={generate.isPending}
          className="shrink-0 rounded-full px-7 py-3 sm:w-auto"
        >
          {generate.isPending ? "Generating…" : "Build my path"}
        </Button>
      </form>
      {errors.topic && <p className="mt-2 text-xs text-rose-400">{errors.topic.message}</p>}
      {generate.isError && (
        <p className="mt-2 text-xs text-rose-400">Couldn&apos;t generate a roadmap. Please try again.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLE_TOPICS.map((topic) => (
          <motion.button
            key={topic}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setValue("topic", topic)}
            className="rounded-full border border-line/10 bg-card/50 px-3.5 py-1.5 text-xs text-subtle transition-colors hover:border-accent/50 hover:text-accent"
          >
            {topic}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
