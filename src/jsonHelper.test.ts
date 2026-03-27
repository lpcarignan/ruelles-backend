import { JsonHelper } from './jsonHelper';

describe('JsonHelper test suite', () => {

    it('getField() - should pass all edge case scenarios', () => {

        // Test - The data object is undefined
        let jsonHelper = new JsonHelper();
        let actual = jsonHelper.getField(undefined, "gazou");
        expect(actual).toBeUndefined();

        // Test - The data object is null
        jsonHelper = new JsonHelper();
        actual = jsonHelper.getField(null, "gazou");
        expect(actual).toBeUndefined();

        // Test - The data object has no field
        jsonHelper = new JsonHelper();
        actual = jsonHelper.getField({}, "");
        expect(actual).toBeUndefined();

        // Test - The field name is an empty string
        jsonHelper = new JsonHelper();
        actual = jsonHelper.getField({ myField: 1 }, "");
        expect(actual).toBeUndefined();
    })
})