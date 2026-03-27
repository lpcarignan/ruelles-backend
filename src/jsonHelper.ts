export class JsonHelper {
    constructor() {
    }

    public getField(dataObject: any, fieldName: string): any {
        if (dataObject === undefined || dataObject === null){
            return undefined;
        }
        if (this.hasField(dataObject, fieldName)) {
            return dataObject[fieldName];
        }
        else {
            console.log(`Field '${fieldName} does not exists in object ${JSON.stringify(dataObject)}`);
            return undefined;
        }
    }

    public hasField(jsonObject: any, fieldName: string): boolean {
        return jsonObject.hasOwnProperty(fieldName);
    }
}