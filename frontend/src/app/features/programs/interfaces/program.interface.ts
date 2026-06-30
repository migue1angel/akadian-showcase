import { CatalogueModel } from '@core/models/catalogue.model';
import { Unit } from './unit.interface';
export interface Program {
  id:                      string;
  deletedAt:               null;
  createdAt:               Date;
  updatedAt:               Date;
  name:                    string;
  totalUnits:              number;
  isActive:                boolean;
  totalClasses:            number;
  minAttendancePercentage: number;
  minPassPercentage:       number;
  language:                CatalogueModel;
  languageId:              string;
  level:                   CatalogueModel;
  levelId:                 string;
  units:                   Unit[];
}

export interface Language {
  id:            string;
  deletedAt:     null;
  createdAt:     Date;
  name:          string;
  type:          string;
  code:          string;
  orderSequence: number | null;
  description:   string;
}
