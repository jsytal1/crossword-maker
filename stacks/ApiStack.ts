import { Api, Config, StackContext, use } from "sst/constructs";
import { StorageStack } from "./StorageStack";

export function ApiStack({ stack }: StackContext) {
  const { table, bucket } = use(StorageStack);
  const STRIPE_SECRET_KEY = new Config.Secret(stack, "STRIPE_SECRET_KEY");

  // Create the API
  const api = new Api(stack, "Api", {
    defaults: {
      authorizer: "iam",
      function: {
        bind: [table, STRIPE_SECRET_KEY],
      },
    },
    routes: {
      "POST /grid-configs": "packages/functions/src/create.main",
      "GET /grid-configs/{id}": "packages/functions/src/get.main",
      "GET /grid-configs": "packages/functions/src/list.main",
      "PUT /grid-configs/{id}": "packages/functions/src/update.main",
      "DELETE /grid-configs/{id}": "packages/functions/src/delete.main",
      "POST /billing": "packages/functions/src/billing.main",
      "POST /grid-configs/solve": {
        authorizer: "none",
        function: {
          handler: "packages/python-functions/src/solve.handler",
          runtime: "python3.8",
          permissions: [bucket],
          environment: {
            BUCKET_NAME: bucket.bucketName,
          },
        },
      },
    },
  });

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  // Return the API resource
  return {
    api,
  };
}
