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
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsString()
  @IsIn(['male', 'female', 'other'])
  gender: string;

  @IsISO8601()
  @IsOptional()
  dateOfBirth: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(8)
  @Validate(PasswordsMatchConstraint)
  confirmPassword: string;
}
