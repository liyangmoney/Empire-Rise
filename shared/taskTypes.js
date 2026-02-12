// shared/taskTypes.js
/**
 * 任务类型定义
 * 前后端共用
 */

export const TASK_TYPES = {
  MAIN: 'main',       // 主线任务
  DAILY: 'daily',     // 日常任务
  ACHIEVEMENT: 'achievement', // 成就任务
};

// 任务状态
export const TASK_STATUS = {
  PENDING: 'pending',     // 进行中
  COMPLETED: 'completed', // 已完成（待领取奖励）
  CLAIMED: 'claimed',     // 已领取奖励
};

// 主线任务定义
export const MAIN_TASKS = [
  {
    id: 'main_001',
    type: TASK_TYPES.MAIN,
    title: '初出茅庐',
    description: '训练5名步兵，建立最初的军队',
    requirements: {
      train: { infantry: 5 }
    },
    rewards: {
      wood: 100,
      food: 50,
      gold: 50
    },
    nextTaskId: 'main_002'
  },
  {
    id: 'main_002',
    type: TASK_TYPES.MAIN,
    title: '资源储备',
    description: '收集500木材',
    requirements: {
      collect: { wood: 500 }
    },
    rewards: {
      stone: 100,
      food: 100,
      gold: 30
    },
    nextTaskId: 'main_003'
  },
  {
    id: 'main_003',
    type: TASK_TYPES.MAIN,
    title: '首次出征',
    description: '击败1只野狼',
    requirements: {
      battleWin: { wolf: 1 }
    },
    rewards: {
      iron: 20,
      gold: 100,
      exp: 50
    },
    nextTaskId: 'main_004'
  },
  {
    id: 'main_004',
    type: TASK_TYPES.MAIN,
    title: '壮大军队',
    description: '训练总计20名士兵',
    requirements: {
      totalArmy: 20
    },
    rewards: {
      wood: 300,
      food: 200,
      gold: 100
    },
    nextTaskId: 'main_005'
  },
  {
    id: 'main_005',
    type: TASK_TYPES.MAIN,
    title: '据点攻略',
    description: '击败1个山贼营地',
    requirements: {
      battleWin: { bandit_camp: 1 }
    },
    rewards: {
      iron: 50,
      crystal: 10,
      gold: 200
    },
    nextTaskId: 'main_006'
  },
  {
    id: 'main_006',
    type: TASK_TYPES.MAIN,
    title: '帝国建设',
    description: '将兵营升级到2级',
    requirements: {
      buildingLevel: { barracks: 2 }
    },
    rewards: {
      wood: 500,
      stone: 300,
      gold: 300
    },
    nextTaskId: 'main_007'
  },
  {
    id: 'main_007',
    type: TASK_TYPES.MAIN,
    title: '招募将领',
    description: '招募1名将领',
    requirements: {
      recruitGeneral: 1
    },
    rewards: {
      gold: 500,
      crystal: 20
    },
    nextTaskId: null
  }
];

// 日常任务池
export const DAILY_TASKS_POOL = [
  {
    id: 'daily_collect_wood',
    type: TASK_TYPES.DAILY,
    title: '伐木工人',
    description: '采集300木材',
    requirements: {
      collect: { wood: 300 }
    },
    rewards: {
      food: 100,
      gold: 50
    }
  },
  {
    id: 'daily_collect_food',
    type: TASK_TYPES.DAILY,
    title: '农场劳作',
    description: '采集200粮食',
    requirements: {
      collect: { food: 200 }
    },
    rewards: {
      wood: 100,
      gold: 50
    }
  },
  {
    id: 'daily_train_soldiers',
    type: TASK_TYPES.DAILY,
    title: '招募新兵',
    description: '训练10名士兵',
    requirements: {
      train: { any: 10 }
    },
    rewards: {
      iron: 20,
      gold: 80
    }
  },
  {
    id: 'daily_battle',
    type: TASK_TYPES.DAILY,
    title: '日常练兵',
    description: '进行3场战斗',
    requirements: {
      battle: 3
    },
    rewards: {
      wood: 150,
      stone: 50,
      gold: 100
    }
  },
  {
    id: 'daily_win_battle',
    type: TASK_TYPES.DAILY,
    title: '胜利之路',
    description: '赢得2场战斗胜利',
    requirements: {
      battleWin: 2
    },
    rewards: {
      iron: 30,
      gold: 150
    }
  },
  {
    id: 'daily_upgrade_building',
    type: TASK_TYPES.DAILY,
    title: '建设帝国',
    description: '升级1次建筑',
    requirements: {
      upgradeBuilding: 1
    },
    rewards: {
      wood: 200,
      stone: 100,
      gold: 100
    }
  }
];

// 成就任务
export const ACHIEVEMENT_TASKS = [
  {
    id: 'achievement_army',
    type: TASK_TYPES.ACHIEVEMENT,
    title: '大军压境',
    description: '拥有总计100名士兵',
    requirements: {
      totalArmy: 100
    },
    rewards: {
      gold: 1000,
      crystal: 50
    }
  },
  {
    id: 'achievement_conqueror',
    type: TASK_TYPES.ACHIEVEMENT,
    title: '征服者',
    description: '占领10个NPC据点',
    requirements: {
      occupyOutpost: 10
    },
    rewards: {
      gold: 2000,
      crystal: 100
    }
  },
  {
    id: 'achievement_general',
    type: TASK_TYPES.ACHIEVEMENT,
    title: '名将云集',
    description: '招募5名将领',
    requirements: {
      recruitGeneral: 5
    },
    rewards: {
      gold: 1500,
      crystal: 80
    }
  },
  {
    id: 'achievement_level',
    type: TASK_TYPES.ACHIEVEMENT,
    title: '帝国崛起',
    description: '帝国等级达到10级',
    requirements: {
      empireLevel: 10
    },
    rewards: {
      gold: 5000,
      crystal: 200
    }
  }
];