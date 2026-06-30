import { CatalogueModel } from '@core/models/catalogue.model';
export interface Unit {
  id:          string;
  createdAt:   Date;
  deletedAt:   null;
  updatedAt:   Date;
  unitNumber:  number;
  title:       string;
  overview:    string;
  programId:   string;
  unitClasses: UnitClass[];
}


export interface UnitClass {
  id: string;
  classType: CatalogueModel;
  classTypeId: string;
  unit: Unit;
  unitId:      string;
  title?: string;
  description?: string;
}
