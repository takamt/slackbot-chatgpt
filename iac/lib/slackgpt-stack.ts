import type { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

export class SlackgptStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDBテーブル
    const messagesTable = new cdk.aws_dynamodb.Table(this, "messagesTable", {
      tableName: "slackChatGptBotNode-messages",
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

    // 各種シークレット・APIキーをSSMパラメータストアから取得
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
      "slackGptNode-openAiApiKey"
    );

    // APIGW Lambda関数
    const apiFn = new cdk.aws_lambda_nodejs.NodejsFunction(this, "apiFn", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      entry: "../server/src/handler.ts",
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
    const api = new cdk.aws_apigateway.RestApi(this, "api", {
      deployOptions: {
        tracingEnabled: true,
        stageName: "api",
      },
    });
    api.root.addProxy({
      defaultIntegration: new cdk.aws_apigateway.LambdaIntegration(apiFn),
    });
  }
}