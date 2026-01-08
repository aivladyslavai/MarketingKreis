import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address'
  })
  @IsEmail()
  email: string

  @ApiProperty({
    example: 'securepassword',
    description: 'User password',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'User full name'
  })
  @IsString()
  @IsOptional()
  name?: string
}
