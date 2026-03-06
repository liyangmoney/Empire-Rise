import Phaser from 'phaser';

/**
 * 资源面板 - 显示所有资源
 */
export class ResourcePanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.resourceItems = {};
    this.staminaText = null;
    this.populationText = null;
    
    // 资源类型配置
    this.resourceTypes = [
      { key: 'wood', name: '木材', icon: '🌲', color: '#8B4513' },
      { key: 'stone', name: '石材', icon: '⛰️', color: '#808080' },
      { key: 'food', name: '粮食', icon: '🌾', color: '#FFD700' },
      { key: 'iron', name: '铁矿', icon: '⚙️', color: '#4a5568' },
      { key: 'crystal', name: '水晶', icon: '💎', color: '#00CED1' },
      { key: 'gold', name: '金币', icon: '💰', color: '#FFD700' }
    ];
    
    // 创建资源显示项
    let offsetX = -300;
    this.resourceTypes.forEach(type => {
      this.createResourceItem(type, offsetX);
      offsetX += 100;
    });
    
    // 创建体力和人口显示
    this.createStaminaDisplay(320);
    this.createPopulationDisplay(450);
    
    scene.add.existing(this);
  }

  createResourceItem(type, x) {
    const container = this.scene.add.container(x, 0);
    
    // 图标
    const icon = this.scene.add.text(0, -8, type.icon, {
      fontSize: '20px'
    }).setOrigin(0.5);
    
    // 数值
    const value = this.scene.add.text(0, 12, '0', {
      fontSize: '14px',
      color: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    container.add([icon, value]);
    this.add(container);
    
    this.resourceItems[type.key] = value;
  }
  
  createStaminaDisplay(x) {
    const container = this.scene.add.container(x, 0);
    
    // 图标
    const icon = this.scene.add.text(0, -8, '⚡', {
      fontSize: '20px'
    }).setOrigin(0.5);
    
    // 数值
    this.staminaText = this.scene.add.text(0, 12, '100/100', {
      fontSize: '14px',
      color: '#4CAF50',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    container.add([icon, this.staminaText]);
    this.add(container);
  }
  
  createPopulationDisplay(x) {
    const container = this.scene.add.container(x, 0);
    
    // 图标
    const icon = this.scene.add.text(0, -8, '👥', {
      fontSize: '20px'
    }).setOrigin(0.5);
    
    // 数值
    this.populationText = this.scene.add.text(0, 12, '50/50', {
      fontSize: '14px',
      color: '#2196F3',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    container.add([icon, this.populationText]);
    this.add(container);
  }

  updateData(resources) {
    if (!resources) return;
    
    Object.keys(resources).forEach(key => {
      const text = this.resourceItems[key];
      if (text) {
        const value = resources[key]?.amount || resources[key] || 0;
        // 格式化大数字
        if (value >= 1000000) {
          text.setText((value / 1000000).toFixed(1) + 'M');
        } else if (value >= 1000) {
          text.setText((value / 1000).toFixed(1) + 'K');
        } else {
          text.setText(Math.floor(value).toString());
        }
      }
    });
  }
  
  updateStamina(stamina) {
    if (this.staminaText && stamina) {
      this.staminaText.setText(`${stamina.current}/${stamina.max}`);
      // 低体力变红色
      if (stamina.current < 20) {
        this.staminaText.setColor('#f44336');
      } else {
        this.staminaText.setColor('#4CAF50');
      }
    }
  }
  
  updatePopulation(population) {
    if (this.populationText && population) {
      this.populationText.setText(`${population.current}/${population.max}`);
      // 人口不足变红色
      if (population.current < population.max * 0.2) {
        this.populationText.setColor('#f44336');
      } else {
        this.populationText.setColor('#2196F3');
      }
    }
  }
}
