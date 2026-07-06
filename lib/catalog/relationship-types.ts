import type { CatalogOption } from './types';

export const RELATIONSHIP_TYPES: CatalogOption[] = [
  {
    value: 'PARENT',
    label: 'Parent / Child',
    description: 'Direct parent-child blood or adoptive line',
    edgeStyle: { stroke: '#534AB7', strokeWidth: 1.5 },
  },
  {
    value: 'SPOUSE',
    label: 'Spouse',
    description: 'Married or partnered',
    edgeStyle: { stroke: '#888780', strokeWidth: 1 },
  },
  {
    value: 'ADOPTED',
    label: 'Adopted',
    description: 'Brought into the family by choice',
    edgeStyle: { stroke: '#0F6E56', strokeWidth: 1, strokeDasharray: '4 3' },
  },
];
