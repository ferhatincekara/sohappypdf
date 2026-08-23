import type { AxiosInstance } from "axios";
import { apiClient } from "@/lib/api/client";
import type {
  ConversionListQuery,
  ConversionListResponse,
  CreateConversionInput,
  CreateConversionResponse,
  GetConversionResponse,
  PublicConversion,
} from "../types/conversion";
import { toConversionClientError } from "./conversion-errors";

export class ConversionApiRequestError extends Error {
  readonly clientError: ReturnType<typeof toConversionClientError>;

  constructor(error: unknown) {
    super("Conversion request failed");
    this.name = "ConversionApiRequestError";
    this.clientError = toConversionClientError(error);
  }
}

export type ConversionApi = {
  create: (input: CreateConversionInput) => Promise<PublicConversion>;
  get: (id: string) => Promise<PublicConversion>;
  list: (query?: ConversionListQuery) => Promise<ConversionListResponse>;
};

export function createConversionApi(
  client: AxiosInstance = apiClient,
): ConversionApi {
  return {
    async create(input) {
      try {
        const response = await client.post<CreateConversionResponse>(
          "/api/v1/conversions",
          {
            sourceFileId: input.sourceFileId,
            targetFormat: input.targetFormat,
            ...(input.type === undefined ? {} : { type: input.type }),
          },
          input.idempotencyKey === undefined
            ? undefined
            : {
                headers: {
                  "Idempotency-Key": input.idempotencyKey,
                },
              },
        );

        return response.data.conversion;
      } catch (error) {
        throw new ConversionApiRequestError(error);
      }
    },

    async get(id) {
      try {
        const response = await client.get<GetConversionResponse>(
          `/api/v1/conversions/${id}`,
        );
        return response.data.conversion;
      } catch (error) {
        throw new ConversionApiRequestError(error);
      }
    },

    async list(query = {}) {
      try {
        const response = await client.get<ConversionListResponse>(
          "/api/v1/conversions",
          {
            params: {
              ...(query.cursor === undefined ? {} : { cursor: query.cursor }),
              ...(query.limit === undefined ? {} : { limit: query.limit }),
              ...(query.status === undefined ? {} : { status: query.status }),
            },
          },
        );

        return response.data;
      } catch (error) {
        throw new ConversionApiRequestError(error);
      }
    },
  };
}

export const conversionApi = createConversionApi();
