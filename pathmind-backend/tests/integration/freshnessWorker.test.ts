import { Roadmap } from "@/models/Roadmap";
import { runFreshnessCheck } from "@/services/freshness/freshness.service";
import { generateOrGetRoadmap } from "@/services/roadmap.service";
import { startInMemoryMongo, stopInMemoryMongo, clearCollections } from "../mocks/mongoMemory";

beforeAll(async () => {
  await startInMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await stopInMemoryMongo();
});

describe("freshness worker", () => {
  it("stamps lastVerifiedAt on stale resources it re-verifies", async () => {
    const roadmap = await generateOrGetRoadmap("Machine Learning");

    // Force every resource to look stale (older than the configured threshold).
    const staleDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (const stage of roadmap.stages) {
      for (const resource of stage.freeResources) {
        resource.lastVerifiedAt = staleDate;
      }
    }
    await roadmap.save();

    const stats = await runFreshnessCheck();
    expect(stats.roadmapsScanned).toBeGreaterThan(0);
    expect(stats.resourcesChecked).toBeGreaterThan(0);

    const refreshed = await Roadmap.findById(roadmap._id);
    const anyResource = refreshed?.stages.flatMap((s) => s.freeResources)[0];
    if (anyResource) {
      expect(anyResource.lastVerifiedAt.getTime()).toBeGreaterThan(staleDate.getTime());
    }
  });

  it("leaves freshly-verified resources untouched", async () => {
    const roadmap = await generateOrGetRoadmap("Blockchain");
    const beforeStamp = roadmap.stages[0]?.freeResources[0]?.lastVerifiedAt.getTime();

    await runFreshnessCheck();

    const refreshed = await Roadmap.findById(roadmap._id);
    const afterStamp = refreshed?.stages[0]?.freeResources[0]?.lastVerifiedAt.getTime();
    if (beforeStamp && afterStamp) {
      expect(afterStamp).toBe(beforeStamp); // not stale yet, so untouched
    }
  });
});
