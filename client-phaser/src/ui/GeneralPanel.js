import Phaser from 'phaser';

/**
 * 将领面板
 */
export class GeneralPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.scene.add.text(0, 0, '🎖️ 将领系统', {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0.5);
    
    this.scene.add.text(0, 40, '（开发中）', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(0.5);
    
    scene.add.existing(this);
  }

  updateData(data) {
    // 待实现
  }

  onShow() {
    // 面板显示时调用
  }
}
