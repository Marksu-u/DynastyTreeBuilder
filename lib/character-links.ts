import type { AnyCanvasNode, RelationshipEdgeType } from '@/store/canvas';

export interface LinkedPerson {
  id: string;
  name: string;
  /** Only meaningful on parent/child links. */
  adopted?: boolean;
  /** Ghost nodes stand in for unknown parents and cannot be opened. */
  isGhost?: boolean;
}

export interface CharacterLinks {
  partners: LinkedPerson[];
  parents: LinkedPerson[];
  children: LinkedPerson[];
}

/**
 * Everyone directly connected to one character, for the inspector's Links tab.
 *
 * The canvas stores families as union nodes rather than person-to-person edges:
 * a character points at a union with PARTNER, and the union points at each
 * child with CHILD or ADOPTED_CHILD. That indirection is what lets a person
 * have several partners with separate offspring, but it means "who are this
 * person's parents" is a two-hop question — which is exactly the kind of thing
 * that belongs in a tested pure function rather than inline in a component.
 */
export function characterLinks(
  nodes: AnyCanvasNode[],
  edges: RelationshipEdgeType[],
  personId: string,
): CharacterLinks {
  const person = new Map(
    nodes
      .filter((n) => n.type === 'character')
      .map((n) => [n.id, n as Extract<AnyCanvasNode, { type: 'character' }>]),
  );

  const toPerson = (id: string, adopted?: boolean): LinkedPerson | null => {
    const node = person.get(id);
    if (!node) return null;
    return {
      id,
      name: node.data.name,
      ...(adopted === undefined ? {} : { adopted }),
      ...(node.data.isGhost ? { isGhost: true } : {}),
    };
  };

  // Unions this person is a partner in, and unions they are a child of.
  const partnerUnions = new Set<string>();
  const childOfUnions = new Set<string>();

  for (const e of edges) {
    if (e.data?.type === 'PARTNER' && e.source === personId) {
      partnerUnions.add(e.target);
    } else if (
      (e.data?.type === 'CHILD' || e.data?.type === 'ADOPTED_CHILD') &&
      e.target === personId
    ) {
      childOfUnions.add(e.source);
    }
  }

  const partners: LinkedPerson[] = [];
  const children: LinkedPerson[] = [];
  const parents: LinkedPerson[] = [];

  const seen = { partners: new Set<string>(), children: new Set<string>(), parents: new Set<string>() };

  for (const e of edges) {
    const type = e.data?.type;

    // Co-partners: someone else pointing at a union we are also partnered in.
    if (type === 'PARTNER' && partnerUnions.has(e.target) && e.source !== personId) {
      const p = toPerson(e.source);
      if (p && !seen.partners.has(p.id)) { seen.partners.add(p.id); partners.push(p); }
    }

    // Our children: anyone a union we partner in points at.
    if ((type === 'CHILD' || type === 'ADOPTED_CHILD') && partnerUnions.has(e.source)) {
      const c = toPerson(e.target, type === 'ADOPTED_CHILD');
      if (c && !seen.children.has(c.id)) { seen.children.add(c.id); children.push(c); }
    }

    // Our parents: anyone partnered in a union that points at us.
    if (type === 'PARTNER' && childOfUnions.has(e.target)) {
      const p = toPerson(e.source);
      if (p && !seen.parents.has(p.id)) { seen.parents.add(p.id); parents.push(p); }
    }
  }

  return { partners, parents, children };
}
