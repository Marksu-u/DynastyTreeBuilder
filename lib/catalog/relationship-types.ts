import type { CatalogOption } from './types';

/** Default relationship structural types, each with a display label, tooltip description,
 *  and the SVG edge stroke style used on the canvas. */
export const RELATIONSHIP_TYPES: CatalogOption[] = [
  {
    value: 'BLOOD',
    label: 'Blood',
    description: 'Family by birth',
    edgeStyle: { stroke: '#a1a1aa', strokeWidth: 2 },
  },
  {
    value: 'ADOPTED',
    label: 'Adopted',
    description: 'Family by choice',
    edgeStyle: { stroke: '#60a5fa', strokeWidth: 2, strokeDasharray: '6 4' },
  },
  {
    value: 'MARRIED',
    label: 'Married',
    description: 'Bound by marriage',
    edgeStyle: { stroke: '#fb7185', strokeWidth: 2 },
  },
  {
    value: 'BETROTHED',
    label: 'Betrothed',
    description: 'Promised in marriage',
    edgeStyle: { stroke: '#fda4af', strokeWidth: 1.5, strokeDasharray: '4 4' },
  },
  {
    value: 'ALLY',
    label: 'Ally',
    description: 'Political or tactical alliance',
    edgeStyle: { stroke: '#4ade80', strokeWidth: 1.5, strokeDasharray: '3 3' },
  },
  {
    value: 'ENEMY',
    label: 'Enemy',
    description: 'Open conflict or enmity',
    edgeStyle: { stroke: '#f87171', strokeWidth: 2 },
  },
  {
    value: 'MENTOR',
    label: 'Mentor',
    description: 'Teacher and student',
    edgeStyle: { stroke: '#818cf8', strokeWidth: 2 },
  },
  {
    value: 'RIVAL',
    label: 'Rival',
    description: 'Competing for the same goal',
    edgeStyle: { stroke: '#fb923c', strokeWidth: 2, strokeDasharray: '5 3' },
  },
  {
    value: 'UNKNOWN',
    label: 'Unknown',
    description: 'Relationship unclear',
    edgeStyle: { stroke: '#52525b', strokeWidth: 1.5 },
  },
];
