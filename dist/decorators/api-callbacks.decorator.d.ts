import { CallBackObject } from '../interfaces/callback-object.interface';
export declare function ApiCallbacks(...callbackObject: Array<CallBackObject<any>>): MethodDecorator & ClassDecorator;
