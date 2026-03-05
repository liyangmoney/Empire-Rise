import Phaser from 'phaser';

/**
 * 任务面板
 */
export class TaskPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.add.text(0, 0, '📋 任务系统', {
      fontSize: '24px',
      color: '#fff'
    }).setOrigin(0.5);
    
    this.add.text(0, 40, '（待实现）', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(0.5);
    
    scene.add.existing(this);
  }

  updateData(tasks) {
    // 待实现
  }

  onShow() {
    // 面板显示时调用
  }
}
