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
                    <el-form label-width="84px" class="form">
                        <el-form-item label="提示词">
                            <div class="preset-toolbar">
                                <div class="row">
                                    <el-select v-model="selectedPreset" placeholder="快速模版（可选）" clearable filterable size="large"
                                        class="preset-select" @change="onPresetChange">
                                        <el-option v-for="item in presetOptions" :key="item.value" :label="item.label"
                                            :value="item.value" />
                                    </el-select>
                                    <el-button @click="randomPreset" :disabled="submitting" plain>随机模版</el-button>
                                    <el-button @click="copyPrompt" :disabled="!prompt.trim()" plain>复制提示词</el-button>
                                </div>
                                <div class="row">
                                    <el-select v-model="selectedSubject" placeholder="选择主体类型" clearable size="large"
                                        class="subject-select">
                                        <el-option v-for="item in subjectOptions" :key="item.value" :label="item.label"
                                            :value="item.value" />
                                    </el-select>
                                    <el-select v-model="selectedScene" placeholder="选择场景" clearable size="large"
                                        class="era-select">
                                        <el-option v-for="item in sceneOptionsShown" :key="item.value" :label="item.label"
                                            :value="item.value" />
                                    </el-select>
                                    <el-select v-model="selectedArtStyle" placeholder="选择艺术风格" clearable size="large"
                                        class="style-select">
                                        <el-option v-for="item in artStyleOptionsShown" :key="item.value" :label="item.label"
                                            :value="item.value" />
                                    </el-select>
                                    <el-button @click="smartCombo" :disabled="submitting" plain>智能组合</el-button>
                                </div>
                                <div class="hint">可选择「快速模版」或自由组合三个下拉菜单；系统会智能约束，保证语义合理、不乱搭配。</div>
                            </div>
                            <el-input v-model="prompt" type="textarea" :rows="7" placeholder="请选择上方模版/预设，或直接在此处输入提示词"
                                clearable />
                        </el-form-item>

                        <el-form-item label="上传图片">
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

                <div class="right">
                    <div class="preview-grid">
                        <div class="preview-card">
                            <div class="preview-title">原图预览</div>
                            <div class="preview-body">
                                <el-empty v-if="!previewUrl" description="请先选择图片" />
                                <el-image v-else :src="previewUrl" fit="contain" class="preview-image"
                                    :preview-src-list="[previewUrl]" preview-teleported />
                            </div>
                        </div>
                        <div class="preview-card">
                            <div class="preview-title">生成结果</div>
                            <div class="preview-body">
                                <el-empty v-if="!resultUrl" description="提交后查看生成结果" />
                                <el-image v-else :src="resultUrl" fit="contain" class="preview-image"
                                    :preview-src-list="[resultUrl]" preview-teleported />
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

// 直接覆盖生成的提示词（不追加）
function applyText(text) {
    prompt.value = text
}

function updatePromptFromSelections() {
    // Handle special template
    const subjectSelection = subjectOptions.find(opt => opt.value === selectedSubject.value)
    if (subjectSelection?.template) {
        applyText(subjectSelection.template)
        return
    }

    // Handle combinations
    if (!selectedSubject.value && !selectedScene.value && !selectedArtStyle.value) {
        prompt.value = ''
        return
    }

    const parts = []
    let base = `请为本图进行再创作`

    const sceneSelection = sceneOptions.find(opt => opt.value === selectedScene.value)
    if (sceneSelection) base += `，${sceneSelection.description}`

    if (subjectSelection) parts.push(`主体需要${subjectSelection.description}`)

    const styleSelection = artStyleOptions.find(opt => opt.value === selectedArtStyle.value)
    if (styleSelection) parts.push(styleSelection.description)

    const text = base + ' ' + parts.join('，') + '。要求画面富有想象力，细节精致，充满故事感。'
    applyText(text)
}

watch([selectedSubject, selectedScene, selectedArtStyle], updatePromptFromSelections)

const fileList = ref([])
const selectedFile = ref(null)
const submitting = ref(false)
const resultUrl = ref('')
const previewUrl = ref('')

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
    handleFileRemove()
    resultUrl.value = ''
}

const onSubmit = async () => {
    if (!canSubmit.value || submitting.value) return
    submitting.value = true
    try {
        const formData = new FormData()
        formData.append('file', selectedFile.value)
        formData.append('prompt', prompt.value.trim())

        const res = await imageEditService(formData)
        resultUrl.value = typeof res.data === 'string' ? res.data : (res.data?.url || '')
    } catch (e) {
    } finally {
        submitting.value = false
    }
}

watch(() => selectedFile.value, (_, __, onCleanup) => {
    onCleanup(() => revokePreview())
})

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

// 兼容性与智能组合
const compatibility = {
    subjectToScenes: {
        mech_pilot: ['cyberpunk_city', 'steampunk_sky_city', 'moon_base'],
        gothic_vampire: ['victorian_manor', 'enchanted_forest'],
        rock_star: ['concert_stage', 'retro_arcade', 'cyberpunk_city'],
        astronaut: ['moon_base', 'cyberpunk_city', 'floating_islands'],
        samurai: ['floating_islands', 'enchanted_forest', 'victorian_manor'],
        wizard: ['enchanted_forest', 'floating_islands'],
        street_dancer: ['retro_arcade', 'cyberpunk_city'],
        chef: ['magazine_studio'],
        '8_bit_hero': ['retro_arcade'],
        time_magazine_cover: ['magazine_studio']
    },
    subjectToStyles: {
        mech_pilot: ['glitch_art', 'retro_futurism', 'low_poly'],
        gothic_vampire: ['film_noir', 'oil_paint', 'van_gogh'],
        rock_star: ['glitch_art', 'retro_futurism', 'meme_style'],
        astronaut: ['retro_futurism', 'film_noir', 'low_poly'],
        samurai: ['ukiyo_e', 'van_gogh', 'oil_paint'],
        wizard: ['van_gogh', 'studio_ghibli', 'oil_paint'],
        street_dancer: ['glitch_art', 'pixel_art', 'meme_style'],
        chef: ['film_noir', 'oil_paint'],
        '8_bit_hero': ['pixel_art'],
        time_magazine_cover: ['film_noir', 'retro_futurism']
    },
    sceneToStyles: {
        cyberpunk_city: ['glitch_art', 'retro_futurism', 'pixel_art'],
        steampunk_sky_city: ['retro_futurism', 'oil_paint', 'van_gogh'],
        moon_base: ['retro_futurism', 'film_noir', 'low_poly'],
        enchanted_forest: ['van_gogh', 'studio_ghibli', 'oil_paint', 'papercraft'],
        victorian_manor: ['film_noir', 'oil_paint', 'van_gogh'],
        magazine_studio: ['film_noir', 'oil_paint'],
        retro_arcade: ['pixel_art', 'glitch_art', 'meme_style'],
        floating_islands: ['studio_ghibli', 'van_gogh', 'isometric'],
        concert_stage: ['glitch_art', 'retro_futurism', 'meme_style']
    }
}

const sceneOptionsShown = computed(() => {
    const sub = selectedSubject.value
    const allow = compatibility.subjectToScenes[sub]
    return allow ? sceneOptions.filter(o => allow.includes(o.value)) : sceneOptions
})

const artStyleOptionsShown = computed(() => {
    const sub = selectedSubject.value
    const sc = selectedScene.value
    const allowBySub = compatibility.subjectToStyles[sub]
    const allowByScene = compatibility.sceneToStyles[sc]
    return artStyleOptions.filter(o => (!allowBySub || allowBySub.includes(o.value)) && (!allowByScene || allowByScene.includes(o.value)))
})

watch(selectedSubject, () => {
    if (selectedScene.value) {
        const ok = sceneOptionsShown.value.some(o => o.value === selectedScene.value)
        if (!ok) selectedScene.value = ''
    }
    if (selectedArtStyle.value) {
        const ok = artStyleOptionsShown.value.some(o => o.value === selectedArtStyle.value)
        if (!ok) selectedArtStyle.value = ''
    }
})

watch(selectedScene, () => {
    if (selectedArtStyle.value) {
        const ok = artStyleOptionsShown.value.some(o => o.value === selectedArtStyle.value)
        if (!ok) selectedArtStyle.value = ''
    }
})

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
    // 如果都没选，给一个预置的高质量组合
    if (!selectedSubject.value && !selectedScene.value && !selectedArtStyle.value) {
        const combo = pick(curatedCombos)
        selectedSubject.value = combo.subject
        selectedScene.value = combo.scene
        selectedArtStyle.value = combo.style
        updatePromptFromSelections()
        return
    }
    // 填充缺失项，且保证兼容
    if (!selectedSubject.value) {
        // 反查与当前 scene/style 兼容的主体
        const candidates = subjectOptions.filter(su => {
            const allowScenes = compatibility.subjectToScenes[su.value]
            const allowStyles = compatibility.subjectToStyles[su.value]
            const sceneOk = selectedScene.value ? allowScenes?.includes(selectedScene.value) : true
            const styleOk = selectedArtStyle.value ? allowStyles?.includes(selectedArtStyle.value) : true
            return sceneOk && styleOk
        })
        selectedSubject.value = (pick(candidates) || {}).value || ''
    }
    if (!selectedScene.value) {
        const allowScenes = compatibility.subjectToScenes[selectedSubject.value] || sceneOptions.map(o => o.value)
        selectedScene.value = pick(sceneOptions.filter(o => allowScenes.includes(o.value)))?.value || ''
    }
    if (!selectedArtStyle.value) {
        const allowBySub = compatibility.subjectToStyles[selectedSubject.value] || artStyleOptions.map(o => o.value)
        const allowByScene = compatibility.sceneToStyles[selectedScene.value] || artStyleOptions.map(o => o.value)
        const intersection = artStyleOptions.filter(o => allowBySub.includes(o.value) && allowByScene.includes(o.value))
        selectedArtStyle.value = pick(intersection.length ? intersection : artStyleOptions)?.value || ''
    }
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
    color: #909399;
    font-size: 12px;
}

.content {
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 20px;
}

.form {
    background: #fafafa;
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
    background: #fff;
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.preview-title {
    padding: 10px 12px;
    font-weight: 600;
    background: #f7f8fa;
    border-bottom: 1px solid var(--el-border-color);
}

.preview-body {
    padding: 12px;
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

.preset-toolbar .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.preset-toolbar .row.minor { /* removed minor row in simplified UI */ }

.preset-select :deep(.el-select__wrapper) {
    --el-select-border-color: #626aef;
    --el-select-placeholder-color: #626aef;
}

.hint {
    color: #909399;
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
