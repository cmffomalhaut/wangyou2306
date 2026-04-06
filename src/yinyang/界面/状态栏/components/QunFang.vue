<template>
  <div class="fade-content">
    
    <!-- 鼎炉列表 -->
    <div v-if="!selectedGirl">
      <div class="cauldron-grid">
        <div v-for="girl in girls" :key="girl.id" class="succubus-card" @click="openGirl(girl)">
          <!-- 淫纹背景 -->
          <svg class="bg-emblem" viewBox="0 0 24 24" fill="currentColor"><path d="M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22M12,19.5A7.5,7.5 0 0,0 19.5,12A7.5,7.5 0 0,0 12,4.5A7.5,7.5 0 0,0 4.5,12A7.5,7.5 0 0,0 12,19.5M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,14.5A2.5,2.5 0 0,0 14.5,12A2.5,2.5 0 0,0 12,9.5A2.5,2.5 0 0,0 9.5,12A2.5,2.5 0 0,0 12,14.5Z"/></svg>
          
          <h3 class="text-2xl font-ancient text-red-900 mb-2 border-b border-red-200 pb-2">
            {{ girl.name }}
            <span class="seal-tag gold float-right text-sm">{{ girl.rank }}级炉鼎</span>
          </h3>
          
          <div class="flex gap-2 mb-3">
            <span class="seal-tag"><svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg> {{ girl.location }}</span>
            <span class="seal-tag"><svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/></svg> {{ girl.slaveStatus }}</span>
          </div>

          <div class="mt-4">
            <div class="flex justify-between text-xs font-bold text-gray-800 mb-1">
              <span class="flex items-center text-rose-600">倾慕 ({{girl.loveDesc}})</span>
              <span>{{girl.love}}/100</span>
            </div>
            <LustBar :percent="girl.love" />
          </div>
          <div class="mt-3">
            <div class="flex justify-between text-xs font-bold text-gray-800 mb-1">
              <span class="flex items-center text-red-900">牝犬印记 ({{girl.lustDesc}})</span>
              <span>{{girl.lust}}/100</span>
            </div>
            <LustBar :percent="girl.lust" wrapperClass="!border-red-900" fillClass="!bg-gradient-to-r !from-red-900 !to-red-600" />
          </div>

          <div class="mt-4 pt-3 border-t border-red-200">
            <p class="text-sm font-serif italic text-red-800 leading-relaxed font-bold">「{{ girl.voice }}」</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情 -->
    <div v-else class="fade-content">
      <button @click="selectedGirl = null" class="text-red-800 font-bold hover:text-rose-600 transition flex items-center mb-4 text-lg">
        ← 返归名录
      </button>

      <div class="ancient-card pb-10">
        <div class="flex justify-between items-end border-b-2 border-red-800 pb-3 mb-6">
            <h2 class="text-5xl font-ancient text-red-900" style="text-shadow: 2px 2px 0px rgba(212,175,55,0.5);">{{ selectedGirl.name }}</h2>
            <div class="flex gap-2">
                <span class="seal-tag gold text-lg">{{ selectedGirl.rank }} 阶极品鼎炉</span>
            </div>
        </div>

        <h3 class="text-2xl font-ancient text-red-800 border-b border-gold-dark inline-block mb-4 pr-4">仙姿画骨</h3>
        <div class="kv-block bg-white/50 p-3 rounded border border-red-100">
            <span class="kv-key">蔽体之物:</span> <span class="kv-val">{{ selectedGirl.details.clothes }}</span>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-2 mb-6">
            <div class="erotic-box !mb-0"><span class="kv-key block text-lg mb-1">双峰秘景</span><span class="kv-val">{{ selectedGirl.details.boobs }}</span></div>
            <div class="erotic-box !mb-0"><span class="kv-key block text-lg mb-1">幽谷芳草</span><span class="kv-val">{{ selectedGirl.details.pussy }}</span></div>
            <div class="erotic-box !mb-0"><span class="kv-key block text-lg mb-1">玉腿缠腰</span><span class="kv-val">{{ selectedGirl.details.legs }}</span></div>
            <div class="erotic-box !mb-0"><span class="kv-key block text-lg mb-1">后庭秘穴</span><span class="kv-val">{{ selectedGirl.details.ass }}</span></div>
        </div>

        <h3 class="text-2xl font-ancient text-red-800 border-b border-gold-dark inline-block mb-4 pr-4 mt-2">欲海沉沦</h3>
        <div class="bg-red-50/50 p-4 border border-red-200 rounded mb-6 shadow-inner">
            <div class="grid grid-cols-2 gap-6 mb-4">
                <div>
                    <span class="kv-key block mb-1">倾慕品阶: {{ selectedGirl.loveDesc }} ({{selectedGirl.love}}/100)</span>
                    <LustBar :percent="selectedGirl.love" wrapperClass="!h-2" />
                    <p class="text-xs mt-2 text-gray-600">{{ selectedGirl.details.loveChange }}</p>
                </div>
                <div>
                    <span class="kv-key block mb-1 text-red-900">奴化品阶: {{ selectedGirl.lustDesc }} ({{selectedGirl.lust}}/100)</span>
                    <LustBar :percent="selectedGirl.lust" wrapperClass="!h-2 !border-red-900" fillClass="!bg-red-900" />
                    <p class="text-xs mt-2 text-gray-600">{{ selectedGirl.details.lustChange }}</p>
                </div>
            </div>
            <div class="kv-block"><span class="kv-key">采补履历:</span> <span class="kv-val">{{ selectedGirl.details.exp }}</span></div>
            <div class="kv-block"><span class="kv-key">淫根深种:</span> <span class="kv-val text-rose-800 font-bold">{{ selectedGirl.details.fetish }}</span></div>
            <div class="kv-block"><span class="kv-key">破身死穴:</span> <span class="kv-val">{{ selectedGirl.details.weakness }}</span></div>
        </div>

        <h3 class="text-2xl font-ancient text-red-800 border-b border-gold-dark inline-block mb-4 pr-4 mt-2">御女总纲</h3>
        <div class="bg-gradient-to-br from-yellow-50 to-white p-5 border border-yellow-300 rounded shadow-md relative">
            <div class="kv-block"><span class="kv-key">获取手段:</span> <span class="kv-val">{{ selectedGirl.details.capture }}</span></div>
            <p class="text-base text-gray-800 leading-relaxed indent-8 mb-4 border-l-4 border-gold-accent pl-3">{{ selectedGirl.details.review }}</p>
            
            <div class="grid grid-cols-2 gap-y-3 gap-x-6 text-sm bg-white/60 p-3 rounded">
                <div><span class="kv-key">推荐体位:</span> <span class="kv-val">{{ selectedGirl.details.recPose }}</span></div>
                <div><span class="kv-key">刺激方式:</span> <span class="kv-val">{{ selectedGirl.details.recStim }}</span></div>
                <div><span class="kv-key">推荐节奏:</span> <span class="kv-val">{{ selectedGirl.details.recTempo }}</span></div>
                <div><span class="kv-key text-red-800">禁忌注意:</span> <span class="kv-val font-bold text-red-900">{{ selectedGirl.details.notice }}</span></div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import gsap from 'gsap';
import LustBar from './LustBar.vue';

const girls = ref([
  {
      id: 1, name: '冷霜仙子', rank: 'S', level: '元婴中期', location: '地下水牢',
      slaveStatus: '抵死不从', mark: '正在破心', love: 10, loveDesc: '极度敌意', lust: 45, lustDesc: '肉体本能反应',
      voice: '魔头……你毁我清白，休想让我发出一声淫叫……啊！别碰阴蒂……！',
      details: {
          age: 230, race: '人族冰系天灵根', identity: '广寒宫圣女', job: '正道魁首', powerType: '冰清玉洁决',
          clothes: '仅存几片被撕裂的素白雪缎，无法遮掩胸前深红的乳粒，亵裤已被体液洇透。',
          boobs: '形状完美的玉碗，原本雪白，现因情欲毒药发作，乳头肿胀成鲜艳的樱桃色，稍一触碰便会流出甘乳。',
          pussy: '天生名器「名剑寒渊」，入口狭窄如处子，紧致冰凉，但在高潮时会疯狂分泌滚烫的爱液，内壁疯狂绞杀阳物。',
          legs: '常年修仙练就的修长仙腿，肌肉匀称，现被缚仙索强行大张成M字，内侧满是巴掌印。',
          ass: '雪白挺翘，后庭仍是不可侵犯的禁地，紧闭如红梅。',
          loveChange: '道心破碎中，但仇恨值极高。',
          lustChange: '极度抗拒，但身体因合欢散开始食髓知味，阴道会不自觉地收缩索求。',
          exp: '冰清玉洁二百年，初夜被主人用极品合欢散强行夺走，现每日承受高强度采补三次。',
          fetish: '尚未彻底屈服。[潜在淫根]：强烈的反差羞耻、被同门弟子目睹的凌辱露出。',
          weakness: '[生理] 冰肌玉骨最怕灼热刺激，阴核极度敏感。[心理] 害怕师门名誉扫地。',
          capture: '宗门大战中灵力耗尽，被强行收入美人图封印。',
          review: '极品冰系神鼎！外表越是神圣不可侵犯，内里调教出的淫水越是甘甜。双修时其元婴期精纯灵力反哺极大。当前重点在摧毁其精神防线，让其彻底沦为只会求欢的母狗。',
          recPose: '后背位强制进入、悬挂M字开脚。',
          recStim: '使用阳火属性法宝持续刺激阴核，辅以精神羞辱。',
          recTempo: '暴风骤雨般的撞击，不给其喘息凝神的机会。',
          notice: '元婴期修士神识强大，交媾时必须时刻开启锁神环，谨防其自爆金丹同归于尽。'
      }
  },
  {
      id: 2, name: '苏妲己 (妖狐)', rank: 'SS', level: '化神期', location: '牝牝宫 (软榻)',
      slaveStatus: '绝对臣服', mark: '永世肉奴', love: 100, loveDesc: '至死不渝', lust: 100, lustDesc: '牝犬发情',
      voice: '主人~ 妲己的骚穴好痒，求主人用大肉棒狠狠塞满骚狐狸的子宫吧~',
      details: {
          age: 1500, race: '九尾天狐', identity: '一代妖后', job: '魅魔', powerType: '魅惑、采阳补阴',
          clothes: '半透明的薄纱亵衣，完全真空，九条毛茸茸的尾巴不安分地摇晃着。',
          boobs: '硕大丰满的G罩杯，深褐色的硕大乳晕，随时散发着催情狐香，乳肉如同极品水球。',
          pussy: '天生名器「春水玉壶」，芳草修剪得干干净净。阴唇肥厚外翻，常年流淌着淫水，内部肉壁如千万张小嘴般蠕动。',
          legs: '丰腴肉感的大腿，常年盘在主人腰间，脚趾涂着勾人的红色丹蔻。',
          ass: '极度肥美的安产型巨尻，后庭已被彻底开发，不仅能容纳巨物，还能带来窒息般的快感。',
          loveChange: '已被完全驯化，视主人为唯一的信仰与交配对象。',
          lustChange: '随时处于发情状态，一日无精液灌溉便会欲火焚身。',
          exp: '魅惑众生，但自臣服主人后，一切洞穴仅供主人一人享用，日夜侍寝。',
          fetish: '极度渴望被内射子宫、多穴并行、甚至饮用精液。',
          weakness: '[生理] 狐狸尾巴根部、深宫子宫口。[心理] 害怕被主人冷落一天。',
          capture: '被天香美人图的法则之力直接镇压收服。',
          review: '狐族顶尖神鼎，天生的极品星怒。交媾时无需任何前戏，她会主动榨干你所有的精力。其体内产生的欲望能源纯净且庞大，是法宝升级最核心的能量泵。',
          recPose: '所有体位皆可，尤其推荐其主动骑乘榨汁。',
          recStim: '直接内射子宫，并用力揉捏其狐尾根部。',
          recTempo: '绵长持久，深捣深干。',
          notice: '其榨汁能力极强，主人若灵力不足，容易被其反吸导致精尽人亡。'
      }
  }
]);

const selectedGirl = ref(null);

const openGirl = (girl: any) => {
  selectedGirl.value = girl;
  nextTick(() => {
    gsap.fromTo('.fade-content', { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.5, ease: "back.out(1.2)" });
  });
};
</script>

<style scoped>
.font-ancient { font-family: 'Ma Shan Zheng', cursive; }

.ancient-card {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.5);
  box-shadow: 0 4px 15px rgba(0,0,0,0.08), inset 0 0 30px rgba(255,255,255,0.5);
  border-radius: 4px;
  padding: 25px;
  position: relative;
  margin-bottom: 25px;
  backdrop-filter: blur(4px);
}
.ancient-card::before, .ancient-card::after {
  content: ''; position: absolute; width: 20px; height: 20px; border: 2px solid #c49123; pointer-events: none;
}
.ancient-card::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.ancient-card::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.cauldron-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px;
}

.succubus-card {
  background: linear-gradient(145deg, rgba(255, 240, 245, 0.85), rgba(250, 230, 230, 0.6));
  border: 1px solid rgba(209, 46, 83, 0.3);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(138, 11, 28, 0.1);
}
.succubus-card .bg-emblem {
  position: absolute; right: -20px; bottom: -20px; width: 120px; height: 120px;
  opacity: 0.05; transition: all 0.5s; transform: rotate(0deg);
}
.succubus-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: #d12e53;
  box-shadow: 0 15px 30px rgba(138, 11, 28, 0.2), 0 0 20px rgba(209, 46, 83, 0.6);
}
.succubus-card:hover .bg-emblem {
  opacity: 0.15; transform: rotate(45deg) scale(1.2);
  fill: #d12e53;
}

.seal-tag {
  font-size: 0.85rem; padding: 2px 8px;
  border: 1px solid #8a0b1c; color: #8a0b1c;
  border-radius: 2px; font-weight: bold;
  background: rgba(138, 11, 28, 0.05);
  display: inline-flex; align-items: center; gap: 4px;
}
.seal-tag.gold {
  border-color: #c49123; color: #c49123; background: rgba(196, 145, 35, 0.1);
}

.kv-block { margin-bottom: 12px; }
.kv-key { color: #8a0b1c; font-weight: bold; margin-right: 8px; font-family: 'Noto Serif SC', serif; }
.kv-val { color: #1a1a1a; font-size: 0.95rem; line-height: 1.6; }

.erotic-box {
  background: linear-gradient(to right, rgba(255,240,245,0.9), rgba(255,255,255,0.7));
  border-left: 3px solid #d12e53;
  padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 15px;
  box-shadow: 2px 2px 10px rgba(209, 46, 83, 0.05);
}
</style>
