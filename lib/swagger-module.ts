import * as swaggerUi from 'swagger-ui-express';
import { INestApplication } from '@nestjs/common';
import { SwaggerBaseConfig, SwaggerDocument } from './interfaces';
import { SwaggerScanner } from './swagger-scanner';

export class SwaggerModule {
    private static readonly swaggerScanner = new SwaggerScanner();

    public static createDocument(app: INestApplication, config: SwaggerBaseConfig): SwaggerDocument {
        const document = this.swaggerScanner.scanApplication(app);
        return {
            ...config,
            ...document,
        };
    }

    public static setup(
        path: string,
        app: INestApplication,
        document: SwaggerDocument,
    ) {
        const { express } = app as any;
        express.use(path, swaggerUi.serve, swaggerUi.setup(document));
    }
}
