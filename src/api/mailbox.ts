import { getDoc, patchDoc, postDoc } from "./wrappers";


export const addMailbox = async (domain: string, data: Record<string, string | string[]>) => {
  const rs = await postDoc("/domains/" + domain + "/mailboxes", data);

  return rs
}

export const getMailboxes = async (domain: string) => {
  const rs = await getDoc("/domains/" + domain + "/mailboxes");
  return rs.success ? rs.data : [];
}
