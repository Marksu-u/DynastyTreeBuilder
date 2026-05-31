export type TagTone = 'positive' | 'negative' | 'complex' | 'neutral';

export interface TagDefinition {
  tag: string;
  label: string;
  tone: TagTone;
  description: string;
  hooks: [string, string];
}

export const RELATIONSHIP_TAGS: TagDefinition[] = [
  // ── Positive ────────────────────────────────────────────────────────────────
  {
    tag: 'PROTECTOR',
    label: 'Protector',
    tone: 'positive',
    description: 'Has taken on the burden of keeping this person safe. Whether by choice, oath, or debt, their survival is now bound to another\'s.',
    hooks: [
      'What would they sacrifice to keep this person alive?',
      'Who or what is the real threat they haven\'t named yet?',
    ],
  },
  {
    tag: 'DEVOTED',
    label: 'Devoted',
    tone: 'positive',
    description: 'Loyalty that goes beyond reason or reward. They would follow this person into ruin — and may already be doing exactly that.',
    hooks: [
      'What did this person do to earn such fierce devotion?',
      'Has the devotion ever been tested, and did it hold?',
    ],
  },
  {
    tag: 'UNLIKELY_ALLY',
    label: 'Unlikely Ally',
    tone: 'positive',
    description: 'Two people who should never be on the same side. Circumstance, a shared enemy, or desperation brought them here. The alliance is real — but fragile.',
    hooks: [
      'What common threat or goal binds them together?',
      'What will break this alliance once that threat is gone?',
    ],
  },
  {
    tag: 'REDEEMED',
    label: 'Redeemed',
    tone: 'positive',
    description: 'They did something that should have ended this relationship. It didn\'t. The forgiveness was hard-won — or it\'s still in progress.',
    hooks: [
      'What did they do that required redemption?',
      'Does the wronged party truly forgive, or are they waiting for the next betrayal?',
    ],
  },

  // ── Negative ─────────────────────────────────────────────────────────────────
  {
    tag: 'BETRAYER',
    label: 'Betrayer',
    tone: 'negative',
    description: 'They crossed a line that cannot be uncrossed. Whether it was loyalty, a secret, or a life — they chose themselves over the bond.',
    hooks: [
      'What was the exact moment of betrayal, and who witnessed it?',
      'Do they regret it?',
    ],
  },
  {
    tag: 'SWORN_ENEMY',
    label: 'Sworn Enemy',
    tone: 'negative',
    description: 'Enmity that has been named and declared. Not a rivalry, not a grudge — a formal, stated hostility that shapes every choice.',
    hooks: [
      'What event elevated this from conflict to sworn enmity?',
      'Is there any version of the future where this ends without violence?',
    ],
  },
  {
    tag: 'CORRUPTED',
    label: 'Corrupted',
    tone: 'negative',
    description: 'Something twisted them. Power, grief, desperation, or something darker. The person they were and the person they are now are not the same.',
    hooks: [
      'What was the turning point — when did corruption take hold?',
      'Is there anyone who still sees the person they used to be?',
    ],
  },
  {
    tag: 'FALLEN',
    label: 'Fallen',
    tone: 'negative',
    description: 'They had status, power, or standing — and lost it. The fall was public, and the dynasty has not forgotten.',
    hooks: [
      'What brought them down, and who was responsible?',
      'Are they trying to rebuild, or have they accepted the fall?',
    ],
  },
  {
    tag: 'DECEASED',
    label: 'Deceased',
    tone: 'negative',
    description: 'Dead — but their absence still shapes the living. A ghost in all but body.',
    hooks: [
      'How did they die, and who carries the weight of that?',
      'What did they leave unresolved?',
    ],
  },

  // ── Complex ──────────────────────────────────────────────────────────────────
  {
    tag: 'ESTRANGED',
    label: 'Estranged',
    tone: 'complex',
    description: 'There was a relationship here — blood, bond, or trust. It broke. No formal declaration, just silence and distance.',
    hooks: [
      'When did they last speak, and what was said?',
      'Which one believes reconciliation is still possible?',
    ],
  },
  {
    tag: 'LOVER',
    label: 'Lover',
    tone: 'complex',
    description: 'A romantic bond — acknowledged or hidden. It complicates everything around it and everyone who knows.',
    hooks: [
      'Who else knows about this, and what would they do with that knowledge?',
      'What does this relationship cost each of them?',
    ],
  },
  {
    tag: 'RIVAL_HEIR',
    label: 'Rival Heir',
    tone: 'complex',
    description: 'Two claims, one seat. The competition may be open or unspoken, but both know what is at stake.',
    hooks: [
      'What has each done to advance their claim at the other\'s expense?',
      'Is there any version of this where both survive?',
    ],
  },
  {
    tag: 'SECRET_CHILD',
    label: 'Secret Child',
    tone: 'complex',
    description: 'A child whose parentage is hidden — from the child, from the house, or from the world.',
    hooks: [
      'Who knows the truth, and what are they protecting by keeping it?',
      'What happens if the secret surfaces?',
    ],
  },
  {
    tag: 'CONFLICTED',
    label: 'Conflicted',
    tone: 'complex',
    description: 'They are caught between two loyalties, two truths, or two versions of who they are. They haven\'t chosen yet.',
    hooks: [
      'What are the two things pulling them apart?',
      'When the choice comes, which way will they fall?',
    ],
  },
  {
    tag: 'MANIPULATIVE',
    label: 'Manipulative',
    tone: 'complex',
    description: 'They use people — not always cruelly, not always consciously, but their relationships are instruments toward an end.',
    hooks: [
      'Who are they manipulating right now, and toward what end?',
      'Does anyone see it clearly?',
    ],
  },
  {
    tag: 'GRIEVING',
    label: 'Grieving',
    tone: 'complex',
    description: 'A loss has reshaped them. The grief is real, but it may be driving choices no one has fully reckoned with.',
    hooks: [
      'Who or what did they lose, and when?',
      'How has grief changed what they are willing to do?',
    ],
  },
  {
    tag: 'EXILED',
    label: 'Exiled',
    tone: 'complex',
    description: 'Removed from their place — house, court, city, or family. Whether voluntary or forced, they no longer belong to where they came from.',
    hooks: [
      'What did they do — or what was done to them — that led to exile?',
      'What do they want back, and what would they trade for it?',
    ],
  },

  // ── Neutral ──────────────────────────────────────────────────────────────────
  {
    tag: 'RELUCTANT_DEBTOR',
    label: 'Reluctant Debtor',
    tone: 'neutral',
    description: 'They owe something — a favor, a life, a secret. They don\'t want to pay it, but the debt is real and the creditor knows it.',
    hooks: [
      'What is the debt, and what will it cost to settle it?',
      'Are they looking for a way out that doesn\'t require paying?',
    ],
  },
  {
    tag: 'MISSING',
    label: 'Missing',
    tone: 'neutral',
    description: 'Gone — no body, no farewell, no confirmed end. The not-knowing is its own kind of wound.',
    hooks: [
      'When did they disappear, and who was the last to see them?',
      'Is someone still looking, and what are they afraid of finding?',
    ],
  },
  {
    tag: 'NEUTRAL',
    label: 'Neutral',
    tone: 'neutral',
    description: 'No strong bond in either direction. An acquaintance, a witness, a passing connection. Not everyone is an ally or an enemy.',
    hooks: [
      'What would it take to pull this person firmly into one camp?',
      'Do they know more than they let on?',
    ],
  },
];

export const TONE_LABELS: Record<TagTone, string> = {
  positive: 'Positive',
  negative: 'Negative',
  complex: 'Complex',
  neutral: 'Neutral',
};

export const TONE_ACCENT: Record<TagTone, string> = {
  positive: 'text-emerald-400',
  negative: 'text-red-400',
  complex: 'text-violet-400',
  neutral: 'text-zinc-500',
};

export const TONE_BORDER: Record<TagTone, string> = {
  positive: 'border-emerald-600',
  negative: 'border-red-600',
  complex: 'border-violet-600',
  neutral: 'border-zinc-600',
};

export const TAGS_BY_TONE: Record<TagTone, TagDefinition[]> = {
  positive: RELATIONSHIP_TAGS.filter((t) => t.tone === 'positive'),
  negative: RELATIONSHIP_TAGS.filter((t) => t.tone === 'negative'),
  complex:  RELATIONSHIP_TAGS.filter((t) => t.tone === 'complex'),
  neutral:  RELATIONSHIP_TAGS.filter((t) => t.tone === 'neutral'),
};
