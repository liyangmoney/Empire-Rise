import Phaser from 'phaser';

/**
 * 资源面板 - 顶部栏紧凑版
 */
export class ResourcePanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.resourceItems = {};
    this.currentResources = null;
    
    // 只显示6种主要资源，更紧凑
    this.resourceTypes = [
      { key: 'wood', icon: '🌲', color: 0x4CAF50 },
      { key: 'stone', icon: '⛰️', color: 0x9E9E9E },
      { key: 'food', icon: '🌾', color: 0xFFC107 },
      { key: 'iron', icon: '⚙️', color: 0x607D8B },
      { key: 'crystal', icon: '💎', color: 0x00BCD4 },
      { key: 'gold', icon: '💰', color: 0xFFD700 }
    ];
    
    this.createUI();
    scene.add.existing(this);
    
    this.startLocalUpdate();
  }

  createUI() {
    const itemW = 65;
    const startX = -((this.resourceTypes.length * itemW) / 2) + itemW / 2;
    
    this.resourceTypes.forEach((type, index) => {
      const x = startX + index * itemW;
      
      const container = this.scene.add.container(x, 0);
      
      // 图标
      const icon = this.scene.add.text(0, -10, type.icon, {
        fontSize: '18px'
      }).setOrigin(0.5);
      container.add(icon);
      
      // 数值
      const value = this.scene.add.text(0, 12, '0', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      container.add(value);
      
      // 产出速率（小字体在下方）
      const rate = this.scene.add.text(0, 28, '', {
        fontSize: '9px',
        color: '#4CAF50'
      }).setOrigin(0.5);
      container.add(rate);
      
      this.add(container);
      
      this.resourceItems[type.key] = { value, rate };
    });
    
    // 体力显示 - 更紧凑
    this.staminaText = this.scene.add.text(260, 0, '⚡100/100', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#4CAF50'
    }).setOrigin(0.5);
    this.add(this.staminaText);
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
        
        if (rate > 0) {
          const ratePerSecond = (rate / 3600).toFixed(1);
          item.rate.setText(`+${ratePerSecond}/s`);
        }
      }
    }
  }

  updateStamina(stamina) {
    if (!stamina) return;
    this.staminaText.setText(`⚡${stamina.current}/${stamina.max}`);
    
    const color = stamina.current < 20 ? '#f44336' : stamina.current < 50 ? '#ff9800' : '#4CAF50';
    this.staminaText.setColor(color);
  }

  updatePopulation(population) {
    // 人口显示已移除，此方法保留兼容性
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
