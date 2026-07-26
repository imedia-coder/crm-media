import { IsString, MinLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  whapiToken!: string;
}
