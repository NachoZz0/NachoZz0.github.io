// 创建蛋糕元素
    function createCake() {
      const cake = document.createElement('div');
      cake.className = 'cake';
      
      // 随机水平位置 (留出边距)
      const leftPos = 20 + Math.random() * (window.innerWidth - 40);
      cake.style.left = `${leftPos}px`;
      
      // 随机动画参数
      const duration = 4 + Math.random() * 6; // 4-10秒
      const delay = Math.random() * 1.5; // 0-1.5秒延迟
      
      // 控制蛋糕大小 (30px-80px之间)
      const minSize = 30;
      const maxSize = 50;
      const size = minSize + Math.random() * (maxSize - minSize);
      
      cake.style.width = `${size}px`;
      cake.style.height = `${size}px`;
      
      // 随机蛋糕类型 (使用emoji或图片)
      const cakeTypes = [
        '🍰', '🎂','🎉',''
      ];
      
      // 50%概率使用emoji，50%概率使用图片
      if (Math.random() > 0.5) {
        // 使用emoji
        cake.textContent = cakeTypes[Math.floor(Math.random() * cakeTypes.length)];
        cake.style.fontSize = `${size * 0.8}px`;
        cake.style.textAlign = 'center';
        cake.style.lineHeight = `${size}px`;
      } else {
        // 使用图片
        cake.style.backgroundImage = "url('images/cake.png')";
      }
      
      // 应用动画
      cake.style.animation = `fall ${duration}s ease-in ${delay}s forwards`;
      
      document.body.appendChild(cake);
      
      // 动画结束后移除元素
      setTimeout(() => {
        cake.remove();
      }, (duration + delay) * 1000);
    }
    // 确认日期为8月27
    const today = new Date();
    if (today.getMonth() === 7 && today.getDate() === 27) 
    { 
      startCakeAnimation();
    // 控制蛋糕生成
    let cakeInterval;
    function startCakeAnimation() {
      // 清除现有蛋糕
      document.querySelectorAll('.cake').forEach(cake => cake.remove());
      
      // 根据屏幕宽度控制蛋糕密度
      const density = Math.max(1, Math.floor(window.innerWidth / 300));
      const createCount = density;
      
      // 初始创建一批蛋糕
      for (let i = 0; i < createCount; i++) {
        createCake();
      }
      
      // 设置创建间隔 (每0.6秒创建一次)
      cakeInterval = setInterval(() => {
        for (let i = 0; i < density; i++) {
          createCake();
        }
      }, 600);
      
      setTimeout(() => {
        stopCakeAnimation();
      }, 60 * 1000);
    }
    
    function stopCakeAnimation() {
      clearInterval(cakeInterval);
    }

    // 页面加载后开始动画
    window.addEventListener('load', () => {
      // 自动开始动画
      startCakeAnimation();
    });

    // 窗口大小变化时重新调整
    window.addEventListener('resize', () => {
      if (cakeInterval) {
        stopCakeAnimation();
        startCakeAnimation();
      }
    });
}

