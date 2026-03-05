import Phaser from 'phaser';

/**
 * 建筑面板
 */
export class BuildingPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.add.text(0, 0, '🏗️ 建筑系统', {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0.5);
    
    this.add.text(0, 40, '（待实现）', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(0.5);
    
    scene.add.existing(this);
  }

  updateData(buildings) {
    // 待实现
  }

  onShow() {
    // 面板显示时调用
  }
}
