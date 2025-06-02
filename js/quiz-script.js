// 操作系统选择题通用脚本

// 禁止右键菜单
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// 禁止选中文本
document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
});

// 禁止拖拽
document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
});

// 禁止复制相关快捷键
document.addEventListener('keydown', function(e) {
    // 禁止 Ctrl+A (全选)
    if (e.ctrlKey && e.keyCode === 65) {
        e.preventDefault();
        return false;
    }
    // 禁止 Ctrl+C (复制)
    if (e.ctrlKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
    }
    // 禁止 Ctrl+V (粘贴)
    if (e.ctrlKey && e.keyCode === 86) {
        e.preventDefault();
        return false;
    }
    // 禁止 Ctrl+X (剪切)
    if (e.ctrlKey && e.keyCode === 88) {
        e.preventDefault();
        return false;
    }
    // 禁止 F12 (开发者工具)
    if (e.keyCode === 123) {
        e.preventDefault();
        return false;
    }
    // 禁止 Ctrl+Shift+I (开发者工具)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
    }
    // 禁止 Ctrl+U (查看源代码)
    if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
    }
});

// 全局变量
let answeredQuestions = new Set();
let userAnswers = {}; // 存储用户答案
let totalQuestions = 0; // 总题数
let currentPageKey = ''; // 当前页面的存储键

// 检查答案函数
function checkAnswer(questionNum, correctAnswer) {
    const questionDiv = document.querySelector(`input[name="q${questionNum}"]`).closest('.question');
    const options = questionDiv.querySelectorAll('.option');
    const selectedOption = questionDiv.querySelector('input[type="radio"]:checked');
    
    if (!selectedOption) return;
    
    const selectedValue = selectedOption.value;
    
    // 记录用户答案
    userAnswers[questionNum] = {
        selected: selectedValue,
        correct: correctAnswer,
        isCorrect: selectedValue === correctAnswer
    };
    
    // 显示正确答案和错误答案
    options.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio.value === correctAnswer) {
            option.classList.add('correct');
        } else if (radio.checked && radio.value !== correctAnswer) {
            option.classList.add('incorrect');
        }
    });
    
    // 显示解释（如果存在）
    const explanation = questionDiv.querySelector('.explanation');
    if (explanation) {
        explanation.classList.add('show');
    }
    
    // 自动保存进度
    saveProgress();
    updateProgressDisplay();
    
    // 检查是否所有题目都已完成
    checkAllQuestionsCompleted();
}

// 检查所有题目是否完成
function checkAllQuestionsCompleted() {
    if (Object.keys(userAnswers).length === totalQuestions) {
        // 延迟显示结果，让用户看到最后一题的答案
        setTimeout(() => {
            showQuizResults();
        }, 1000);
    }
}

// 显示测验结果
function showQuizResults() {
    const correctCount = Object.values(userAnswers).filter(answer => answer.isCorrect).length;
    const accuracy = ((correctCount / totalQuestions) * 100).toFixed(1);
    
    // 获取错题题号
    const wrongQuestions = [];
    for (let questionNum in userAnswers) {
        if (!userAnswers[questionNum].isCorrect) {
            wrongQuestions.push(questionNum);
        }
    }
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'quiz-modal';
    modal.innerHTML = `
        <div class="quiz-modal-content">
            <h2>🎯 测验完成！</h2>
            <div class="quiz-result-stats">
                <p><strong>总题数：</strong>${totalQuestions}</p>
                <p><strong>正确题数：</strong>${correctCount}</p>
                <div class="accuracy-score">${accuracy}%</div>
            </div>
            ${wrongQuestions.length > 0 ? 
                `<div class="wrong-questions">
                    <p><strong>❌ 错题题号：</strong>${wrongQuestions.join('、')}</p>
                    <p style="margin-top: 10px; font-size: 14px; color: #666;">建议复习错题相关知识点</p>
                </div>` : 
                `<div style="color: #4CAF50; font-size: 18px; margin: 20px 0;">🎉 恭喜！全部答对！</div>`
            }
            <button class="quiz-modal-close" onclick="closeQuizModal()">确定</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示模态框
    setTimeout(() => {
        modal.style.display = 'block';
    }, 100);
}

// 关闭模态框
function closeQuizModal() {
    const modal = document.querySelector('.quiz-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.removeChild(modal);
    }
}

// 随机打乱选项函数
function shuffleOptions() {
    // 获取所有题目
    const questions = document.querySelectorAll('.question');
    totalQuestions = questions.length; // 记录总题数
    
    questions.forEach((question, index) => {
        const questionNum = index + 1;
        const optionsContainer = question.querySelector('.options');
        const options = Array.from(optionsContainer.querySelectorAll('.option'));
        
        // 保存原始选项数据
        const originalOptions = options.map(option => {
            const radio = option.querySelector('input[type="radio"]');
            const label = option.querySelector('label');
            return {
                value: radio.value,
                text: label.textContent,
                element: option
            };
        });
        
        // 打乱选项顺序
        const shuffledOptions = [...originalOptions].sort(() => Math.random() - 0.5);
        
        // 清空容器
        optionsContainer.innerHTML = '';
        
        // 重新添加打乱后的选项
        shuffledOptions.forEach((optionData, newIndex) => {
            const newValue = String.fromCharCode(65 + newIndex); // A, B, C, D
            const radio = optionData.element.querySelector('input[type="radio"]');
            const label = optionData.element.querySelector('label');
            
            // 更新radio的value和id
            radio.value = newValue;
            const newId = `q${questionNum}${newValue.toLowerCase()}`;
            radio.id = newId;
            
            // 更新label的for属性和文本
            label.setAttribute('for', newId);
            label.textContent = `${newValue}. ${optionData.text.substring(3)}`; // 移除原来的"A. "前缀
            
            // 重新添加到容器中
            optionsContainer.appendChild(optionData.element);
        });
        
        // 更新正确答案映射
        const originalCorrectAnswers = getOriginalCorrectAnswers();
        const originalCorrectValue = originalCorrectAnswers[index];
        const originalCorrectOption = originalOptions.find(opt => opt.value === originalCorrectValue);
        
        if (originalCorrectOption) {
            // 提取选项的实际内容（去掉"A. "、"B. "等前缀）
            const originalCorrectContent = originalCorrectOption.text.replace(/^[A-D]\. /, '');
            
            // 在打乱后的选项中找到相同内容的选项
            const newCorrectIndex = shuffledOptions.findIndex(opt => {
                const shuffledContent = opt.text.replace(/^[A-D]\. /, ''); // 去掉原始的前缀
                return shuffledContent === originalCorrectContent;
            });
            
            if (newCorrectIndex !== -1) {
                const newCorrectValue = String.fromCharCode(65 + newCorrectIndex);
                
                // 更新全局正确答案数组
                window.shuffledCorrectAnswers = window.shuffledCorrectAnswers || [];
                window.shuffledCorrectAnswers[questionNum - 1] = newCorrectValue;
            } else {
                // 如果找不到匹配的选项，保持原始答案
                window.shuffledCorrectAnswers = window.shuffledCorrectAnswers || [];
                window.shuffledCorrectAnswers[questionNum - 1] = originalCorrectValue;
            }
        } else {
            // 如果找不到原始正确选项，保持原始答案
            window.shuffledCorrectAnswers = window.shuffledCorrectAnswers || [];
            window.shuffledCorrectAnswers[questionNum - 1] = originalCorrectValue;
        }
    });
}

// 获取原始正确答案（需要在具体页面中重写此函数）
function getOriginalCorrectAnswers() {
    // 这个函数需要在具体的HTML页面中重写，返回该页面的正确答案数组
    return [];
}

// 添加选项点击事件监听
function initializeQuizEvents() {
    // 获取总题数
    const questions = document.querySelectorAll('.question');
    totalQuestions = questions.length;
    
    // 为所有选项添加点击事件
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                const questionNum = parseInt(radio.name.substring(1)); // 从 "q1" 中提取 "1"
                
                // 检查该题是否已经答过
                if (answeredQuestions.has(questionNum)) {
                    return; // 如果已答过，直接返回，不允许再次选择
                }
                
                radio.checked = true;
                
                // 移除同组其他选项的选中状态
                const groupName = radio.name;
                const groupOptions = document.querySelectorAll(`input[name="${groupName}"]`);
                groupOptions.forEach(groupRadio => {
                    groupRadio.closest('.option').classList.remove('selected');
                });
                
                // 添加当前选项的选中状态
                this.classList.add('selected');
                
                // 标记该题已答
                answeredQuestions.add(questionNum);
                
                // 禁用该题的所有选项
                groupOptions.forEach(groupRadio => {
                    groupRadio.disabled = true;
                    const optionDiv = groupRadio.closest('.option');
                    optionDiv.classList.add('disabled');
                });
                
                // 自动判断答案（使用原始正确答案）
                const correctAnswers = getOriginalCorrectAnswers();
                checkAnswer(questionNum, correctAnswers[questionNum - 1]);
                
                // 自动保存进度和更新显示
                saveProgress();
                updateProgressDisplay();
            }
        });
    });
    
    // 为所有单选按钮添加change事件
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                // 移除同组其他选项的选中状态
                const groupName = this.name;
                const groupOptions = document.querySelectorAll(`input[name="${groupName}"]`);
                groupOptions.forEach(groupRadio => {
                    groupRadio.closest('.option').classList.remove('selected');
                });
                
                // 添加当前选项的选中状态
                this.closest('.option').classList.add('selected');
            }
        });
    });
}

// 主题切换功能
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeToggle.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            深色模式
        `;
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            浅色模式
        `;
        localStorage.setItem('theme', 'dark');
    }
}

// 初始化主题
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (themeToggle) {
            themeToggle.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                浅色模式
            `;
        }
    }
}

// 数据永久化功能

// 获取当前页面的存储键
function getCurrentPageKey() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    return `quiz_progress_${filename}`;
}

// 保存学习进度
function saveProgress() {
    const progressData = {
        answeredQuestions: Array.from(answeredQuestions),
        userAnswers: userAnswers,
        shuffledCorrectAnswers: window.shuffledCorrectAnswers || [],
        timestamp: new Date().toISOString()
    };
    
    try {
        localStorage.setItem(currentPageKey, JSON.stringify(progressData));
        showSaveSuccessMessage();
    } catch (error) {
        console.error('保存进度失败:', error);
        showSaveErrorMessage();
    }
}

// 显示保存成功提示
function showSaveSuccessMessage() {
    showMessage('✅ 进度保存成功！', 'success');
}

// 显示保存失败提示
function showSaveErrorMessage() {
    showMessage('❌ 保存失败，请重试', 'error');
}

// 通用消息提示函数
function showMessage(text, type = 'success') {
    // 移除已存在的消息
    const existingMessage = document.querySelector('.save-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `save-message ${type}`;
    messageDiv.textContent = text;
    
    // 添加到页面
    document.body.appendChild(messageDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.classList.add('fade-out');
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }
    }, 3000);
}

// 加载学习进度
function loadProgress() {
    const savedData = localStorage.getItem(currentPageKey);
    if (!savedData) return false;
    
    try {
        const progressData = JSON.parse(savedData);
        
        // 恢复答题状态
        answeredQuestions = new Set(progressData.answeredQuestions || []);
        userAnswers = progressData.userAnswers || {};
        window.shuffledCorrectAnswers = progressData.shuffledCorrectAnswers || [];
        
        // 恢复页面显示状态
        restoreQuizState();
        
        return true;
    } catch (error) {
        console.error('加载进度失败:', error);
        return false;
    }
}

// 恢复测验状态
function restoreQuizState() {
    // 恢复每个题目的状态
    answeredQuestions.forEach(questionNum => {
        const answer = userAnswers[questionNum];
        if (!answer) return;
        
        // 选中用户之前选择的选项
        const radio = document.querySelector(`input[name="q${questionNum}"][value="${answer.selected}"]`);
        if (radio) {
            radio.checked = true;
            radio.closest('.option').classList.add('selected');
            
            // 禁用该题的所有选项
            const groupOptions = document.querySelectorAll(`input[name="q${questionNum}"]`);
            groupOptions.forEach(groupRadio => {
                groupRadio.disabled = true;
                groupRadio.closest('.option').classList.add('disabled');
            });
            
            // 显示答案状态
            const questionDiv = radio.closest('.question');
            const options = questionDiv.querySelectorAll('.option');
            
            options.forEach(option => {
                const optionRadio = option.querySelector('input[type="radio"]');
                if (optionRadio.value === answer.correct) {
                    option.classList.add('correct');
                } else if (optionRadio.value === answer.selected && !answer.isCorrect) {
                    option.classList.add('incorrect');
                }
            });
            
            // 显示解释
            const explanation = questionDiv.querySelector('.explanation');
            if (explanation) {
                explanation.classList.add('show');
            }
        }
    });
    
    // 更新进度显示
    updateProgressDisplay();
    
    // 如果所有题目都已完成，显示结果
    if (Object.keys(userAnswers).length === totalQuestions) {
        setTimeout(() => {
            showQuizResults();
        }, 500);
    }
}

// 重置学习进度
function resetProgress() {
    if (confirm('确定要重置当前页面的学习进度吗？这将清除所有答题记录。')) {
        // 清除本地存储
        localStorage.removeItem(currentPageKey);
        
        // 重置全局变量
        answeredQuestions.clear();
        userAnswers = {};
        window.shuffledCorrectAnswers = [];
        
        // 重新加载页面
        location.reload();
    }
}

// 创建进度控制按钮
function createProgressControls() {
    const container = document.querySelector('.container');
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'progress-controls';
    
    // 创建题目状态段
    let segmentsHTML = '';
    for (let i = 1; i <= totalQuestions; i++) {
        const segmentWidth = (100 / totalQuestions).toFixed(2);
        segmentsHTML += `<div class="progress-segment unanswered" data-question="${i}" style="width: ${segmentWidth}%" title="题目 ${i}"></div>`;
    }
    
    controlsDiv.innerHTML = `
        <div class="progress-info">
            <div class="progress-text-info">
                <span class="progress-text">学习进度: <span id="progress-count">0</span>/${totalQuestions}</span>
                <span class="progress-percentage">正确率: <span id="accuracy-percent">0</span>%</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-segments">
                    ${segmentsHTML}
                </div>
            </div>
        </div>
        <div class="progress-controls-bottom">
            <div class="control-buttons">
                <button class="reset-btn" onclick="resetProgress()" title="重置学习进度">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.25022 4 6.82447 5.38734 5.38451 7.50024" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    重置进度
                </button>
                <button class="save-btn" onclick="saveProgress()" title="手动保存进度">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M17 21V13H7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 3V8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    保存进度
                </button>
            </div>
        </div>
    `;
    
    // 插入到标题后面
    const h1 = container.querySelector('h1');
    h1.insertAdjacentElement('afterend', controlsDiv);
    
    // 为每个进度条段添加点击事件监听器
    const segments = controlsDiv.querySelectorAll('.progress-segment');
    segments.forEach(segment => {
        segment.addEventListener('click', function() {
            const questionNum = parseInt(this.getAttribute('data-question'));
            scrollToQuestion(questionNum);
        });
        
        // 添加鼠标悬停效果
        segment.style.cursor = 'pointer';
    });
}

// 跳转到指定题目
function scrollToQuestion(questionNum) {
    const questionElement = document.querySelector(`input[name="q${questionNum}"]`);
    if (questionElement) {
        const questionDiv = questionElement.closest('.question');
        if (questionDiv) {
            // 平滑滚动到题目位置
            questionDiv.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // 添加高亮效果
            questionDiv.classList.add('highlight');
            setTimeout(() => {
                questionDiv.classList.remove('highlight');
            }, 2000);
        }
    }
}

// 更新进度显示
function updateProgressDisplay() {
    const progressCount = document.getElementById('progress-count');
    const accuracyPercent = document.getElementById('accuracy-percent');
    
    if (progressCount && accuracyPercent) {
        const answered = answeredQuestions.size;
        
        // 计算正确率
        const correctCount = Object.values(userAnswers).filter(answer => answer.isCorrect).length;
        const accuracy = answered > 0 ? Math.round((correctCount / answered) * 100) : 0;
        
        progressCount.textContent = answered;
        accuracyPercent.textContent = accuracy;
        
        // 更新每个题目段的状态
        updateProgressSegments();
    }
}

// 更新进度条段状态
function updateProgressSegments() {
    for (let i = 1; i <= totalQuestions; i++) {
        const segment = document.querySelector(`[data-question="${i}"]`);
        if (!segment) continue;
        
        // 重置所有状态类
        segment.classList.remove('unanswered', 'correct', 'incorrect');
        
        if (userAnswers[i]) {
            // 已答题
            if (userAnswers[i].isCorrect) {
                segment.classList.add('correct');
                segment.title = `题目 ${i}: 正确 ✓`;
            } else {
                segment.classList.add('incorrect');
                segment.title = `题目 ${i}: 错误 ✗`;
            }
        } else {
            // 未答题
            segment.classList.add('unanswered');
            segment.title = `题目 ${i}: 未答题`;
        }
    }
}

// 处理URL参数，跳转到指定题目
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const questionNum = urlParams.get('question');
    
    if (questionNum) {
        // 延迟执行，确保页面完全加载
        setTimeout(() => {
            const targetQuestion = document.querySelector(`[name="q${questionNum}"]`);
            if (targetQuestion) {
                const questionElement = targetQuestion.closest('.question');
                if (questionElement) {
                    // 滚动到指定题目
                    questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // 高亮显示题目
                    questionElement.style.backgroundColor = 'var(--accent-color-light, #fff3cd)';
                    questionElement.style.border = '2px solid var(--accent-color, #ffc107)';
                    questionElement.style.borderRadius = '8px';
                    questionElement.style.transition = 'all 0.3s ease';
                    questionElement.style.padding = '20px';
                    questionElement.style.margin = '10px 0';
                    
                    // 3秒后移除高亮
                    setTimeout(() => {
                        questionElement.style.backgroundColor = '';
                        questionElement.style.border = '';
                        questionElement.style.borderRadius = '';
                        questionElement.style.padding = '';
                        questionElement.style.margin = '';
                    }, 3000);
                }
            }
        }, 500);
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    
    // 设置当前页面键
    currentPageKey = getCurrentPageKey();
    
    // 处理URL参数，检查是否需要跳转到特定题目
    handleUrlParameters();
    
    // 尝试加载之前的进度
    const hasProgress = loadProgress();
    
    // 如果没有保存的进度，正常初始化
    if (!hasProgress) {
        initializeQuizEvents();
    } else {
        // 如果有保存的进度，需要重新初始化事件但不打乱选项
        const questions = document.querySelectorAll('.question');
        totalQuestions = questions.length;
        
        // 为未答题的选项添加事件监听
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio && !radio.disabled) {
                option.addEventListener('click', function() {
                    const questionNum = parseInt(radio.name.substring(1));
                    
                    if (answeredQuestions.has(questionNum)) {
                        return;
                    }
                    
                    radio.checked = true;
                    
                    const groupName = radio.name;
                    const groupOptions = document.querySelectorAll(`input[name="${groupName}"]`);
                    groupOptions.forEach(groupRadio => {
                        groupRadio.closest('.option').classList.remove('selected');
                    });
                    
                    this.classList.add('selected');
                    answeredQuestions.add(questionNum);
                    
                    groupOptions.forEach(groupRadio => {
                        groupRadio.disabled = true;
                        groupRadio.closest('.option').classList.add('disabled');
                    });
                    
                    const correctAnswers = getOriginalCorrectAnswers();
                    checkAnswer(questionNum, correctAnswers[questionNum - 1]);
                    
                    // 自动保存进度
                    saveProgress();
                    updateProgressDisplay();
                });
            }
        });
    }
    
    // 创建进度控制界面
    createProgressControls();
    updateProgressDisplay();
});