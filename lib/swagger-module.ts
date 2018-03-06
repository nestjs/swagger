import { AuthOptions } from './interfaces/authentication.interface';
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
            swagger: '2.0',
        };
    }

    public static setup(
        path: string,
        app: INestApplication,
        document: SwaggerDocument,
        authOptions: AuthOptions,
        customCss : string = ``,
        customfavIcon: string = ``,
        swaggerUrl: string = `/swagger.json`,
        customsiteTitle: string = `Swagger UI`

    ) {
        app.use(path, swaggerUi.serve, swaggerUi.setup(
            document, 
            false, 
            authOptions,
            customCss,
            customfavIcon,
            swaggerUrl,
            customsiteTitle
        ));
    }
}
