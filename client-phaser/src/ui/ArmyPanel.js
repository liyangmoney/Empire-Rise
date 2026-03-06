import Phaser from 'phaser';

/**
 * 军队面板
 */
export class ArmyPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.units = {};
    this.trainingQueue = [];
    this.maxSize = 0;
    
    this.scene = scene;
    
    this.createUI();
    
    scene.add.existing(this);
  }
  
  createUI() {
    // 标题
    this.add.text(0, -250, '⚔️ 军队管理', {
      fontSize: '28px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 军队规模
    this.sizeText = this.scene.add.text(0, -210, '军队规模: 0/0', {
      fontSize: '16px',
      color: '#aaa'
    }).setOrigin(0.5);
    this.add(this.sizeText);
    
    // 兵种列表区域
    this.createUnitList();
    
    // 训练区域
    this.createTrainingArea();
    
    // 训练队列
    this.createTrainingQueue();
  }
  
  createUnitList() {
    const unitTypes = [
      { id: 'infantry', name: '步兵', icon: '⚔️', desc: '基础近战单位' },
      { id: 'archer', name: '弓兵', icon: '🏹', desc: '远程攻击单位' },
      { id: 'cavalry', name: '骑兵', icon: '🐴', desc: '高机动单位' }
    ];
    
    let offsetX = -300;
    unitTypes.forEach(type => {
      const card = this.scene.add.container(offsetX, -120);
      
      // 背景
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x000000, 0.5);
      bg.fillRoundedRect(-100, -60, 200, 120, 8);
      bg.lineStyle(1, 0xffd700, 0.3);
      bg.strokeRoundedRect(-100, -60, 200, 120, 8);
      card.add(bg);
      
      // 图标
      const icon = this.scene.add.text(0, -35, type.icon, {
        fontSize: '32px'
      }).setOrigin(0.5);
      card.add(icon);
      
      // 名称
      const name = this.scene.add.text(0, -5, type.name, {
        fontSize: '16px',
        color: '#fff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      card.add(name);
      
      // 数量
      const count = this.scene.add.text(0, 20, '数量: 0', {
        fontSize: '14px',
        color: '#4CAF50'
      }).setOrigin(0.5);
      card.add(count);
      this.units[type.id] = count;
      
      // 训练按钮
      const trainBtn = this.scene.add.text(0, 45, '训练', {
        fontSize: '12px',
        color: '#4CAF50',
        backgroundColor: 'rgba(76,175,80,0.2)',
        padding: { x: 20, y: 5 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      trainBtn.on('pointerup', () => {
        this.showTrainDialog(type.id);
      });
      card.add(trainBtn);
      
      this.add(card);
      offsetX += 220;
    });
  }
  
  createTrainingArea() {
    // 训练区域背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(-500, 50, 1000, 150, 10);
    this.add(bg);
    
    // 训练标题
    this.add.text(-480, 70, '🎖️ 快速训练', {
      fontSize: '16px',
      color: '#ffd700'
    });
  }
  
  createTrainingQueue() {
    // 训练队列标题
    this.add.text(-480, 220, '⏱️ 训练队列', {
      fontSize: '16px',
      color: '#ffd700'
    });
    
    // 队列显示区域
    this.queueContainer = this.scene.add.container(0, 260);
    this.add(this.queueContainer);
  }
  
  showTrainDialog(unitTypeId) {
    const modal = this.scene.add.container(640, 360);
    modal.setDepth(1000);
    
    // 半透明背景
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-640, -360, 1280, 720);
    modal.add(overlay);
    
    // 弹窗背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-200, -150, 400, 300, 12);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(-200, -150, 400, 300, 12);
    modal.add(bg);
    
    // 标题
    const unitNames = { infantry: '步兵', archer: '弓兵', cavalry: '骑兵' };
    const title = this.scene.add.text(0, -120, `训练 ${unitNames[unitTypeId]}`, {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    modal.add(title);
    
    // 数量选择
    let count = 1;
    const countText = this.scene.add.text(0, -50, `数量: ${count}`, {
      fontSize: '18px',
      color: '#fff'
    }).setOrigin(0.5);
    modal.add(countText);
    
    // 减号按钮
    const minusBtn = this.scene.add.text(-80, -50, '-', {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#666',
      padding: { x: 15, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    minusBtn.on('pointerup', () => {
      if (count > 1) {
        count--;
        countText.setText(`数量: ${count}`);
      }
    });
    modal.add(minusBtn);
    
    // 加号按钮
    const plusBtn = this.scene.add.text(80, -50, '+', {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#666',
      padding: { x: 15, y: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    plusBtn.on('pointerup', () => {
      count++;
      countText.setText(`数量: ${count}`);
    });
    modal.add(plusBtn);
    
    // 确认按钮
    const confirmBtn = this.scene.add.text(-60, 50, '确认', {
      fontSize: '16px',
      color: '#fff',
      backgroundColor: '#4CAF50',
      padding: { x: 30, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    confirmBtn.on('pointerup', () => {
      window.socketManager.startTraining(unitTypeId, count);
      modal.destroy();
    });
    modal.add(confirmBtn);
    
    // 取消按钮
    const cancelBtn = this.scene.add.text(60, 50, '取消', {
      fontSize: '16px',
      color: '#fff',
      backgroundColor: '#666',
      padding: { x: 30, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    cancelBtn.on('pointerup', () => {
      modal.destroy();
    });
    modal.add(cancelBtn);
    
    this.scene.add.existing(modal);
  }

  updateData(data) {
    if (!data) return;
    
    // 更新军队规模
    const currentSize = data.currentSize || 0;
    this.maxSize = data.maxSize || 0;
    this.sizeText.setText(`军队规模: ${currentSize}/${this.maxSize}`);
    
    // 更新各单位数量
    if (data.units) {
      Object.entries(data.units).forEach(([type, unit]) => {
        if (this.units[type]) {
          this.units[type].setText(`数量: ${unit.count || 0}`);
        }
      });
    }
    
    // 更新训练队列
    this.updateTrainingQueue(data.trainingQueue || []);
  }
  
  updateTrainingQueue(queue) {
    this.trainingQueue = queue;
    
    // 清空队列显示
    this.queueContainer.removeAll(true);
    
    if (queue.length === 0) {
      const emptyText = this.scene.add.text(0, 0, '暂无训练任务', {
        fontSize: '14px',
        color: '#666'
      }).setOrigin(0.5);
      this.queueContainer.add(emptyText);
      return;
    }
    
    let offsetX = -((queue.length - 1) * 110);
    queue.forEach((task, index) => {
      const item = this.scene.add.container(offsetX + index * 220, 0);
      
      // 背景
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x000000, 0.5);
      bg.fillRoundedRect(-100, -25, 200, 50, 8);
      item.add(bg);
      
      // 单位名称
      const unitNames = { infantry: '步兵', archer: '弓兵', cavalry: '骑兵' };
      const name = this.scene.add.text(-90, -15, `${unitNames[task.unitTypeId] || task.unitTypeId} x${task.count}`, {
        fontSize: '14px',
        color: '#fff'
      });
      item.add(name);
      
      // 进度
      const progress = task._progress / task.duration;
      const progressBar = this.scene.add.graphics();
      progressBar.fillStyle(0x333333, 1);
      progressBar.fillRoundedRect(-90, 5, 180, 8, 4);
      item.add(progressBar);
      
      const progressFill = this.scene.add.graphics();
      progressFill.fillStyle(0x4CAF50, 1);
      progressFill.fillRoundedRect(-90, 5, 180 * progress, 8, 4);
      item.add(progressFill);
      
      this.queueContainer.add(item);
    });
  }

  onShow() {
    // 获取单位类型
    window.socketManager.getUnitTypes();
  }
}
