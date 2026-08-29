import axios from "axios";
import { getBrowserApiBaseUrl } from "@/config/public-env";

export function createApiClient() {
  return axios.create({
    baseURL: getBrowserApiBaseUrl(),
    withCredentials: true,
    headers: {
      Accept: "application/json",
    },
  });
}

export const apiClient = createApiClient();
