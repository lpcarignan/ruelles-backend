export abstract class AkpaHandler {
    constructor() {        
    }
    
    protected getField(object: any, fieldName: string): any {
        if (object.hasOwnProperty(fieldName)) {
            return object[fieldName];
        }
        else {
            console.log(`Field '${fieldName}' does not exists in object ${JSON.stringify(object)}`);
            return undefined;
        }
    }

    protected getBody(body:any):object{
        if (typeof (body) === 'string') {
            // When receiving the body of a POST from PaceMkr in browser, the body is a string. Parse it and return the object
            return JSON.parse(body);
        }
        else {
            // When doing tests with the command 'serverless', it transforms the data from the .json file into an object
            // No need to parse the body. Just return the body.
            return body;
        }

    }
}