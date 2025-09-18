<template>
    <div class="page-container">
        <el-card class="card" shadow="never">
            <template #header>
                <div class="header">
                    <div class="title">
                        <span>魔法修图</span>
                        <span class="subtitle">智能编辑 · 更清晰 · 去背景</span>
                    </div>
                </div>
            </template>

            <div class="content">
                <div class="left">
                    <div class="template-area form">
                        <el-form>
                            <el-form-item>
                                <div class="preset-toolbar">
                                    <div class="subcard">
                                        <div class="subcard-header">快速模版</div>
                                        <div class="row">
                                            <el-select v-model="selectedPreset" placeholder="快速模版（可选）" clearable
                                                filterable size="large" class="preset-select" @change="onPresetChange">
                                                <el-option v-for="item in presetOptions" :key="item.value"
                                                    :label="item.label" :value="item.value" />
                                            </el-select>
                                            <el-button @click="randomPreset" :disabled="submitting"
                                                plain>随机模版</el-button>
                                            <el-button @click="copyPrompt" :disabled="!prompt.trim()" plain>复制提示词
                                            </el-button>

                                        </div>
                                    </div>
                                    <div class="subcard">
                                        <div class="subcard-header subcard-header--top">
                                            <span>下拉组合模版</span>
                                            <div class="carousel-controls">
                                                <el-button :icon="ArrowLeft" circle size="small" @click="shiftPage(-1)"
                                                    :disabled="submitting" />
                                                <el-button :icon="ArrowRight" circle size="small" @click="shiftPage(1)"
                                                    :disabled="submitting" />
                                            </div>
                                        </div>
                                        <div class="carousel-container">
                                            <div class="card-viewport">
                                                <div class="subcard-header">{{ currentPageTitle }}</div>
                                                <transition name="fade" mode="out-in">
                                                    <div class="carousel-page" v-if="currentPage === 0" key="page0">
                                                        <div class="row carousel-row">
                                                            <el-select v-model="selectedSubject" placeholder="选择主体类型"
                                                                clearable size="large" class="subject-select">
                                                                <el-option v-for="item in subjectOptions"
                                                                    :key="item.value" :label="item.label"
                                                                    :value="item.value" />
                                                            </el-select>
                                                            <el-select v-model="selectedScene" placeholder="选择场景"
                                                                clearable size="large" class="era-select">
                                                                <el-option v-for="item in sceneOptions"
                                                                    :key="item.value" :label="item.label"
                                                                    :value="item.value" />
                                                            </el-select>
                                                        </div>
                                                        <div class="row carousel-row">
                                                            <el-select v-model="selectedArtStyle" placeholder="选择艺术风格"
                                                                clearable size="large" class="style-select">
                                                                <el-option v-for="item in artStyleOptions"
                                                                    :key="item.value" :label="item.label"
                                                                    :value="item.value" />
                                                            </el-select>
                                                            <el-button @click="smartCombo" :disabled="submitting"
                                                                plain>智能组合</el-button>
                                                        </div>
                                                    </div>
                                                    <div class="row carousel-row" v-else-if="currentPage === 1"
                                                        key="page1">
                                                        <el-select v-model="selectedEra" placeholder="年代风格模版" clearable
                                                            size="large">
                                                            <el-option v-for="item in eraOptions" :key="item.value"
                                                                :label="item.label" :value="item.value" />
                                                        </el-select>
                                                    </div>
                                                    <div class="row carousel-row" v-else key="page2">
                                                        <el-select v-model="selectedCelebrity" placeholder="名人站在你身边模版"
                                                            clearable size="large">
                                                            <el-option v-for="item in celebrityOptions"
                                                                :key="item.value" :label="item.label"
                                                                :value="item.value" />
                                                        </el-select>
                                                        <el-select v-model="selectedPose" placeholder="名人和你的姿势模版"
                                                            clearable size="large">
                                                            <el-option v-for="item in poseOptions" :key="item.value"
                                                                :label="item.label" :value="item.value" />
                                                        </el-select>
                                                    </div>
                                                </transition>
                                            </div>
                                        </div>
                                        <div class="hint">可选择「快速模版」或自由组合三个下拉菜单；不做约束，随心搭配。</div>
                                    </div>
                                </div>
                            </el-form-item>
                        </el-form>
                    </div>

                    <div class="input-area form">
                        <el-form>
                            <el-form-item>
                                <el-select v-model="selectedModel" placeholder="选择模型" size="large"
                                    style="min-width: 180px">
                                    <el-option v-for="m in modelOptions" :key="m.value" :label="m.label"
                                        :value="m.value" />
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-input v-model="prompt" type="textarea" :rows="7"
                                    placeholder="请选择上方模版/预设，或直接在此处输入提示词" clearable />
                            </el-form-item>
                            <el-form-item>
                                <el-upload class="uploader" :auto-upload="false" :limit="1" :show-file-list="true"
                                    :on-change="handleFileChange" :on-remove="handleFileRemove" :file-list="fileList"
                                    accept="image/*">
                                    <el-button type="primary">选择图片</el-button>
                                    <template #tip>
                                        <div class="el-upload__tip">仅支持单张图片，建议不超过 10MB</div>
                                    </template>
                                </el-upload>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" size="large" :disabled="!canSubmit || submitting"
                                    :loading="submitting" @click="onSubmit">提交</el-button>
                                <el-button @click="onReset" :disabled="submitting">重置</el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                </div>

                <div class="right">
                    <div class="preview-grid">
                        <div class="preview-card">
                            <div class="preview-title">原图预览</div>
                            <div class="preview-body">
                                <el-empty v-if="!previewUrl" description="请先选择图片" />
                                <el-image v-else :src="previewUrl" fit="contain" class="preview-image"
                                    :preview-src-list="[previewUrl]" preview-teleported hide-on-click-modal />
                            </div>
                        </div>
                        <div class="preview-card">
                            <div class="preview-title">生成结果</div>
                            <div class="preview-body">
                                <el-empty v-if="!resultUrl" description="提交后查看生成结果" />
                                <el-image v-if="resultUrl" :src="resultUrl" fit="contain" class="preview-image"
                                    :preview-src-list="[resultUrl]" preview-teleported hide-on-click-modal />
                                <div v-if="submitting" class="generation-loading">
                                    <div class="generation-spinner" aria-hidden="true"></div>
                                    <div class="generation-text" aria-live="polite">
                                        <strong>正在生成…</strong>
                                        <span>预计耗时约30秒，请耐心等待</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { imageEditService } from '@/api/ai'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const prompt = ref('')

// 快速模版
const selectedPreset = ref('')

const presetOptions = [
    { value: 'bg_remove', label: '一键去背景（产品抠图）', template: '对主体进行精准抠图，去除复杂背景，保持边缘平滑自然，输出透明背景PNG，避免锯齿与发丝损失。' },
    { value: 'photo_restore', label: '老照片修复高清化', template: '对图像进行划痕修复、噪点去除与超分辨率增强，恢复清晰度与细节，肤色自然不过度磨皮，保留原始质感。' },
    { value: 'portrait_beauty', label: '人像美化与光影', template: '针对人像进行自然美化与光影塑形，细腻肤质、保留毛孔及纹理，眼神高光、层次分明，避免过度处理。' },
    { value: 'product_hero', label: '电商主图·质感提升', template: '将主体提升为电商主图效果，干净高亮背景，质感增强，增加柔和反射光与轮廓光，构图标准居中，强调商业质感。' },
    { value: 'anime_style', label: '二次元动漫化', template: '将主体转换为高质量二次元动漫风格，线条清晰、色块干净、色彩和谐，保留人物特征与神态。' },
    { value: 'pixar_style', label: '皮克斯插画风', template: '以皮克斯风格重绘主体，柔和色彩与圆润建模感，温暖光影，富有童趣与叙事氛围。' },
    { value: 'film_poster', label: '电影海报感', template: '整体重构为电影海报风，戏剧化光影，高对比与胶片颗粒，构图中心突出主体，加入电影感色彩分级。' },
    { value: 'neon_cyber', label: '霓虹赛博感', template: '加入赛博霓虹视觉语言，冷暖对撞的蓝粉光，金属质感与发光边缘，未来都市的色彩氛围。' },
    { value: 'sketch_style', label: '黑白素描重绘', template: '采用铅笔素描风格重绘，线条富有力度与层次，保留光影明暗结构与形体体积。' },
    { value: 'oil_paint', label: '油画厚涂风', template: '以油画厚涂风格重绘，笔触可见，色彩饱满，光影块面分明，具有画布材质感。' },
    { value: 'studio_lighting', label: '棚拍级打光', template: '模拟摄影棚三点布光，主光、轮廓光与补光协调，阴影干净，提升立体感与质感。' },
    { value: 'dream_mobius', label: '莫比乌斯循环梦境', template: '在同一画面中构建莫比乌斯带式的空间循环，主体处于不可思议的空间反转与无尽阶梯之间，逻辑悖论与视觉错觉并存。' },
    { value: 'giant_scale', label: '巨物化世界', template: '将主体巨物化处理，置于微缩城市模型中，倾斜移轴景深，制造强烈的尺度反差与戏剧感。' },
    { value: 'paper_theatre', label: '纸艺立体剧场', template: '所有元素以纸艺与剪影构建，层层叠叠的纸张深度，温暖逆光与柔和阴影，手作质感明显。' },
]

// 组合选择
const TOTAL_PAGES = 3
const currentPage = ref(0)
const pageTitles = ['核心三元素', '时空之旅', '名人合影']
const currentPageTitle = computed(() => pageTitles[currentPage.value])

// Card 0 State
const selectedSubject = ref('')
const subjectOptions = [
    {
        value: 'commercial_figure',
        label: '商业化手办 (特别模板)',
        template: '使用 nano-banana 模型创建一个 1/7 比例的商业化手办，风格和环境都要求逼真。将手办放置在电脑桌上，使用一个没有任何文字的圆形透明亚克力底座。电脑屏幕上显示手办的 ZBrush 建模过程。电脑屏幕旁边放置一个印有原始插图的万代风格玩具包装盒。'
    },
    { value: '8_bit_hero', label: '8比特游戏英雄', description: '将其像素化，呈现出经典红白机（NES）8比特画风，背景为横版过关游戏。' },
    { value: 'time_magazine_cover', label: '《时代》杂志封面人物', description: '将其作为封面人物登上《时代》周刊，要求有经典的红色边框，顶部的“TIME”标志，以及引人注目的封面标题。' },
    { value: 'gothic_vampire', label: '哥特吸血鬼', description: '将其转变为一名优雅而危险的哥特吸血鬼，背景设定在维多利亚时代的古堡中，色调阴暗。' },
    { value: 'mech_pilot', label: '机甲驾驶员', description: '将其描绘成一名坐在巨大机甲驾驶舱内的精英驾驶员，舱内布满复杂的仪表盘和闪烁的屏幕。' },
    { value: 'rock_star', label: '摇滚巨星', description: '将其变为一名正在舞台上激情表演的摇滚巨星，周围有闪烁的舞台灯光、狂热的观众和乐队成员。' },
    { value: 'astronaut', label: '宇航员', description: '穿着宇航服置身太空或空间站舷窗前，反射面罩中映出星空与地球。' },
    { value: 'samurai', label: '武士', description: '化身日本战国时代的武士，穿着铠甲，持刀而立，背景有樱花与和风建筑。' },
    { value: 'street_dancer', label: '街舞舞者', description: '化身街头舞者，动感姿态与喷绘墙面，霓虹与动感灯带。' },
    { value: 'wizard', label: '大法师', description: '化身奇幻世界的大法师，长袍与法杖，法阵符文与流动的光。' },
    { value: 'chef', label: '米其林主厨', description: '穿着主厨服在开放式厨房，火焰翻腾、食材飞舞，色香味俱全。' },
]

const selectedScene = ref('')
const sceneOptions = [
    { value: 'cyberpunk_city', label: '赛博朋克都市', description: '背景设定为一座霓虹灯闪烁、高楼林立的赛博朋克都市，空中飞车穿梭，地面阴雨连绵。' },
    { value: 'enchanted_forest', label: '魔法森林', description: '背景是一片充满魔法生物和发光植物的神秘森林，阳光透过茂密的树冠洒下斑驳的光点。' },
    { value: 'atlantis', label: '深海亚特兰蒂斯', description: '场景位于失落的深海城市亚特兰蒂斯，周围有发光的珊瑚、古代遗迹和巡游的海洋生物。' },
    { value: 'steampunk_sky_city', label: '蒸汽朋克天空城', description: '场景是一座由巨大齿轮和蒸汽管道构成的浮空城市，远处有飞艇和巨大的机械结构。' },
    { value: 'endless_office', label: '无限循环的办公室', description: '置身于一个“后室”（Backrooms）风格的无限延伸、令人不安的办公室空间，灯光惨白，布局单调。' },
    { value: 'moon_base', label: '月面基地', description: '在月球表面的科研基地，低重力尘土、远处地球悬挂在天幕中，冷白环境光。' },
    { value: 'victorian_manor', label: '维多利亚古宅', description: '维多利亚时代的古宅与烛光走廊，彩绘玻璃窗投下幽暗斑驳的光影。' },
    { value: 'magazine_studio', label: '杂志棚拍背景', description: '极简杂志棚拍背景，干净无干扰，专业棚灯布光与柔和反光板。' },
    { value: 'retro_arcade', label: '复古街机厅', description: '满墙霓虹与街机机台，地面反光，荧光招牌与像素屏幕闪烁。' },
    { value: 'floating_islands', label: '浮空群岛', description: '漂浮在天空中的群岛与瀑布，云海翻涌，奇幻植被。' },
    { value: 'concert_stage', label: '演唱会舞台', description: '巨型舞台灯架、激光与烟雾，观众海与高能灯光效果。' },
]

const selectedArtStyle = ref('')
const artStyleOptions = [
    { value: 'low_poly', label: '低多边形 (PS1游戏风)', description: '画面风格采用早期3D游戏（PS1时代）的低多边形（Low Poly）美学，有明显的像素颗粒感和纹理抖动。' },
    { value: 'retro_futurism', label: '复古未来主义海报', description: '渲染成一张上世纪60年代风格的复古未来主义海报，色彩鲜艳，构图大胆，充满对未来的乐观想象。' },
    { value: 'glitch_art', label: '故障艺术 (Glitch Art)', description: '画面中加入“故障艺术”元素，如数据错误、色彩偏移和像素错位，营造出数字化的破碎感。' },
    { value: 'van_gogh', label: '梵高《星空》笔触', description: '用梵高标志性的旋转、粗犷的笔触和强烈的色彩来重绘整个画面，使其充满表现主义的激情。' },
    { value: 'film_noir', label: '黑白电影黑色片风格', description: '采用“黑色电影”风格，画面为高对比度的黑白，利用强烈的阴影和光线来塑造人物和氛围，充满悬疑感。' },
    { value: 'meme_style', label: '表情包/梗图画质', description: '画面处理成一张典型的网络梗图（Meme），带有明显的JPEG压缩痕迹、低画质和可能存在的趣味水印或文字。' },
    { value: 'studio_ghibli', label: '吉卜力动画气质', description: '温暖柔和的色彩与手绘质感，叙事性强，氛围诗意。' },
    { value: 'pixel_art', label: '像素艺术', description: '以8/16位像素艺术风格重绘，清晰像素网格与有限色板，复古游戏氛围。' },
    { value: 'ukiyo_e', label: '浮世绘版画', description: '采用浮世绘版画风格，平涂色块、留白与木刻质感，东方构图美学。' },
    { value: 'papercraft', label: '纸艺剪影', description: '以纸艺剪影形式呈现层次与深度，边缘质感类似手工裁切。' },
    { value: 'isometric', label: '等距视角立体', description: '等距视角的微缩场景呈现，几何秩序与立体构成，画面整洁。' },
]

// 第二页：新增三个下拉
const selectedEra = ref('')
const selectedCelebrity = ref('')
const selectedPose = ref('')

const eraOptions = [
    { value: '1980s', label: '80年代复古胶片' },
    { value: '1990s', label: '90年代嘻哈街头' },
    { value: '2000s', label: '千禧年Y2K美学' },
    { value: 'victorian', label: '维多利亚时代' },
    { value: 'future_tech', label: '未来科技感' },
]

const celebrityOptions = [
    { value: 'taylor_swift', label: '泰勒·斯威夫特' },
    { value: 'tom_cruise', label: '汤姆·克鲁斯' },
    { value: 'emma_watson', label: '艾玛·沃森' },
    { value: 'dwayne_johnson', label: '道恩·强森' },
    { value: 'scarlett_johansson', label: '斯嘉丽·约翰逊' },
]

const poseOptions = [
    { value: 'side_by_side', label: '并肩站立' },
    { value: 'back_to_back', label: '背靠背合照' },
    { value: 'selfie', label: '一起温馨自拍' },
    { value: 'cheers', label: '碰杯庆祝' },
    { value: 'high_five', label: '击掌瞬间' },
]

// 直接覆盖生成的提示词（不追加）
function applyText(text) {
    prompt.value = text
}

function updatePromptFromSelections() {
    const subjectSelection = subjectOptions.find(opt => opt.value === selectedSubject.value)

    // Page 0 构文
    const buildPage0 = () => {
        if (subjectSelection?.template) return subjectSelection.template
        if (!selectedSubject.value && !selectedScene.value && !selectedArtStyle.value) return ''
        const parts = []
        let base = `请为本图进行再创作`
        const sceneSelection = sceneOptions.find(opt => opt.value === selectedScene.value)
        if (sceneSelection) base += `，${sceneSelection.description}`
        if (subjectSelection) parts.push(`主体需要${subjectSelection.description}`)
        const styleSelection = artStyleOptions.find(opt => opt.value === selectedArtStyle.value)
        if (styleSelection) parts.push(styleSelection.description)
        return base + ' ' + parts.join('，') + '。'
    }

    // Page 1 构文
    const buildPage1 = () => {
        if (!selectedEra.value) return ''
        const era = eraOptions.find(o => o.value === selectedEra.value)
        return era ? `整体画面呈现${era.label}的风格。` : ''
    }

    // Page 2 构文
    const buildPage2 = () => {
        if (!selectedCelebrity.value && !selectedPose.value) return ''
        const parts = []
        const celeb = celebrityOptions.find(o => o.value === selectedCelebrity.value)
        const pose = poseOptions.find(o => o.value === selectedPose.value)
        if (celeb && pose) {
            parts.push(`画面中需要出现名人${celeb.label}，并与你一起摆出${pose.label}的姿势`)
        } else if (celeb) {
            parts.push(`画面中需要出现名人${celeb.label}`)
        }
        return parts.join('，') + '。'
    }

    const chunks = [buildPage0(), buildPage1(), buildPage2()].filter(Boolean)
    const finalText = chunks.join(' ') + (chunks.length ? '要求画面富有想象力，细节精致，充满故事感。' : '')
    applyText(finalText)
}

watch([selectedSubject, selectedScene, selectedArtStyle, selectedEra, selectedCelebrity, selectedPose], updatePromptFromSelections)

const fileList = ref([])
const selectedFile = ref(null)
const submitting = ref(false)
const resultUrl = ref('')
const previewUrl = ref('')
// 模型选择（默认 nanobanana）
const selectedModel = ref('nanobanana')
const modelOptions = [
    { value: 'nanobanana', label: 'NanoBanana（默认）' },
    { value: 'seedream4', label: 'Seedream4' },
]

const canSubmit = computed(() => {
    return !!selectedFile.value && !!prompt.value.trim()
})

const revokePreview = () => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
}

const handleFileChange = (uploadFile, uploadFiles) => {
    selectedFile.value = uploadFile?.raw || null
    fileList.value = uploadFiles.slice(-1)
    revokePreview()
    previewUrl.value = selectedFile.value ? URL.createObjectURL(selectedFile.value) : ''
}

const handleFileRemove = () => {
    selectedFile.value = null
    fileList.value = []
    revokePreview()
    previewUrl.value = ''
}

const onReset = () => {
    prompt.value = ''
    selectedPreset.value = ''
    selectedSubject.value = ''
    selectedScene.value = ''
    selectedArtStyle.value = ''
    selectedEra.value = ''
    selectedCelebrity.value = ''
    selectedPose.value = ''
    currentPage.value = 0
    handleFileRemove()
    resultUrl.value = ''
}

const onSubmit = async () => {
    if (!canSubmit.value || submitting.value) return
    submitting.value = true
    ElMessage.info('已提交，请等待大约30秒生成结果…')
    try {
        const formData = new FormData()
        // 新增 originFile 参数：上传用户原图
        formData.append('originFile', selectedFile.value)
        // 保持兼容：继续传原有的 file 字段
        formData.append('file', selectedFile.value)
        formData.append('prompt', prompt.value.trim())
        // 传递模型参数：未选择时默认 nanobanana
        formData.append('model', selectedModel.value || 'nanobanana')

        const res = await imageEditService(formData)
        resultUrl.value = typeof res.data === 'string' ? res.data : (res.data?.url || '')
    } catch (e) {
        ElMessage.error('生成失败，请稍后重试')
    } finally {
        submitting.value = false
    }
}

watch(() => selectedFile.value, (_, __, onCleanup) => {
    onCleanup(() => revokePreview())
})

function shiftPage(direction) {
    currentPage.value = (currentPage.value + direction + TOTAL_PAGES) % TOTAL_PAGES
}

// 交互：快速模版与工具
function onPresetChange(val) {
    const tpl = presetOptions.find(i => i.value === val)?.template
    if (tpl) applyText(tpl)
}

function randomPreset() {
    if (!presetOptions.length) return
    const idx = Math.floor(Math.random() * presetOptions.length)
    selectedPreset.value = presetOptions[idx].value
    onPresetChange(selectedPreset.value)
}

// 已放开互斥约束：三个下拉可自由组合，无需兼容过滤

const curatedCombos = [
    { subject: 'mech_pilot', scene: 'cyberpunk_city', style: 'glitch_art' },
    { subject: 'gothic_vampire', scene: 'victorian_manor', style: 'film_noir' },
    { subject: 'astronaut', scene: 'moon_base', style: 'retro_futurism' },
    { subject: '8_bit_hero', scene: 'retro_arcade', style: 'pixel_art' },
    { subject: 'wizard', scene: 'enchanted_forest', style: 'van_gogh' },
    { subject: 'samurai', scene: 'floating_islands', style: 'ukiyo_e' },
    { subject: 'rock_star', scene: 'concert_stage', style: 'glitch_art' },
    { subject: 'street_dancer', scene: 'retro_arcade', style: 'pixel_art' },
    { subject: 'chef', scene: 'magazine_studio', style: 'oil_paint' },
    { subject: 'time_magazine_cover', scene: 'magazine_studio', style: 'film_noir' }
]

function smartCombo() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
    // 当前选择的组合键，用于避免重复
    const currentKey = `${selectedSubject.value}|${selectedScene.value}|${selectedArtStyle.value}`
    // 从预置高质量组合中过滤掉当前组合，保证每次点击都会“变换”
    const pool = curatedCombos.filter(c => `${c.subject}|${c.scene}|${c.style}` !== currentKey)
    const combo = pick(pool.length ? pool : curatedCombos)
    selectedSubject.value = combo.subject
    selectedScene.value = combo.scene
    selectedArtStyle.value = combo.style
    updatePromptFromSelections()
}

async function copyPrompt() {
    const text = prompt.value.trim()
    if (!text) return
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text)
        } else {
            // fallback
            const textarea = document.createElement('textarea')
            textarea.value = text
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        }
        ElMessage.success('提示词已复制')
    } catch (e) {
        ElMessage.error('复制失败，请重试')
    }
}
</script>

<style scoped>
.page-container {
    padding: 16px;
    box-sizing: border-box;
}

.card {
    width: 100%;
    border-radius: 12px;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.title {
    display: flex;
    align-items: baseline;
    gap: 12px;
}

.title>span:first-child {
    font-weight: 700;
}

.subtitle {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.content {
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 20px;
}

.left {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form {
    background: var(--app-surface-2);
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) inset;
}

.uploader :deep(.el-upload) {
    margin-right: 8px;
}

.right {
    min-width: 0;
}

.preview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.preview-card {
    background: var(--app-surface);
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.preview-title {
    padding: 10px 12px;
    font-weight: 600;
    background: var(--app-surface-2);
    border-bottom: 1px solid var(--el-border-color);
}

.preview-body {
    position: relative;
    padding: 12px;
    min-height: 280px;
}

.preview-image {
    width: 100%;
    height: 60vh;
    max-height: 70vh;
    display: block;
    border-radius: 6px;
}

/* ensure inner img fits container properly */
.preview-image :deep(img) {
    object-fit: contain;
}

.preset-toolbar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
}

.preview-body :deep(.el-empty) {
    margin: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.generation-loading {
    position: absolute;
    inset: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(64, 158, 255, 0.25);
    border-radius: 8px;
    backdrop-filter: blur(2px);
    z-index: 5;
}

.generation-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(64, 158, 255, 0.2);
    border-top-color: var(--el-color-primary);
    border-radius: 50%;
    animation: generation-spin 0.9s linear infinite;
}

.generation-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
}

.generation-text strong {
    color: var(--el-text-color-primary);
}

@keyframes generation-spin {
    to {
        transform: rotate(360deg);
    }
}

.preset-toolbar .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.subcard {
    background: var(--app-surface-2);
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) inset;
}

.subcard-header {
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color);
}


.preset-select :deep(.el-select__wrapper) {
    --el-select-border-color: #626aef;
    --el-select-placeholder-color: #626aef;
}

.subcard {
    background: var(--app-surface);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 10px;
}

.subcard-header {
    font-weight: 600;
    margin-bottom: 8px;
    text-align: center;
}

.subcard-header--top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
}

.carousel-controls {
    display: flex;
    gap: 6px;
}

.carousel-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.card-viewport {
    flex: 1;
    overflow: hidden;
    position: relative;
    min-width: 0;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.carousel-row {
    width: 100%;
}

.carousel-row .el-select {
    flex: 1;
    min-width: 160px;
}

.carousel-page {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.carousel-page .row {
    display: flex;
    gap: 8px;
}

.carousel-page .row .el-select {
    flex: 1;
    min-width: 150px;
    /* Increased min-width for selects */
    flex-basis: 150px;
    /* Added flex-basis for better control */
}


.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.hint {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.subject-select :deep(.el-select__wrapper) {
    --el-select-border-color: #409eff;
    --el-select-placeholder-color: #409eff;
}

.era-select :deep(.el-select__wrapper) {
    --el-select-border-color: #67c23a;
    --el-select-placeholder-color: #67c23a;
}

.style-select :deep(.el-select__wrapper) {
    --el-select-border-color: #e6a23c;
    --el-select-placeholder-color: #e6a23c;
}

/* 响应式 */
@media (max-width: 1200px) {
    .content {
        grid-template-columns: 360px 1fr;
    }

    .preview-image {
        height: 50vh;
    }
}

@media (max-width: 900px) {
    .content {
        grid-template-columns: 1fr;
    }

    .preview-grid {
        grid-template-columns: 1fr;
    }

    .preview-image {
        height: 45vh;
    }
}
</style>
