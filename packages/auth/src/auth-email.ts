export type SendAuthEmailInput = {
  user: {
    email?: string;
  };
  url: string;
  token: string;
};

export type SendAuthEmail = (
  data: SendAuthEmailInput,
  request?: Request,
) => Promise<void>;

export const sendAuthEmailUnimplemented: SendAuthEmail = async () => {
  // Email delivery is wired in a later phase. Do not log url or token.
};
