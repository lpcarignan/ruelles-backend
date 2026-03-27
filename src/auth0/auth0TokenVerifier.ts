import * as jwt from 'jsonwebtoken';
import type { JwtHeader, JwtPayload, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient = require('jwks-rsa');

export interface VerifiedAuth0Token {
    sub: string;
    payload: JwtPayload & { sub: string };
}

export class Auth0TokenVerifier {
    private readonly issuerUrl?: string;
    private readonly audience?: string;
    private readonly client;

    constructor() {
        this.issuerUrl = this.normalizeIssuer(process.env.AUTH0_ISSUER_URL);
        this.audience = process.env.AUTH0_AUDIENCE;
        this.client = jwksClient({
            cache: true,
            cacheMaxEntries: 5,
            cacheMaxAge: 600000,
            jwksUri: this.getJwksUri(),
        });
    }

    public extractBearerToken(authHeader?: string): string | undefined {
        if (!authHeader?.startsWith('Bearer ')) {
            return undefined;
        }

        const token = authHeader.slice('Bearer '.length).trim();
        return token || undefined;
    }

    public hasValidConfiguration(): boolean {
        return !!this.issuerUrl && !!this.audience;
    }

    public async verifyAccessToken(token: string): Promise<VerifiedAuth0Token> {
        if (!this.issuerUrl || !this.audience) {
            throw new Error('Auth0 is not configured. Set AUTH0_ISSUER_URL and AUTH0_AUDIENCE.');
        }

        const payload = await new Promise<JwtPayload & { sub: string }>((resolve, reject) => {
            jwt.verify(token, this.getSigningKey, {
                audience: this.audience,
                issuer: this.issuerUrl,
                algorithms: ['RS256'],
            }, (err, decoded) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!decoded || typeof decoded === 'string' || !decoded.sub) {
                    reject(new Error('Token payload is missing sub.'));
                    return;
                }

                resolve(decoded as JwtPayload & { sub: string });
            });
        });

        return {
            sub: payload.sub,
            payload,
        };
    }

    private readonly getSigningKey = (header: JwtHeader, callback: SigningKeyCallback): void => {
        if (!header.kid) {
            callback(new Error('JWT header is missing kid.'));
            return;
        }

        this.client.getSigningKey(header.kid)
            .then((key) => {
                callback(null, key.getPublicKey());
            })
            .catch((err: Error) => {
                callback(err);
            });
    };

    private getJwksUri(): string {
        if (!this.issuerUrl) {
            return 'https://invalid.local/.well-known/jwks.json';
        }

        return new URL('.well-known/jwks.json', this.issuerUrl).toString();
    }

    private normalizeIssuer(issuer?: string): string | undefined {
        if (!issuer) {
            return undefined;
        }

        return issuer.endsWith('/') ? issuer : `${issuer}/`;
    }
}