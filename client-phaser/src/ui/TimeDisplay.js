import Phaser from 'phaser';

/**
 * 时间显示
 */
export class TimeDisplay extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // 日期显示
    this.dateText = scene.add.text(0, -10, '公元前1000年 1月1日', {
      fontSize: '14px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.dateText);
    
    // 时间显示
    this.timeText = scene.add.text(0, 12, '00:00:00', {
      fontSize: '16px',
      color: '#4CAF50',
      fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.add(this.timeText);
    
    scene.add.existing(this);
  }
  
  updateTime(data) {
    if (data.gameDate) {
      this.dateText.setText(data.gameDate);
    }
    if (data.timeDisplay) {
      this.timeText.setText(data.timeDisplay);
    }
  }
}
