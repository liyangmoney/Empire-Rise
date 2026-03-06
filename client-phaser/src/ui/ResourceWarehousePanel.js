import Phaser from 'phaser';

/**
 * 资源仓库面板 - 显示所有资源详情
 */
export class ResourceWarehousePanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.resourceItems = {};
    this.currentResources = null;
    
    // 资源类型配置
    this.resourceTypes = [
      { key: 'wood', name: '木材', icon: '🌲', color: '#8B4513' },
      { key: 'stone', name: '石材', icon: '⛰️', color: '#808080' },
      { key: 'food', name: '粮食', icon: '🌾', color: '#FFD700' },
      { key: 'iron', name: '铁矿', icon: '⚙️', color: '#4a5568' },
      { key: 'crystal', name: '水晶', icon: '💎', color: '#00CED1' },
      { key: 'gold', name: '金币', icon: '💰', color: '#FFD700' },
      { key: 'fish_product', name: '鱼产品', icon: '🐟', color: '#4682B4' },
      { key: 'fruit', name: '水果', icon: '🍎', color: '#FF6347' },
      { key: 'premium_food', name: '精品食材', icon: '🍖', color: '#DAA520' }
    ];
    
    this.createUI();
    scene.add.existing(this);
    
    // 启动本地刷新
    this.startLocalUpdate();
  }

  createUI() {
    // 标题
    this.scene.add.text(0, -260, '📦 资源仓库', {
      fontSize: '28px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 资源卡片容器
    this.cardsContainer = this.scene.add.container(0, 0);
    this.add(this.cardsContainer);
    
    // 创建资源卡片
    let col = 0;
    let row = 0;
    
    this.resourceTypes.forEach((type, index) => {
      const x = -350 + col * 230;
      const y = -150 + row * 110;
      
      this.createResourceCard(type, x, y);
      
      col++;
      if (col >= 4) {
        col = 0;
        row++;
      }
    });
  }
  
  createResourceCard(type, x, y) {
    const cardW = 210;
    const cardH = 95;
    
    const card = this.scene.add.container(x, y);
    
    // 卡片背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 10);
    bg.lineStyle(1, 0x444444, 0.5);
    bg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, 10);
    card.add(bg);
    
    // 左侧彩色条
    const colorBar = this.scene.add.graphics();
    colorBar.fillStyle(0xffd700, 0.5);
    colorBar.fillRoundedRect(-cardW/2 + 3, -cardH/2 + 3, 5, cardH - 6, 3);
    card.add(colorBar);
    
    // 图标
    const icon = this.scene.add.text(-cardW/2 + 25, -cardH/2 + 25, type.icon, {
      fontSize: '28px'
    }).setOrigin(0.5);
    card.add(icon);
    
    // 资源名称
    const nameText = this.scene.add.text(-cardW/2 + 55, -cardH/2 + 18, type.name, {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    card.add(nameText);
    
    // 数量 - 大字体
    const valueText = this.scene.add.text(-cardW/2 + 55, -cardH/2 + 42, '0', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    card.add(valueText);
    
    // 上限
    const maxText = this.scene.add.text(cardW/2 - 10, -cardH/2 + 22, '/ 1000', {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(1, 0);
    card.add(maxText);
    
    // 产出速率
    const rateText = this.scene.add.text(-cardW/2 + 55, cardH/2 - 15, '+0.0/秒', {
      fontSize: '12px',
      color: '#4CAF50'
    });
    card.add(rateText);
    
    // 进度条背景（显示容量百分比）
    const progressBg = this.scene.add.graphics();
    progressBg.fillStyle(0x333333, 1);
    progressBg.fillRoundedRect(-cardW/2 + 55, cardH/2 - 28, cardW - 70, 6, 3);
    card.add(progressBg);
    
    // 进度条
    const progressBar = this.scene.add.graphics();
    progressBar.fillStyle(parseInt(type.color.replace('#', '0x')), 1);
    progressBar.fillRoundedRect(-cardW/2 + 55, cardH/2 - 28, 0, 6, 3);
    card.add(progressBar);
    
    this.cardsContainer.add(card);
    
    // 保存引用
    this.resourceItems[type.key] = {
      value: valueText,
      max: maxText,
      rate: rateText,
      progressBar,
      bg
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
        
        // 更新产出速率
        const ratePerSecond = (rate / 3600).toFixed(1);
        item.rate.setText(`+${ratePerSecond}/秒`);
        
        // 更新进度条
        const progress = Math.min(1, amount / max);
        item.progressBar.clear();
        
        // 根据容量改变颜色
        let color = 0x4CAF50; // 绿色
        if (progress > 0.9) color = 0xf44336; // 红色（快满）
        else if (progress > 0.7) color = 0xff9800; // 橙色
        
        const barWidth = (210 - 70) * progress;
        item.progressBar.fillStyle(color, 1);
        item.progressBar.fillRoundedRect(-210/2 + 55, 95/2 - 28, barWidth, 6, 3);
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
              
              // 更新进度条
              const progress = Math.min(1, data.amount / max);
              item.progressBar.clear();
              
              let color = 0x4CAF50;
              if (progress > 0.9) color = 0xf44336;
              else if (progress > 0.7) color = 0xff9800;
              
              const barWidth = (210 - 70) * progress;
              item.progressBar.fillStyle(color, 1);
              item.progressBar.fillRoundedRect(-210/2 + 55, 95/2 - 28, barWidth, 6, 3);
            }
          }
        }
      }
    });
  }
  
  onShow() {
    // 面板显示时触发
  }
}
