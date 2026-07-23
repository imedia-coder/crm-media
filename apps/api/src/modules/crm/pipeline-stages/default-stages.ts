export const DEFAULT_PIPELINE_STAGES = [
  { name: 'Prospect', order: 1 },
  { name: 'Qualification', order: 2 },
  { name: 'Premier rendez-vous', order: 3 },
  { name: 'Proposition commerciale', order: 4 },
  { name: 'Négociation', order: 5 },
  { name: 'Signé', order: 6, isWon: true },
  { name: 'Perdu', order: 7, isLost: true },
] as const;
