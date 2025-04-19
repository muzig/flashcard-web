// 创建 Vue 应用
const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

// 创建下载链接的辅助函数
function createDownloadLink(content, filename) {
    const blob = new Blob([content], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

const app = createApp({
    template: '#app-template',
    setup() {
        // 状态变量
        const themes = ref([]);
        const flashcards = ref([]);
        const currentIndex = ref(0);
        const isFlipped = ref(false);
        const selectedTheme = ref('');
        const currentThemeData = ref(null);
        const isLoading = ref(false);
        const showThemeUploadForm = ref(false);
        const showThemeUpdateForm = ref(false);
        const themeToUpdate = ref(null);

        // 从localStorage加载用户主题
        const loadUserThemes = () => {
            try {
                const savedThemes = localStorage.getItem('userThemes');
                if (savedThemes) {
                    return JSON.parse(savedThemes);
                }
            } catch (error) {
                console.error('加载用户主题失败:', error);
            }
            return [];
        };

        // 保存用户主题到localStorage
        const saveUserThemes = (userThemes) => {
            try {
                localStorage.setItem('userThemes', JSON.stringify(userThemes));
            } catch (error) {
                console.error('保存用户主题失败:', error);
            }
        };

        // 计算当前卡片
        const currentCard = computed(() => {
            if (flashcards.value.length === 0) {
                return { question: '', answer: '' };
            }
            return flashcards.value[currentIndex.value];
        });

        // 加载所有主题
        const loadAllThemes = async () => {
            try {
                isLoading.value = true;
                const response = await fetch('themes/index.json');
                const data = await response.json();

                const themePromises = data.themes.map(async (themeInfo) => {
                    const metaResponse = await fetch(`themes/${themeInfo.path}`);
                    return await metaResponse.json();
                });

                const loadedThemes = await Promise.all(themePromises);

                // 自定义主题选项在界面上单独显示，不再添加到主题列表中

                // 加载用户保存的主题
                const userThemes = loadUserThemes();

                // 合并系统主题和用户主题
                themes.value = [...loadedThemes, ...userThemes];
            } catch (error) {
                console.error('加载主题列表失败:', error);
                alert('加载主题列表失败，请刷新页面重试。');
            } finally {
                isLoading.value = false;
            }
        };

        // 加载主题
        const loadTheme = async (themeId) => {
            selectedTheme.value = themeId;

            // 如果是自定义主题，不加载文件
            if (themeId === 'custom') {
                currentThemeData.value = themes.value.find(t => t.id === 'custom');
                return;
            }

            const theme = themes.value.find(t => t.id === themeId);
            if (!theme) {
                return;
            }

            currentThemeData.value = theme;

            try {
                isLoading.value = true;

                // 检查是否是用户上传的主题
                const userThemes = loadUserThemes();
                const userTheme = userThemes.find(t => t.id === themeId);

                if (userTheme && userTheme.cardsContent) {
                    // 如果是用户主题，直接使用保存的内容
                    parseAndLoadCards(userTheme.cardsContent);
                } else if (theme.cards) {
                    // 如果是系统主题，从文件加载
                    const response = await fetch(`themes/${theme.id}/${theme.cards}`);
                    const text = await response.text();
                    parseAndLoadCards(text);
                }
            } catch (error) {
                console.error('加载主题失败:', error);
                alert('加载主题失败，请重试或选择其他主题。');
            } finally {
                isLoading.value = false;
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

        // 下载闪卡模板
        const downloadTemplate = () => {
            const templateContent = 'question\tanswer\n问题1\t答案1\n问题2\t答案2\n问题3\t答案3';
            createDownloadLink(templateContent, 'flashcard_template.tsv');
        };

        // 显示上传新主题表单
        const showNewThemeForm = () => {
            showThemeUploadForm.value = true;
            showThemeUpdateForm.value = false;
        };

        // 显示更新主题表单
        const showUpdateThemeForm = (theme) => {
            themeToUpdate.value = theme;
            showThemeUpdateForm.value = true;
            showThemeUploadForm.value = false;
        };

        // 处理新主题上传
        const handleNewThemeUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                isLoading.value = true;

                // 读取上传的TSV文件
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target.result;

                    // 生成一个随机的主题ID
                    const themeId = 'theme_' + Math.random().toString(36).substring(2, 10);

                    // 创建新主题对象
                    const newTheme = {
                        id: themeId,
                        name: file.name.replace(/\.[^\.]+$/, ''), // 使用文件名作为主题名
                        description: '自定义上传的主题',
                        icon: themeId.charAt(0),
                        color: '#' + Math.floor(Math.random()*16777215).toString(16), // 随机颜色
                        cards: null
                    };

                    // 创建包含闪卡内容的主题对象
                    const themeWithCards = {
                        ...newTheme,
                        cardsContent: text  // 保存原始TSV内容
                    };

                    // 将新主题添加到主题列表
                    themes.value.push(newTheme);

                    // 保存到localStorage
                    const userThemes = loadUserThemes();
                    userThemes.push(themeWithCards);
                    saveUserThemes(userThemes);

                    // 选择新主题并加载闪卡
                    selectedTheme.value = themeId;
                    currentThemeData.value = newTheme;
                    parseAndLoadCards(text);

                    // 关闭上传表单
                    showThemeUploadForm.value = false;
                    isLoading.value = false;

                    alert('新主题上传成功！');
                };

                reader.onerror = () => {
                    alert('读取文件失败，请重试。');
                    isLoading.value = false;
                };

                reader.readAsText(file);

            } catch (error) {
                console.error('上传主题失败:', error);
                alert('上传主题失败，请重试。');
                isLoading.value = false;
            }
        };

        // 处理主题更新
        const handleThemeUpdate = async (event) => {
            const file = event.target.files[0];
            if (!file || !themeToUpdate.value) return;

            try {
                isLoading.value = true;

                // 读取上传的TSV文件
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target.result;

                    // 选择要更新的主题
                    selectedTheme.value = themeToUpdate.value.id;
                    currentThemeData.value = themeToUpdate.value;

                    // 更新localStorage中的主题
                    const userThemes = loadUserThemes();
                    const themeIndex = userThemes.findIndex(t => t.id === themeToUpdate.value.id);

                    if (themeIndex !== -1) {
                        // 更新已存在的用户主题
                        userThemes[themeIndex].cardsContent = text;
                        saveUserThemes(userThemes);
                    } else {
                        // 如果是系统主题，创建一个副本作为用户主题
                        const themeWithCards = {
                            ...themeToUpdate.value,
                            cardsContent: text
                        };
                        userThemes.push(themeWithCards);
                        saveUserThemes(userThemes);
                    }

                    // 解析并加载闪卡
                    parseAndLoadCards(text);

                    // 关闭更新表单
                    showThemeUpdateForm.value = false;
                    themeToUpdate.value = null;
                    isLoading.value = false;

                    alert('主题更新成功！');
                };

                reader.onerror = () => {
                    alert('读取文件失败，请重试。');
                    isLoading.value = false;
                };

                reader.readAsText(file);

            } catch (error) {
                console.error('更新主题失败:', error);
                alert('更新主题失败，请重试。');
                isLoading.value = false;
            }
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

        // 删除当前闪卡
        const deleteCurrentCard = () => {
            if (flashcards.value.length === 0) return;

            // 确认删除
            if (!confirm('确定要删除当前闪卡吗？')) return;

            // 从数组中删除当前闪卡
            flashcards.value.splice(currentIndex.value, 1);

            // 如果删除后没有闪卡了
            if (flashcards.value.length === 0) {
                resetCards();
                return;
            }

            // 如果删除的是最后一张卡片，则将索引移到1
            if (currentIndex.value >= flashcards.value.length) {
                currentIndex.value = flashcards.value.length - 1;
            }

            // 重置翻转状态
            isFlipped.value = false;

            // 如果是用户主题，更新localStorage
            if (selectedTheme.value && selectedTheme.value !== 'custom') {
                updateThemeInLocalStorage();
            }
        };

        // 更新localStorage中的主题数据
        const updateThemeInLocalStorage = () => {
            const userThemes = loadUserThemes();
            const themeIndex = userThemes.findIndex(t => t.id === selectedTheme.value);

            if (themeIndex !== -1) {
                // 将当前闪卡数组转换回TSV格式
                let tsvContent = 'question\tanswer\n';
                flashcards.value.forEach(card => {
                    tsvContent += `${card.question}\t${card.answer}\n`;
                });

                // 更新用户主题的内容
                userThemes[themeIndex].cardsContent = tsvContent;
                saveUserThemes(userThemes);
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
            // 加载所有主题
            loadAllThemes();
        });

        onUnmounted(() => {
            document.removeEventListener('keydown', handleKeyDown);
        });

        // 删除主题
        const deleteTheme = (theme) => {
            // 确认删除
            if (!confirm(`确定要删除主题 "${theme.name}" 吗？该操作无法撤销。`)) return;

            // 判断是否是系统预设主题
            const isSystemTheme = ['html', 'javascript', 'vue'].includes(theme.id);

            if (isSystemTheme) {
                alert('无法删除系统预设主题。');
                return;
            }

            // 从主题列表中删除
            const themeIndex = themes.value.findIndex(t => t.id === theme.id);
            if (themeIndex !== -1) {
                themes.value.splice(themeIndex, 1);
            }

            // 从localStorage中删除
            const userThemes = loadUserThemes();
            const userThemeIndex = userThemes.findIndex(t => t.id === theme.id);
            if (userThemeIndex !== -1) {
                userThemes.splice(userThemeIndex, 1);
                saveUserThemes(userThemes);
            }

            // 如果当前正在查看该主题，则返回主页
            if (selectedTheme.value === theme.id) {
                resetCards();
            }

            alert(`主题 "${theme.name}" 已成功删除。`);
        };

        // 自定义主题数据
        const customTheme = {
            id: 'custom',
            name: '自定义主题',
            description: '上传自己的TSV文件，创建自定义闪卡集合。',
            icon: 'upload',
            color: '#8e44ad',
            cards: null
        };

        // 加载自定义主题
        const loadCustomTheme = () => {
            selectedTheme.value = 'custom';
            currentThemeData.value = customTheme;
        };

        return {
            themes,
            flashcards,
            currentIndex,
            isFlipped,
            selectedTheme,
            currentThemeData,
            isLoading,
            showThemeUploadForm,
            showThemeUpdateForm,
            themeToUpdate,
            currentCard,
            customTheme,
            loadTheme,
            loadAllThemes,
            loadCustomTheme,
            handleFileUpload,
            flipCard,
            prevCard,
            nextCard,
            resetCards,
            deleteCurrentCard,
            deleteTheme,
            downloadTemplate,
            showNewThemeForm,
            showUpdateThemeForm,
            handleNewThemeUpload,
            handleThemeUpdate
        };
    }
});

// 挂载应用
app.mount('#app');
