import { SocialNetwork } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListSocialAccountsQuery {
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsEnum(SocialNetwork) network?: SocialNetwork;
}
