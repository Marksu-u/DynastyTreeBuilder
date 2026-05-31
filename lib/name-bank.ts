import type { CharacterGender, NameStyle } from '@/types/canvas';

export interface StaticName {
  id: string;
  name: string;
  style: NameStyle;
  gender: CharacterGender;
  note?: string;
}

export const NAME_BANK: StaticName[] = [
  // FANTASY
  { id: 'f-01', name: 'Aldric',    style: 'FANTASY',    gender: 'MALE',     note: 'Noble cadence, house-born' },
  { id: 'f-02', name: 'Seraphine', style: 'FANTASY',    gender: 'FEMALE',   note: 'Silvered tongue, old bloodline' },
  { id: 'f-03', name: 'Theron',    style: 'FANTASY',    gender: 'MALE',     note: 'Bearer of the ancestral crest' },
  { id: 'f-04', name: 'Lyrandel',  style: 'FANTASY',    gender: 'FEMALE',   note: 'Wanderer turned shadow' },
  { id: 'f-05', name: 'Caelum',    style: 'FANTASY',    gender: 'NON_BINARY', note: 'Reads star charts, speaks rarely' },
  { id: 'f-06', name: 'Maevis',    style: 'FANTASY',    gender: 'FEMALE',   note: 'Blade-for-hire, loyal until paid' },
  { id: 'f-07', name: 'Dorian',    style: 'FANTASY',    gender: 'MALE',     note: 'Smiled at the funeral' },
  { id: 'f-08', name: 'Isolde',    style: 'FANTASY',    gender: 'FEMALE',   note: 'The quiet one they underestimated' },
  { id: 'f-09', name: 'Rhaedyn',   style: 'FANTASY',    gender: 'MALE',     note: 'Built the keep with borrowed gold' },
  { id: 'f-10', name: 'Thessaly',  style: 'FANTASY',    gender: 'FEMALE',   note: 'Remembers every name and slight' },
  { id: 'f-11', name: 'Ashvane',   style: 'FANTASY',    gender: 'NON_BINARY', note: 'No last name, no past' },
  { id: 'f-12', name: 'Corvus',    style: 'FANTASY',    gender: 'MALE',     note: 'Old grudge, older than the house' },
  { id: 'f-13', name: 'Elara',     style: 'FANTASY',    gender: 'FEMALE',   note: 'Showed up with soldiers and a debt' },
  { id: 'f-14', name: 'Feryn',     style: 'FANTASY',    gender: 'MALE',     note: 'Carries messages for three houses' },
  { id: 'f-15', name: 'Nythra',    style: 'FANTASY',    gender: 'FEMALE',   note: 'The first. The only rule-maker' },
  // HISTORICAL
  { id: 'h-01', name: 'Alaric',    style: 'HISTORICAL', gender: 'MALE',     note: 'Visigothic name, commander cadence' },
  { id: 'h-02', name: 'Caterina',  style: 'HISTORICAL', gender: 'FEMALE',   note: 'Italian renaissance, ruthless patron' },
  { id: 'h-03', name: 'Sigebert',  style: 'HISTORICAL', gender: 'MALE',     note: 'Frankish, heavy and old' },
  { id: 'h-04', name: 'Mehmed',    style: 'HISTORICAL', gender: 'MALE',     note: 'Ottoman lineage' },
  { id: 'h-05', name: 'Yoshiko',   style: 'HISTORICAL', gender: 'FEMALE',   note: 'Japanese nobility' },
  { id: 'h-06', name: 'Harald',    style: 'HISTORICAL', gender: 'MALE',     note: 'Norse, sea-tested' },
  { id: 'h-07', name: 'Morrigan',  style: 'HISTORICAL', gender: 'FEMALE',   note: 'Celtic, shapeshifter cadence' },
  { id: 'h-08', name: 'Theodoros', style: 'HISTORICAL', gender: 'MALE',     note: 'Byzantine court scholar' },
  { id: 'h-09', name: 'Zenobia',   style: 'HISTORICAL', gender: 'FEMALE',   note: 'Warrior queen cadence' },
  { id: 'h-10', name: 'Balthazar', style: 'HISTORICAL', gender: 'MALE',     note: 'Medieval merchant, double agent' },
  { id: 'h-11', name: 'Eowyn',     style: 'HISTORICAL', gender: 'FEMALE',   note: 'Anglo-Saxon, overlooked daughter' },
  { id: 'h-12', name: 'Ragnar',    style: 'HISTORICAL', gender: 'MALE',     note: 'Norse raider, rival claim' },
  // SCI_FI
  { id: 's-01', name: 'Kael',      style: 'SCI_FI',     gender: 'MALE',     note: 'Retrofit name, salvager' },
  { id: 's-02', name: 'Nexis',     style: 'SCI_FI',     gender: 'NON_BINARY', note: 'Data broker, no fixed address' },
  { id: 's-03', name: 'Vael',      style: 'SCI_FI',     gender: 'FEMALE',   note: 'Clone series heir' },
  { id: 's-04', name: 'Oryn',      style: 'SCI_FI',     gender: 'MALE',     note: 'Colony founder, iron will' },
  { id: 's-05', name: 'Synthara',  style: 'SCI_FI',     gender: 'NON_BINARY', note: 'Synthetic origin, diplomatic voice' },
  { id: 's-06', name: 'Dax',       style: 'SCI_FI',     gender: 'MALE',     note: 'Mercenary turned faction head' },
  { id: 's-07', name: 'Lyren',     style: 'SCI_FI',     gender: 'FEMALE',   note: 'Pilot, owes a life-debt' },
  { id: 's-08', name: 'Zephyr',    style: 'SCI_FI',     gender: 'NON_BINARY', note: 'Courier, seen everywhere, known nowhere' },
  // MODERN
  { id: 'm-01', name: 'Marcus',    style: 'MODERN',     gender: 'MALE',     note: 'Old money, quiet authority' },
  { id: 'm-02', name: 'Elena',     style: 'MODERN',     gender: 'FEMALE',   note: 'Built the family business from scratch' },
  { id: 'm-03', name: 'Jordan',    style: 'MODERN',     gender: 'NON_BINARY', note: 'Journalist with inconvenient files' },
  { id: 'm-04', name: 'Damien',    style: 'MODERN',     gender: 'MALE',     note: 'Same school, different family' },
  { id: 'm-05', name: 'Nadia',     style: 'MODERN',     gender: 'FEMALE',   note: '"Consultant." Euphemism.' },
  // HORROR
  { id: 'ho-1', name: 'Mordecai',  style: 'HORROR',     gender: 'MALE',     note: 'Victorian patriarch, wrong powers' },
  { id: 'ho-2', name: 'Evander',   style: 'HORROR',     gender: 'MALE',     note: 'Cursed bloodline, every heir pays' },
  { id: 'ho-3', name: 'Lilith',    style: 'HORROR',     gender: 'FEMALE',   note: 'The name they stopped saying aloud' },
  { id: 'ho-4', name: 'Cassia',    style: 'HORROR',     gender: 'FEMALE',   note: 'Keeps the house together; knows why' },
  { id: 'ho-5', name: 'Aamon',     style: 'HORROR',     gender: 'NON_BINARY', note: 'Shadow society enforcer' },
];
