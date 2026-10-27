# 预派工正常模式返工快捷入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在正常模式预派工的两个产品入口上显示可用返工提醒，并一键切换、添加、定位对应返工预派工。

**Architecture:** 仅修改 `pages/preDispatched/preDispatched.vue`。页面按「生产编号 + 车间 + 返工排产」查询可用返工计划，缓存为 `productionCode -> plans[]`；两个按钮读取同一缓存；点击后复用现有 `PRE_DISPATCH_PRODUCT_ADD_URL` 添加接口，再自动选中目标产品并加载返工工序。

**Tech Stack:** Vue 3 SFC / uni-app、现有 HAP workflow list API、Node 静态回归测试、@vue/compiler-sfc 编译检查。

---

### Task 1: 返工计划查询与数据映射测试

**Files:**
- Test: `tmp/pre-dispatched-rework-shortcut.test.mjs`
- Modify: `pages/preDispatched/preDispatched.vue`

- [x] **Step 1: 写失败测试**

测试必须覆盖字段 ID、查询条件、已完成排除、两个获取时机和按钮显隐：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../pages/preDispatched/preDispatched.vue', import.meta.url), 'utf8')

const block = (startMarker, endMarker) => {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start)
  assert.ok(start >= 0 && end > start, `未找到 ${startMarker}`)
  return source.slice(start, end)
}

test('排产计划字段映射包含返工选择框所需字段', () => {
  const map = block('const SCHEDULE_PLAN_FIELD_MAP = {', '\n}')
  for (const field of [
    'orderCode: \'655e1cbbbd2094b316347f92\'',
    'productName: \'6937d255ff2b019b3cb34be3\'',
    'productionCount: \'67de8eb5c5377d50a523ef9b\'',
    'problemDescription: \'694ba108dc025d98887fd782\'',
    'reworkMergeFlag: \'69ccaf64665ab27f39105bed\'',
    'scheduleStatus: \'655b875ffc44a9469a3aa225\'',
    'deliveryType: \'69db0017665ab27f3913c455\'',
    'processDetail: \'688c366082289045da815f97\'',
    'reworkProgress: \'69ccb3e7665ab27f39105da2\''
  ]) assert.include(map, field)
})

test('正常模式返工计划按业务键和添加产品口径查询', () => {
  const fn = block('const loadNormalReworkPlanMap = async', '\nconst hasNormalReworkPlans =')
  for (const marker of [
    'controlId: SCHEDULE_PLAN_FIELD_MAP.workshop',
    'controlId: SCHEDULE_PLAN_FIELD_MAP.scheduleType',
    'controlId: SCHEDULE_PLAN_FIELD_MAP.productionCode',
    'controlId: SCHEDULE_PLAN_FIELD_MAP.scheduleStatus',
    'controlId: SCHEDULE_PLAN_FIELD_MAP.deliveryType',
    'controlId: SCHEDULE_PLAN_FIELD_MAP.processDetail',
    'controlId: SCHEDULE_PLAN_FIELD_MAP.reworkProgress',
    "values: ['返工排产']",
    "values: ['已排产', '部分排产']",
    "values: ['已完成']"
  ]) assert.include(fn, marker)
  assert.doesNotMatch(fn, /productionType:/, '反查返工计划不能随正常模式传入正常派工类型')
})

test('返工提醒只在打开添加产品弹窗和打开工序列表时获取', () => {
  const addList = block('const loadAddProductList = async', '\n// 切换订单展开/折叠')
  assert.include(addList, 'loadNormalReworkPlanMap(products.map')

  const click = block('const handleProductClick = (product)', '\n// 取工序集合中某数量字段大于')
  assert.include(click, "dispatchTypeFilter.value === '正常'")
  assert.include(click, 'loadNormalReworkPlanMap([product.productionCode])')
})

test('两个正常模式入口只读取可用返工计划缓存', () => {
  assert.include(source, "hasNormalReworkPlans(product.productionCode)")
  assert.include(source, "hasNormalReworkPlans(group.productionCode)")
})
```

- [x] **Step 2: 运行测试确认失败**

Run: `node --test tmp/pre-dispatched-rework-shortcut.test.mjs`
Expected: FAIL，原因缺少 `SCHEDULE_PLAN_FIELD_MAP` 字段、`loadNormalReworkPlanMap` 或调用点。

- [x] **Step 3: 实现查询与缓存**

在 `SCHEDULE_PLAN_FIELD_MAP` 补充选择框和口径字段；新增：

```js
const normalReworkPlanMap = ref({})
const showReworkPlanSelector = ref(false)
const reworkPlanSelectorList = ref([])
const reworkShortcutLoading = ref(false)
const reworkShortcutLoadingCode = ref('')

const formatReworkMergeFlag = (v) => {
  if (v === 0 || v === '0') return '否'
  if (v === 1 || v === '1') return '是'
  return formatFieldValue(v) || '-'
}

const mapNormalReworkPlanRows = (rows = []) => rows
  .map(item => ({
    rowid: item.rowid || '',
    orderCode: formatFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.orderCode]) || '-',
    productName: formatFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.productName]) || '-',
    productionCode: formatFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.productionCode]) || '',
    reworkQty: formatFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.productionCount]) || '0',
    problemDescription: formatFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.problemDescription]) || '-',
    reworkProgress: formatFieldValue(item[SCHEDULE_PLAN_FIELD_MAP.reworkProgress]) || '-',
    reworkMergeFlag: formatReworkMergeFlag(item[SCHEDULE_PLAN_FIELD_MAP.reworkMergeFlag])
  }))
  .filter(item => item.rowid && item.productionCode && item.reworkProgress !== '已完成')
```

`loadNormalReworkPlanMap(productionCodes)` 使用 `callWorkflowListAll`，过滤车间、返工排产、生产编号集合、已排产/部分排产、准时交货、工序明细非空，并排除已完成返工进度；失败时清空并提示「返工提醒加载失败」。

- [x] **Step 4: 接入两个获取时机**

`loadAddProductList()` 在正常产品映射完成后调用 `loadNormalReworkPlanMap(products.map(...))`；`handleProductClick()` 仅在从未选中变为选中且当前为正常模式时调用单生产编号查询。

- [x] **Step 5: 运行测试确认通过并提交**

Run: `node --test tmp/pre-dispatched-rework-shortcut.test.mjs`
Commit: `feat: 预派工正常产品加载返工提醒数据`

---

### Task 2: 两个返工按钮与多计划选择框

**Files:**
- Test: `tmp/pre-dispatched-rework-shortcut.test.mjs`
- Modify: `pages/preDispatched/preDispatched.vue`

- [x] **Step 1: 追加失败测试**

```js
test('多条返工计划选择框展示用户确认的六个字段', () => {
  const modal = block('class="rework-plan-modal"', '<!-- 员工选择弹窗')
  for (const text of ['订单编号', '产品名称', '返工数量', '问题描述', '返工进度', '是否合并']) {
    assert.include(modal, text)
  }
  assert.include(modal, 'confirmReworkPlanSelection(plan)')
})

test('返工快捷按钮阻止产品卡片默认选择事件', () => {
  assert.include(source, '@click.stop="openReworkShortcutFromProduct(product)"')
  assert.include(source, '@click.stop="openReworkShortcutFromGroup(group)"')
})
```

- [x] **Step 2: 运行测试确认失败**

Run: `node --test tmp/pre-dispatched-rework-shortcut.test.mjs`
Expected: FAIL，缺少按钮和选择框模板。

- [x] **Step 3: 实现模板**

- 添加产品卡片在「规格」右侧追加「返工」按钮。
- 右侧工序列表顶部栏在标题信息区后追加「返工」按钮。
- 页面末尾新增多计划选择框，每行展示订单编号、产品名称、返工数量、问题描述、返工进度、是否合并，并提供取消与「进入返工派工」操作。

- [x] **Step 4: 实现样式**

按钮沿用小尺寸操作按钮体系；选择框使用遮罩、标题、表头和横向滚动表格，问题 描述长文本换行显示。

- [x] **Step 5: 编译检查并提交**

Run: `node tmp/compile-sfc-check.cjs`
Commit: `feat: 预派工显示返工快捷入口`

---

### Task 3: 一键切换、添加并定位返工预派工

**Files:**
- Test: `tmp/pre-dispatched-rework-shortcut.test.mjs`
- Modify: `pages/preDispatched/preDispatched.vue`

- [x] **Step 1: 追加失败测试**

```js
test('一条返工计划直接进入，多条计划必须人工选择', () => {
  const fn = block('const openReworkShortcut = (plans)', '\nconst startReworkShortcut = async')
  assert.include(fn, 'plans.length === 1')
  assert.include(fn, 'showReworkPlanSelector.value = true')
})

test('快捷入口先切返工并等待刷新，再用计划rowid添加', () => {
  const fn = block('const startReworkShortcut = async', '\n// 延后预派工')
  assert.include(fn, "dispatchTypeFilter.value = '返工'")
  assert.include(fn, 'await refreshProductsAndProcesses(false)')
  assert.include(fn, 'addProductsByRowids([plan.rowid], [plan.productionCode]')

  const addFn = block('const addProductsByRowids = async', '\n// 延后预派工')
  assert.include(addFn, 'selectReworkProductAfterAdded')
})

test('添加成功后按订单和生产编号定位返工产品', () => {
  const fn = block('const selectReworkProductAfterAdded =', '\nconst startReworkShortcut = async')
  assert.include(fn, 'product.productionCode === plan.productionCode')
  assert.include(fn, 'product.orderNo === plan.orderCode')
  assert.include(fn, 'selectedProductIds.value = [target.uniqueKey]')
  assert.include(fn, 'await loadProductProcesses(target)')
})
```

- [x] **Step 2: 运行测试确认失败**

Run: `node --test tmp/pre-dispatched-rework-shortcut.test.mjs`
Expected: FAIL，缺少流程函数和自动定位逻辑。

- [x] **Step 3: 实现流程**

```js
const startReworkShortcut = async (plan) => {
  if (reworkShortcutLoading.value || !plan?.rowid) return
  reworkShortcutLoading.value = true
  reworkShortcutLoadingCode.value = plan.productionCode
  showAddProductModal.value = false
  showReworkPlanSelector.value = false
  try {
    dispatchTypeFilter.value = '返工'
    normalReworkPlanMap.value = {}
    await refreshProductsAndProcesses(false)
    await addProductsByRowids([plan.rowid], [plan.productionCode], { plan })
  } finally {
    reworkShortcutLoading.value = false
    reworkShortcutLoadingCode.value = ''
  }
}
```

`addProductsByRowids` 增加第三个可选参数；接口和轮询成功后调用 `selectReworkProductAfterAdded(plan)`，按订单编号 + 生产编号精确定位，必要时回退生产编号，再选中并加载工序。

- [x] **Step 4: 运行测试和全量回归**

Run:
```powershell
node --test tmp/pre-dispatched-rework-shortcut.test.mjs
node --test tmp/recent-regressions.test.mjs
node --test tmp/pre-dispatched-header-order.test.mjs
node --test tmp/dispatch-process-fields.test.mjs
node --test tmp/pre-dispatched-add-product-rework-qty.test.mjs
node tmp/compile-sfc-check.cjs
```
Expected: 全部 PASS / OK。

- [x] **Step 5: 最终代码提交**

Commit: `feat: 预派工支持一键返工派工`

---

### Task 4: 交付检查

**Files:**
- Modify: 无
- Verify: Git diff 与工作区状态

- [x] **Step 1: 检查变更边界**

只允许本次修改 `docs/superpowers/plans/2026-10-27-pre-dispatch-rework-shortcut.md` 与 `pages/preDispatched/preDispatched.vue`；`tmp/` 测试和既有脏文件不提交。

- [x] **Step 2: 输出验证结果**

向用户说明测试结果、按钮位置、匹配条件和自动流程。
