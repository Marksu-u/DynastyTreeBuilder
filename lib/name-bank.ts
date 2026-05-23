import type { CharacterRole, CharacterGender, NameStyle } from '@/types/canvas';

export interface StaticName {
  id: string;
  name: string;
  style: NameStyle;
  gender: CharacterGender;
  role?: CharacterRole;
  note?: string;
}

export const NAME_BANK: StaticName[] = [
  // FANTASY
  { id: 'f-01', name: 'Aldric',    style: 'FANTASY',    gender: 'MALE',       role: 'HEIR',        note: 'Noble cadence, house-born' },
  { id: 'f-02', name: 'Seraphine', style: 'FANTASY',    gender: 'FEMALE',     role: 'MATRIARCH',   note: 'Silvered tongue, old bloodline' },
  { id: 'f-03', name: 'Theron',    style: 'FANTASY',    gender: 'MALE',       role: 'PATRIARCH',   note: 'Bearer of the ancestral crest' },
  { id: 'f-04', name: 'Lyrandel',  style: 'FANTASY',    gender: 'FEMALE',     role: 'INFORMANT',   note: 'Wanderer turned shadow' },
  { id: 'f-05', name: 'Caelum',    style: 'FANTASY',    gender: 'NON_BINARY', role: 'ADVISOR',     note: 'Reads star charts, speaks rarely' },
  { id: 'f-06', name: 'Maevis',    style: 'FANTASY',    gender: 'FEMALE',     role: 'OPERATIVE',   note: 'Blade-for-hire, loyal until paid' },
  { id: 'f-07', name: 'Dorian',    style: 'FANTASY',    gender: 'MALE',       role: 'RIVAL',       note: 'Smiled at the funeral' },
  { id: 'f-08', name: 'Isolde',    style: 'FANTASY',    gender: 'FEMALE',     role: 'HEIR',        note: 'The quiet one they underestimated' },
  { id: 'f-09', name: 'Rhaedyn',   style: 'FANTASY',    gender: 'MALE',       role: 'PATRIARCH',   note: 'Built the keep with borrowed gold' },
  { id: 'f-10', name: 'Thessaly',  style: 'FANTASY',    gender: 'FEMALE',     role: 'ADVISOR',     note: 'Remembers every name and slight' },
  { id: 'f-11', name: 'Ashvane',   style: 'FANTASY',    gender: 'NON_BINARY', role: 'OPERATIVE',   note: 'No last name, no past' },
  { id: 'f-12', name: 'Corvus',    style: 'FANTASY',    gender: 'MALE',       role: 'SWORN_ENEMY', note: 'Old grudge, older than the house' },
  { id: 'f-13', name: 'Elara',     style: 'FANTASY',    gender: 'FEMALE',     role: 'ALLY',        note: 'Showed up with soldiers and a debt' },
  { id: 'f-14', name: 'Feryn',     style: 'FANTASY',    gender: 'MALE',       role: 'INFORMANT',   note: 'Carries messages for three houses' },
  { id: 'f-15', name: 'Nythra',    style: 'FANTASY',    gender: 'FEMALE',     role: 'MATRIARCH',   note: 'The first. The only rule-maker' },
  // HISTORICAL
  { id: 'h-01', name: 'Alaric',    style: 'HISTORICAL', gender: 'MALE',       role: 'PATRIARCH',   note: 'Visigothic name, commander cadence' },
  { id: 'h-02', name: 'Caterina',  style: 'HISTORICAL', gender: 'FEMALE',     role: 'MATRIARCH',   note: 'Italian renaissance, ruthless patron' },
  { id: 'h-03', name: 'Sigebert',  style: 'HISTORICAL', gender: 'MALE',       role: 'HEIR',        note: 'Frankish, heavy and old' },
  { id: 'h-04', name: 'Mehmed',    style: 'HISTORICAL', gender: 'MALE',       role: 'PATRIARCH',   note: 'Ottoman lineage' },
  { id: 'h-05', name: 'Yoshiko',   style: 'HISTORICAL', gender: 'FEMALE',     role: 'MATRIARCH',   note: 'Japanese nobility' },
  { id: 'h-06', name: 'Harald',    style: 'HISTORICAL', gender: 'MALE',       role: 'PATRIARCH',   note: 'Norse, sea-tested' },
  { id: 'h-07', name: 'Morrigan',  style: 'HISTORICAL', gender: 'FEMALE',     role: 'SWORN_ENEMY', note: 'Celtic, shapeshifter cadence' },
  { id: 'h-08', name: 'Theodoros', style: 'HISTORICAL', gender: 'MALE',       role: 'ADVISOR',     note: 'Byzantine court scholar' },
  { id: 'h-09', name: 'Zenobia',   style: 'HISTORICAL', gender: 'FEMALE',     role: 'RIVAL',       note: 'Warrior queen cadence' },
  { id: 'h-10', name: 'Balthazar', style: 'HISTORICAL', gender: 'MALE',       role: 'OPERATIVE',   note: 'Medieval merchant, double agent' },
  { id: 'h-11', name: 'Eowyn',     style: 'HISTORICAL', gender: 'FEMALE',     role: 'HEIR',        note: 'Anglo-Saxon, overlooked daughter' },
  { id: 'h-12', name: 'Ragnar',    style: 'HISTORICAL', gender: 'MALE',       role: 'RIVAL',       note: 'Norse raider, rival claim' },
  // SCI_FI
  { id: 's-01', name: 'Kael',      style: 'SCI_FI',     gender: 'MALE',       role: 'OPERATIVE',   note: 'Retrofit name, salvager' },
  { id: 's-02', name: 'Nexis',     style: 'SCI_FI',     gender: 'NON_BINARY', role: 'INFORMANT',   note: 'Data broker, no fixed address' },
  { id: 's-03', name: 'Vael',      style: 'SCI_FI',     gender: 'FEMALE',     role: 'HEIR',        note: 'Clone series heir' },
  { id: 's-04', name: 'Oryn',      style: 'SCI_FI',     gender: 'MALE',       role: 'PATRIARCH',   note: 'Colony founder, iron will' },
  { id: 's-05', name: 'Synthara',  style: 'SCI_FI',     gender: 'NON_BINARY', role: 'ADVISOR',     note: 'Synthetic origin, diplomatic voice' },
  { id: 's-06', name: 'Dax',       style: 'SCI_FI',     gender: 'MALE',       role: 'RIVAL',       note: 'Mercenary turned faction head' },
  { id: 's-07', name: 'Lyren',     style: 'SCI_FI',     gender: 'FEMALE',     role: 'ALLY',        note: 'Pilot, owes a life-debt' },
  { id: 's-08', name: 'Zephyr',    style: 'SCI_FI',     gender: 'NON_BINARY', role: 'OPERATIVE',   note: 'Courier, seen everywhere, known nowhere' },
  // MODERN
  { id: 'm-01', name: 'Marcus',    style: 'MODERN',     gender: 'MALE',       role: 'PATRIARCH',   note: 'Old money, quiet authority' },
  { id: 'm-02', name: 'Elena',     style: 'MODERN',     gender: 'FEMALE',     role: 'MATRIARCH',   note: 'Built the family business from scratch' },
  { id: 'm-03', name: 'Jordan',    style: 'MODERN',     gender: 'NON_BINARY', role: 'INFORMANT',   note: 'Journalist with inconvenient files' },
  { id: 'm-04', name: 'Damien',    style: 'MODERN',     gender: 'MALE',       role: 'RIVAL',       note: 'Same school, different family' },
  { id: 'm-05', name: 'Nadia',     style: 'MODERN',     gender: 'FEMALE',     role: 'OPERATIVE',   note: '"Consultant." Euphemism.' },
  // HORROR
  { id: 'ho-1', name: 'Mordecai',  style: 'HORROR',     gender: 'MALE',       role: 'SWORN_ENEMY', note: 'Victorian patriarch, wrong powers' },
  { id: 'ho-2', name: 'Evander',   style: 'HORROR',     gender: 'MALE',       role: 'PATRIARCH',   note: 'Cursed bloodline, every heir pays' },
  { id: 'ho-3', name: 'Lilith',    style: 'HORROR',     gender: 'FEMALE',     role: 'SWORN_ENEMY', note: 'The name they stopped saying aloud' },
  { id: 'ho-4', name: 'Cassia',    style: 'HORROR',     gender: 'FEMALE',     role: 'MATRIARCH',   note: 'Keeps the house together; knows why' },
  { id: 'ho-5', name: 'Aamon',     style: 'HORROR',     gender: 'NON_BINARY', role: 'OPERATIVE',   note: 'Shadow society enforcer' },
];
