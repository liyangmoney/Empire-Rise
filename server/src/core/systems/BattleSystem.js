// server/src/core/systems/BattleSystem.js
import { BattleComponent } from '../components/BattleComponent.js';
import { generateNpc, NPC_TYPES, calculateNpcPower } from '../../../../shared/npcTypes.js';

/**
 * 战斗系统 - 管理所有战斗的创建、执行和清理
 */
export class BattleSystem {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
    this.activeBattles = new Map(); // battleId -> BattleComponent
    this.playerBattleMap = new Map(); // playerId -> battleId
  }

  /**
   * 发起战斗（攻打NPC）
   * @param {string} playerId 玩家ID
   * @param {string} npcTypeId NPC类型
   * @param {string} formationId 使用的编队
   * @returns {Object} 战斗结果或错误
   */
  startBattle(playerId, npcTypeId, formationId = 'default') {
    const empire = this.gameWorld.empires.get(playerId);
    if (!empire) {
      return { success: false, error: '帝国不存在' };
    }

    // 检查玩家是否已在战斗中
    if (this.playerBattleMap.has(playerId)) {
      return { success: false, error: '您正在进行另一场战斗' };
    }

    // 检查编队是否存在且有士兵（严格检查总士兵数 > 0）
    const formation = empire.army.formations.get(formationId);
    if (!formation) {
      return { success: false, error: '编队不存在' };
    }
    
    // 计算编队总士兵数
    const totalUnits = Object.values(formation.units).reduce((sum, count) => sum + count, 0);
    if (totalUnits === 0) {
      return { success: false, error: '编队中没有士兵，请先训练军队' };
    }

    // 检查军队状态
    if (empire.army.status !== 'idle') {
      return { success: false, error: `军队当前状态: ${empire.army.status}，无法出征` };
    }

    // 生成NPC
    const attackerPower = empire.army.calculateFormationPower(formationId);
    const npc = generateNpc(npcTypeId, attackerPower);
    if (!npc) {
      return { success: false, error: '无效的NPC类型' };
    }

    // 创建战斗
    const battleId = `battle_${Date.now()}_${playerId}`;
    const battle = new BattleComponent(battleId, playerId, npc.id, 'pve');

    // 初始化战斗数据
    battle.init(
      {
        empireId: empire.id,
        playerName: empire.playerName,
        army: formation.units,
        formation: formationId,
        morale: empire.army.morale,
        power: attackerPower,
      },
      {
        id: npc.id,
        name: npc.name,
        type: 'npc',
        army: npc.army,
        morale: 100,
        power: npc.power,
      }
    );

    // 记录战斗
    this.activeBattles.set(battleId, battle);
    this.playerBattleMap.set(playerId, battleId);

    // 设置军队状态为战斗中
    empire.army.status = 'fighting';

    // 立即执行战斗（自动战斗，瞬间完成）
    this.executeBattleInstantly(battleId);

    return {
      success: true,
      battleId,
      npc: {
        name: npc.name,
        level: npc.level,
        power: npc.power,
      },
    };
  }

  /**
   * 发起战斗（带将领）
   */
  startBattleWithGeneral(playerId, npcTypeId, formationId, general) {
    const empire = this.gameWorld.empires.get(playerId);
    if (!empire) {
      return { success: false, error: '帝国不存在' };
    }

    if (this.playerBattleMap.has(playerId)) {
      return { success: false, error: '您正在进行另一场战斗' };
    }

    const formation = empire.army.formations.get(formationId);
    if (!formation || Object.keys(formation.units).length === 0) {
      return { success: false, error: '编队不存在或没有士兵' };
    }

    if (empire.army.status !== 'idle') {
      return { success: false, error: `军队当前状态: ${empire.army.status}，无法出征` };
    }

    const attackerPower = empire.army.calculateFormationPower(formationId);
    const npc = generateNpc(npcTypeId, attackerPower);
    if (!npc) {
      return { success: false, error: '无效的NPC类型' };
    }

    const battleId = `battle_${Date.now()}_${playerId}`;
    const battle = new BattleComponent(battleId, playerId, npc.id, 'pve');

    battle.init(
      {
        empireId: empire.id,
        playerName: empire.playerName,
        army: formation.units,
        formation: formationId,
        morale: empire.army.morale,
        power: attackerPower,
        general: general,
      },
      {
        id: npc.id,
        name: npc.name,
        type: 'npc',
        army: npc.army,
        morale: 100,
        power: npc.power,
      }
    );

    this.activeBattles.set(battleId, battle);
    this.playerBattleMap.set(playerId, battleId);
    empire.army.status = 'fighting';

    this.executeBattleInstantly(battleId);

    return {
      success: true,
      battleId,
      npc: { name: npc.name, level: npc.level, power: npc.power },
    };
  }

  /**
   * 瞬间执行完整战斗（自动战斗模式）
   */
  executeBattleInstantly(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;

    // 执行所有回合直到结束
    while (battle.status === 'active' && battle.currentRound < battle.maxRounds) {
      battle.executeRound();
    }

    // 确保战斗结束
    if (battle.status === 'active') {
      // 强制结束，比较HP
      const attackerRatio = battle.attacker.currentHp / battle.attacker.totalHp;
      const defenderRatio = battle.defender.currentHp / battle.defender.totalHp;
      battle.finishBattle(attackerRatio > defenderRatio ? 'attacker' : 'defender');
    }

    // 处理战斗结果
    this.processBattleResult(battleId);
  }

  /**
   * 处理战斗结果
   */
  processBattleResult(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle || !battle.result) return;

    const empire = this.gameWorld.empires.get(battle.attackerId);
    if (!empire) return;

    const { winner, casualties } = battle.result;

    // 1. 应用伤亡到玩家军队
    for (const [unitType, count] of Object.entries(casualties.attacker)) {
      if (count > 0) {
        empire.army.removeUnits(unitType, count, battle.attacker.formation);
        
        // 部分转为伤病（50%）
        const wounded = Math.floor(count * 0.5);
        if (wounded > 0) {
          empire.army.addWounded(unitType, wounded);
        }
      }
    }

    // 2. 更新士气
    if (winner === 'attacker') {
      empire.army.updateMorale(5); // 胜利+5
    } else {
      empire.army.updateMorale(-15); // 失败-15
    }

    // 3. 发放奖励（胜利）
    let loot = null;
    let exp = 0;
    if (winner === 'attacker') {
      // 获取NPC模板
      const npcTemplate = Object.values(NPC_TYPES).find(n => n.id === battle.defender.typeId);
      if (npcTemplate) {
        loot = { ...npcTemplate.loot };
        exp = npcTemplate.exp;

        // 添加资源到玩家
        for (const [resId, amount] of Object.entries(loot)) {
          empire.resources.add(resId, amount);
        }

        // 处理掉落
        const drops = this.processDrops(npcTemplate.dropRate);
        
        battle.result.loot = loot;
        battle.result.exp = exp;
        battle.result.drops = drops;
      }
    }

    // 4. 将领获得经验
    if (battle.attacker.general && battle.result.generalExp) {
      const general = empire.generals.get(battle.attacker.general.id);
      if (general) {
        const levelUpResult = empire.generals.addExpToGeneral(general.id, battle.result.generalExp);
        battle.result.generalLevelUp = levelUpResult;
      }
    }

    // 5. 更新任务进度
    empire.tasks.updateProgress('battle', 1);
    if (winner === 'attacker') {
      empire.tasks.updateProgress('battleWin', 1);
    }

    // 6. 恢复军队状态
    empire.army.status = 'idle';

    // 7. 立即清理玩家战斗映射（允许发起新战斗）
    this.playerBattleMap.delete(battle.attackerId);

    // 8. 通知客户端
    if (empire.socketId && empire._io) {
      empire._io.to(empire.socketId).emit('battle:finished', {
        battleId,
        result: battle.getResult(),
        army: empire.army.getSnapshot(),
        resources: empire.resources.getSnapshot(),
        generals: empire.generals.getSnapshot(),
      });
    }

    // 9. 延迟清理战斗记录（5分钟后，保留战报查看）
    setTimeout(() => {
      this.activeBattles.delete(battleId);
    }, 300000);
  }

  /**
   * 处理掉落
   */
  processDrops(dropRate) {
    const drops = [];
    for (const [itemId, rate] of Object.entries(dropRate)) {
      if (Math.random() < rate) {
        drops.push(itemId);
      }
    }
    return drops;
  }

  /**
   * 获取战斗状态
   */
  getBattleStatus(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return null;
    return battle.getSnapshot();
  }

  /**
   * 获取玩家当前战斗
   */
  getPlayerBattle(playerId) {
    const battleId = this.playerBattleMap.get(playerId);
    if (!battleId) return null;
    return this.activeBattles.get(battleId);
  }

  /**
   * 清理战斗
   */
  cleanupBattle(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (battle) {
      this.playerBattleMap.delete(battle.attackerId);
      this.activeBattles.delete(battleId);
    }
  }

  /**
   * 获取可挑战的NPC列表（根据玩家战力）
   */
  getAvailableNpcs(playerId) {
    const empire = this.gameWorld.empires.get(playerId);
    if (!empire) return [];

    const playerPower = empire.army.calculateFormationPower('default');
    const availableNpcs = [];

    for (const [key, npcTemplate] of Object.entries(NPC_TYPES)) {
      let recommended = false;
      let difficulty = 'easy';

      if (npcTemplate.category === 'wild') {
        // 野怪：战力低于玩家
        recommended = playerPower >= npcTemplate.powerBase * 0.5;
        difficulty = 'easy';
      } else if (npcTemplate.category === 'outpost') {
        // 据点：战力接近玩家
        const minPower = npcTemplate.powerMultiplier * 0.5;
        const maxPower = npcTemplate.powerMultiplier * 2;
        recommended = playerPower >= minPower && playerPower <= maxPower;
        difficulty = playerPower > npcTemplate.powerMultiplier ? 'medium' : 'hard';
      } else if (npcTemplate.category === 'city') {
        // 城邦：战力远高于玩家
        recommended = playerPower >= npcTemplate.powerBase * 0.3;
        difficulty = 'extreme';
      }

      availableNpcs.push({
        id: npcTemplate.id,
        name: npcTemplate.name,
        category: npcTemplate.category,
        level: npcTemplate.level || npcTemplate.levelRange?.[0],
        recommended,
        difficulty,
        power: npcTemplate.powerBase || npcTemplate.powerMultiplier,
      });
    }

    return availableNpcs;
  }
}