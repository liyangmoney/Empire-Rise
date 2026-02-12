// server/src/core/components/BattleComponent.js
import { getCounterMultiplier } from '../../../../shared/unitTypes.js';
import { SKILL_TYPES } from '../../../../shared/generalTypes.js';

/**
 * 战斗组件 - 管理一场战斗的完整状态
 * 支持将领技能系统
 */
export class BattleComponent {
  constructor(battleId, attackerId, defenderId, battleType = 'pve') {
    this.id = battleId;
    this.attackerId = attackerId;
    this.defenderId = defenderId;
    this.battleType = battleType;
    
    this.status = 'preparing';
    this.currentRound = 0;
    this.maxRounds = 10;
    
    this.attacker = null;
    this.defender = null;
    
    // 战斗效果（增益/减益）
    this.effects = {
      attacker: [], // { type, power, duration, source }
      defender: [],
    };
    
    this.battleLog = [];
    this.result = null;
    
    this.createdAt = Date.now();
    this.startedAt = null;
    this.finishedAt = null;
  }

  init(attackerData, defenderData) {
    this.attacker = {
      empireId: attackerData.empireId,
      playerName: attackerData.playerName,
      army: JSON.parse(JSON.stringify(attackerData.army)),
      formation: attackerData.formation || 'default',
      morale: attackerData.morale || 100,
      power: attackerData.power || 0,
      general: attackerData.general || null, // 将领数据
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
    
    this.calculateInitialHp();
    
    this.status = 'active';
    this.startedAt = Date.now();
    
    this.addLog('battle_start', `战斗开始！${this.attacker.playerName} VS ${this.defender.name}`);
    
    // 显示将领信息
    if (this.attacker.general) {
      this.addLog('general', `${this.attacker.general.name}加入战斗！`, {
        generalName: this.attacker.general.name,
        generalRarity: this.attacker.general.rarity,
      });
    }
  }

  calculateInitialHp() {
    // 将领加成HP（每点智力+5 HP）
    let generalBonus = 0;
    if (this.attacker.general) {
      generalBonus = this.attacker.general.stats.intelligence * 5;
    }
    
    this.attacker.totalHp = this.attacker.power + generalBonus;
    this.attacker.currentHp = this.attacker.totalHp;
    
    this.defender.totalHp = this.defender.power;
    this.defender.currentHp = this.defender.totalHp;
  }

  executeRound() {
    if (this.status !== 'active') return null;
    
    this.currentRound++;
    const roundLog = {
      round: this.currentRound,
      actions: [],
    };
    
    // 1. 处理技能触发
    this.processSkillTriggers(roundLog);
    
    // 2. 更新效果持续时间
    this.updateEffects();
    
    // 3. 计算普通攻击伤害
    const attackerDamage = this.calculateDamage(this.attacker, this.defender, 'attacker');
    const defenderDamage = this.calculateDamage(this.defender, this.attacker, 'defender');
    
    // 4. 应用增益效果
    const finalAttackerDamage = this.applyDamageBuffs(attackerDamage.total, 'attacker');
    const finalDefenderDamage = this.applyDamageBuffs(defenderDamage.total, 'defender');
    
    // 5. 应用伤害
    this.defender.currentHp -= finalAttackerDamage;
    this.attacker.currentHp -= finalDefenderDamage;
    
    // 6. 记录日志
    roundLog.actions.push({
      side: 'attacker',
      type: 'attack',
      damage: finalAttackerDamage,
      details: attackerDamage.details,
    });
    
    roundLog.actions.push({
      side: 'defender',
      type: 'attack',
      damage: finalDefenderDamage,
      details: defenderDamage.details,
    });
    
    this.battleLog.push(roundLog);
    
    // 7. 检查战斗结束
    this.checkBattleEnd();
    
    return roundLog;
  }

  /**
   * 处理技能触发
   */
  processSkillTriggers(roundLog) {
    // 进攻方将领技能
    if (this.attacker.general) {
      for (const skill of this.attacker.general.skills) {
        // 检查冷却
        if (skill.currentCooldown > 0) {
          skill.currentCooldown--;
          continue;
        }
        
        // 触发概率判定
        if (Math.random() < skill.triggerRate) {
          this.triggerSkill(skill, 'attacker', roundLog);
          skill.currentCooldown = skill.cooldown;
        }
      }
    }
  }

  /**
   * 触发技能效果
   */
  triggerSkill(skill, side, roundLog) {
    const isAttacker = side === 'attacker';
    const target = isAttacker ? this.defender : this.attacker;
    const self = isAttacker ? this.attacker : this.defender;
    
    switch (skill.type) {
      case SKILL_TYPES.AOE_DAMAGE: {
        // 群体伤害
        const damage = Math.floor(self.power * skill.power * 0.5); // 技能伤害基于战力
        target.currentHp -= damage;
        
        roundLog.actions.push({
          side,
          type: 'skill_damage',
          skillName: skill.name,
          damage,
          target: 'all',
        });
        
        this.addLog('skill', `${self.general?.name || side}释放【${skill.name}】，造成${damage}点伤害！`);
        break;
      }
      
      case SKILL_TYPES.HEAL: {
        // 治疗
        const heal = Math.floor(self.totalHp * skill.power);
        self.currentHp = Math.min(self.totalHp, self.currentHp + heal);
        
        roundLog.actions.push({
          side,
          type: 'skill_heal',
          skillName: skill.name,
          heal,
        });
        
        this.addLog('skill', `${self.general?.name || side}释放【${skill.name}】，恢复${heal}点生命！`);
        break;
      }
      
      case SKILL_TYPES.BUFF_ATTACK: {
        // 攻击增益
        this.effects[side].push({
          type: 'attack_buff',
          power: skill.power,
          duration: skill.duration,
          source: skill.name,
        });
        
        roundLog.actions.push({
          side,
          type: 'skill_buff',
          skillName: skill.name,
          buffType: 'attack',
          power: skill.power,
        });
        
        this.addLog('skill', `${self.general?.name || side}释放【${skill.name}】，攻击力提升${Math.floor(skill.power * 100)}%！`);
        break;
      }
      
      case SKILL_TYPES.BUFF_DEFENSE: {
        // 防御增益
        this.effects[side].push({
          type: 'defense_buff',
          power: skill.power,
          duration: skill.duration,
          source: skill.name,
        });
        
        this.addLog('skill', `${self.general?.name || side}释放【${skill.name}】，防御力提升${Math.floor(skill.power * 100)}%！`);
        break;
      }
      
      case SKILL_TYPES.MORALE_BOOST: {
        // 士气提升
        self.morale = 100;
        
        roundLog.actions.push({
          side,
          type: 'skill_morale',
          skillName: skill.name,
          newMorale: 100,
        });
        
        this.addLog('skill', `${self.general?.name || side}释放【${skill.name}】，士气大振！`);
        break;
      }
    }
  }

  /**
   * 更新效果持续时间
   */
  updateEffects() {
    for (const side of ['attacker', 'defender']) {
      this.effects[side] = this.effects[side].filter(effect => {
        effect.duration--;
        return effect.duration > 0;
      });
    }
  }

  /**
   * 应用伤害增益
   */
  applyDamageBuffs(baseDamage, side) {
    let multiplier = 1.0;
    
    for (const effect of this.effects[side]) {
      if (effect.type === 'attack_buff') {
        multiplier += effect.power;
      }
    }
    
    return Math.floor(baseDamage * multiplier);
  }

  calculateDamage(attacker, defender, side) {
    let totalDamage = 0;
    const details = [];
    
    const moraleMultiplier = this.calculateMoraleMultiplier(attacker.morale);
    
    // 计算防御增益
    let defenseMultiplier = 1.0;
    const opponentSide = side === 'attacker' ? 'defender' : 'attacker';
    for (const effect of this.effects[opponentSide]) {
      if (effect.type === 'defense_buff') {
        defenseMultiplier -= effect.power;
      }
    }
    defenseMultiplier = Math.max(0.5, defenseMultiplier);
    
    for (const [unitType, count] of Object.entries(attacker.army)) {
      if (count <= 0) continue;
      
      const baseAttack = 15 * count;
      
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
      
      // 将领攻击加成
      let generalBonus = 0;
      if (attacker.general) {
        generalBonus = attacker.general.stats.attack * 0.1; // 每点攻击+10%伤害
      }
      
      const damageBeforeDefense = baseAttack * bestMultiplier * moraleMultiplier * (1 + generalBonus);
      const defense = 5 * defenseMultiplier;
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
    
    return { total: totalDamage, details };
  }

  calculateMoraleMultiplier(morale) {
    if (morale >= 100) return 1.2;
    if (morale >= 80) return 1.1;
    if (morale >= 50) return 1.0;
    if (morale >= 30) return 0.8;
    return 0.6;
  }

  checkBattleEnd() {
    if (this.attacker.currentHp <= 0) {
      this.finishBattle('defender');
      return;
    }
    if (this.defender.currentHp <= 0) {
      this.finishBattle('attacker');
      return;
    }
    
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

  finishBattle(winner) {
    this.status = 'finished';
    this.finishedAt = Date.now();
    
    // 将领获得经验（胜利+50，失败+20）
    const generalExp = winner === 'attacker' ? 50 : 20;
    
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
      generalExp, // 将领获得的经验
    };
    
    this.addLog('battle_end', `战斗结束！${winner === 'attacker' ? '进攻方' : '防守方'}胜利！`);
    
    if (this.attacker.general) {
      this.addLog('exp', `${this.attacker.general.name}获得${generalExp}点经验！`);
    }
  }

  calculateCasualties(winner) {
    const attackerCasualties = {};
    const defenderCasualties = {};
    
    const attackerLossRate = winner === 'attacker' ? 0.1 : 0.3;
    for (const [unitType, count] of Object.entries(this.attacker.army)) {
      attackerCasualties[unitType] = Math.floor(count * attackerLossRate);
    }
    
    const defenderLossRate = winner === 'defender' ? 0.1 : 0.5;
    for (const [unitType, count] of Object.entries(this.defender.army)) {
      defenderCasualties[unitType] = Math.floor(count * defenderLossRate);
    }
    
    return { attacker: attackerCasualties, defender: defenderCasualties };
  }

  addLog(type, message, data = {}) {
    this.battleLog.push({ timestamp: Date.now(), type, message, ...data });
  }

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
        general: this.attacker?.general ? {
          name: this.attacker.general.name,
          rarity: this.attacker.general.rarity,
        } : null,
      },
      defender: {
        name: this.defender?.name,
        currentHp: this.defender?.currentHp,
        totalHp: this.defender?.totalHp,
        morale: this.defender?.morale,
      },
      log: this.battleLog.slice(-5),
    };
  }

  getResult() {
    return { ...this.result, battleLog: this.battleLog };
  }
}