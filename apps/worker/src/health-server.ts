import { createServer, type Server } from "node:http";

export type WorkerHealthStatus = "starting" | "ready" | "shutting_down";

export type WorkerHealthState = {
  getStatus(): WorkerHealthStatus;
};

export type WorkerHealthServer = {
  port: number;
  close(): Promise<void>;
};

export type StartWorkerHealthServerOptions = {
  port: number;
  host?: string;
  state: WorkerHealthState;
};

function jsonStatus(
  statusCode: number,
  status: string,
): { statusCode: number; body: string } {
  return {
    statusCode,
    body: JSON.stringify({ status }),
  };
}

export function healthResponse(
  path: string,
  method: string,
  status: WorkerHealthStatus,
): { statusCode: number; body: string } | undefined {
  if (method !== "GET" && method !== "HEAD") {
    return {
      statusCode: 405,
      body: JSON.stringify({ status: "method_not_allowed" }),
    };
  }

  if (path === "/" || path === "/live") {
    return jsonStatus(200, "alive");
  }

  if (path === "/ready" || path === "/health") {
    if (status === "ready") {
      return jsonStatus(200, "ready");
    }

    return jsonStatus(503, status);
  }

  return undefined;
}

export function startWorkerHealthServer(
  options: StartWorkerHealthServerOptions,
): Promise<WorkerHealthServer> {
  const host = options.host ?? "0.0.0.0";

  return new Promise((resolve, reject) => {
    const server: Server = createServer((request, response) => {
      const path =
        request.url === undefined ? "/" : (request.url.split("?")[0] ?? "/");
      const result = healthResponse(
        path,
        request.method ?? "GET",
        options.state.getStatus(),
      );

      if (result === undefined) {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ status: "not_found" }));
        return;
      }

      response.writeHead(result.statusCode, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      response.end(request.method === "HEAD" ? undefined : result.body);
    });

    server.once("error", reject);
    server.listen(options.port, host, () => {
      const address = server.address();
      const port =
        address !== null && typeof address === "object"
          ? address.port
          : options.port;

      resolve({
        port,
        close() {
          return new Promise((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }

              closeResolve();
            });
          });
        },
      });
    });
  });
}
