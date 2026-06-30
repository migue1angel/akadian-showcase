import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateUnitClassDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classNumber: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}

export class CreateUnitDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unitNumber: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateUnitClassDto)
  unitClasses: CreateUnitClassDto[];
}

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalUnits: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsUUID()
  languageId: string;

  @IsUUID()
  levelId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateUnitDto)
  units: CreateUnitDto[];
}
