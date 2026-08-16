import type { CategoryFacet } from "./api";

export type CategoryTreeNode = {
  id: number;
  slug: string;
  name: string;
  children: CategoryTreeNode[];
};

/** Groups the flat categories API response into a tree.
 *
 * Siblings are sorted by id ascending, which mirrors the curated menu order
 * of the import (parents are inserted in menu order).
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

/** Finds a node anywhere in the tree by its slug. */
export function findNodeBySlug(
  tree: CategoryTreeNode[],
  slug: string,
): CategoryTreeNode | undefined {
  for (const node of tree) {
    if (node.slug === slug) {
      return node;
    }
    const found = findNodeBySlug(node.children, slug);
    if (found) {
      return found;
    }
  }
  return undefined;
}
