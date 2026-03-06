import Phaser from 'phaser';

/**
 * 时间显示 - 修复版
 */
export class TimeDisplay extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // 背景
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(-70, -22, 140, 44, 8);
    this.add(bg);
    
    // 日期显示
    this.dateText = scene.add.text(0, -8, '第1年 1月 1日', {
      fontSize: '12px',
      fontFamily: 'Microsoft YaHei, Arial',
      color: '#ffd700'
    }).setOrigin(0.5);
    this.add(this.dateText);
    
    // 时间显示
    this.timeText = scene.add.text(0, 10, '00:00:00', {
      fontSize: '14px',
      color: '#4CAF50',
      fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.add(this.timeText);
    
    scene.add.existing(this);
    
    // 本地秒数计时
    this.localSeconds = 0;
    this.startLocalTick();
  }
  
  startLocalTick() {
    this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.localSeconds++;
        // 更新显示的时间（最后两位秒数）
        const currentText = this.timeText.text;
        const parts = currentText.split(':');
        if (parts.length === 3) {
          let h = parseInt(parts[0]);
          let m = parseInt(parts[1]);
          let s = parseInt(parts[2]) + 1;
          
          if (s >= 60) {
            s = 0;
            m++;
          }
          if (m >= 60) {
            m = 0;
            h++;
          }
          if (h >= 24) {
            h = 0;
          }
          
          this.timeText.setText(
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
          );
        }
      }
    });
  }
  
  updateTime(data) {
    if (data.gameDate) {
      this.dateText.setText(data.gameDate);
    }
    if (data.timeDisplay || data.time) {
      const timeStr = data.timeDisplay || data.time || '00:00:00';
      this.timeText.setText(timeStr);
    }
  }
}
