import { IsString, MinLength } from 'class-validator';

export class AddDependencyDto {
  @IsString()
  @MinLength(1)
  dependsOnTaskId!: string;
}
