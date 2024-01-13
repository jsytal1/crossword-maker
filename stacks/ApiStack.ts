import { Api, StackContext, use } from "sst/constructs";
import { StorageStack } from "./StorageStack";

export function ApiStack({ stack }: StackContext) {
  const { table } = use(StorageStack);

  // Create the API
  const api = new Api(stack, "Api", {
    defaults: {
      authorizer: "iam",
      function: {
        bind: [table],
      },
    },
    routes: {
      "POST /grid-configs": "packages/functions/src/create.main",
      "GET /grid-configs/{id}": "packages/functions/src/get.main",
      "GET /grid-configs": "packages/functions/src/list.main",
      "PUT /grid-configs/{id}": "packages/functions/src/update.main",
      "DELETE /grid-configs/{id}": "packages/functions/src/delete.main",
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
