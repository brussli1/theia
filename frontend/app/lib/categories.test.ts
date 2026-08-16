import { describe, expect, it } from "vitest";
import { buildCategoryTree } from "./categories";

const FLAT = [
  { id: 6, slug: "special", name: "Special", parent_id: null },
  { id: 1, slug: "exam-room-essentials", name: "Exam Room Essentials", parent_id: null },
  { id: 2, slug: "refraction", name: "Refraction", parent_id: 1 },
  { id: 3, slug: "autorefractors", name: "Autorefractors", parent_id: 2 },
  { id: 5, slug: "current-offers", name: "Current Offers", parent_id: 6 },
  { id: 4, slug: "biometer", name: "Biometer", parent_id: 1 },
];

describe("buildCategoryTree", () => {
  it("groups children under their parents and orders roots by id", () => {
    const tree = buildCategoryTree(FLAT);
    expect(tree.map((node) => node.slug)).toEqual([
      "exam-room-essentials",
      "special",
    ]);
  });

  it("nests subgroups under roots and keeps id order inside", () => {
    const tree = buildCategoryTree(FLAT);
    const exam = tree.find((node) => node.slug === "exam-room-essentials");
    expect(exam?.children.map((child) => child.slug)).toEqual([
      "refraction",
      "biometer",
    ]);
    const refraction = exam?.children.find((child) => child.slug === "refraction");
    expect(refraction?.children.map((child) => child.slug)).toEqual([
      "autorefractors",
    ]);
  });

  it("attaches leaves directly under their root", () => {
    const tree = buildCategoryTree(FLAT);
    const special = tree.find((node) => node.slug === "special");
    expect(special?.children.map((child) => child.slug)).toEqual([
      "current-offers",
    ]);
  });

  it("drops children whose parent is unknown", () => {
    const orphaned = [
      ...FLAT,
      { id: 99, slug: "ghost", name: "Ghost", parent_id: 999 },
    ];
    const tree = buildCategoryTree(orphaned);
    const slugs = [
      ...tree.map((node) => node.slug),
      ...tree.flatMap((node) => node.children.map((child) => child.slug)),
    ];
    expect(slugs).not.toContain("ghost");
  });
});
