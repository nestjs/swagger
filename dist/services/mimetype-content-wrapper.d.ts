import { ContentObject } from '../interfaces/open-api-spec.interface';
export declare class MimetypeContentWrapper {
    wrap(mimetype: string[], obj: Record<string, any>): Record<'content', ContentObject>;
}
