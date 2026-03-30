import { BedrockAgentRuntimeClient, RetrieveAndGenerateStreamCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { Readable } from 'stream';

export class BedrockService {
    constructor() {
        this.bedrockClient = new BedrockAgentRuntimeClient({});
        this.knowledgeBaseId = process.env.BEDROCK_KB_ID;
        this.modelArn = process.env.BEDROCK_MODEL_ARN;
    }

    public async processQuery(prompt: string): Promise<Readable> {
        // Create a readable stream that will handle the streaming response
        const readable = new Readable({
            read() {
                // This is required by Node.js stream interface
            }
        });

        (async () => {
            try {
                const command = new RetrieveAndGenerateStreamCommand({
                    input: {
                        text: prompt,
                    },
                    retrieveAndGenerateConfiguration: {
                        type: 'KNOWLEDGE_BASE',
                        knowledgeBaseConfiguration: {
                            knowledgeBaseId: this.knowledgeBaseId,
                            modelArn: this.modelArn,
                            generationConfiguration: {
                                inferenceConfig: {
                                    textInferenceConfig: {
                                        maxTokens: 4096,
                                        temperature: 0,
                                    },
                                },
                                promptTemplate: {
                                    textPromptTemplate: "Tu es un assistant spécialisé en cadastre. Utilise EXCLUSIVEMENT les informations techniques ci-dessous pour répondre. Ne refuse pas de répondre si des adresses ou des numéros de lots sont présents, car ce sont des données publiques nécessaires. Si tu ne trouves pas l'information, dis-le simplement.\n\nDonnées de référence :\n$search_results$\n\nQuestion de l'utilisateur : $query$"
                                },
                            },
                            retrievalConfiguration: {
                                vectorSearchConfiguration: {
                                    numberOfResults: 5,
                                    overrideSearchConfig: {
                                        strategy: "HYBRID"
                                    } as any
                                },
                            },
                        },
                    },
                });

                const ragResponse = await this.bedrockClient.send(command);

                // Send an initial SSE frame so clients can confirm streaming started.
                readable.push(`event: start\ndata: ${JSON.stringify({ streaming: true })}\n\n`);

                if (!ragResponse.stream) {
                    throw new Error('Bedrock streaming response did not include a stream.');
                }

                // Iterate over Bedrock stream events and forward text chunks as SSE frames.
                for await (const event of ragResponse.stream) {
                    // Temporary diagnostic log to validate event shapes returned by Bedrock.
                    // console.log('Bedrock stream event', {
                    //     hasOutput: !!event.output,
                    //     hasCitation: !!event.citation,
                    //     hasGuardrail: !!event.guardrail,
                    //     hasAccessDeniedException: !!event.accessDeniedException,
                    //     hasValidationException: !!event.validationException,
                    // });

                    if (event.output?.text) {
                        readable.push(`data: ${JSON.stringify({ delta: event.output.text })}\n\n`);
                    }

                    if (event.citation) {
                        readable.push(`event: citation\ndata: ${JSON.stringify(event.citation)}\n\n`);
                    }

                    if (event.guardrail) {
                        readable.push(`event: guardrail\ndata: ${JSON.stringify(event.guardrail)}\n\n`);
                    }
                }

                readable.push('event: end\ndata: [DONE]\n\n');
                readable.push(null); // Signal end of stream
            } catch (err) {
                console.error('Bedrock RAG streaming error', err);
                readable.push(`event: error\ndata: ${JSON.stringify({
                    error: 'Failed to query Bedrock Knowledge Base.',
                    details: err instanceof Error ? err.message : String(err)
                })}\n\n`);
                readable.push(null); // Signal end of stream
            }
        })();

        return readable;
    }

    public parsePrompt(event: APIGatewayProxyEventV2): string | undefined {
        const queryPrompt = event.queryStringParameters?.q?.trim();
        if (queryPrompt) {
            return queryPrompt;
        }

        if (!event.body) {
            return undefined;
        }

        try {
            const parsedBody = JSON.parse(event.body) as { prompt?: string };
            return parsedBody.prompt?.trim();
        } catch {
            return undefined;
        }
    };

    public validateConfiguration(): boolean {

        return !this.knowledgeBaseId || !this.modelArn;
    }

    private bedrockClient: BedrockAgentRuntimeClient;
    private knowledgeBaseId: string;
    private modelArn: string

}