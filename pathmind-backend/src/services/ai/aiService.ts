import { env } from "@/config/env";
import type { AIProvider } from "./AIProvider.interface";
import { MockAIProvider } from "./mockProvider";
import { AnthropicProvider } from "./anthropicProvider";
import { OpenAIProvider } from "./openaiProvider";

// The single seam between "which vendor generates the roadmap" and
// everything else. roadmap.service.ts only ever calls `getAIProvider()` and
// programs against the AIProvider interface.
let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;

  if (env.MOCK_MODE) {
    cached = new MockAIProvider();
    return cached;
  }

  cached = env.AI_PROVIDER === "openai" ? new OpenAIProvider() : new AnthropicProvider();
  return cached;
}

// Exposed for tests that need to reset the memoized provider between cases.
export function resetAIProviderCache(): void {
  cached = null;
}
