import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, ValidateNested, IsObject, IsArray, IsOptional, MaxLength, ValidatorConstraintInterface, ValidationArguments, ValidatorConstraint, Validate, IsBoolean } from 'class-validator';

//prevent items that quill recognizes as images.
@ValidatorConstraint({name: 'isValidTextInsert', async: false})
class isValidTextInsert implements ValidatorConstraintInterface {
  validate(insert: any, args: ValidationArguments) {
    if (typeof insert !== 'string') {
      return false;
    }
    const containsImageKey = insert.includes('image:');
    return !containsImageKey;
  }
  defaultMessage(validationArguments?: ValidationArguments): string {
    return "Only text is allowed in the insert field. No images"
  }
}

class Attributes {
  @IsOptional()
  @IsBoolean()
  bold?: boolean;

  @IsOptional()
  @IsBoolean()
  italic?: boolean;

  @IsOptional()
  @IsBoolean()
  underline?: boolean;

  @IsOptional()
  @IsNumber()
  header?: number;

  @IsOptional()
  @IsString()
  list?: string;
}

class DeltaOperation {
  @IsNotEmpty()
  @IsString()
  //in case and image like base64 get' through, just limit the amount to 2000 chars
  @MaxLength(2000)
  @Validate(isValidTextInsert)
  insert: string;

  @IsOptional()
  @IsObject()
  attributes?: Attributes;
}

class DeltaContent {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeltaOperation)
  ops: DeltaOperation[];
}

export class SaveLetterDto {
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  letterContent: string;

  @ValidateNested()
  @Type(() => DeltaContent)
  deltaContent: DeltaContent;
}
