export class ResponseBuilder {

    constructor(headers: { key: string, value: string } | undefined = undefined) {
        if (headers !== undefined) {
            this.additionalHeaders = headers;
        }
    }

    public getSuccessResponse(statusCode: number, data: any): Promise<any> {
        let res = {
            "statusCode": statusCode,
            //            "body": JSON.stringify(data),
            "headers": {
                "Access-Control-Allow-Origin": "*",
            },
            "isBase64Encoded": false
        };

        if (this.additionalHeaders !== undefined) {
            // An additional header key has to be added
            res["headers"][this.additionalHeaders.key] = this.additionalHeaders.value;
        }

        return Promise.resolve(data)
            .then((data) => {
                res['body'] = JSON.stringify(data);
                return res;
            })
            .catch((err) => {
                console.log(`Error when returning promise: '${err}'`);
            });

    }

    public getErrorResponse(message: string): Promise<any> {
        console.log(`Error: ${message}`);

        return new Promise((resolve) => {
            resolve({
                "statusCode": 400,
                "body": {
                    "error": "Invalid call to API",
                },
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "access-control-request-headers": "email, tokenkey, url"

                },
                "isBase64Encoded": false
            });
        });
    }

    private additionalHeaders: { key: string, value: string }
}