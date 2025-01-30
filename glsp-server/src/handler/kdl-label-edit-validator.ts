import { GModelElement, LabelEditValidator, ValidationStatus } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { KDLModelState } from '../model/kdl-model-state';

/**
 * A simple edit label validator that verifies that the given name label is not empty.
 */
@injectable()
export class KDLLabelEditValidator implements LabelEditValidator {
    @inject(KDLModelState)
    protected modelState: KDLModelState;

    validate(label: string, element: GModelElement): ValidationStatus {
        if (label.length < 1) {
            return { severity: ValidationStatus.Severity.ERROR, message: 'Name must not be empty' };
        }
        return { severity: ValidationStatus.Severity.OK };
    }
}
