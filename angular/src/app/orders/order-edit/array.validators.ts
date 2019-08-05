import { ValidatorFn, AbstractControl, FormArray } from '@angular/forms';

// Array Validators
export class ArrayValidators {

    public static minLengthArray(min: number) {
        return (c: AbstractControl): {[key: string]: any} => {

            const length = c.value.filter(value => value.quantity != null).length;
            if (length >= 1) {
                return null;
            }
            // if (c.value.length >= min) {
            //     console.log('adfs', c.value);
            //     return null;
            // }

            return { minLengthArray: {valid: false }};
        };
    }

}
