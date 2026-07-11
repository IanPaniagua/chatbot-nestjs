import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompanyOnboardingDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEmail()
  internalEmail?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  onlineStoreUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  locationAddress?: string;

  @IsOptional()
  @IsString()
  faqSeed?: string;
}

export class UpdateCompanySettingsDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEmail()
  internalEmail?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  onlineStoreUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  locationAddress?: string;

  @IsString()
  greeting!: string;

  @IsString()
  fallback!: string;

  @IsString()
  humanHandoff!: string;

  @IsString()
  normalOrderRedirect!: string;

  @IsOptional()
  @IsString()
  clarificationPrompt?: string;

  @IsOptional()
  @IsString()
  capabilities?: string;

  @IsOptional()
  @IsString()
  courtesyThanks?: string;

  @IsOptional()
  @IsString()
  courtesyGoodbye?: string;

  @IsOptional()
  @IsString()
  flowResumePrompt?: string;

  @IsOptional()
  @IsString()
  flowContinuePrefix?: string;

  @IsOptional()
  @IsString()
  flowLowInformation?: string;

  @IsOptional()
  @IsString()
  specialFlowWelcome?: string;

  @IsOptional()
  @IsString()
  specialFlowFields?: string;

  @IsOptional()
  @IsString()
  specialFlowCompletion?: string;

  @IsOptional()
  @IsString()
  restaurantFlowWelcome?: string;

  @IsOptional()
  @IsString()
  restaurantFlowFields?: string;

  @IsOptional()
  @IsString()
  restaurantFlowCompletion?: string;

  @IsOptional()
  @IsString()
  normalOrderKeywords?: string;

  @IsOptional()
  @IsString()
  specialOrderKeywords?: string;

  @IsOptional()
  @IsString()
  restaurantOrderKeywords?: string;

  @IsOptional()
  @IsString()
  faqKeywords?: string;

  @IsOptional()
  @IsString()
  humanSupportKeywords?: string;

  @IsOptional()
  @IsString()
  faqSeed?: string;

  @IsOptional()
  @IsString()
  serviceCatalogJson?: string;
}
