import Phaser from 'phaser';

/**
 * 资源面板 - 显示所有资源详情
 */
export class ResourcePanel extends Phaser.GameObjects.Container {
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
      { key: 'gold', name: '金币', icon: '💰', color: '#FFD700' }
    ];
    
    this.createUI();
    scene.add.existing(this);
    
    // 启动本地刷新
    this.startLocalUpdate();
  }

  createUI() {
    let offsetX = -300;
    
    this.resourceTypes.forEach(type => {
      const container = this.scene.add.container(offsetX, 0);
      
      // 背景
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x000000, 0.3);
      bg.fillRoundedRect(-45, -25, 90, 50, 8);
      container.add(bg);
      
      // 图标
      const icon = this.scene.add.text(0, -12, type.icon, {
        fontSize: '20px'
      }).setOrigin(0.5);
      container.add(icon);
      
      // 数值
      const value = this.scene.add.text(0, 10, '0', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      container.add(value);
      
      // 产出速率（默认隐藏）
      const rate = this.scene.add.text(0, 28, '', {
        fontSize: '10px',
        color: '#4CAF50'
      }).setOrigin(0.5);
      container.add(rate);
      
      this.add(container);
      
      this.resourceItems[type.key] = {
        value,
        rate,
        bg
      };
      
      offsetX += 100;
    });
    
    // 体力显示
    this.staminaText = this.scene.add.text(320, 0, '⚡ 100/100', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#4CAF50'
    }).setOrigin(0.5);
    this.add(this.staminaText);
    
    // 人口显示
    this.populationText = this.scene.add.text(450, 0, '👥 50/50', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#4CAF50'
    }).setOrigin(0.5);
    this.add(this.populationText);
  }

  updateData(resources) {
    if (!resources) return;
    
    this.currentResources = JSON.parse(JSON.stringify(resources));
    
    for (const [key, data] of Object.entries(resources)) {
      const item = this.resourceItems[key];
      if (item) {
        const amount = typeof data === 'object' ? (data.amount || 0) : (data || 0);
        const rate = typeof data === 'object' ? (data.rate || 0) : 0;
        
        item.value.setText(Math.floor(amount).toString());
        
        // 显示产出速率
        if (rate > 0) {
          const ratePerSecond = (rate / 3600).toFixed(1);
          item.rate.setText(`+${ratePerSecond}/s`);
        }
      }
    }
  }

  updateStamina(stamina) {
    if (!stamina) return;
    this.staminaText.setText(`⚡ ${stamina.current}/${stamina.max}`);
    
    // 根据体力值改变颜色
    const color = stamina.current < 20 ? '#f44336' : stamina.current < 50 ? '#ff9800' : '#4CAF50';
    this.staminaText.setColor(color);
  }

  updatePopulation(population) {
    if (!population) return;
    this.populationText.setText(`👥 ${population.current}/${population.max}`);
    
    // 根据人口使用率改变颜色
    const ratio = population.current / population.max;
    const color = ratio > 0.9 ? '#f44336' : ratio > 0.7 ? '#ff9800' : '#4CAF50';
    this.populationText.setColor(color);
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
            }
          }
        }
      }
    });
  }
}
