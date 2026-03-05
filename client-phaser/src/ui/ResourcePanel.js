import Phaser from 'phaser';

/**
 * 资源面板 - 显示所有资源
 */
export class ResourcePanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.resourceItems = {};
    
    // 资源类型配置
    this.resourceTypes = [
      { key: 'wood', name: '木材', icon: '🌲', color: '#8B4513' },
      { key: 'stone', name: '石材', icon: '🪨', color: '#808080' },
      { key: 'food', name: '粮食', icon: '🌾', color: '#FFD700' },
      { key: 'iron', name: '铁矿', icon: '⛏️', color: '#4a5568' },
      { key: 'crystal', name: '水晶', icon: '💎', color: '#00CED1' },
      { key: 'gold', name: '金币', icon: '🪙', color: '#FFD700' }
    ];
    
    // 创建资源显示项
    let offsetX = -250;
    this.resourceTypes.forEach(type => {
      this.createResourceItem(type, offsetX);
      offsetX += 100;
    });
    
    scene.add.existing(this);
  }

  createResourceItem(type, x) {
    const container = this.scene.add.container(x, 0);
    
    // 图标
    const icon = this.scene.add.text(0, -5, type.icon, {
      fontSize: '20px'
    }).setOrigin(0.5);
    
    // 数值
    const value = this.scene.add.text(0, 15, '0', {
      fontSize: '14px',
      color: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    container.add([icon, value]);
    this.add(container);
    
    this.resourceItems[type.key] = value;
  }

  updateData(resources) {
    if (!resources) return;
    
    Object.keys(resources).forEach(key => {
      const text = this.resourceItems[key];
      if (text) {
        const value = resources[key];
        // 格式化大数字
        if (value >= 1000000) {
          text.setText((value / 1000000).toFixed(1) + 'M');
        } else if (value >= 1000) {
          text.setText((value / 1000).toFixed(1) + 'K');
        } else {
          text.setText(value.toString());
        }
      }
    });
  }
}
