import request from "@/utils/request";

// AI 图片编辑接口：上传图片与提示词，返回编辑后的图片 URL
export const imageEditService = (formData) => {
    return request.post("ai/imageEdit", formData);
};

// 获取所有媒体库信息的接口
export const getAllLibraryService = () => {
    return request.get("ai/Alllibrary");
};