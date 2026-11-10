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
 * Material 3: the field and its action sit together in a `surface-container`
 * search bar with a full `rounded-xl` shape, and the example topics below are
 * M3 **suggestion chips** — a state layer rather than a hover colour swap, so
 * they respond the same way every other control in the app does.
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
      toast.success("Roadmap generated", `${roadmap.stages.length} stages ready — start your journey.`);
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
        className="flex flex-col gap-3 rounded-lg border border-md-outline-variant bg-md-surface-container-high p-2 transition-colors duration-fast ease-standard focus-within:border-md-primary sm:flex-row sm:items-center sm:rounded-xl"
      >
        <Input
          placeholder="Type any topic — e.g. Dynamic Programming, React"
          className="min-h-touch rounded-sm border-0 bg-transparent px-4 text-md-on-surface placeholder:text-md-on-surface-variant"
          {...register("topic")}
        />
        <Button
          type="submit"
          variant="accent"
          isLoading={generate.isPending}
          className="w-full shrink-0 px-7 sm:w-auto"
        >
          {generate.isPending ? "Generating…" : "Build my path"}
        </Button>
      </form>
      {errors.topic && (
        <p role="alert" className="mt-2 px-4 text-body-sm text-md-error">
          {errors.topic.message}
        </p>
      )}
      {generate.isError && (
        <p role="alert" className="mt-2 px-4 text-body-sm text-md-error">
          Couldn&apos;t generate a roadmap. Please try again.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLE_TOPICS.map((topic) => (
          <motion.button
            key={topic}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setValue("topic", topic)}
            className="state-layer inline-flex min-h-touch-min items-center justify-center rounded-sm border border-md-outline-variant bg-md-surface-container-low h-8 px-4 text-label-lg text-md-on-surface-variant transition-colors duration-fast ease-standard sm:min-h-0"
          >
            {topic}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
