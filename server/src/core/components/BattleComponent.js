// server/src/core/components/BattleComponent.js
import { getCounterMultiplier } from '../../../../shared/unitTypes.js';

/**
 * 战斗组件 - 管理一场战斗的完整状态
 * 由 BattleSystem 创建和管理生命周期
 */
export class BattleComponent {
  constructor(battleId, attackerId, defenderId, battleType = 'pve') {
    this.id = battleId;
    this.attackerId = attackerId;  // 玩家ID
    this.defenderId = defenderId;  // NPC ID或玩家ID
    this.battleType = battleType;  // 'pve' | 'pvp'
    
    this.status = 'preparing'; // preparing | active | finished
    this.currentRound = 0;
    this.maxRounds = 10;
    
    // 战斗双方数据（深拷贝，避免修改原始数据）
    this.attacker = null;  // { empireId, army: {...}, formation: 'default', power }
    this.defender = null;  // NPC或敌方数据
    
    // 战斗日志
    this.battleLog = [];
    
    // 结果
    this.result = null;  // { winner: 'attacker'|'defender', loot, exp, casualties }
    
    this.createdAt = Date.now();
    this.startedAt = null;
    this.finishedAt = null;
  }

  /**
   * 初始化战斗双方
   */
  init(attackerData, defenderData) {
    this.attacker = {
      empireId: attackerData.empireId,
      playerName: attackerData.playerName,
      army: JSON.parse(JSON.stringify(attackerData.army)), // 深拷贝
      formation: attackerData.formation || 'default',
      morale: attackerData.morale || 100,
      power: attackerData.power || 0,
      totalHp: 0,
      currentHp: 0,
    };
    
    this.defender = {
      id: defenderData.id,
      name: defenderData.name,
      type: defenderData.type || 'npc',
      army: JSON.parse(JSON.stringify(defenderData.army)),
      morale: defenderData.morale || 100,
      power: defenderData.power || 0,
      totalHp: 0,
      currentHp: 0,
    };
    
    // 计算初始总HP
    this.calculateInitialHp();
    
    this.status = 'active';
    this.startedAt = Date.now();
    
    this.addLog('battle_start', `战斗开始！${this.attacker.playerName} VS ${this.defender.name}`);
  }

  /**
   * 计算初始HP（简化版：战力 = HP）
   */
  calculateInitialHp() {
    this.attacker.totalHp = this.attacker.power;
    this.attacker.currentHp = this.attacker.power;
    
    this.defender.totalHp = this.defender.power;
    this.defender.currentHp = this.defender.power;
  }

  /**
   * 执行一个回合
   * @returns {Object} 回合结果
   */
  executeRound() {
    if (this.status !== 'active') return null;
    
    this.currentRound++;
    const roundLog = {
      round: this.currentRound,
      actions: [],
    };
    
    // 双方轮流攻击（简化：同时攻击）
    const attackerDamage = this.calculateDamage(this.attacker, this.defender);
    const defenderDamage = this.calculateDamage(this.defender, this.attacker);
    
    // 应用伤害
    this.defender.currentHp -= attackerDamage.total;
    this.attacker.currentHp -= defenderDamage.total;
    
    // 记录日志
    roundLog.actions.push({
      side: 'attacker',
      type: 'attack',
      damage: attackerDamage.total,
      details: attackerDamage.details,
    });
    
    roundLog.actions.push({
      side: 'defender',
      type: 'attack',
      damage: defenderDamage.total,
      details: defenderDamage.details,
    });
    
    this.battleLog.push(roundLog);
    
    // 检查战斗结束条件
    this.checkBattleEnd();
    
    return roundLog;
  }

  /**
   * 计算伤害（GDD公式简化版）
   * 伤害 = (攻击力 + 将领加成) × 克制系数 × 士气系数 - 防御
   */
  calculateDamage(attacker, defender) {
    let totalDamage = 0;
    const details = [];
    
    // 士气系数：士气100 = 1.2，50 = 1.0，<50递减
    const moraleMultiplier = this.calculateMoraleMultiplier(attacker.morale);
    
    // 遍历攻击方所有兵种
    for (const [unitType, count] of Object.entries(attacker.army)) {
      if (count <= 0) continue;
      
      // 每个士兵基础攻击力 = 15（简化）
      const baseAttack = 15 * count;
      
      // 对防守方每个兵种计算克制
      let bestMultiplier = 1.0;
      let targetUnit = 'infantry';
      
      for (const [defUnitType, defCount] of Object.entries(defender.army)) {
        if (defCount > 0) {
          const multiplier = getCounterMultiplier(unitType, defUnitType);
          if (multiplier > bestMultiplier) {
            bestMultiplier = multiplier;
            targetUnit = defUnitType;
          }
        }
      }
      
      // 计算最终伤害
      const damageBeforeDefense = baseAttack * bestMultiplier * moraleMultiplier;
      const defense = 5; // 简化防御
      const finalDamage = Math.max(1, Math.floor(damageBeforeDefense - defense));
      
      totalDamage += finalDamage;
      
      details.push({
        unitType,
        count,
        targetUnit,
        counterMultiplier: bestMultiplier,
        damage: finalDamage,
      });
    }
    
    return {
      total: totalDamage,
      details,
      moraleMultiplier,
    };
  }

  /**
   * 计算士气系数
   */
  calculateMoraleMultiplier(morale) {
    if (morale >= 100) return 1.2;
    if (morale >= 80) return 1.1;
    if (morale >= 50) return 1.0;
    if (morale >= 30) return 0.8;
    return 0.6;
  }

  /**
   * 检查战斗是否结束
   */
  checkBattleEnd() {
    // 条件1：一方HP归零
    if (this.attacker.currentHp <= 0) {
      this.finishBattle('defender');
      return;
    }
    if (this.defender.currentHp <= 0) {
      this.finishBattle('attacker');
      return;
    }
    
    // 条件2：达到最大回合数，比较剩余HP比例
    if (this.currentRound >= this.maxRounds) {
      const attackerRatio = this.attacker.currentHp / this.attacker.totalHp;
      const defenderRatio = this.defender.currentHp / this.defender.totalHp;
      
      if (attackerRatio > defenderRatio) {
        this.finishBattle('attacker');
      } else {
        this.finishBattle('defender');
      }
    }
  }

  /**
   * 结束战斗
   */
  finishBattle(winner) {
    this.status = 'finished';
    this.finishedAt = Date.now();
    this.result = {
      winner,
      totalRounds: this.currentRound,
      attackerHp: {
        current: Math.max(0, this.attacker.currentHp),
        total: this.attacker.totalHp,
      },
      defenderHp: {
        current: Math.max(0, this.defender.currentHp),
        total: this.defender.totalHp,
      },
      casualties: this.calculateCasualties(winner),
    };
    
    this.addLog('battle_end', `战斗结束！${winner === 'attacker' ? '进攻方' : '防守方'}胜利！`);
  }

  /**
   * 计算伤亡（简化版）
   */
  calculateCasualties(winner) {
    const attackerCasualties = {};
    const defenderCasualties = {};
    
    // 进攻方伤亡：失败方损失30%，胜利方损失10%
    const attackerLossRate = winner === 'attacker' ? 0.1 : 0.3;
    for (const [unitType, count] of Object.entries(this.attacker.army)) {
      attackerCasualties[unitType] = Math.floor(count * attackerLossRate);
    }
    
    // 防守方伤亡
    const defenderLossRate = winner === 'defender' ? 0.1 : 0.5;
    for (const [unitType, count] of Object.entries(this.defender.army)) {
      defenderCasualties[unitType] = Math.floor(count * defenderLossRate);
    }
    
    return {
      attacker: attackerCasualties,
      defender: defenderCasualties,
    };
  }

  /**
   * 添加战斗日志
   */
  addLog(type, message, data = {}) {
    this.battleLog.push({
      timestamp: Date.now(),
      type,
      message,
      ...data,
    });
  }

  /**
   * 获取战斗快照（发送给客户端）
   */
  getSnapshot() {
    return {
      id: this.id,
      status: this.status,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      attacker: {
        name: this.attacker?.playerName,
        currentHp: this.attacker?.currentHp,
        totalHp: this.attacker?.totalHp,
        morale: this.attacker?.morale,
      },
      defender: {
        name: this.defender?.name,
        currentHp: this.defender?.currentHp,
        totalHp: this.defender?.totalHp,
        morale: this.defender?.morale,
      },
      log: this.battleLog.slice(-5), // 最近5条日志
    };
  }

  /**
   * 获取完整结果（战斗结束后）
   */
  getResult() {
    return {
      ...this.result,
      battleLog: this.battleLog,
    };
  }
}