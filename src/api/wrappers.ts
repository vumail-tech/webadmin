import Instance from "./axios-interceptor";
import qs from "qs";

const handleAuthErr = (err: any, log: boolean = false) => {
  const { response } = err || {};
  const data = response?.data;
  const message = data?.message || data?.errorMessage || data?.error || "Server Error!";
  const code = response?.status;

  if (code === 401 && typeof window !== "undefined") {
    window.location.href = "/signin";
  }

  return {
    status: "fail",
    statusCode: code,
    message,
  };
};

export const getDoc = async (
  url: string,
  options?: { params?: Record<string, any>; log?: boolean },
) => {
  try {
    const { params, log = false } = options || {};
    const queryString = params
      ? `?${qs.stringify(params, { arrayFormat: "brackets" })}`
      : "";
    const res = await Instance.get(`${url}${queryString}`);
    return res.data;
  } catch (err) {
    return handleAuthErr(err, options?.log || false);
  }
};

export const postDoc = async (url: string, form: any, log: boolean = false) => {
  try {
    const res = await Instance.post(url, form);
    return res.data;
  } catch (err) {
    return handleAuthErr(err, log);
  }
};

export const putDoc = async (url: string, form: any, log: boolean = false) => {
  try {
    const res = await Instance.put(url, form);
    return res.data;
  } catch (err) {
    return handleAuthErr(err, log);
  }
};

export const patchDoc = async (url: string, form: any, log: boolean = false) => {
  try {
    const res = await Instance.patch(url, form);
    return res.data;
  } catch (err) {
    return handleAuthErr(err, log);
  }
};

export const postFormDoc = async (
  url: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
  log: boolean = false,
) => {
  try {
    const res = await Instance.post(url, formData, {
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
    return res.data;
  } catch (err) {
    return handleAuthErr(err, log);
  }
};

export const deleteDoc = async (url: string, log: boolean = false) => {
  try {
    const res = await Instance.delete(url);
    return res.data;
  } catch (err) {
    return handleAuthErr(err, log);
  }
};
