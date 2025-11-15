import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'emailOrPhone', async: false })
export class EmailOrPhoneValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as any;
    return !!(object.email || object.phone);
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Either email or phone must be provided';
  }
}
