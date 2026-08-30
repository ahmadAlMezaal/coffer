import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConsentDto {
  @IsString()
  @IsNotEmpty()
  publicToken!: string;
}
