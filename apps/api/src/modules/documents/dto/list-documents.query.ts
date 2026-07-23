import { IsOptional, IsString } from 'class-validator';

export class ListDocumentsQuery {
  @IsOptional()
  @IsString()
  projectId?: string;
}
