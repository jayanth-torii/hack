export const ROADMAP_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function roadmapTemplateKey(slug: string): string {
  return `roadmap:template:${slug}`;
}

export function roadmapTopicKey(normalizedTopic: string): string {
  return `roadmap:topic:${normalizedTopic}`;
}
