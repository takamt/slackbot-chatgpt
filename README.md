# SlackGPT

- SlackBotでChatGPT API経由の会話を行うAWS CDK構築

## ## Description

- AWS CDKでインフラ構築
  - SSM
  - APIGW
  - Lambda
  - DynamoDB
- SlackBot（bolt）に送ったメッセージをChatGPT APIに投げかけ、返答をbot返答
- DynamoDBでスレッド単位で会話記録し、ChatGPT APIのメッセージに含める

## TODO

- [ ] いままでの会話分を次のメッセージへ渡す際に要約を挟む
- [ ] プロンプトインジェクション
- [ ] etc