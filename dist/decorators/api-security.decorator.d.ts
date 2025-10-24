import { SecurityRequirementObject } from '../interfaces/open-api-spec.interface';
export declare function ApiSecurity(name: string | SecurityRequirementObject, requirements?: string[]): ClassDecorator & MethodDecorator;
