// 创建 Vue 应用
const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

const app = createApp({
    template: '#app-template',
    setup() {
        // 主题列表
        const themes = [
            {
                id: 'html',
                name: 'HTML/CSS 基础',
                description: '学习网页开发的基础知识，包括HTML标签、CSS样式等内容。',
                file: 'html_cards.tsv'
            },
            {
                id: 'js',
                name: 'JavaScript 基础',
                description: '学习JavaScript编程语言的核心概念和常用功能。',
                file: 'js_cards.tsv'
            },
            {
                id: 'vue',
                name: 'Vue.js 框架',
                description: '学习Vue.js框架的基本概念、组件化开发和状态管理。',
                file: 'vue_cards.tsv'
            },
            {
                id: 'custom',
                name: '自定义主题',
                description: '上传自己的TSV文件，创建自定义闪卡集合。',
                file: null
            }
        ];

        // 状态变量
        const flashcards = ref([]);
        const currentIndex = ref(0);
        const isFlipped = ref(false);
        const selectedTheme = ref('');

        // 计算当前卡片
        const currentCard = computed(() => {
            if (flashcards.value.length === 0) {
                return { question: '', answer: '' };
            }
            return flashcards.value[currentIndex.value];
        });

        // 加载主题
        const loadTheme = async (themeId) => {
            selectedTheme.value = themeId;
            
            // 如果是自定义主题，不加载文件
            if (themeId === 'custom') {
                return;
            }
            
            const theme = themes.find(t => t.id === themeId);
            if (!theme || !theme.file) {
                return;
            }
            
            try {
                const response = await fetch(theme.file);
                const text = await response.text();
                parseAndLoadCards(text);
            } catch (error) {
                console.error('加载主题失败:', error);
                alert('加载主题失败，请重试或选择其他主题。');
            }
        };

        // 处理文件上传
        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                parseAndLoadCards(text);
            };
            reader.onerror = () => {
                alert('读取文件失败，请重试。');
            };
            reader.readAsText(file);
        };

        // 解析TSV文件并加载卡片
        const parseAndLoadCards = (text) => {
            try {
                const lines = text.trim().split('\n');
                const cards = [];
                
                // 跳过标题行
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const [question, answer] = line.split('\t');
                    if (question && answer) {
                        cards.push({ question, answer });
                    }
                }
                
                if (cards.length === 0) {
                    alert('没有找到有效的闪卡数据，请检查文件格式。');
                    return;
                }
                
                flashcards.value = cards;
                currentIndex.value = 0;
                isFlipped.value = false;
            } catch (error) {
                console.error('解析文件失败:', error);
                alert('解析文件失败，请确保文件格式正确。');
            }
        };

        // 翻转卡片
        const flipCard = () => {
            isFlipped.value = !isFlipped.value;
        };

        // 上一张卡片
        const prevCard = () => {
            if (currentIndex.value > 0) {
                currentIndex.value--;
                isFlipped.value = false;
            }
        };

        // 下一张卡片
        const nextCard = () => {
            if (currentIndex.value < flashcards.value.length - 1) {
                currentIndex.value++;
                isFlipped.value = false;
            }
        };

        // 重置卡片
        const resetCards = () => {
            flashcards.value = [];
            currentIndex.value = 0;
            isFlipped.value = false;
            selectedTheme.value = '';
        };

        // 键盘事件处理
        const handleKeyDown = (e) => {
            if (flashcards.value.length === 0) return;
            
            if (e.key === 'ArrowLeft') {
                prevCard();
            } else if (e.key === 'ArrowRight') {
                nextCard();
            } else if (e.key === ' ' || e.key === 'Enter') {
                flipCard();
                e.preventDefault(); // 防止空格滚动页面
            }
        };

        // 组件挂载和卸载时添加/移除键盘事件监听
        onMounted(() => {
            document.addEventListener('keydown', handleKeyDown);
        });

        onUnmounted(() => {
            document.removeEventListener('keydown', handleKeyDown);
        });

        return {
            themes,
            flashcards,
            currentIndex,
            isFlipped,
            selectedTheme,
            currentCard,
            loadTheme,
            handleFileUpload,
            flipCard,
            prevCard,
            nextCard,
            resetCards
        };
    }
});

// 挂载应用
app.mount('#app');
