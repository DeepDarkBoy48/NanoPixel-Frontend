import request from "@/utils/request";

export const getCategoryListService = () => {
  return request.get("/category");
};
