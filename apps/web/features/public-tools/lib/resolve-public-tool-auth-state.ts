export type PublicToolAuthState = {
  isAuthenticated: boolean;
  authPending: boolean;
};

/**
 * Browser API calls must follow the client session, not SSR. The Next.js
 * server can see a parent-domain cookie that the browser will not send to
 * the API host on a credentialed XHR.
 */
export function resolvePublicToolAuthState(input: {
  sessionPending: boolean;
  hasSessionUser: boolean;
}): PublicToolAuthState {
  if (input.sessionPending) {
    return {
      isAuthenticated: false,
      authPending: true,
    };
  }

  return {
    isAuthenticated: input.hasSessionUser,
    authPending: false,
  };
}
