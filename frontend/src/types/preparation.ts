export type PreparationProfile = {
  procedureId: string;
  scheduledAt: string;
  location: string;
};

export type PreparationStep = {
  id: string;
  label: string;
  scheduledAt?: string;
};

export type PreparationPhase = {
  id: string;
  title: string;
  date: string;
  steps: readonly PreparationStep[];
};
