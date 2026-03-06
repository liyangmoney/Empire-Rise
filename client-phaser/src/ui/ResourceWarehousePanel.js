import Phaser from 'phaser';

/**
 * 资源仓库面板 - 优化版
 */
export class ResourceWarehousePanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.resourceItems = {};
    this.currentResources = null;
    
    this.resourceTypes = [
      { key: 'wood', name: '木材', icon: '🌲', color: 0x4CAF50 },
      { key: 'stone', name: '石材', icon: '⛰️', color: 0x9E9E9E },
      { key: 'food', name: '粮食', icon: '🌾', color: 0xFFC107 },
      { key: 'iron', name: '铁矿', icon: '⚙️', color: 0x607D8B },
      { key: 'crystal', name: '水晶', icon: '💎', color: 0x00BCD4 },
      { key: 'gold', name: '金币', icon: '💰', color: 0xFFD700 },
      { key: 'fish_product', name: '鱼产品', icon: '🐟', color: 0x2196F3 },
      { key: 'fruit', name: '水果', icon: '🍎', color: 0xF44336 },
      { key: 'premium_food', name: '精品食材', icon: '🍖', color: 0xFF9800 }
    ];
    
    this.createUI();
    scene.add.existing(this);
    this.startLocalUpdate();
  }

  createUI() {
    // 标题
    this.scene.add.text(0, -250, '📦 资源仓库', {
      fontSize: '28px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 卡片容器
    this.cardsContainer = this.scene.add.container(0, 0);
    this.add(this.cardsContainer);
    
    // 布局参数
    const cardW = 240;
    const cardH = 110;
    const gapX = 25;
    const gapY = 20;
    const cols = 4;
    
    // 计算总宽度和起始位置
    const totalWidth = cols * cardW + (cols - 1) * gapX;
    const startX = -totalWidth / 2 + cardW / 2;
    const startY = -160;
    
    this.resourceTypes.forEach((type, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      
      this.createResourceCard(type, x, y, cardW, cardH);
    });
  }
  
  createResourceCard(type, x, y, cardW, cardH) {
    const card = this.scene.add.container(x, y);
    
    // 卡片背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 12);
    bg.lineStyle(1, 0x333333, 1);
    bg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 12);
    card.add(bg);
    
    // 左侧彩色条
    const colorBar = this.scene.add.graphics();
    colorBar.fillStyle(type.color, 1);
    colorBar.fillRoundedRect(-cardW/2 + 3, -cardH/2 + 3, 4, cardH - 6, 2);
    card.add(colorBar);
    
    // 图标背景
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(type.color, 0.15);
    iconBg.fillCircle(-cardW/2 + 35, -cardH/2 + 35, 22);
    card.add(iconBg);
    
    // 图标
    const icon = this.scene.add.text(-cardW/2 + 35, -cardH/2 + 35, type.icon, {
      fontSize: '26px'
    }).setOrigin(0.5);
    card.add(icon);
    
    // 资源名称（右上）
    const nameText = this.scene.add.text(-cardW/2 + 70, -cardH/2 + 18, type.name, {
      fontSize: '15px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffffff'
    });
    card.add(nameText);
    
    // 上限（右上）
    const maxText = this.scene.add.text(cardW/2 - 15, -cardH/2 + 18, '/ 1000', {
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(1, 0);
    card.add(maxText);
    
    // 数量（中间大字体）
    const valueText = this.scene.add.text(-cardW/2 + 70, -cardH/2 + 50, '0', {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    card.add(valueText);
    
    // 产出速率
    const rateText = this.scene.add.text(-cardW/2 + 70, cardH/2 - 18, '+0.0/秒', {
      fontSize: '12px',
      color: '#4CAF50'
    });
    card.add(rateText);
    
    // 进度条背景
    const progressY = cardH/2 - 6;
    const progressBg = this.scene.add.graphics();
    progressBg.fillStyle(0x000000, 0.5);
    progressBg.fillRoundedRect(-cardW/2 + 70, progressY, cardW - 90, 6, 3);
    card.add(progressBg);
    
    // 进度条
    const progressBar = this.scene.add.graphics();
    progressBar.fillStyle(type.color, 1);
    progressBar.fillRoundedRect(-cardW/2 + 70, progressY, 0, 6, 3);
    card.add(progressBar);
    
    this.cardsContainer.add(card);
    
    this.resourceItems[type.key] = {
      value: valueText,
      max: maxText,
      rate: rateText,
      progressBar,
      cardBg: bg
    };
  }

  updateData(resources) {
    if (!resources) return;
    
    this.currentResources = JSON.parse(JSON.stringify(resources));
    
    for (const [key, data] of Object.entries(resources)) {
      const item = this.resourceItems[key];
      if (item) {
        const amount = typeof data === 'object' ? (data.amount || 0) : (data || 0);
        const max = typeof data === 'object' ? (data.max || 1000) : 1000;
        const rate = typeof data === 'object' ? (data.rate || 0) : 0;
        
        item.value.setText(Math.floor(amount).toString());
        item.max.setText(`/ ${Math.floor(max)}`);
        
        const ratePerSecond = (rate / 3600).toFixed(1);
        item.rate.setText(`+${ratePerSecond}/秒`);
        
        // 更新进度条
        const progress = Math.min(1, amount / max);
        const barWidth = (240 - 90) * progress;
        
        item.progressBar.clear();
        
        // 根据容量改变颜色
        let color = 0x4CAF50;
        if (progress > 0.9) color = 0xf44336;
        else if (progress > 0.7) color = 0xff9800;
        
        item.progressBar.fillStyle(color, 1);
        item.progressBar.fillRoundedRect(-240/2 + 70, 110/2 - 6, barWidth, 6, 3);
      }
    }
  }

  startLocalUpdate() {
    this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.currentResources) return;
        
        for (const [key, data] of Object.entries(this.currentResources)) {
          const rate = data.rate || 0;
          if (rate > 0) {
            const perSecond = rate / 3600;
            const max = data.max || 1000;
            data.amount = Math.min(max, (data.amount || 0) + perSecond);
            
            const item = this.resourceItems[key];
            if (item) {
              item.value.setText(Math.floor(data.amount).toString());
              
              const progress = Math.min(1, data.amount / max);
              const barWidth = (240 - 90) * progress;
              
              item.progressBar.clear();
              
              let color = 0x4CAF50;
              if (progress > 0.9) color = 0xf44336;
              else if (progress > 0.7) color = 0xff9800;
              
              item.progressBar.fillStyle(color, 1);
              item.progressBar.fillRoundedRect(-240/2 + 70, 110/2 - 6, barWidth, 6, 3);
            }
          }
        }
      }
    });
  }
  
  onShow() {}
}
