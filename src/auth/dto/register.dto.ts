import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsIn,
  IsISO8601,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsOptional,
} from 'class-validator';

@ValidatorConstraint({ name: 'passwordsMatch', async: false })
class PasswordsMatchConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const obj = args.object as RegisterDto;
    return confirmPassword === obj.password;
  }

  defaultMessage() {
    return 'Passwords do not match';
  }
}

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female', 'other'] })
  @IsString()
  @IsIn(['male', 'female', 'other'])
  gender: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsISO8601()
  @IsOptional()
  dateOfBirth: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+12345678' })
  @IsString()
  @MinLength(8)
  @IsOptional()
  phoneNumber: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @Validate(PasswordsMatchConstraint)
  confirmPassword: string;
}
