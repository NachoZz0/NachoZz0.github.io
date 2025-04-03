// DOM元素
const player = document.getElementById('player');
const toggleBtn = document.getElementById('toggleBtn');
const toggleHeader = document.getElementById('toggleHeader');
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const progress = document.getElementById('progress');
const volume = document.getElementById('volume');
const timeDisplay = document.getElementById('time');

// ================= 状态管理 =================
let isExpanded = localStorage.getItem('playerExpanded') === 'true';

function initPlayerState() {
  player.classList.toggle('expanded', isExpanded);
  toggleBtn.style.transform = isExpanded ? 'rotate(180deg)' : 'none';
  updatePlayButton();
}

function updatePlayButton() {
  const icon = playBtn.querySelector('i');
  icon.className = audio.paused ? 'fas fa-play' : 'fas fa-pause';
}

// ================= 伸缩控制 =================
toggleHeader.addEventListener('click', () => {
  isExpanded = !isExpanded;
  player.classList.toggle('expanded');
  toggleBtn.style.transform = isExpanded ? 'rotate(180deg)' : 'none';
  localStorage.setItem('playerExpanded', isExpanded);
});

// ================= 播放控制 =================
playBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (audio.paused) {
    audio.play().catch(e => console.log('播放失败:', e));
  } else {
    audio.pause();
  }
  updatePlayButton();
});

// ================= 进度控制 =================
audio.addEventListener('timeupdate', () => {
  progress.value = (audio.currentTime / audio.duration) * 100 || 0;
  timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});

progress.addEventListener('input', () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
});

// ================= 音量控制 =================
volume.addEventListener('input', () => {
  audio.volume = volume.value;
  localStorage.setItem('volume', volume.value);
});

// ================= 工具函数 =================
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ================= 初始化 =================
window.addEventListener('load', () => {
  initPlayerState();
  audio.volume = localStorage.getItem('volume') || 1;
  volume.value = audio.volume;
  
  const savedTime = localStorage.getItem('audioTime');
  if (savedTime) audio.currentTime = parseFloat(savedTime);
  
  setInterval(() => {
    if (!audio.paused) {
      localStorage.setItem('audioTime', audio.currentTime);
    }
  }, 1000);
});

// 自动播放尝试
document.addEventListener('click', () => {
  audio.play().then(() => {
    updatePlayButton();
  }).catch(e => {
    console.log('自动播放被阻止:', e);
  });
}, { once: true });