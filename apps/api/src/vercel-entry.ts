import { getRequestListener } from "@hono/node-server";
import { Hono } from "hono";
import app from "./index.js";

const vercelApp = new Hono();
vercelApp.route("/", app);
vercelApp.route("/api", app);

const handleFetch = (request: Request): Promise<Response> =>
  Promise.resolve(vercelApp.fetch(request));

export const GET = handleFetch;
export const POST = handleFetch;
export const PUT = handleFetch;
export const PATCH = handleFetch;
export const DELETE = handleFetch;
export const OPTIONS = handleFetch;
export const HEAD = handleFetch;

export default getRequestListener(handleFetch);
