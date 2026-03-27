import { patchDoc } from "./wrappers";


export const bumpToAdmin = async (token?: string) => {
  const rs = await patchDoc("/users", {});
  return rs.success;
}
