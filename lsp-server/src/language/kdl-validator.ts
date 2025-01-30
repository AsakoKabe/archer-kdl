import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { KdlAstType, Person } from './generated/ast.js';
import type { KdlServices } from './kdl-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: KdlServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.KdlValidator;
    const checks: ValidationChecks<KdlAstType> = {
        Person: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class KdlValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}
