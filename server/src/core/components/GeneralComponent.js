// server/src/core/components/GeneralComponent.js
import { createGeneral, addExp, GENERAL_TEMPLATES } from '../../../../shared/generalTypes.js';

/**
 * 将领组件 - 管理玩家的所有将领
 */
export class GeneralComponent {
  constructor() {
    this.generals = new Map(); // generalId -> generalData
    this.formationAssignments = new Map(); // formationId -> generalId
  }

  /**
   * 招募将领
   * @param {string} templateId 将领模板ID
   * @returns {Object} 新将领
   */
  recruit(templateId) {
    const general = createGeneral(templateId);
    if (!general) return null;
    
    this.generals.set(general.id, general);
    return general;
  }

  /**
   * 获取所有将领
   */
  getAll() {
    return Array.from(this.generals.values());
  }

  /**
   * 获取单个将领
   */
  get(generalId) {
    return this.generals.get(generalId);
  }

  /**
   * 分配将领到编队
   */
  assignToFormation(generalId, formationId) {
    const general = this.generals.get(generalId);
    if (!general) return false;
    
    // 解除之前的分配
    for (const [fid, gid] of this.formationAssignments) {
      if (gid === generalId) {
        this.formationAssignments.delete(fid);
      }
    }
    
    this.formationAssignments.set(formationId, generalId);
    return true;
  }

  /**
   * 获取编队的将领
   */
  getFormationGeneral(formationId) {
    const generalId = this.formationAssignments.get(formationId);
    return generalId ? this.generals.get(generalId) : null;
  }

  /**
   * 添加经验
   */
  addExpToGeneral(generalId, exp) {
    const general = this.generals.get(generalId);
    if (!general) return null;
    
    return addExp(general, exp);
  }

  /**
   * 计算编队总战力加成
   */
  calculatePowerBonus(formationId) {
    const general = this.getFormationGeneral(formationId);
    if (!general) return 0;
    
    // 将领战力 = (攻击 + 防御 + 智力) / 3
    const generalPower = (general.stats.attack + general.stats.defense + general.stats.intelligence) / 3;
    return Math.floor(generalPower);
  }

  /**
   * 获取快照
   */
  getSnapshot() {
    return {
      generals: this.getAll().map(g => ({
        id: g.id,
        name: g.name,
        rarity: g.rarity,
        level: g.level,
        exp: g.exp,
        expToNext: this.getExpToLevel(g.level),
        stats: g.stats,
        skills: g.skills.map(s => ({
          name: s.name,
          description: s.description,
          cooldown: s.cooldown,
        })),
        assignedTo: this.getAssignedFormation(g.id),
      })),
      totalCount: this.generals.size,
    };
  }

  /**
   * 获取将领被分配到哪个编队
   */
  getAssignedFormation(generalId) {
    for (const [fid, gid] of this.formationAssignments) {
      if (gid === generalId) return fid;
    }
    return null;
  }

  /**
   * 计算升级所需经验
   */
  getExpToLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }
}