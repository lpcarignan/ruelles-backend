# ruelles-backend

Serverless NodeJs Lambda functions. To decouple the business logic from the actual Lambda technology, and facilitate unit tests, the 3 files in each servicehave handlers which takes care of the http layer. When this project will become a full blow server (Ex: an Express server), the business logic and its unit tests will stay intact. Only the handlers will be changed.

 * Auth0 webhooks in folder auth0
   * `auth0EndPoint.test.ts`: Unit tests for the business logic around Auth0 end points.
   * `auth0EndPoint.ts`: Functions that do the actual business logic to consume Auth0 end points.
   * `auth0Webhook.test.ts`: Unit tests for the business logic around Auth0 web hooks.
   * `auth0Webhook.ts`: Functions that do the actual business logic to be consumed by Auth0 web hooks.
   * `auth0WebhookHandler.ts`: The entry point exposed by AWS. Web app calls these functions.
 * Stripe Checkout in folder stripe
   * `stripeWebhook.test.ts`: Unit tests for the business logic.
   * `stripeWebhook.ts`: It manages calls from the browser and web hooks from Stripe to manage customers subscriptions.
   * `stripeWebhookHandler.ts`: The entry point exposed by AWS. Stripe web hooks and web app call these functions.
 * UserProfile in folder userProfile
   * `userProfile.test.ts`: Unit tests for the business logic of user profiles.
   * `userProfile.ts`: Functions that do the actual business logic to fetch user profiles.
   * `userProfileHandler.ts`: The entry point exposed by AWS. Web app calls these functions.

# Databases

This project uses the AWS NoSQL DynamoDB. The tables are used locally and in AWS based on their purpose. Here's how each table is used locally and in AWS.

Localhost (run throught local DynamoDB instance)
* test.\<tableName\>: Used by unit tests. 

AWS
* dev.\<tableName\>: Used by the web app when developing new features
* prod.\<tableName\>: The production tables with the web appin production


# Testing locally on command line

It is possible to test the lambda functions locally with the following command lines. This method of testing is rarely used. It is still there in case we want to test the handler.

# Testing with unit tests

Unit tests are much more used to test the lambdas. To run your unit tests, you must first start the local DynamoDB instance inside of a Docker instance. DynamoDB is in a Docker instance because we might play with the Java version of your dev machine. This Java Runtime version could change based on other developments. For this reason, we run DynamoDB inside Docker.

To get the latest Docker image of local DynamoDb, run

```docker pull amazon/dynamodb-local:latest```

To start running DynamoDb inside this Docker image, run

```docker run -p 8000:8000 amazon/dynamodb-local:latest```

The ```-p 8000:8000``` parameter will redirect the port 8000 from local machine to port 8000 in Docker instance. Make sure in class ```DbClient.ts``` has end point at ```http://localhost:8000``` when it runs the units tests

For further documentation about the Docker image of DynamoDb local, you can read this page: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html#DynamoDBLocal.DownloadingAndRunning.title

Jest is the test runner/framework used to execute the tests. Here are the most commands to run the tests:

* Execute all tests on the command line: `npm run test`
* Execute one file of tests on the command line: `npm run test <path to file>`
* Execute one test on the command line: `npm run test <path to file> -t "<name of the test>"`

Jest doesn't load automatically the environment variables like in dev or prod which are handled by Serverless. To load `environmentVariables.test.json` in Jest, first put your variables `environmentVariables.test.json`.  Than, Jest run the code in file `./setTestEnvVariables.ts` which assigns the values to environment variables which are used in the code. 

# Deploy

Make sure Serverless has been configured to use the IAM role `serverless-deploy-lambda` with the following command line. Ask the GitHub account administrator for the access keys.

```serverless config credentials --provider aws --key <your_access_key_id> --secret <your_access_key_secret>```

To deploy to a stage, run this command. By default, the serverless.yml file points to the `dev` stage.
 
```serverless deploy --stage dev```

To remove a Serverless installation, use the command:

```serverless remove -- stage dev```

There are two stages defined:
* dev: Deployed on `https://gxsa2roalk.execute-api.us-east-1.amazonaws.com/`
* prod: Deployed on `https://x3pz4b0t6j.execute-api.us-east-1.amazonaws.com/`

## Testing on lambda function deployed on AWS

Once the Akpa gateway has been deploy to AWS, you can test each end point (aka lambad function) to make sure it works well. This is useful when major changes are done on the Lambda deployement. For example, migrating the AWS SDK from version 2.0 to 3.0 is a good scenario to test lambdas once they are deployed. Another example of testing each lambda is when the packaging has changed in the serverless.yml file.

### createCheckoutSession

This end point is a POST where parameters origin and priceId are used to test the lambda: 

```
curl -X POST -H "Content-Type : application/json" --data '{
    "headers":{
        "origin":""
    },
    "body": {
        "priceId": ""
    }
}' https://gxsa2roalk.execute-api.us-east-1.amazonaws.com/dev/createCheckoutSession
```

Values for testing:
 * origin: http://localhost:3000
 * priceId: ```price_1Ixd3HHyb5mfCUpkDBngBSPP``` for monthly and ```price_1Ixd3HHyb5mfCUpkhJPzBSRm``` for yearly subscription

### saveNewUserToDatabase

```curl -X POST -H "Content-Type: application/json" --data '{"user_id":"<enter userId here>","email":"<enter email here>","optIn":"true"}' https://gxsa2roalk.execute-api.us-east-1.amazonaws.com/dev/saveNewUserToDatabase```

### getUserByAuthId

```curl -X POST -H "Content-Type: application/json" --data '{"user_id":"<enter userId here>","email":"<enter email here>"}' https://gxsa2roalk.execute-api.us-east-1.amazonaws.com/dev/getUserWithAuthId```

curl -X POST -H "Content-Type: application/json" --data '{"user_id":"toto","email":"someone@gmailc.om"}' https://users.pacemkr.com/getUserWithAuthId

### updateRegistration

Test when we set the registration type to 'Trial'

```curl -X POST -H "Content-Type: application/json" --data '{"user_id":"<enter userId here>","registrationType":"10"}' https://gxsa2roalk.execute-api.us-east-1.amazonaws.com/dev/updateRegistration```

Test when we set the registration type to something else than 'Trial'
```curl -X POST -H "Content-Type: application/json" --data '{"user_id":"<enter userId here>","registrationType":"20"}' https://gxsa2roalk.execute-api.us-east-1.amazonaws.com/dev/updateRegistration```

Test when we set the registration and subscription plan
```curl -X POST -H "Content-Type: application/json" --data '{"user_id":"<enter userId here>","registrationType":"10","subscriptionPlan":"10"}' https://gxsa2roalk.execute-api.us-east-1.amazonaws.com/dev/updateRegistration```
