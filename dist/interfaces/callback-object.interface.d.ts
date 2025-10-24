export interface CallBackObject<T> {
    name: string;
    callbackUrl: string;
    method: string;
    requestBody: {
        type: T;
    };
    expectedResponse: {
        status: number;
        description?: string;
    };
}
