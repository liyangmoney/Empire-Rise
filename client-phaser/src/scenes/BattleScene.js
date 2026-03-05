import Phaser from 'phaser';

/**
 * 战斗场景 - 展示战斗动画和结果
 */
export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    this.battleData = data.battleData || {};
    this.callback = data.callback;
  }

  create() {
    // 半透明背景
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.9);
    
    // 标题
    this.add.text(640, 60, '⚔️ 战斗进行中', {
      fontSize: '36px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700'
    }).setOrigin(0.5);
    
    // 如果已经有结果，直接显示
    if (this.battleData.result) {
      this.showResult(this.battleData.result);
    } else {
      this.showBattleAnimation();
    }
    
    // 关闭按钮
    this.createCloseButton();
  }

  showBattleAnimation() {
    // 简化的战斗动画
    const centerX = 640;
    const centerY = 360;
    
    // 玩家军队
    this.add.text(centerX - 200, centerY, '🛡️', {
      fontSize: '64px'
    }).setOrigin(0.5);
    
    this.add.text(centerX - 200, centerY + 50, '我方军队', {
      fontSize: '18px',
      color: '#4CAF50'
    }).setOrigin(0.5);
    
    // VS
    this.add.text(centerX, centerY, 'VS', {
      fontSize: '48px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 敌人
    this.add.text(centerX + 200, centerY, '👹', {
      fontSize: '64px'
    }).setOrigin(0.5);
    
    this.add.text(centerX + 200, centerY + 50, this.battleData.npcName || '敌人', {
      fontSize: '18px',
      color: '#f44336'
    }).setOrigin(0.5);
    
    // 战斗进行中提示
    const loadingText = this.add.text(centerX, centerY + 150, '战斗激烈进行中...', {
      fontSize: '20px',
      color: '#aaa'
    }).setOrigin(0.5);
    
    // 动画
    this.tweens.add({
      targets: loadingText,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  showResult(result) {
    // 清除战斗动画
    this.children.removeAll();
    
    // 重新添加背景
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.95);
    
    // 胜负标题
    const isWin = result.victory;
    this.add.text(640, 80, isWin ? '🎉 胜利!' : '💀 失败', {
      fontSize: '48px',
      fontFamily: 'Microsoft YaHei',
      color: isWin ? '#4CAF50' : '#f44336',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 战斗统计
    const stats = result.stats || {};
    let y = 180;
    
    const statTexts = [
      `总回合: ${stats.rounds || 0}`,
      `我方伤害: ${stats.playerDamage || 0}`,
      `敌方伤害: ${stats.npcDamage || 0}`,
      `我方阵亡: ${stats.playerDeaths || 0}`,
      `敌方击杀: ${stats.npcDeaths || 0}`
    ];
    
    statTexts.forEach(text => {
      this.add.text(640, y, text, {
        fontSize: '18px',
        color: '#fff'
      }).setOrigin(0.5);
      y += 35;
    });
    
    // 战利品
    if (result.rewards && result.rewards.length > 0) {
      y += 20;
      this.add.text(640, y, '🎁 战利品:', {
        fontSize: '20px',
        color: '#ffd700'
      }).setOrigin(0.5);
      
      y += 40;
      result.rewards.forEach(reward => {
        this.add.text(640, y, `${reward.name} x${reward.count}`, {
          fontSize: '16px',
          color: '#aaa'
        }).setOrigin(0.5);
        y += 25;
      });
    }
    
    // 关闭按钮
    this.createCloseButton();
  }

  createCloseButton() {
    const btn = this.add.text(640, 600, '关闭', {
      fontSize: '20px',
      color: '#fff',
      backgroundColor: 'rgba(76,175,80,0.8)',
      padding: { x: 40, y: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    btn.on('pointerover', () => {
      btn.setBackgroundColor('rgba(76,175,80,1)');
    });
    
    btn.on('pointerout', () => {
      btn.setBackgroundColor('rgba(76,175,80,0.8)');
    });
    
    btn.on('pointerup', () => {
      this.scene.stop();
      if (this.callback) {
        this.callback();
      }
    });
  }
}
