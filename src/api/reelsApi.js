import { api, unwrapPage } from "./client";
const REELS = "/reels";
export const getReels = async ({ page = 0, size = 10 } = {}) => {
  const { data } = await api.get(REELS, { params: { page, size } });
  return unwrapPage(data);
};
