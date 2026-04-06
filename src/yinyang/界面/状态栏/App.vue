<template>
  <div class="app-container w-full h-full flex items-center justify-center relative text-gray-900">

    <!-- 动态背景落花 -->
    <div v-for="i in 20" :key="i" class="petal" 
         :style="{ left: Math.random() * 100 + 'vw', top: -20 + 'px', 
                   width: Math.random() * 15 + 10 + 'px', height: Math.random() * 15 + 10 + 'px',
                   animation: `fall ${Math.random() * 5 + 5}s linear infinite`,
                   animationDelay: `-${Math.random() * 5}s` }">
    </div>

    <!-- 初始召唤按钮 -->
    <div v-if="!isSummoned" class="summon-btn" @click="summonScroll">
        祭出天香美人图
    </div>

    <!-- 华丽卷轴容器 -->
    <div class="scroll-wrapper" ref="scrollContainer" v-show="isSummoned">
        <!-- 左侧画轴 -->
        <div class="scroll-roller left"></div>
        
        <!-- 画布内容区 -->
        <div class="scroll-canvas">
            <div class="glass-inner w-full h-full relative z-10 flex">
                <div class="close-seal" @click="closeScroll">印</div>

                <!-- 导航栏组件 -->
                <NavSidebar :tabs="tabs" :currentTab="currentTab" @switch="switchTab" />

                <!-- 右侧主内容 -->
                <div class="main-content">
                    <div class="gilded-title font-ancient flex items-center justify-between w-full">
                        <span>{{ tabs[currentTab].name }}</span>
                    </div>

                    <!-- 动态组件渲染 -->
                    <WuShen v-if="currentTab === 0" />
                    <HuanJuan v-if="currentTab === 1 || currentTab === 2" />
                    <QunFang v-if="currentTab === 3" />
                </div>
            </div>
        </div>
        
        <!-- 右侧画轴 -->
        <div class="scroll-roller right"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import gsap from 'gsap';
import NavSidebar from './components/NavSidebar.vue';
import WuShen from './components/WuShen.vue';
import HuanJuan from './components/HuanJuan.vue';
import QunFang from './components/QunFang.vue';

const isSummoned = ref(false);
const scrollContainer = ref(null);
const currentTab = ref(3); 

const tabs = [
    { name: '吾身' },
    { name: '幻卷' },
    { name: '芥子' },
    { name: '群芳' }
];

const summonScroll = () => {
    isSummoned.value = true;
    nextTick(() => {
        gsap.fromTo(scrollContainer.value, 
            { opacity: 0, scaleX: 0, rotationY: 90 },
            { duration: 1.5, opacity: 1, scaleX: 1, rotationY: 0, ease: "expo.out" }
        );
    });
};

const closeScroll = () => {
    gsap.to(scrollContainer.value, {
        duration: 0.8, opacity: 0, scaleX: 0, rotationY: -90, ease: "expo.in",
        onComplete: () => { isSummoned.value = false; currentTab.value = 3; }
    });
};

const switchTab = (index: number) => {
    currentTab.value = index;
    nextTick(() => {
        gsap.fromTo('.fade-content', { opacity: 0, y: 30, filter: 'blur(5px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: "power2.out" });
    });
};
</script>

<style scoped>
.app-container {
    background: radial-gradient(circle at 50% 50%, #2a1525 0%, #0a0508 100%);
    font-family: 'Noto Serif SC', 'STKaiti', '楷体', serif;
    perspective: 1000px;
    height: 100vh;
    overflow: hidden;
}

.font-ancient { font-family: 'Ma Shan Zheng', cursive; }

.petal {
    position: absolute;
    background-color: #ffb7c5;
    border-radius: 15px 0 15px 0;
    opacity: 0.6;
    pointer-events: none;
    z-index: 1;
    filter: drop-shadow(0 0 5px rgba(255,183,197,0.8));
}
@keyframes fall {
    to { transform: translateY(110vh) rotate(360deg); }
}

.scroll-wrapper {
    position: relative;
    width: 85vw;
    max-width: 1400px;
    height: 88vh;
    display: flex;
    z-index: 10;
    opacity: 0;
    transform: scaleX(0);
}

.scroll-roller {
    width: 45px;
    background-color: #e2e8e4;
    background-image: 
        url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="3"><path d="M10,50 Q25,25 50,50 T90,50 M50,50 Q65,75 80,50" /><circle cx="50" cy="50" r="15"/></svg>'),
        linear-gradient(to right, #d0d9d4 0%, #ffffff 30%, #a9b5af 70%, #687a70 100%);
    background-size: 45px 45px, 100% 100%;
    background-blend-mode: multiply;
    box-shadow: 
        inset 8px 0 20px rgba(0,0,0,0.6), 
        inset -8px 0 20px rgba(0,0,0,0.4),
        15px 0 30px rgba(0,0,0,0.8);
    position: relative;
    z-index: 20;
    border-radius: 12px;
}
.scroll-roller::before, .scroll-roller::after {
    content: '';
    position: absolute;
    width: 65px; height: 40px;
    left: -10px;
    background-color: #d4af37;
    background-image: 
        url('data:image/svg+xml;utf8,<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M0,0 L10,10 L20,0" stroke="rgba(90,58,13,0.3)" fill="none" stroke-width="1.5"/></svg>'),
        linear-gradient(to bottom, #ffe898, #d4af37, #8a5a19);
    background-size: 10px 10px, 100% 100%;
    background-blend-mode: multiply;
    border-radius: 6px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.8), inset 0 3px 8px rgba(255,255,255,0.9), inset 0 -3px 8px rgba(0,0,0,0.5);
    border: 2px solid #5a3a0d;
}
.scroll-roller::before { top: -15px; }
.scroll-roller::after { bottom: -15px; }
.scroll-roller.left { border-top-left-radius: 20px; border-bottom-left-radius: 20px; box-shadow: -10px 0 20px rgba(0,0,0,0.7); }
.scroll-roller.right { border-top-right-radius: 20px; border-bottom-right-radius: 20px; box-shadow: 10px 0 20px rgba(0,0,0,0.7); }

.scroll-canvas {
    flex: 1;
    background-image: url('../../paperboard-texture.png');
    background-size: cover;
    background-color: #e8dcc4;
    background-blend-mode: multiply;
    position: relative;
    overflow: hidden;
    display: flex;
    box-shadow: inset 0 0 50px rgba(138, 11, 28, 0.15);
}
.scroll-canvas::before {
    content: ''; position: absolute; top:0; left:0; width:100%; height:100%;
    background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212, 175, 55, 0.03) 10px, rgba(212, 175, 55, 0.03) 20px);
    pointer-events: none; z-index: 0;
}

.glass-inner {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(8px);
}

.close-seal {
    position: absolute;
    top: 20px; right: 30px;
    width: 45px; height: 45px;
    background: #8a0b1c;
    color: #fff;
    font-family: 'Ma Shan Zheng';
    font-size: 1.5rem;
    display: flex; justify-content: center; align-items: center;
    border-radius: 8px;
    border: 2px solid rgba(255,255,255,0.4);
    box-shadow: 2px 2px 8px rgba(0,0,0,0.4), inset 0 0 10px rgba(0,0,0,0.5);
    cursor: pointer;
    z-index: 50;
    transition: all 0.3s;
    clip-path: polygon(5% 0%, 95% 5%, 100% 95%, 5% 100%);
}
.close-seal:hover {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 0 15px #8a0b1c;
}

.main-content {
    flex: 1; padding: 40px 60px; overflow-y: auto; position: relative; z-index: 10;
}
.main-content::-webkit-scrollbar { width: 6px; }
.main-content::-webkit-scrollbar-track { background: rgba(212, 175, 55, 0.1); border-radius: 3px; }
.main-content::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #d4af37, #8a5a19); border-radius: 3px; }

.gilded-title {
    font-size: 3.5rem;
    color: #d4af37;
    background-image: linear-gradient(to bottom, #ffe898, #d4af37, #996515);
    background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    display: inline-block;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
    position: relative;
    margin-bottom: 30px;
}
.gilded-title::after {
    content: ''; position: absolute; bottom: 0px; left: 0; width: 100%; height: 3px;
    background: linear-gradient(to right, transparent, #c49123, transparent);
}

.summon-btn {
    position: absolute; font-size: 3rem; color: #d4af37;
    background-color: #2a1525;
    background-image: linear-gradient(to bottom, #ffe898, #d4af37, #996515); 
    background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    padding: 30px 60px; cursor: pointer; z-index: 100;
    border: none;
    font-family: 'Ma Shan Zheng', cursive; text-shadow: 0 5px 15px rgba(0,0,0,0.8);
    transition: all 0.5s;
}
.summon-btn::before {
    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-color: #000;
    background-image: url('../../paperboard-texture.png'); background-size: cover;
    border: 3px solid #c49123; border-radius: 12px; box-shadow: 0 0 15px rgba(247, 213, 112, 0.5), 0 10px 30px rgba(0,0,0,0.9);
    z-index: -1; transition: all 0.5s;
}
.summon-btn:hover { transform: scale(1.08); letter-spacing: 4px; }
.summon-btn:hover::before { box-shadow: 0 0 30px #f7d570; border-color: #f7d570; }
</style>
