export interface CatalogueModel {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  code: string;
  description: string;
  orderSequence: number;
}
