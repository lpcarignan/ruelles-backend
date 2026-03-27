module.exports =  async () => {

    setupEnvironmentVariables();

}
function setupEnvironmentVariables() {
    var testJson = require('./environmentVariables.test.json')

    process.env.BEDROCK_KB_ID = testJson.BEDROCK_KB_ID;
    process.env.BEDROCK_MODEL_ARN = testJson.BEDROCK_MODEL_ARN;

    process.env.ENV = testJson.ENV;    
}