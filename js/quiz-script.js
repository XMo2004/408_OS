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
            
            // 更新radio的value
            radio.value = newValue;
            
            // 更新label的文本，保持新的字母顺序
            label.textContent = `${newValue}. ${optionData.text.substring(3)}`; // 移除原来的"A. "前缀
            
            // 重新添加到容器中
            optionsContainer.appendChild(optionData.element);
        });
        
        // 更新正确答案映射
        const originalCorrectAnswers = getOriginalCorrectAnswers();
        const originalCorrectValue = originalCorrectAnswers[index];
        const originalCorrectOption = originalOptions.find(opt => opt.value === originalCorrectValue);
        const newCorrectIndex = shuffledOptions.findIndex(opt => opt.text === originalCorrectOption.text);
        const newCorrectValue = String.fromCharCode(65 + newCorrectIndex);
        
        // 更新全局正确答案数组
        window.shuffledCorrectAnswers = window.shuffledCorrectAnswers || [];
        window.shuffledCorrectAnswers[questionNum - 1] = newCorrectValue;
    });
}

// 获取原始正确答案（需要在具体页面中重写此函数）
function getOriginalCorrectAnswers() {
    // 这个函数需要在具体的HTML页面中重写，返回该页面的正确答案数组
    return [];
}

// 添加选项点击事件监听
function initializeQuizEvents() {
    // 首先随机打乱选项
    shuffleOptions();
    
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
                
                // 自动判断答案（使用打乱后的正确答案）
                const correctAnswers = window.shuffledCorrectAnswers || getOriginalCorrectAnswers();
                checkAnswer(questionNum, correctAnswers[questionNum - 1]);
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
        themeToggle.textContent = '🌙 深色模式';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️ 浅色模式';
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
            themeToggle.textContent = '☀️ 浅色模式';
        }
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeQuizEvents();
});