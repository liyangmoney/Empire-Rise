import Phaser from 'phaser';

/**
 * 时间显示组件
 */
export class TimeDisplay extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // 背景
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(-120, -20, 240, 40, 20);
    
    // 日期文本
    this.dateText = scene.add.text(0, -5, '2026年 2月 13日', {
      fontSize: '14px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 时间文本
    this.timeText = scene.add.text(0, 12, '☀️ 早晨 00:00:00', {
      fontSize: '12px',
      color: '#aaa'
    }).setOrigin(0.5);
    
    this.add([bg, this.dateText, this.timeText]);
    scene.add.existing(this);
    
    // 启动本地时间更新
    this.startLocalUpdate();
  }

  updateTime(data) {
    if (data.gameDate) {
      this.dateText.setText(data.gameDate);
    }
    
    if (data.timeOfDayName && data.realTime) {
      this.timeText.setText(`${data.timeOfDayName} ${data.realTime}`);
    }
    
    this.lastTimeData = data;
  }

  startLocalUpdate() {
    // 每秒更新本地时间显示
    this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        const timeOfDayName = this.lastTimeData?.timeOfDayName || '☀️ 早晨';
        this.timeText.setText(`${timeOfDayName} ${timeStr}`);
      },
      loop: true
    });
  }
}
