import { IsEmail, IsString, MinLength } from 'class-validator';

export class InviteClientDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;
}
