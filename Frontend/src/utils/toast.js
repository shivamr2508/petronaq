import toast from "react-hot-toast";

export const showSuccess = (msg) => {
  toast.success(msg);
};

export const showError = (msg) => {
  toast.error(msg);
};

export const showLoading = (msg) => {
  return toast.loading(msg);
};

export const updateSuccess = (msg, id) => {
  toast.success(msg, { id });
};

export const updateError = (msg, id) => {
  toast.error(msg, { id });
};

export const dismissToast = (id) => toast.dismiss(id);