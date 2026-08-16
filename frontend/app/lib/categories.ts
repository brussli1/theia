import type { CategoryFacet } from "./api";

export type CategoryTreeNode = {
  id: number;
  slug: string;
  name: string;
  children: CategoryTreeNode[];
};

/** Groups the flat categories API response into a tree.
 *
 * Roots and siblings keep the backend's insertion order (id ascending),
 * which mirrors the curated menu order of the import.
 */
export function buildCategoryTree(categories: CategoryFacet[]): CategoryTreeNode[] {
  const byId = new Map<number, CategoryTreeNode>();
  for (const category of categories) {
    byId.set(category.id, {
      id: category.id,
      slug: category.slug,
      name: category.name,
      children: [],
    });
  }
  const roots: CategoryTreeNode[] = [];
  for (const category of categories) {
    const node = byId.get(category.id);
    if (!node) {
      continue;
    }
    if (category.parent_id === null) {
      roots.push(node);
      continue;
    }
    const parent = byId.get(category.parent_id);
    if (!parent) {
      continue; // orphaned child (parent not in the response) is dropped
    }
    parent.children.push(node);
  }
  const sortById = (nodes: CategoryTreeNode[]) =>
    nodes.sort((left, right) => left.id - right.id);
  sortById(roots);
  for (const root of roots) {
    sortById(root.children);
    for (const child of root.children) {
      sortById(child.children);
    }
  }
  return roots;
}
