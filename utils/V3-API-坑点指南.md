# V3 API 字段值格式坑点指南

## 问题：新建行记录时下拉/关联字段赋值无效

### 错误写法（字段值传对象数组）

```js
// ❌ 错误：下拉字段传 [{key, value}]
{ Id: '字段ID', value: [{ key: '选项key', value: '选项名' }] }

// ❌ 错误：关联记录字段传 [{sid, name}]
{ Id: '字段ID', value: [{ sid: '目标rowId', name: '目标名称' }] }
```

**现象**：API 返回 success，但写入后：
- 下拉字段（Dropdown/SingleSelect）变成空值
- 关联记录字段（Relation）显示"已删除"，实际存入的是二次序列化的 JSON 字符串

### 正确写法（字段值传纯字符串 key/rowId）

```js
// ✅ 正确：下拉字段直接传选项 key 字符串
{ Id: '6a0c4062c03685667d67b621', value: '6cafeec2-b516-4df6-a6ec-59e80a29e42f' }

// ✅ 正确：关联记录字段直接传目标 rowId 字符串
{ Id: '6a0ed55bc03685667d68c003', value: 'fdaf8922-07f6-41e7-a6e2-5f9ac0f5bfcc' }
```

API 会自动将纯字符串转换为完整的 `[{key, value}]` / `[{sid, name}]` 格式存储。

## 根本原因

V3 API 的 `POST /rows`（新建行记录）和 `PATCH /rows/{rowId}`（更新行记录），其 `fields` 参数格式为：

```json
{
  "fields": [
    { "Id": "字段ID", "value": "值" }
  ]
}
```

对于**下拉/单选/关联记录**这类选择型字段，`value` 只接受**纯字符串 ID/key**，而不是完整的对象数组。对象数组格式仅用于**查询结果的返回值**，不是写入时的输入格式。

## 如何确认字段类型对应的 value 格式

通过 `getWorksheetStructure(worksheetId)` 获取工作表结构，查看字段的 `type` 属性：

| 字段类型编号 | 字段类型 | value 写入格式 |
|:-----------:|---------|--------------|
| 2 | Text | 纯字符串 |
| 9 | SingleSelect | 选项 key（字符串） |
| 11 | Dropdown | 选项 key（字符串） |
| 29 | Relation | 目标记录的 rowId（字符串） |
| 26 | Collaborator | 成员 ID（字符串） |

## 已存在的函数说明

`api.js` 中的 `createRow` 和 `updateRow` 函数已经封装了 `{Id, value}` 格式：

```js
const createRow = async (worksheetId, fields) => {
  const body = { fields: Object.entries(fields).map(([Id, value]) => ({ Id, value })) }
  // value 必须传纯字符串，不可传对象
}
```

调用时传纯字符串即可：
```js
await createRow(worksheetId, {
  '字段ID_编码': 'CAT-1-101',
  '字段ID_类型': '6cafeec2-...',  // 下拉key
  '字段ID_上级': 'fdaf8922-...',  // 关联rowId
})
```

---

## 问题：查询行记录时 Relation（关联记录）字段过滤条件失效

### 错误写法（value 传纯字符串 rowId）

```js
// ❌ 错误：关联字段过滤传纯字符串
const rows = await getAllDataList(worksheetId, [
  { fieldId: '关联字段ID', operator: 'eq', value: 'targetRowId' }
])
// 过滤不生效，返回全部数据
```

**现象**：API 返回 `success: true`，但过滤条件完全不生效，返回全部数据。明明只想看某用户关联的记录，结果其他用户的也出来了。

### 正确写法（value 传数组格式 `[rowId]`）

```js
// ✅ 正确：关联字段过滤传数组格式的 rowId
const rows = await getAllDataList(worksheetId, [
  { fieldId: '关联字段ID', operator: 'eq', value: ['targetRowId'] }
])
```

### 为什么

根据明道云筛选器使用指南：
> **关联记录**: 关联的记录的筛选需要先查询到对应的record_id，再以**数组值规则**进行筛选

关联记录字段（Relation）和选项型字段一样，filter 的 value 必须使用**数组格式**。V3 API 会忽略纯字符串格式的 value，导致过滤不生效。

### 已踩坑案例

2026-06-29：维修模块工单列表按报修人（Relation 字段）过滤时，传 `value: authStore.userId`（纯字符串），结果过滤完全不生效，所有用户都能看到全部工单。改为 `value: [authStore.userId]` 后正常。

---

## 问题：查询行记录时 SingleSelect 过滤条件失效

### 错误写法（传显示文本）

```js
// ❌ 错误：SingleSelect 过滤传显示文本
const rows = await getAllDataList(worksheetId, [
  { fieldId: '字段ID', operator: 'eq', value: '在途' }
])
// rows 为空数组
```

**现象**：API 返回 `success: true`，但 `data.rows` 为空。明明有对应值的数据，但就是查不到。

### 正确写法（传选项 key UUID）

过滤前先调用 `getWorksheetStructure` 获取字段的选项 key：

```js
// ✅ 正确：先获取选项 key，再用 key 过滤
const structure = await getWorksheetStructure(worksheetId)
const statusField = structure.fields.find(f => f.id === '字段ID')
const targetOption = statusField?.options?.find(o => o.value === '在途')
const rows = await getAllDataList(worksheetId, [
  { fieldId: '字段ID', operator: 'eq', value: targetOption?.key }
])
```

### 为什么

SingleSelect 字段在数据库中存储的格式为 `[{key: "uuid", value: "显示文本"}]`。  
查询接口的 filter 条件需要匹配内部的 **key（UUID 字符串）**，而不是显示文本 value。

### 如何确认选项 key

通过 `getWorksheetStructure(worksheetId)` 获取的字段结构中，SingleSelect/MultipleSelect 类型字段包含 `options` 数组：

```json
{
  "options": [
    { "key": "d199e3fc-9c17-40b1-b2c3-1ae9877e6a8e", "value": "在途", "index": "0", "isDeleted": "false" },
    { "key": "a2b3c4d5-...", "value": "已到货", "index": "1", "isDeleted": "false" }
  ]
}
```

取 `options` 数组中 `value` 匹配目标文本的 `key` 即可。  
若 `value` 匹配不到，检查 `isDeleted` 是否被标记为删除。

### 涉及的方法

- `getDataList(worksheetId, pageIndex, pageSize, filters)` — 分页查询
- `getAllDataList(worksheetId, filters)` — 全量查询

---

## 问题：新建行记录时响应中的记录 ID 字段名是 `id` 而非 `rowId`

### 错误写法（用 `data.rowId` 取 ID）

```js
// ❌ 错误：新建后取 data.rowId
const res = await fetch(`.../worksheets/${wsId}/rows`, {
  method: 'POST',
  body: JSON.stringify({ fields })
})
const result = await res.json()
const newRowId = result.data.rowId  // undefined！
```

**现象**：`result.data.rowId` 为 `undefined`，导致后续使用该 ID（如关联子表、更新状态）全部失效。

### 正确写法（用 `data.id` 取 ID）

```js
// ✅ 正确：新建后取 data.id
const newRowId = result.data.id
```

### 为什么

V3 API 的 `POST /rows`（新建行记录）响应格式：

```json
{
  "data": { "id": "af986a70-9244-48fe-9370-f94b6edca05a" },
  "success": true
}
```

新记录的 ID 字段名是 **`id`**，不是 `rowId`。

> `rowId` 仅出现在**查询列表**（`GET /rows/list`）的返回数据中，作为每条记录的属性名。

### 哪些接口受影响

| 接口 | 响应中的 ID 字段名 | 示例 |
|------|-------------------|------|
| `POST /rows`（新建） | `data.id` | `result.data.id` |
| `GET /rows/{rowId}`（查询单条） | `data.rowId` | `result.data.rowId` |
| `POST /rows/list`（查询列表） | 每条记录的 `rowId` 属性 | `rows[0].rowId` |

### 已踩坑案例

2026-05-29：`DeliveryScan.vue` 中 `submitDelivery` 函数，新建入库单后取 `data.rowId` 得到 `undefined`，导致入库明细的关联入库单号为 `null`，子表更新也因 ID 无效而报 "数据不存在"。

---

## 问题：附件（Attachment）字段写入与读取的字段名不一致

### 写入格式（createRow / updateRow）

```js
// ✅ 写入时：name + url（Base64 或外部链接）
{
  '附件字段ID': [
    { name: '盘点证明_1.jpg', url: 'data:image/jpeg;base64,...' },
    { name: '盘点证明_2.jpg', url: 'https://example.com/photo.jpg' },
  ]
}
```

### 读取格式（getDataList / getData 返回值）

附件字段读取时返回的是**完整的文件对象**，包含多个 URL 字段（注意大小写）：

```js
[
  {
    file_id: '4fe371ba-...',
    original_file_name: '发货照片_1.jpg',   // 原始文件名
    file_name: 'c164fd11dd7740a48c5c90b3fd839638.jpg',  // 服务器文件名
    file_path: 'https://www.dachen.vip/file/mdpic/normal/20260610/',  // 目录路径
    // ⚠️ 以下三个 URL 字段均可用于显示图片，优先级从高到低：
    preview_url: 'https://www.dachen.vip/file/.../xxx.jpg?e=xxx&token=xxx',  // 带认证token，可直接访问
    DownloadUrl: 'https://www.dachen.vip/file/.../xxx.jpg',  // 大写D，不带token
    original_file_full_path: 'https://www.dachen.vip/file/.../xxx.jpg',  // 原图完整路径
    // 缩略图
    thumbnail_full_path: 'https://www.dachen.vip/file/.../xxx.jpg?imageView2/1/w/200/h/118',
    large_thumbnail_full_path: 'https://www.dachen.vip/file/.../xxx.jpg?imageView2/2/w/1280/h/800',
    // 其他字段
    file_size: 696025,
    file_type: 1,
    is_delete: false,
    allow_down: true,
    allow_view: true,
    createTime: '2026-06-10 23:04:07',
  }
]
```

### 对比

| 操作 | 文件名字段 | URL 字段 | URL 格式 |
|------|-----------|---------|---------|
| 写入 | `name` | `url` | Base64 或外部链接 |
| 读取 | `original_file_name` | `preview_url` / `DownloadUrl` / `original_file_full_path` | 服务器托管地址 |

### 正确的解析方式

```js
const photoField = row['附件字段ID']
let photos = []
if (Array.isArray(photoField)) {
  photos = photoField
    // 优先使用 preview_url（带认证token，可直接访问），其次 DownloadUrl（大写D），最后 original_file_full_path
    .map(att => att.preview_url || att.DownloadUrl || att.original_file_full_path || att.downloadUrl || att.url || '')
    .filter(url => url)
}
```

### ⚠️ 注意事项

1. **`DownloadUrl` 是大写 D**，不是 `downloadUrl`（小写 d）
2. **`preview_url` 带认证 token**，可直接在 `<img src>` 中使用，但 token 有过期时间
3. **`original_file_full_path` 不带 token**，可能需要认证才能访问
4. 不同工作表的附件字段返回结构可能略有差异，建议优先用 `preview_url`

### 已踩坑案例

2026-06-06：`InventoryCheckDetail.vue` 中解析盘点证明附件时，用 `att.preview_url` / `att.original_file_full_path` / `att.DownloadUrl` / `att.url` 均取不到值，实际返回的字段名是 `downloadUrl`（小写 d）。

2026-06-10：发货单附件字段实际返回的是 `DownloadUrl`（大写 D）和 `preview_url`，**不存在** `downloadUrl`（小写 d）字段。之前代码用 `att.downloadUrl || att.url` 取值，结果为空字符串，导致图片无法渲染。不同工作表的附件字段返回格式可能不同，应按优先级 `preview_url > DownloadUrl > original_file_full_path > downloadUrl` 依次尝试。

---

## 问题：关联记录/下拉字段为空时返回空数组 `[]`，导致 truthy 误判

### 错误写法（直接用 `||` 兜底）

```js
// ❌ 错误：空数组是 truthy，`[] || ''` 结果是 `[]` 而非 `''`
const statusField = item['审批结果字段ID']  // 未填写时返回 []
const statusValue = Array.isArray(statusField) && statusField.length > 0
  ? statusField[0].name
  : statusField  // 这里 statusField 是 []，不是 falsy！
// statusValue = []，后续判断 `!statusValue` 为 false，逻辑出错
```

**现象**：关联记录/下拉字段未填写时，API 返回空数组 `[]`。JavaScript 中 `[]` 是 truthy，`[] || ''` 结果是 `[]`，导致：
- `![]` 为 `false`，空值被当作有值处理
- 模板中渲染 `[]` 显示为空但逻辑判断错误（如审批状态判断）

### 正确写法（数组类型单独判断）

```js
// ✅ 正确：数组为空时返回空字符串
const statusField = item['审批结果字段ID']
const statusValue = Array.isArray(statusField) && statusField.length > 0
  ? statusField[0].name
  : (Array.isArray(statusField) ? '' : (statusField || ''))
```

### 通用工具函数建议

```js
// 解析关联记录/下拉字段，安全取值
function parseRelationField(field) {
  if (Array.isArray(field)) {
    return field.length > 0 ? field[0] : null
  }
  return field || null
}

// 解析他表字段（Lookup），可能返回纯文本或数组
function parseLookupField(field) {
  if (Array.isArray(field) && field.length > 0) {
    return field[0].name || field[0].value || ''
  }
  return Array.isArray(field) ? '' : (field || '')
}
```

### 已踩坑案例

2026-06-09：审批模块中审批结果字段（关联记录）未填写时返回 `[]`，`[] || ''` 结果为 `[]`，导致 `!statusText` 为 `false`，未审批的单子被错误归入"已完成"列表。

---

## 问题：Number 字段查询返回字符串，直接运算导致字符串拼接

### 错误写法（直接对 API 返回值做数值运算）

```js
// ❌ 错误：API 返回的 Number 字段值是字符串 "0.00"，不是数字 0
const shippedQty = row['实际发货数量字段ID'] ?? 0  // shippedQty = "0.00"
const newQty = shippedQty + 1  // "0.00" + 1 = "0.001"（字符串拼接！）
```

**现象**：数值更新后变成小数点追加，如实际发货数量从 `0` 变成 `0.001` 而非 `1`。库存数量、金额等数值字段同理。

### 正确写法（parseFloat 转换后再运算）

```js
// ✅ 正确：先 parseFloat 转为数字
const shippedQty = parseFloat(row['实际发货数量字段ID']) || 0  // shippedQty = 0
const newQty = shippedQty + 1  // 0 + 1 = 1 ✅
```

### 为什么

V3 API 查询接口（`GET /rows/list`、`GET /rows/{rowId}`）返回的 Number 类型字段值是**字符串格式**（如 `"0.00"`、`"100"`、`"10.5"`），不是 JavaScript 的 number 类型。

JavaScript 中字符串与数字的 `+` 运算会触发**字符串拼接**：
- `"0.00" + 1` → `"0.001"`
- `"10" + 5` → `"105"`
- `0 + 1` → `1`（数字运算，正确）

### 受影响的运算符

| 运算 | 字符串行为 | 正确结果 |
|------|-----------|---------|
| `+` | 字符串拼接 ❌ | 数值相加 ✅ |
| `-` | 隐式转数字 ✅ | 数值相减 ✅ |
| `*` | 隐式转数字 ✅ | 数值相乘 ✅ |
| `/` | 隐式转数字 ✅ | 数值相除 ✅ |
| `>` / `<` | 字符串比较 ❌ | 数值比较 ✅ |

> 只有 `+` 和比较运算符会出问题，但为了安全，**所有 Number 字段都应 parseFloat**。

### 涉及的字段类型

| 字段类型编号 | 字段类型 | 返回格式 | 示例 |
|:-----------:|---------|---------|------|
| 6 | Number | 字符串 | `"0.00"`、`"100"`、`"10.5"` |
| 8 | Money | 字符串 | `"1000.00"` |

### 已踩坑案例

2026-06-10：发货模块提交出库时，发货明细的"实际发货数量"字段（Number/Double）API 返回 `"0.00"`，`"0.00" + 10 = "0.0010"`，导致更新后实际发货数量变为 `0.0010` 而非 `10`。库存台账的库存数量、均价、虚拟占用等 Number 字段同理。

---

## 问题：双向关联字段手动 updateRow 覆盖导致关联被清空

### 错误写法（手动更新双向关联的其中一方）

```js
// ❌ 错误：创建子记录时已设置 fParent，双向关联会自动回写 fChildren，
//        但紧接着手动 updateRow 覆盖 fChildren，导致双向关联都被破坏
const childRow = await createRow(wsChild, {
  [CHILD.fParent]: parentRowId,  // 设置子→父关联，明道云自动回写父→子关联
})

// ❌ 又手动更新父记录的关联字段，覆盖了自动回写的正确值
await updateRow(wsParent, parentRowId, {
  [PARENT.fChildren]: childRowIds.join(','),  // 逗号拼接字符串不是合法的关联值格式
})
```

**现象**：
- 父记录的关联子记录字段显示为空（或显示"已删除"）
- 子记录的关联父记录字段也被清空
- 后台日志出现 "xxx取消了1条(被动)"，表示双向关联一致性机制在清除无效值

### 根本原因

1. **双向关联自动回写**：明道云的双向关联（Relation）字段，在 A→B 设置关联时，B→A 会自动回写。创建子记录设置 `fParent: parentRowId` 后，父记录的 `fChildren` 会被自动填充。

2. **手动覆盖破坏关联**：`updateRow` 的 `updateType` 默认为 `"0"`（覆盖），手动更新 `fChildren` 会用新值完全替换自动回写的正确值。

3. **值格式错误**：多条关联记录的值不是逗号拼接字符串 `"id1,id2,id3"`，而是字符串数组 `["id1", "id2", "id3"]`。逗号拼接字符串不是合法的关联字段值格式，API 会将其当作无效值处理。

4. **双向一致性**：覆盖 `fChildren` 为无效值后，明道云双向关联一致性机制会同步清空子记录的 `fParent`，导致**双向关联都断了**。

### 正确写法（依赖自动回写，不手动更新双向关联的反向字段）

```js
// ✅ 正确：只设置子→父关联，依赖双向关联自动回写
for (const childData of childList) {
  await createRow(wsChild, {
    [CHILD.fParent]: parentRowId,  // 设置子→父，自动回写父→子
    // 其他字段...
  })
}
// 无需手动 updateRow 父记录的 fChildren 字段
```

### 如果确实需要手动追加关联（使用 updateType: "1"）

```js
// ✅ 正确：追加关联，不覆盖已有值
await updateRow(wsParent, parentRowId, {
  [PARENT.fChildren]: newChildRowId,  // 传纯字符串 rowId
}, { updateType: '1' })  // 追加模式，不覆盖
```

> 注意：当前 `api.js` 的 `updateRow` 函数未支持 `updateType` 参数，如需使用需扩展。

### updateType 参数说明

| updateType | 含义 | 适用字段类型 |
|:---:|------|------|
| `"0"` | 覆盖（默认） | Relation、MultipleSelect、Attachment、Collaborator、SubTable 等 |
| `"1"` | 新增（追加） | 同上 |
| `"2"` | 减少（移除） | 同上 |

### 已踩坑案例

2026-06-11：订单进度跟踪流程中，创建物料进度明细时设置了 `fOrderProgress: progressRowId`（子→父），明道云自动回写了 `fMatProgress`（父→子）。但代码紧接着用 `updateRow` 更新 `fMatProgress` 为 `matProgressRowIds.join(',')`（逗号拼接字符串），导致：①值格式无效（关联字段不接受逗号字符串）；②覆盖模式清空了自动回写的正确值；③双向一致性机制同步清空了 `fOrderProgress`。最终订单进度跟踪表中没有物料进度明细，物料进度明细中也没有订单进度跟踪表。
