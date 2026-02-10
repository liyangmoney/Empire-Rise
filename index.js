// index.js
import { ResourceSystem } from './src/core/ResourceSystem.js';

console.log('=== 《帝国崛起》资源系统 MVP 演示 ===\n');

const rs = new ResourceSystem();

// 初始状态
console.log('初始资源:', rs.getAll());

// 升级仓库（模拟建筑升级）
rs.upgradeWarehouse('basic', 3);   // 基础仓库Lv3 → 容量 1000 * 1.5^2 = 2250
rs.upgradeWarehouse('special', 2); // 特殊仓库Lv2 → 容量 500 * 1.5 = 750

console.log('\n升级仓库后:');
console.log('基础仓库容量:', rs.warehouses.basic.maxCapacity);
console.log('特殊仓库容量:', rs.warehouses.special.maxCapacity);

// 添加资源（模拟采集）
rs.add('wood', 1500);
rs.add('food', 800);
rs.add('iron', 300);
rs.add('crystal', 100);
rs.add('gold', 50);

console.log('\n添加资源后:', rs.getAll());

// 消耗资源（模拟训练军队）
const trained = rs.consume('food', 200);
console.log('\n消耗200粮食训练军队:', trained ? '✅ 成功' : '❌ 不足');
console.log('剩余粮食:', rs.get('food'));

// 模拟NPC掠夺（防护系数默认0.1 → 损失10%）
const loss = rs.raid('wood', 500);
console.log(`\nNPC掠夺500木材 → 实际损失: ${loss} (防护后剩余: ${rs.get('wood')})`);

// 周期性产出（模拟伐木场每小时产100木材）
rs.produce({ wood: 100, food: 50 });
console.log('\n1小时后自动产出:', rs.getAll());

console.log('\n=== 演示结束 ===');