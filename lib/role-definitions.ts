import type { CharacterRole, RelationshipTag } from '@/types/canvas';

export interface RoleDefinition {
  role: CharacterRole;
  label: string;
  description: string;
  group: 'within' | 'outside';
  hooks: [string, string];
  tags: RelationshipTag[];
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  // ── Within the house ────────────────────────────────────────────────────────
  {
    role: 'PATRIARCH',
    label: 'Patriarch',
    description: 'The public face and final authority of the dynasty. His word ends arguments — until someone challenges it.',
    group: 'within',
    hooks: [
      'Who in the house no longer fears him?',
      'What decision haunts him that he will never undo?',
    ],
    tags: ['DEVOTED', 'MANIPULATIVE', 'GRIEVING'],
  },
  {
    role: 'MATRIARCH',
    label: 'Matriarch',
    description: 'The true anchor of the house. Outlasted three crises no one else knew about. Her loyalty is to the bloodline, not to any one person in it.',
    group: 'within',
    hooks: [
      'What secret does she carry to protect the dynasty?',
      'Which heir does she quietly prefer — and why?',
    ],
    tags: ['DEVOTED', 'PROTECTOR', 'CONFLICTED'],
  },
  {
    role: 'HEIR',
    label: 'Heir',
    description: 'The named successor. May not be the eldest, may not be the strongest. Almost certainly not unchallenged.',
    group: 'within',
    hooks: [
      'Who else believes they should hold this title?',
      'What has the heir done — or hidden — to secure their position?',
    ],
    tags: ['RIVAL_HEIR', 'CONFLICTED', 'FALLEN'],
  },
  {
    role: 'ADVISOR',
    label: 'Advisor',
    description: 'Trusted counsel who stays one step behind the throne by choice. Knows too much to be dismissed, not enough to be feared — yet.',
    group: 'within',
    hooks: [
      'What leverage does the advisor hold over the patriarch?',
      'Which outside house has offered them something better?',
    ],
    tags: ['MANIPULATIVE', 'DEVOTED', 'RELUCTANT_DEBTOR'],
  },
  {
    role: 'OPERATIVE',
    label: 'Operative',
    description: 'Deniable. Loyal until the right price. The house uses them for work that cannot be traced back to a name.',
    group: 'within',
    hooks: [
      'What job went wrong that the house doesn\'t know about?',
      'Who recruited them first — and do they still report back?',
    ],
    tags: ['BETRAYER', 'RELUCTANT_DEBTOR', 'EXILED'],
  },
  {
    role: 'INFORMANT',
    label: 'Informant',
    description: 'Knows every whisper in three courts. Never reveals the source. Has survived by being more useful alive than silenced.',
    group: 'within',
    hooks: [
      'What information are they sitting on and haven\'t sold yet?',
      'Who originally turned them into an informant?',
    ],
    tags: ['MANIPULATIVE', 'RELUCTANT_DEBTOR', 'MISSING'],
  },

  // ── Outside the house ───────────────────────────────────────────────────────
  {
    role: 'ALLY',
    label: 'Ally',
    description: 'Sworn to stand with the house — for now. Has their own agenda, their own debts, and their own definition of loyalty.',
    group: 'outside',
    hooks: [
      'What does the ally expect in return for their support?',
      'When will their loyalty be tested, and will it hold?',
    ],
    tags: ['UNLIKELY_ALLY', 'DEVOTED', 'RELUCTANT_DEBTOR'],
  },
  {
    role: 'RIVAL',
    label: 'Rival',
    description: 'Competing claim — bloodline, territory, or title. Not yet willing to strike openly. Building toward the moment they are.',
    group: 'outside',
    hooks: [
      'What would turn this rivalry into open war?',
      'Is there any respect beneath the competition?',
    ],
    tags: ['RIVAL_HEIR', 'ESTRANGED', 'CORRUPTED'],
  },
  {
    role: 'SWORN_ENEMY',
    label: 'Sworn Enemy',
    description: 'The named threat. An antagonist who has made their position clear and public. Ending this house is their stated purpose.',
    group: 'outside',
    hooks: [
      'What originally created the enmity — and who started it?',
      'Is there any path to resolution, or only escalation?',
    ],
    tags: ['BETRAYER', 'SWORN_ENEMY', 'FALLEN'],
  },
  {
    role: 'UNKNOWN',
    label: 'Hidden Position',
    description: 'Role deliberately obscured. Could be a sleeper agent, a spy inserted years ago, or someone whose allegiance has never been tested.',
    group: 'outside',
    hooks: [
      'Who placed them here — and does that patron still control them?',
      'What would reveal their true purpose?',
    ],
    tags: ['MISSING', 'SECRET_CHILD', 'EXILED'],
  },
  {
    role: 'OTHER',
    label: 'Wild Card',
    description: 'Doesn\'t fit the defined roles. Useful for characters whose function is unique to this dynasty, or whose role is still becoming clear.',
    group: 'outside',
    hooks: [
      'What function do they serve that no one else in the house fills?',
      'Are they a resource, a liability, or both?',
    ],
    tags: ['NEUTRAL', 'CONFLICTED', 'REDEEMED'],
  },
];

export const WITHIN_ROLES = ROLE_DEFINITIONS.filter((r) => r.group === 'within');
export const OUTSIDE_ROLES = ROLE_DEFINITIONS.filter((r) => r.group === 'outside');
