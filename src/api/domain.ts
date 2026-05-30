import { getDoc, patchDoc, postDoc } from "./wrappers";


export const addDomain = async (domain: string, planKey?: string) => {
  const rs = await postDoc("/domains", { domain, planKey });

  return rs
}

export const getDomain = async (domain: string) => {
  const rs = await getDoc("/domains/" + domain);
  return rs
}
