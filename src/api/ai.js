import request from "@/utils/request";

// AI 图片编辑接口：上传图片与提示词，返回编辑后的图片 URL
export const imageEditService = (formData) => {
    return request.post("ai/imageEdit", formData);
};

// 获取所有媒体库信息的接口（分页）
export const getAllLibraryService = (pageNum, pageSize) => {
    return request.get("ai/Alllibrary", { params: { pageNum, pageSize } });
};

// 获取当前用户的媒体（分页）
export const getUserLibraryService = (pageNum, pageSize) => {
    return request.get("ai/Userlibrary", { params: { pageNum, pageSize } });
};

// 设置媒体发布/不发布
export const setMediaPublicService = (mediaId, isPublic) => {
    // 接口使用 query 参数
    return request.put("ai/media/public", null, { params: { mediaId, isPublic } });
};
