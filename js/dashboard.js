// 数据看板JavaScript

// 全局变量
let progressChart, chapterChart;
let currentSelectedChapter = 'all'; // 当前选择的章节
let dashboardData = {
    totalQuestions: 0,
    completedQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    chapterStats: {},
    studyHistory: [],
    wrongQuestions: [],
    studyStreak: 0
};

// 章节配置
const chapterConfig = {
    '1.1': '操作系统基本概念',
    '1.2': '操作系统发展历程',
    '1.3': '操作系统运行机制',
    '1.4': '操作系统体系结构',
    '2.1': '进程的基本概念'
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// 初始化看板
function initializeDashboard() {
    loadAllData();
    updateStatCards();
    initializeCharts();
    updateWrongQuestionsList();
    updateSuggestions();
    updateKnowledgeSummary(getKnowledgePointsData());
    setupEventListeners();
}

// 加载所有数据
function loadAllData() {
    dashboardData = {
        totalQuestions: 0,
        completedQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        chapterStats: {},
        studyHistory: [],
        wrongQuestions: [],
        studyStreak: 0
    };

    // 遍历所有章节页面的数据
    Object.keys(chapterConfig).forEach(chapter => {
        const pageKey = `quiz_progress_${chapter}`;
        const savedData = localStorage.getItem(pageKey);
        
        // 无论是否有保存的数据，都要处理章节数据以确保题目总数正确
        let progressData = {};
        if (savedData) {
            try {
                progressData = JSON.parse(savedData);
            } catch (error) {
                console.error(`加载章节 ${chapter} 数据失败:`, error);
                progressData = {};
            }
        }
        
        // 始终调用processChapterData，即使没有进度数据
        processChapterData(chapter, progressData);
    });

    // 加载学习历史
    loadStudyHistory();
    
    // 计算学习连续天数
    calculateStudyStreak();
}

// 处理章节数据
function processChapterData(chapter, progressData) {
    const userAnswers = progressData.userAnswers || {};
    const answeredQuestions = progressData.answeredQuestions || [];
    
    // 计算该章节的题目总数（从HTML文件中获取或估算）
    const chapterQuestionCount = getChapterQuestionCount(chapter);
    
    const correctCount = Object.values(userAnswers).filter(answer => answer.isCorrect).length;
    const wrongCount = Object.values(userAnswers).filter(answer => !answer.isCorrect).length;
    const completedCount = answeredQuestions.length;
    
    // 更新总体统计
    dashboardData.totalQuestions += chapterQuestionCount;
    dashboardData.completedQuestions += completedCount;
    dashboardData.correctAnswers += correctCount;
    dashboardData.wrongAnswers += wrongCount;
    
    // 更新章节统计
    dashboardData.chapterStats[chapter] = {
        name: chapterConfig[chapter],
        total: chapterQuestionCount,
        completed: completedCount,
        correct: correctCount,
        wrong: wrongCount,
        accuracy: completedCount > 0 ? (correctCount / completedCount * 100).toFixed(1) : 0
    };
    
    // 收集错题
    const shuffledCorrectAnswers = progressData.shuffledCorrectAnswers || [];
    Object.keys(userAnswers).forEach(questionNum => {
        const answer = userAnswers[questionNum];
        if (!answer.isCorrect) {
            // 从shuffledCorrectAnswers数组中获取正确答案
            const correctAnswer = shuffledCorrectAnswers[questionNum - 1] || answer.correct || 'N/A';
            dashboardData.wrongQuestions.push({
                chapter: chapter,
                chapterName: chapterConfig[chapter],
                questionNum: questionNum,
                selected: answer.selected,
                correct: correctAnswer,
                timestamp: answer.timestamp || Date.now()
            });
        }
    });
}

// 动态获取章节题目数量
function getChapterQuestionCount(chapter) {
    // 实际题目数量（通过统计HTML文件中的class="question"得出）
    const counts = {
        '1.1': 14,  // 实际统计：14题
        '1.2': 20,  // 实际统计：20题
        '1.3': 33,  // 实际统计：33题
        '1.4': 21,  // 实际统计：21题
        '2.1': 75   // 实际统计：75题
    };
    return counts[chapter] || 0;
}

// 加载学习历史
function loadStudyHistory() {
    const historyData = localStorage.getItem('study_history');
    if (historyData) {
        try {
            dashboardData.studyHistory = JSON.parse(historyData);
        } catch (error) {
            console.error('加载学习历史失败:', error);
            dashboardData.studyHistory = [];
        }
    }
    
    // 记录今天的学习情况
    recordTodayStudy();
}

// 记录今天的学习情况
function recordTodayStudy() {
    const today = new Date().toDateString();
    const existingRecord = dashboardData.studyHistory.find(record => record.date === today);
    
    if (!existingRecord) {
        dashboardData.studyHistory.push({
            date: today,
            questionsCompleted: dashboardData.completedQuestions,
            correctAnswers: dashboardData.correctAnswers,
            studyTime: 0 // 简化版，实际应该记录学习时间
        });
        
        // 保存到本地存储
        localStorage.setItem('study_history', JSON.stringify(dashboardData.studyHistory));
    }
}

// 计算学习连续天数
function calculateStudyStreak() {
    if (dashboardData.studyHistory.length === 0) {
        dashboardData.studyStreak = 0;
        return;
    }
    
    // 按日期排序
    const sortedHistory = dashboardData.studyHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let streak = 0;
    let currentDate = new Date();
    
    for (let record of sortedHistory) {
        const recordDate = new Date(record.date);
        const daysDiff = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
            streak++;
            currentDate = recordDate;
        } else {
            break;
        }
    }
    
    dashboardData.studyStreak = streak;
}

// 章节选择函数
function selectChapter(chapter) {
    currentSelectedChapter = chapter;
    
    // 更新选中状态
    document.querySelectorAll('.chapter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-chapter="${chapter}"]`).classList.add('active');
    
    // 更新统计数据
    updateStatCards();
    updateCharts();
}

// 获取当前选择章节的统计数据
function getCurrentChapterStats() {
    if (currentSelectedChapter === 'all') {
        return {
            totalQuestions: dashboardData.totalQuestions,
            completedQuestions: dashboardData.completedQuestions,
            correctAnswers: dashboardData.correctAnswers,
            wrongAnswers: dashboardData.wrongAnswers,
            accuracy: dashboardData.completedQuestions > 0 
                ? (dashboardData.correctAnswers / dashboardData.completedQuestions * 100)
                : 0
        };
    } else if (currentSelectedChapter === 'chapter1') {
        // 合并1.1-1.4的统计数据
        const chapter1Sections = ['1.1', '1.2', '1.3', '1.4'];
        let totalQuestions = 0;
        let completedQuestions = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        
        chapter1Sections.forEach(section => {
            const sectionData = dashboardData.chapterStats[section];
            if (sectionData) {
                totalQuestions += sectionData.total;
                completedQuestions += sectionData.completed;
                correctAnswers += sectionData.correct;
                wrongAnswers += sectionData.wrong;
            }
        });
        
        return {
            totalQuestions: totalQuestions,
            completedQuestions: completedQuestions,
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers,
            accuracy: completedQuestions > 0 
                ? (correctAnswers / completedQuestions * 100)
                : 0
        };
    } else {
        const chapterData = dashboardData.chapterStats[currentSelectedChapter];
        if (!chapterData) {
            return {
                totalQuestions: 0,
                completedQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                accuracy: 0
            };
        }
        return {
            totalQuestions: chapterData.total,
            completedQuestions: chapterData.completed,
            correctAnswers: chapterData.correct,
            wrongAnswers: chapterData.wrong,
            accuracy: parseFloat(chapterData.accuracy)
        };
    }
}

// 更新统计卡片
function updateStatCards() {
    const stats = getCurrentChapterStats();
    
    // 添加数字动画效果
    animateNumber('total-questions', stats.totalQuestions);
    animateNumber('completed-questions', stats.completedQuestions);
    animateNumber('study-streak', dashboardData.studyStreak);
    
    // 显示当前章节的正确率
    animatePercentage('overall-accuracy', stats.accuracy);
}

// 数字动画
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const increment = targetValue / 50;
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        element.textContent = Math.floor(currentValue);
    }, 20);
}

// 百分比动画
function animatePercentage(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const increment = targetValue / 50;
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        element.textContent = currentValue.toFixed(1) + '%';
    }, 20);
}

// 初始化图表
function initializeCharts() {
    initProgressChart();
    initChapterChart();
}

// 更新图表
function updateCharts() {
    initProgressChart();
    initChapterChart();
}

// 初始化进度环形图
function initProgressChart() {
    // 销毁现有图表
    if (progressChart) {
        progressChart.destroy();
    }
    
    const ctx = document.getElementById('progressChart').getContext('2d');
    const stats = getCurrentChapterStats();
    const completionRate = stats.totalQuestions > 0 
        ? (stats.completedQuestions / stats.totalQuestions * 100)
        : 0;
    
    progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [completionRate, 100 - completionRate],
                backgroundColor: [
                    '#4299e1',
                    '#e2e8f0'
                ],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            animation: {
                animateRotate: true,
                duration: 2000
            }
        }
    });
    
    // 更新中心文字
    document.getElementById('progress-percentage').textContent = completionRate.toFixed(1) + '%';
}

// 初始化章节柱状图
function initChapterChart() {
    // 销毁现有图表
    if (chapterChart) {
        chapterChart.destroy();
    }
    
    const ctx = document.getElementById('chapterChart').getContext('2d');
    
    let labels, correctData, wrongData, unansweredData;
    
    if (currentSelectedChapter === 'all') {
        // 显示所有章节的对比
        labels = Object.keys(dashboardData.chapterStats).map(key => key);
        correctData = Object.values(dashboardData.chapterStats).map(stat => stat.correct);
        wrongData = Object.values(dashboardData.chapterStats).map(stat => stat.wrong);
        unansweredData = Object.values(dashboardData.chapterStats).map(stat => 
            stat.total - stat.completed
        );
    } else if (currentSelectedChapter === 'chapter1') {
        // 显示第一章各小节的详细数据
        const chapter1Sections = ['1.1', '1.2', '1.3', '1.4'];
        labels = chapter1Sections;
        correctData = [];
        wrongData = [];
        unansweredData = [];
        
        chapter1Sections.forEach(section => {
            const sectionData = dashboardData.chapterStats[section];
            if (sectionData) {
                correctData.push(sectionData.correct);
                wrongData.push(sectionData.wrong);
                unansweredData.push(sectionData.total - sectionData.completed);
            } else {
                correctData.push(0);
                wrongData.push(0);
                unansweredData.push(getChapterQuestionCount(section));
            }
        });
    } else {
        // 显示单个章节的详细数据
        const chapterData = dashboardData.chapterStats[currentSelectedChapter];
        if (chapterData) {
            labels = [currentSelectedChapter];
            correctData = [chapterData.correct];
            wrongData = [chapterData.wrong];
            unansweredData = [chapterData.total - chapterData.completed];
        } else {
            labels = [currentSelectedChapter];
            correctData = [0];
            wrongData = [0];
            unansweredData = [getChapterQuestionCount(currentSelectedChapter)];
        }
    }
    
    chapterChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '正确',
                    data: correctData,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: '错误',
                    data: wrongData,
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                },
                {
                    label: '未答',
                    data: unansweredData,
                    backgroundColor: '#6b7280',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}



// 获取最近7天数据
function getLast7DaysData() {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        
        const record = dashboardData.studyHistory.find(r => r.date === dateString);
        
        data.push({
            date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
            completed: record ? record.questionsCompleted : 0,
            correct: record ? record.correctAnswers : 0
        });
    }
    
    return data;
}

// 轮播图相关变量
let currentChapterIndex = 0;
let chapterSlides = [];

// 更新章节错题轮播
function updateWrongQuestionsList() {
    const carouselTrack = document.getElementById('carousel-track');
    const carouselDots = document.getElementById('carousel-dots');
    const carouselIndicator = document.getElementById('carousel-indicator');
    
    if (dashboardData.wrongQuestions.length === 0) {
        carouselTrack.innerHTML = `
            <div class="carousel-slide">
                <div class="no-wrong-questions">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🎉</div>
                    <div style="font-size: 1.1rem;">太棒了！暂无错题</div>
                    <div style="font-size: 0.9rem; margin-top: 8px;">继续保持这个状态！</div>
                </div>
            </div>
        `;
        carouselDots.innerHTML = '';
        carouselIndicator.textContent = '0 / 0';
        return;
    }
    
    // 按章节分组错题
    const groupedWrongQuestions = {};
    dashboardData.wrongQuestions.forEach(question => {
        if (!groupedWrongQuestions[question.chapter]) {
            groupedWrongQuestions[question.chapter] = [];
        }
        groupedWrongQuestions[question.chapter].push(question);
    });
    
    chapterSlides = Object.keys(groupedWrongQuestions);
    
    // 生成轮播内容
    let slidesHtml = '';
    chapterSlides.forEach(chapter => {
        const questions = groupedWrongQuestions[chapter];
        const totalQuestions = getChapterTotalQuestions(chapter);
        const correctQuestions = totalQuestions - questions.length;
        const accuracy = totalQuestions > 0 ? ((correctQuestions / totalQuestions) * 100).toFixed(1) : 0;
        
        slidesHtml += `
            <div class="carousel-slide">
                <div class="chapter-slide-header">
                    <div class="chapter-title">${chapter} ${chapterConfig[chapter]}</div>
                </div>
                <div class="wrong-questions-grid">
        `;
        
        questions.forEach(question => {
            slidesHtml += `
                <div class="wrong-question-card" onclick="jumpToQuestion('${question.chapter}', ${question.questionNum})" style="cursor: pointer;">
                    <div class="question-number">第${question.questionNum}题</div>
                </div>
            `;
        });
        
        slidesHtml += `
                </div>
            </div>
        `;
    });
    
    carouselTrack.innerHTML = slidesHtml;
    
    // 生成轮播指示点
    let dotsHtml = '';
    chapterSlides.forEach((_, index) => {
        dotsHtml += `<div class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="goToChapter(${index})"></div>`;
    });
    carouselDots.innerHTML = dotsHtml;
    
    // 更新指示器
    carouselIndicator.textContent = `${currentChapterIndex + 1} / ${chapterSlides.length}`;
    
    // 重置轮播位置
    currentChapterIndex = 0;
    updateCarouselPosition();
}

// 获取章节总题数
function getChapterTotalQuestions(chapter) {
    // 这里可以根据实际情况调整每章的题目数量
    const chapterQuestionCounts = {
        '1.1': 20,
        '1.2': 25,
        '1.3': 30,
        '1.4': 22
    };
    return chapterQuestionCounts[chapter] || 20;
}

// 跳转到指定题目
function jumpToQuestion(chapter, questionNum) {
    // 构建目标页面URL，包含题目编号参数
    const targetUrl = `html/${chapter}.html?question=${questionNum}`;
    
    // 在新标签页中打开目标页面
    window.open(targetUrl, '_blank');
}

// 轮播控制函数
function prevChapter() {
    if (currentChapterIndex > 0) {
        currentChapterIndex--;
        updateCarouselPosition();
    }
}

function nextChapter() {
    if (currentChapterIndex < chapterSlides.length - 1) {
        currentChapterIndex++;
        updateCarouselPosition();
    }
}

function goToChapter(index) {
    currentChapterIndex = index;
    updateCarouselPosition();
}

function updateCarouselPosition() {
    const carouselTrack = document.getElementById('carousel-track');
    const carouselIndicator = document.getElementById('carousel-indicator');
    const dots = document.querySelectorAll('.carousel-dot');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    
    if (carouselTrack && chapterSlides.length > 0) {
        const translateX = -currentChapterIndex * 100;
        carouselTrack.style.transform = `translateX(${translateX}%)`;
        
        // 更新指示器
        carouselIndicator.textContent = `${currentChapterIndex + 1} / ${chapterSlides.length}`;
        
        // 更新指示点
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentChapterIndex);
        });
        
        // 更新按钮状态
        prevBtn.disabled = currentChapterIndex === 0;
        nextBtn.disabled = currentChapterIndex === chapterSlides.length - 1;
    }
}

// 更新学习建议
function updateSuggestions() {
    const container = document.getElementById('suggestions-content');
    const suggestions = generateSuggestions();
    
    let html = '';
    suggestions.forEach(suggestion => {
        html += `
            <div class="suggestion-item">
                <div class="suggestion-icon">${suggestion.icon}</div>
                <div class="suggestion-text">${suggestion.text}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 生成学习建议
function generateSuggestions() {
    const suggestions = [];
    
    // 基于完成度的建议
    const completionRate = dashboardData.totalQuestions > 0 
        ? (dashboardData.completedQuestions / dashboardData.totalQuestions * 100)
        : 0;
    
    if (completionRate < 30) {
        suggestions.push({
            icon: '🚀',
            text: '学习进度较慢，建议制定每日学习计划，每天完成5-10道题目。'
        });
    } else if (completionRate < 70) {
        suggestions.push({
            icon: '💪',
            text: '学习进度良好，继续保持当前节奏，争取在本周内完成更多章节。'
        });
    } else {
        suggestions.push({
            icon: '🎯',
            text: '学习进度优秀！建议重点复习错题，巩固薄弱知识点。'
        });
    }
    
    // 基于正确率的建议
    const accuracy = dashboardData.completedQuestions > 0 
        ? (dashboardData.correctAnswers / dashboardData.completedQuestions * 100)
        : 0;
    
    if (accuracy < 60) {
        suggestions.push({
            icon: '📚',
            text: '正确率偏低，建议回顾基础概念，仔细阅读教材相关章节。'
        });
    } else if (accuracy < 80) {
        suggestions.push({
            icon: '🔍',
            text: '正确率中等，建议重点关注错题分析，理解错误原因。'
        });
    } else {
        suggestions.push({
            icon: '⭐',
            text: '正确率很高！建议挑战更难的题目，提升解题技巧。'
        });
    }
    
    // 基于错题分布的建议
    if (dashboardData.wrongQuestions.length > 0) {
        const chapterErrors = {};
        dashboardData.wrongQuestions.forEach(q => {
            chapterErrors[q.chapter] = (chapterErrors[q.chapter] || 0) + 1;
        });
        
        const mostErrorChapter = Object.keys(chapterErrors).reduce((a, b) => 
            chapterErrors[a] > chapterErrors[b] ? a : b
        );
        
        suggestions.push({
            icon: '🎯',
            text: `${mostErrorChapter} ${chapterConfig[mostErrorChapter]} 错题较多，建议重点复习该章节。`
        });
    }
    
    // 基于学习连续性的建议
    if (dashboardData.studyStreak === 0) {
        suggestions.push({
            icon: '📅',
            text: '建议养成每日学习的习惯，即使每天只做几道题也能保持学习状态。'
        });
    } else if (dashboardData.studyStreak < 7) {
        suggestions.push({
            icon: '🔥',
            text: `已连续学习${dashboardData.studyStreak}天，继续保持，争取达到一周连续学习！`
        });
    } else {
        suggestions.push({
            icon: '🏆',
            text: `连续学习${dashboardData.studyStreak}天，学习习惯很棒！继续保持这个节奏。`
        });
    }
    
    return suggestions;
}

// 设置事件监听器
function setupEventListeners() {
    // 图表控制按钮
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart');
            const period = this.getAttribute('data-period');
            
            // 更新按钮状态 - 只更新同一组的按钮
            if (chartType) {
                // 进度图表按钮组 - 查找包含data-chart属性的按钮
                document.querySelectorAll('.chart-btn[data-chart]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                updateProgressChart(chartType);
            }
            
            if (period) {
                // 趋势图表按钮组 - 查找包含data-period属性的按钮
                document.querySelectorAll('.chart-btn[data-period]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                updateTrendChart(period);
            }
        });
    });
    
    // 错题分析区域滚动优化
    const wrongQuestionsList = document.getElementById('wrong-questions-list');
    if (wrongQuestionsList) {
        wrongQuestionsList.addEventListener('wheel', function(e) {
            // 检查是否可以滚动
            const canScrollUp = this.scrollTop > 0;
            const canScrollDown = this.scrollTop < (this.scrollHeight - this.clientHeight);
            
            // 如果可以在容器内滚动，阻止页面滚动
            if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
                e.stopPropagation();
            }
        }, { passive: false });
    }

}

// 更新进度图表
function updateProgressChart(type) {
    if (!progressChart) {
        console.error('Progress chart not initialized');
        return;
    }
    
    if (type === 'accuracy') {
        const accuracy = dashboardData.completedQuestions > 0 
            ? (dashboardData.correctAnswers / dashboardData.completedQuestions * 100)
            : 0;
        
        progressChart.data.datasets[0].data = [accuracy, 100 - accuracy];
        progressChart.data.datasets[0].backgroundColor = ['#10b981', '#e2e8f0'];
        
        const percentageElement = document.getElementById('progress-percentage');
        const labelElement = document.querySelector('.center-label');
        
        if (percentageElement) {
            percentageElement.textContent = accuracy.toFixed(1) + '%';
        }
        if (labelElement) {
            labelElement.textContent = '正确率';
        }
    } else {
        const completionRate = dashboardData.totalQuestions > 0 
            ? (dashboardData.completedQuestions / dashboardData.totalQuestions * 100)
            : 0;
        
        progressChart.data.datasets[0].data = [completionRate, 100 - completionRate];
        progressChart.data.datasets[0].backgroundColor = ['#4299e1', '#e2e8f0'];
        
        const percentageElement = document.getElementById('progress-percentage');
        const labelElement = document.querySelector('.center-label');
        
        if (percentageElement) {
            percentageElement.textContent = completionRate.toFixed(1) + '%';
        }
        if (labelElement) {
            labelElement.textContent = '完成度';
        }
    }
    
    progressChart.update('active');
}

// 获取知识点数据
function getKnowledgePointsData() {
    const knowledgePoints = {};
    
    // 从章节统计中提取知识点数据
    Object.keys(dashboardData.chapterStats).forEach(chapter => {
        const stats = dashboardData.chapterStats[chapter];
        knowledgePoints[chapter] = {
            total: stats.total || 0,
            correct: stats.correct || 0,
            wrong: stats.wrong || 0,
            accuracy: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0
        };
    });
    
    return knowledgePoints;
}

// 更新知识点总结
function updateKnowledgeSummary(knowledgeData) {
    // 如果没有专门的知识点总结区域，可以在控制台输出或者不做任何操作
    console.log('Knowledge Points Summary:', knowledgeData);
    
    // 可以在这里添加更多的知识点分析逻辑
    // 比如找出薄弱知识点、推荐学习重点等
    const weakPoints = Object.keys(knowledgeData).filter(chapter => {
        const accuracy = parseFloat(knowledgeData[chapter].accuracy);
        return accuracy < 70 && knowledgeData[chapter].total > 0;
    });
    
    if (weakPoints.length > 0) {
        console.log('Weak knowledge points:', weakPoints);
    }
}

// 获取最近30天数据
function getLast30DaysData() {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        
        const record = dashboardData.studyHistory.find(r => r.date === dateString);
        
        data.push({
            date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
            completed: record ? record.questionsCompleted : 0,
            correct: record ? record.correctAnswers : 0
        });
    }
    
    return data;
}

// 获取全部时间数据
function getAllTimeData() {
    return dashboardData.studyHistory.map(record => ({
        date: new Date(record.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        completed: record.questionsCompleted,
        correct: record.correctAnswers
    }));
}

// 导出错题
function exportWrongQuestions() {
    if (dashboardData.wrongQuestions.length === 0) {
        showModal('暂无错题', '目前没有错题记录，继续加油！');
        return;
    }
    
    // 获取详细的错题信息
    getDetailedWrongQuestions().then(detailedQuestions => {
        const wrongQuestionsText = detailedQuestions.map(q => {
            let text = `${q.chapter} ${q.chapterName} - 第${q.questionNum}题\n`;
            text += `题干: ${q.questionText}\n`;
            text += `选项:\n${q.options.join('\n')}\n`;
            text += `你的答案: ${q.selected} | 正确答案: ${q.correct}\n`;
            if (q.explanation) {
                text += `解析: ${q.explanation}\n`;
            }
            text += '\n' + '='.repeat(50) + '\n\n';
            return text;
        }).join('');
        
        const blob = new Blob([wrongQuestionsText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `错题集_${new Date().toLocaleDateString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }).catch(error => {
        console.error('导出错题失败:', error);
        showModal('导出失败', '获取题目详细信息时出现错误，请稍后重试。');
    });
}

// 获取详细的错题信息
async function getDetailedWrongQuestions() {
    const detailedQuestions = [];
    
    for (const wrongQ of dashboardData.wrongQuestions) {
        try {
            const questionDetails = await fetchQuestionDetails(wrongQ.chapter, wrongQ.questionNum);
            detailedQuestions.push({
                ...wrongQ,
                questionText: questionDetails.questionText,
                options: questionDetails.options,
                explanation: questionDetails.explanation
            });
        } catch (error) {
            console.error(`获取题目 ${wrongQ.chapter}-${wrongQ.questionNum} 详细信息失败:`, error);
            // 如果获取失败，使用基本信息
            detailedQuestions.push({
                ...wrongQ,
                questionText: '题目内容获取失败',
                options: [],
                explanation: '解析内容获取失败'
            });
        }
    }
    
    return detailedQuestions;
}

// 获取单个题目的详细信息
async function fetchQuestionDetails(chapter, questionNum) {
    return new Promise((resolve, reject) => {
        // 创建一个隐藏的iframe来加载对应的HTML文件
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `html/${chapter}.html`;
        
        iframe.onload = function() {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const questions = iframeDoc.querySelectorAll('.question');
                
                if (questions.length >= questionNum) {
                    const questionDiv = questions[questionNum - 1];
                    
                    // 获取题干
                    const questionNumberDiv = questionDiv.querySelector('.question-number');
                    const questionText = questionNumberDiv ? questionNumberDiv.textContent.trim() : '题目内容获取失败';
                    
                    // 获取选项
                    const optionDivs = questionDiv.querySelectorAll('.option label');
                    const options = Array.from(optionDivs).map(label => label.textContent.trim());
                    
                    // 获取解析
                    const explanationDiv = questionDiv.querySelector('.explanation-content');
                    const explanation = explanationDiv ? explanationDiv.textContent.trim() : '暂无解析';
                    
                    resolve({
                        questionText,
                        options,
                        explanation
                    });
                } else {
                    reject(new Error(`题目 ${questionNum} 不存在`));
                }
            } catch (error) {
                reject(error);
            } finally {
                // 清理iframe
                document.body.removeChild(iframe);
            }
        };
        
        iframe.onerror = function() {
            document.body.removeChild(iframe);
            reject(new Error(`无法加载文件 ${chapter}.html`));
        };
        
        document.body.appendChild(iframe);
    });
}

// 导出数据
function exportData() {
    const exportData = {
        dashboardData: dashboardData,
        exportTime: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `学习数据_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showModal('导出成功', '学习数据已成功导出到本地文件。');
}

// 导入数据
function importData() {
    document.getElementById('import-file').click();
}

// 处理文件导入
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.dashboardData) {
                // 确认导入
                if (confirm('确定要导入数据吗？这将覆盖当前的学习记录。')) {
                    dashboardData = importedData.dashboardData;
                    
                    // 重新初始化看板
                    updateStatCards();
                    updateCharts();
                    updateWrongQuestionsList();
                    updateSuggestions();
                    
                    showModal('导入成功', '学习数据已成功导入。');
                }
            } else {
                showModal('导入失败', '文件格式不正确，请选择有效的数据文件。');
            }
        } catch (error) {
            showModal('导入失败', '文件解析失败，请检查文件格式。');
        }
    };
    reader.readAsText(file);
    
    // 清空文件输入
    event.target.value = '';
}

// 备份数据
function backupData() {
    const backupData = {
        localStorage: {},
        backupTime: new Date().toISOString()
    };
    
    // 备份所有相关的localStorage数据
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('quiz_progress_') || key === 'study_history') {
            backupData.localStorage[key] = localStorage.getItem(key);
        }
    }
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `学习数据备份_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showModal('备份成功', '学习数据已成功备份到本地文件。');
}

// 重置所有数据
function resetAllData() {
    if (confirm('确定要重置所有学习数据吗？此操作不可恢复！')) {
        if (confirm('再次确认：这将删除所有学习进度和记录，确定继续吗？')) {
            // 清除所有相关的localStorage数据
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('quiz_progress_') || key === 'study_history') {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // 重新加载页面
            location.reload();
        }
    }
}

// 更新所有图表
function updateCharts() {
    if (progressChart) {
        progressChart.destroy();
    }
    if (chapterChart) {
        chapterChart.destroy();
    }

    
    initializeCharts();
}

// 显示模态框
function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h3 style="margin-top: 0; color: var(--heading-color);">${title}</h3>
        <p style="color: var(--text-color); line-height: 1.6;">${content}</p>
    `;
    
    modal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}