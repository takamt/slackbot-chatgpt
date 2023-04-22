import type { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as logs from '@aws-cdk/aws-logs';
import { method } from "lodash-es";

export class SlackgptStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB
    const messagesTable = new cdk.aws_dynamodb.Table(this, "messagesTable", {
      tableName: "slackGPTNode--messages",
      partitionKey: {
        name: "id",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    messagesTable.addGlobalSecondaryIndex({
      indexName: "threadTsIndex",
      partitionKey: {
        name: "threadTs",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
    });

    // Get Api/Secret Key from SSM Parameter Store
    const slackSigningSecret =
      cdk.aws_ssm.StringParameter.valueForStringParameter(
        this,
        "slackGPTNode-slackSigningSecret"
      );
    const slackBotToken = cdk.aws_ssm.StringParameter.valueForStringParameter(
      this,
      "slackGPTNode-slackBotToken"
    );
    const openAiApiKey = cdk.aws_ssm.StringParameter.valueForStringParameter(
      this,
      "slackGPTNode-openAiApiKey"
    );

    // APIGW LambdaFunction
    const apiFn = new cdk.aws_lambda_nodejs.NodejsFunction(this, "callSlackGPTFn", {
      functionName: 'callSlackGPT',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      projectRoot: "..",
      entry: "server/src/handler.ts",
      environment: {
        // 環境変数にシークレットとAPIキーをセット
        SLACK_SIGNING_SECRET: slackSigningSecret,
        SLACK_BOT_TOKEN: slackBotToken,
        OPEN_AI_API_KEY: openAiApiKey,
        MESSAGES_TABLE_NAME: messagesTable.tableName,
      },
      bundling: {
        sourceMap: true,
      },
      timeout: cdk.Duration.seconds(29),
    });
    messagesTable.grantReadWriteData(apiFn);

    // APIGW
    const api = new cdk.aws_apigateway.RestApi(this, "slackGPTApi", {
      restApiName: 'slackGPT',
      defaultMethodOptions: {
        methodResponses: [{ statusCode: "200" }]
      },
      deployOptions: {
        tracingEnabled: true,
        stageName: "api",
        //実行ログの設定
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      cloudWatchRole: true,
    });

    const slackGPT = api.root.addResource('slackGPT')
    slackGPT.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(apiFn));
  }
}