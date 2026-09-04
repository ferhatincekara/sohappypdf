import { APIError } from "better-auth";

export function toAuthHandlerErrorResponse(
  error: unknown,
): Response | undefined {
  if (!(error instanceof APIError)) {
    return undefined;
  }

  return new Response(
    JSON.stringify(error.body ?? { message: error.message }),
    {
      status: error.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
