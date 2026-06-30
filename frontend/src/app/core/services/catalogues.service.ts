import { Injectable, signal } from '@angular/core';
import { CatalogueModel } from '../models/catalogue.model';

@Injectable({
  providedIn: 'root',
})
export class CataloguesService {
  public catalogues = signal<CatalogueModel[]>([
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'English',
      type: 'language',
      code: 'EN',
      description: 'English Language',
      orderSequence: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as any,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'A1 Beginner',
      type: 'level',
      code: 'A1',
      description: 'Beginner Level',
      orderSequence: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as any,
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'B1 Intermediate',
      type: 'level',
      code: 'B1',
      description: 'Intermediate Level',
      orderSequence: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as any,
    },
    {
      id: 'lecture',
      name: 'Lecture',
      type: 'class_type',
      code: 'LECTURE',
      description: 'Lecture Class',
      orderSequence: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as any,
    },
    {
      id: 'practice',
      name: 'Practice',
      type: 'class_type',
      code: 'PRACTICE',
      description: 'Practice Class',
      orderSequence: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as any,
    },
    {
      id: 'debate',
      name: 'Debate',
      type: 'class_type',
      code: 'DEBATE',
      description: 'Debate Class',
      orderSequence: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as any,
    },
  ]);

  constructor() {}

  loadCatalogues() {
    // No-op: catalog loaded statically
  }
}

