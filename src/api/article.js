import request from "@/utils/request";

//获取分类列表接口
export const getCategoryListService = () => {
  return request.get("/category");
};

//添加分类接口
export const addCategoryService = (categoryData) => {
  return request.post("/category", categoryData);
};

//更新分类接口
export const updateCategoryService = (categoryData) => {
  return request.put("/category", categoryData);
};

//删除分类接口
export const deleteCategoryService = (id) => {
  return request.delete("/category?id=" + id);
};

//文章列表接口
export const getArticleListService = (parms) => {
  return request.get("/article", { params: parms });
};

//文章添加
export const articleAddService = (articleData) => {
  return request.post('/article', articleData);

};


//文章更新
export const articleUpdateService = (articleData) => {
  return request.put('/article', articleData);
};

//文章删除
export const articleDeleteService = (id) => {
  return request.delete('/article?id=' + id);
};