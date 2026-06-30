export interface ProgramItem {
  id: string;
  name: string;
  totalUnits: number;
  isActive: boolean;
  totalClasses: number;
  level: { id: string; code: string };
}
