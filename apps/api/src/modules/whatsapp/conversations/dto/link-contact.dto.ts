import { IsString, MinLength } from 'class-validator';

export class LinkContactDto {
  @IsString()
  @MinLength(1)
  contactId!: string;
}
