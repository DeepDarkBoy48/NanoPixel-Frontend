import request from "@/utils/request";

// AI 图片编辑接口：上传图片与提示词，返回编辑后的图片 URL
export const imageEditService = (formData) => {
    return request.post("ai/imageEdit", formData);
};

// 获取所有媒体库信息的接口（分页 + 排序）
// sortBy: 'review_count' | 'createtime'
export const getAllLibraryService = (pageNum, pageSize, sortBy) => {
    const params = { pageNum, pageSize };
    if (sortBy) params.sortBy = sortBy;
    return request.get("ai/Alllibrary", { params });
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

// 根据媒体ID获取原图URL
export const getMediaOriginUrlService = (mediaId) => {
    return request.get("ai/media/originurl", { params: { mediaId } });
};

// 根据媒体ID获取详细信息
export const getMediaByIdService = (mediaId) => {
    return request.get(`ai/media/${mediaId}`);
};

// Prompt 分类管理
export const listPromptCategoriesService = () => {
    return request.get("prompt-category");
};

export const createPromptCategoryService = (payload) => {
    return request.post("prompt-category", payload);
};

export const updatePromptCategoryService = (id, payload) => {
    return request.put(`prompt-category/${id}`, payload);
};

export const deletePromptCategoryService = (id) => {
    return request.delete(`prompt-category/${id}`);
};

// Prompt 管理
export const listSavedPromptsService = (categoryId) => {
    return request.get("saved-prompt", { params: categoryId ? { categoryId } : {} });
};

export const createSavedPromptService = (payload) => {
    return request.post("saved-prompt", payload);
};

export const updateSavedPromptService = (id, payload) => {
    return request.put(`saved-prompt/${id}`, payload);
};

export const deleteSavedPromptService = (id) => {
    return request.delete(`saved-prompt/${id}`);
};

// 评论（Review）相关接口
export const listReviewsByMediaService = (mediaId) => {
    return request.get(`review/list/${mediaId}`);
};

export const listUserReviewsService = () => {
    return request.get("review/userlist");
};

export const addReviewService = (payload) => {
    return request.post("review/add", payload);
};

export const deleteReviewService = (id) => {
    return request.delete(`review/${id}`);
};

// 清空聊天记忆（需要携带 sid）
export const clearChatMemoryService = (sid) => {
    // 后端使用 @RequestParam("sid") 接收，因此通过 query 参数传递
    return request.post("chatroom/clear", null, { params: { sid } });
};

// Embed 文档相关接口
export const uploadEmbedPdfService = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request.post("embed/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const listEmbedPdfService = () => {
    return request.post("embed/list");
};

export const deleteEmbedPdfService = (fileId) => {
    return request.delete("embed/delete", {
        params: { fileid: fileId },
    });
};
