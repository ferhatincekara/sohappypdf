import axios from "axios";
import { getPublicWebEnv } from "../../config/public-env";

export function createApiClient() {
  const { apiBaseUrl } = getPublicWebEnv();

  return axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
    headers: {
      Accept: "application/json",
    },
  });
}

export const apiClient = createApiClient();
