# 派工页返工快捷入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在正式派工页正常单据的“返工数量”左侧提供与预派工页同口径的返工快捷入口。

**Architecture:** 抽出共享的可用返工排产计划查询与映射工具；预派工页复用该工具，正式派工页在正常单据加载后批量查询可用计划，点击后按排产编号精确切到返工单据。

**Tech Stack:** uni-app Vue 3 `<script setup>`、现有 HAP workflow API、Node 内置 test runner 用于纯函数验证。

---

### Task 1: 共享返工计划工具（测试先行）

**Files:**
- Create: `utils/reworkPlan.js`
- Test: `tmp/reworkPlan.test.mjs`

- [ ] **Step 1: 写失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatReworkMergeFlag,
  mapAvailableReworkPlans,
  SCHEDULE_PLAN_FIELD_MAP
} from '../utils/reworkPlan.js'

const row = (overrides = {}) => ({
  rowid: 'plan-1',
  [SCHEDULE_PLAN_FIELD_MAP.productionCode]: ' P001 ',
  [SCHEDULE_PLAN_FIELD_MAP.scheduleCode]: 'PC001',
  [SCHEDULE_PLAN_FIELD_MAP.orderCode]: 'SO001',
  [SCHEDULE_PLAN_FIELD_MAP.productName]: '产品A',
  [SCHEDULE_PLAN_FIELD_MAP.productionCount]: 8,
  [SCHEDULE_PLAN_FIELD_MAP.problemDescription]: '外观不良',
  [SCHEDULE_PLAN_FIELD_MAP.reworkProgress]: '部分返工',
  [SCHEDULE_PLAN_FIELD_MAP.reworkMergeFlag]: 0,
  ...overrides
})

test('formats rework merge flag', () => {
  assert.equal(formatReworkMergeFlag(0), '否')
  assert.equal(formatReworkMergeFlag('1'), '是')
  assert.equal(formatReworkMergeFlag(null), '-')
})

test('maps operable plans by production code', () => {
  const result = mapAvailableReworkPlans([
    row(),
    row({ rowid: 'plan-2', [SCHEDULE_PLAN_FIELD_MAP.scheduleCode]: 'PC002' }),
    row({ rowid: 'plan-3', [SCHEDULE_PLAN_FIELD_MAP.reworkProgress]: '已完成' }),
    row({ rowid: '', [SCHEDULE_PLAN_FIELD_MAP.scheduleCode]: 'PC003' })
  ])

  assert.deepEqual(Object.keys(result), ['P001'])
  assert.equal(result.P001.length, 2)
  assert.deepEqual(result.P001.map(plan => plan.scheduleCode), ['PC001', 'PC002'])
  assert.equal(result.P001[0].reworkMergeFlag, '否')
})
```

- [ ] **Step 2: 验证 RED**

Run: `node --experimental-default-type=module tmp/reworkPlan.test.mjs`
Expected: FAIL，原因是 `utils/reworkPlan.js` 不存在。

- [ ] **Step 3: 实现共享工具**

```js
import { callWorkflowListAPIPaged } from './workflow'

export const SCHEDULE_PLAN_WORKSHEET_ID = 'paichanjihua'
export const SCHEDULE_PLAN_FIELD_MAP = { /* 使用预派工页现字段 ID */ }
export const BLOCKED_REWORK_PROGRESS = ['已完成', '不可返工']

export const isReworkProgressOperable = (progress) =>
  !BLOCKED_REWORK_PROGRESS.includes(String(progress || '').trim())

const formatPlanFieldValue = (value) => { /* 复制预派工 formatFieldValue 语义 */ }
export const formatReworkMergeFlag = (value) => { /* 0/1 转是否，其他转文本 */ }
export const mapAvailableReworkPlans = (rows = []) => { /* rowid + productionCode + operable 分组 */ }

const fetchReworkPlanRows = async (filters) => { /* 100 条分页、最多 500 页 */ }
export const fetchAvailableReworkPlans = async ({ productionCodes = [], workshop = '' }) => { /* 现有预派工查询口径 */ }
```

实现必须包含完整字段：`workshop`、`scheduleType`、`scheduleCode`、`productionCode`、`orderCode`、`productName`、`productionCount`、`problemDescription`、`reworkMergeFlag`、`scheduleStatus`、`deliveryType`、`addProductScope`、`processDetail`、`reworkProgress`、`incompleteProcessQty`。

- [ ] **Step 3: 验证 GREEN**

Run: `node --experimental-default-type=module tmp/reworkPlan.test.mjs`
Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add utils/reworkPlan.js tmp/reworkPlan.test.mjs
git commit -m "feat: add shared rework plan query"
```

### Task 2: 预派工页复用共享口径

**Files:**
- Modify: `pages/preDispatched/preDispatched.vue`

- [ ] Import `SCHEDULE_PLAN_FIELD_MAP`、`BLOCKED_REWORK_PROGRESS`、`isReworkProgressOperable`、`formatReworkMergeFlag`、`mapAvailableReworkPlans`、`fetchAvailableReworkPlans` from `../../utils/reworkPlan`.
- [ ] 删除页面内同名字段表、禁用进度常量、合并格式化和可用计划映射函数。
- [ ] 将 `loadNormalReworkPlanMap` 的两支查询替换为 `fetchAvailableReworkPlans({ productionCodes, workshop: loginWorkshop.value })`，保留现有 catch、toast 和状态清空行为。
- [ ] 验证唯一引用：`rg -n "SCHEDULE_PLAN_FIELD_MAP|loadNormalReworkPlanMap|fetchAvailableReworkPlans" pages/preDispatched/preDispatched.vue`。
- [ ] 提交：`git add pages/preDispatched/preDispatched.vue && git commit -m "refactor: reuse rework plan query"`。

### Task 3: 派工页状态、查询与精确切换

**Files:**
- Modify: `pages/dispatchWork/dispatchWork.vue`

- [ ] Import shared utilities.
- [ ] Add state: `normalReworkPlanMap`、`showReworkPlanSelector`、`reworkPlanSelectorList`、`reworkShortcutLoading`、`reworkShortcutLoadingCode`、`reworkShortcutTargetScheduleCode`.
- [ ] Add `loadDispatchReworkPlans(bills)`; only query normal list, extract unique production codes, catch and toast `返工提醒加载失败`.
- [ ] Call it after `billsList.value = newBillsList`; do not block existing list rendering.
- [ ] Add `hasNormalReworkPlans(productionCode)` and selector handlers.
- [ ] In `getBillsListRaw`, when `reworkShortcutTargetScheduleCode` is set, add exact `scheduleCode` filter so same production code cannot mix multiple plans.
- [ ] Add `startDispatchReworkShortcut(plan)`: set target schedule code and loading, switch `billTypeFilter/billTypeIndex` to rework, clear normal plan cache, await `search()`, verify target bill exists, finally clear target and loading.
- [ ] 提交：`git add pages/dispatchWork/dispatchWork.vue && git commit -m "feat: switch dispatch bills to selected rework plan"`。

### Task 4: 派工页 UI

**Files:**
- Modify: `pages/dispatchWork/dispatchWork.vue`

- [ ] Change rework row visibility to `item.reworkQty > 0 || hasNormalReworkPlans(item.productionCode)`.
- [ ] Put shortcut button as the first child of that row, left of `返工数量：`; loading text is `处理中`.
- [ ] Add multi-plan selector modal after the bill list, with columns 订单编号、产品名称、返工数量、问题描述、返工进度、是否合并; row click calls selector confirm.
- [ ] Add scoped styles for shortcut button and selector, following pre-dispatch page styles and `px2vw`.
- [ ] 提交：`git add pages/dispatchWork/dispatchWork.vue && git commit -m "feat: show dispatch rework shortcut"`。

### Task 5: 验证与收尾

**Files:**
- Verify: `utils/reworkPlan.js`
- Verify: `pages/preDispatched/preDispatched.vue`
- Verify: `pages/dispatchWork/dispatchWork.vue`

- [ ] Run `node --experimental-default-type=module tmp/reworkPlan.test.mjs`; expected PASS.
- [ ] Run `rg -n "TODO|TBD|mock|假数据" utils/reworkPlan.js pages/dispatchWork/dispatchWork.vue pages/preDispatched/preDispatched.vue`; expected no feature-code hits.
- [ ] Run `pnpm exec uni build` or the closest available project build command; expected build success.
- [ ] Inspect `git diff --check`; expected no whitespace errors.
- [ ] Commit verification fixes if any.
