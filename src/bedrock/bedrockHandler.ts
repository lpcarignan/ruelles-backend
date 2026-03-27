import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { Writable } from 'stream';
import { Auth0TokenVerifier } from '../auth0/auth0TokenVerifier';
import { BedrockService } from './bedrockService';

declare const awslambda: {
    streamifyResponse: (handler: (event: APIGatewayProxyEventV2, responseStream: Writable) => Promise<void>) => unknown;
    HttpResponseStream: {
        from: (responseStream: Writable, metadata: { statusCode: number; headers: Record<string, string> }) => Writable;
    };
};

export class BedrockHandler {
    constructor() {
    }

    private getHttpStream(responseStream: Writable, statusCode: number, contentType: string): Writable {
        return awslambda.HttpResponseStream.from(responseStream, {
            statusCode,
            headers: {
                'content-type': contentType,
            },
        });
    }

    public async ask(event: APIGatewayProxyEventV2, responseStream: Writable): Promise<void> {

        const authHeader = event.headers?.Authorization ?? event.headers?.authorization;
        const tokenVerifier = new Auth0TokenVerifier();
        const token = tokenVerifier.extractBearerToken(authHeader);
        console.log('Auth debug', {
            hasAuthorizationHeader: !!authHeader,
            hasBearerToken: !!token,
        });

        if (!tokenVerifier.hasValidConfiguration()) {
            const httpResponseStream = this.getHttpStream(responseStream, 500, 'application/json');
            httpResponseStream.write(JSON.stringify({
                message: 'Auth0 is not configured. Set AUTH0_ISSUER_URL and AUTH0_AUDIENCE.',
            }));
            httpResponseStream.end();
            return;
        }

        if (!token) {
            const httpResponseStream = this.getHttpStream(responseStream, 401, 'application/json');
            httpResponseStream.write(JSON.stringify({
                message: 'Unauthorized',
            }));
            httpResponseStream.end();
            return;
        }

        let verifiedToken;
        try {
            verifiedToken = await tokenVerifier.verifyAccessToken(token);
        } catch (err) {
            console.error('Auth token verification failed', err);
            const httpResponseStream = this.getHttpStream(responseStream, 401, 'application/json');
            httpResponseStream.write(JSON.stringify({
                message: 'Unauthorized',
            }));
            httpResponseStream.end();
            return;
        }

        console.log('Authenticated user', {
            subject: verifiedToken.sub,
        });

        const bedrockService = new BedrockService();
        if (bedrockService.validateConfiguration()) {
            const httpResponseStream = this.getHttpStream(responseStream, 500, 'application/json');
            httpResponseStream.write(JSON.stringify({
                message: 'Bedrock is not configured. Set BEDROCK_KB_ID and BEDROCK_MODEL_ARN.',
            }));
            httpResponseStream.end();
            return;
        }

        // Validate #2 - Make sure the prompt is ok
        const prompt = bedrockService.parsePrompt(event);

        if (!prompt) {
            const httpResponseStream = this.getHttpStream(responseStream, 200, 'application/json');
            httpResponseStream.write(JSON.stringify({
                message: 'hello world',
            }));
            httpResponseStream.end();
            return;
        }

        const httpResponseStream = this.getHttpStream(responseStream, 200, 'text/event-stream');
        const bedrockResponseStream = await bedrockService.processQuery(prompt);

        for await (const chunk of bedrockResponseStream) {
            httpResponseStream.write(chunk);
        }

        httpResponseStream.end();
    }
}

const bedrockHandler = new BedrockHandler();

export const ask = awslambda.streamifyResponse(bedrockHandler.ask.bind(bedrockHandler) as (event: APIGatewayProxyEventV2, responseStream: Writable) => Promise<void>);
