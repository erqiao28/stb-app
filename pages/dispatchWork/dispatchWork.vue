<template>
  <view class="process-container" @click="closeWorkshopOptions" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- ==================== 模态框组件 ==================== -->
    
    <!-- 车间选择模态框 -->
    <Radiobox v-model="workshop" :options="workshopOptions" title="车间" v-model:visible="showWorkshopModal"
      @confirm="handleWorkshopConfirm" />
    
    <!-- 机台选择模态框 -->
    <MachineRadiobox v-model="machine" :options="machineOptions" title="选择机台" v-model:visible="showMachineModal"
      @confirm="handleMachineConfirm" />
    
    <!-- 添加员工模态框 -->
    <AddWorkerRadiobox v-model="selectedEmployeesForAdd" :options="allEmployeesOptions" title="添加员工" 
      :visible="showAddEmployeeModal" @update:visible="handleAddEmployeeModalClose" @confirm="handleAddEmployeeConfirm"
      :workshopOptions="workshopOptions" :workshop="modalWorkshop" @update:workshop="onModalWorkshopChange"
      :maxSelection="addEmployeeMaxSelection" />
    
    <!-- 图片预览模态框（多图轮播） -->
    <view class="image-preview-modal" v-if="showImagePreview" @click="closeImagePreview" :style="{ paddingTop: statusBarHeight + 'px' }">
      <button class="btn-close" @click="closeImagePreview">关闭</button>
      <view class="preview-content" @click.stop>
        <swiper
          v-if="previewImageUrls.length > 0"
          class="preview-swiper"
          :current="previewImageIndex"
          @change="onPreviewSwiperChange"
          :indicator-dots="previewImageUrls.length > 1"
          indicator-active-color="#5884f1"
          indicator-color="rgba(255,255,255,0.5)"
        >
          <swiper-item v-for="(url, idx) in previewImageUrls" :key="idx">
            <view class="swiper-item-inner">
              <image
                :src="url"
                class="preview-image"
                mode="aspectFit"
                :lazy-load="false"
                @error="handleImageError"
              />
            </view>
          </swiper-item>
        </swiper>
      </view>
    </view>
    
    <!-- 终止派工模态框 -->
    <view class="terminate-modal" v-if="showTerminateModal" @click.self="closeTerminateModal">
      <view class="terminate-content" @click.stop>
        <view class="terminate-body">
          <view class="terminate-tip">
            确定要终止工序“{{ selectedProcessData?.process?.processName || '' }}”吗？
          </view>
          <view class="form-group">
            <text class="label">终止原因：</text>
            <textarea 
              v-model="terminateReason" 
              placeholder="请输入终止原因" 
              class="terminate-textarea"
              maxlength="200"
            />
          </view>
        </view>
        <view class="terminate-footer">
          <button class="btn-cancel" @click="closeTerminateModal">取消</button>
          <button class="btn-confirm" @click="confirmTerminate" :disabled="!terminateReason || !terminateReason.trim()">确定</button>
        </view>
      </view>
    </view>

    <!-- 删除工序确认模态框 -->
    <view class="delete-confirm-modal" v-if="showDeleteConfirmModal" @click.self="closeDeleteConfirmModal">
      <view class="delete-confirm-content" @click.stop>
        <view class="delete-confirm-body">
          <view class="delete-confirm-tip">
            确定要删除工序「{{ selectedProcessData?.process?.processName || '' }}」吗？删除后无法恢复。
          </view>
        </view>
        <view class="delete-confirm-footer">
          <button class="btn-cancel" @click="closeDeleteConfirmModal">取消</button>
          <button class="btn-delete-confirm" @click="confirmDeleteProcess">删除</button>
        </view>
      </view>
    </view>

    <!-- 派工确认模态框 -->
    <view class="dispatch-confirm-modal" v-if="showDispatchConfirmModal" @click.self="closeDispatchConfirmModal">
      <view class="dispatch-confirm-content" @click.stop>
        <view class="dispatch-confirm-title">当前派工信息如下</view>
        <view class="dispatch-confirm-list">
          <view class="dispatch-confirm-row" v-for="(row, index) in dispatchConfirmRows" :key="index">
            <text class="dispatch-confirm-label">{{ row.label }}：</text>
            <text class="dispatch-confirm-value">{{ row.value || '-' }}</text>
          </view>
        </view>
        <view class="dispatch-confirm-tip">确认派工吗？</view>
        <view class="dispatch-confirm-footer">
          <button class="btn-cancel" @click="closeDispatchConfirmModal">取消</button>
          <button class="btn-confirm" :disabled="processDispatchConfirmSubmitting" @click.stop="handleDispatchConfirm">
            确认派工
          </button>
        </view>
      </view>
    </view>

    <!-- 返工完成 -->
    <view class="rework-complete-modal" v-if="showReworkCompleteModal" @click.self="closeReworkCompleteModal">
      <view class="rework-complete-content" @click.stop>
        <view class="rework-complete-title">返工完成</view>
        <view class="rework-complete-body">
          <view class="rework-complete-row">
            <text class="rework-complete-label">是否流转到下一个车间返工：</text>
            <radio-group class="rework-complete-radio-group" @change="onReworkTransferRadioChange">
              <label class="rework-complete-radio-label">
                <radio value="yes" :checked="reworkTransferToNext" color="#5884f1" />是
              </label>
              <label class="rework-complete-radio-label">
                <radio value="no" :checked="!reworkTransferToNext" color="#5884f1" />否
              </label>
            </radio-group>
          </view>
          <view class="rework-complete-row">
            <text class="rework-complete-label">返工车间：</text>
            <picker
              mode="selector"
              :range="workshopOptions"
              :value="reworkCompleteWorkshopIndex"
              :disabled="!reworkTransferToNext"
              @change="onReworkCompleteWorkshopChange"
            >
              <view class="rework-complete-picker" :class="{ 'is-disabled': !reworkTransferToNext }">
                {{ workshopOptions[reworkCompleteWorkshopIndex] || '请选择' }}
              </view>
            </picker>
          </view>
        </view>
        <view class="rework-complete-footer">
          <button class="btn-cancel" @click="closeReworkCompleteModal">取消</button>
          <button class="btn-confirm" @click="confirmReworkComplete">确认</button>
        </view>
      </view>
    </view>

    <!-- 合并工序：按车间拉取工序字典（同添加工序页），多选后合并 -->
    <view class="rework-start-modal" v-if="showReworkStartModal" @click.self="closeReworkStartModal">
      <view class="rework-start-content" @click.stop>
        <view class="rework-start-title">合并工序</view>
        <view class="merge-process-search">
          <input
            class="merge-process-search-input"
            type="text"
            v-model="mergeProcessSearchValue"
            placeholder="请输入工序名称"
            @input="onMergeProcessSearchInput"
          />
        </view>
        <!-- 列表区单独 flex 收缩，避免 scroll-view 盖住底部按钮 -->
        <view class="merge-process-list-wrap">
          <scroll-view
            scroll-y
            class="merge-process-scroll"
            :lower-threshold="50"
            @scrolltolower="loadMoreMergeProcess"
          >
            <view
              v-for="p in mergeProcessTableData"
              :key="p.rowid || p.processName"
              class="merge-process-row"
              :class="{ selected: isMergeProcessSelected(p.rowid) }"
              @click="toggleMergeProcessSelect(p)"
            >
              <view class="merge-process-check">{{ isMergeProcessSelected(p.rowid) ? '✓' : '' }}</view>
              <text class="merge-process-name">{{ p.processName || '-' }}</text>
            </view>
            <view v-if="mergeProcessLoading && mergeProcessTableData.length === 0" class="merge-process-tip">加载中...</view>
            <view v-else-if="!mergeProcessLoading && mergeProcessTableData.length === 0" class="merge-process-tip">暂无工序</view>
            <view v-if="mergeProcessLoading && mergeProcessTableData.length > 0" class="merge-process-tip">加载中...</view>
            <view v-if="!mergeProcessHasMore && mergeProcessTableData.length > 0" class="merge-process-tip">没有更多了</view>
          </scroll-view>
        </view>
        <view class="merge-process-footer-bar">
          <view class="rework-start-footer">
            <button class="btn-cancel" @click="closeReworkStartModal">取消</button>
            <button class="btn-merge" @click="confirmReworkStart">合并</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 一对多派工模态框（多工序，每工序独立派工数量） -->
    <view class="process-modal" v-if="showOneToManyModal" @click.self="closeOneToManyModal">
      <view class="process-content one-to-many-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">一对多派工</text>
          <view class="modal-close" @click="closeOneToManyModal">×</view>
        </view>
        <scroll-view scroll-y class="modal-scroll-content">
          <view class="modal-body">
            <view
              class="one-to-many-process-row"
              v-for="(row, idx) in oneToManyProcessRows"
              :key="row.processRowid || idx"
            >
              <view class="form-group one-to-many-col-process">
                <text class="label">工序：</text>
                <text class="value-readonly one-to-many-value">{{ row.processName || '-' }}</text>
              </view>
              <view class="form-group one-to-many-col-num">
                <text class="label">{{ currentOneToManyItem?.billType === '返工排产' ? '返工数量' : '排产数量' }}：</text>
                <text class="value-readonly one-to-many-value one-to-many-value-short">{{ row.productionCountDisplay }}</text>
              </view>
              <view class="form-group one-to-many-col-num one-to-many-col-need">
                <text class="label">可派工数量：</text>
                <text class="value-readonly one-to-many-value one-to-many-value-short">{{ row.needCountDisplay }}</text>
              </view>
              <view class="form-group one-to-many-col-num">
                <text class="label">派工数量：</text>
                <input
                  v-model.number="row.quantity"
                  type="number"
                  placeholder="请输入"
                  min="0"
                  :max="row.maxQuantity"
                  class="input-field one-to-many-qty-input"
                />
              </view>
            </view>
            <view class="row-group">
              <view class="form-group">
                <text class="label">派工日期：</text>
                <picker mode="date" :value="oneToManyDispatchDate" @change="onOneToManyDateChange">
                  <view class="value">
                    {{ oneToManyDispatchDate || '请选择日期' }}
                  </view>
                </picker>
              </view>
              <view class="form-group"></view>
            </view>
          </view>
          <view class="employee-section">
            <view class="table-header">
              <view class="col selected">选择</view>
              <view class="col name">姓名</view>
              <view class="col totalHours">总工时数</view>
              <view class="col unrecordedHours">未派工时</view>
            </view>
            <radio-group @change="onOneToManyEmployeeRadioChange" class="employee-table">
              <label v-for="emp in oneToManyEmployeeList" :key="emp.id" class="table-row">
                <view class="col selected">
                  <radio :value="String(emp.id)" :checked="String(selectedOneToManyEmployeeId) === String(emp.id)" />
                </view>
                <view class="col name">{{ emp.name }}</view>
                <view class="col totalHours">{{ emp.totalHours }} 时</view>
                <view class="col unrecordedHours">{{ emp.unrecordedHours }} 时</view>
              </label>
            </radio-group>
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="btn-confirm" @click="addOneToManyEmployee">添加员工</button>
          <button class="btn-confirm" @click="confirmOneToManyDispatch" :disabled="!canOneToManyDispatch">确认派工</button>
        </view>
      </view>
    </view>

    <!-- 多对多派工模态框 -->
    <view class="process-modal" v-if="showMultiDispatchModal" @click.self="closeMultiDispatchModal">
      <view class="process-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">多对多派工</text>
          <view class="modal-close" @click="closeMultiDispatchModal">×</view>
        </view>
        
        <!-- 可滚动内容区域（包含表单信息和员工表格） -->
        <scroll-view scroll-y class="modal-scroll-content">
          <!-- 多对多：产品派工才显示按单列表；订单派工用下方表单字段 -->
          <view
            v-if="dispatchMode === 'product' && multiDispatchModalSummaryRows.length"
            class="multi-dispatch-modal-summary"
          >
            <view class="multi-dispatch-summary-header">
              <text class="col order">订单编号</text>
              <text class="col prod">{{ multiDispatchSummaryProdColTitle }}</text>
              <text class="col qty-head">派工数量</text>
            </view>
            <view
              v-for="(row, idx) in multiDispatchModalSummaryRows"
              :key="`md-sum-${row.billKey}-${idx}`"
              class="multi-dispatch-summary-row"
            >
              <text class="col order">{{ row.orderCode }}</text>
              <text class="col prod">{{ row.productionQtyDisplay }}</text>
              <view class="col qty-col">
                <input
                  v-model.number="multiDispatchQtyByBillKey[row.billKey]"
                  type="number"
                  placeholder="请输入"
                  min="0"
                  class="multi-dispatch-qty-input"
                />
              </view>
            </view>
            <view class="multi-dispatch-summary-total-row">
              <text class="col order">总派工数量</text>
              <text class="col prod"></text>
              <text class="col qty-col total-qty">{{ multiDispatchTotalQty }}</text>
            </view>
          </view>

          <!-- 表单信息区域 -->
          <view class="modal-body">
            <!-- 产品派工：派工日期 + 计薪方式 -->
            <view class="row-group" v-if="dispatchMode === 'product'">
              <view class="form-group">
                <text class="label">派工日期：</text>
                <picker mode="date" :value="multiDispatchData.date" @change="onMultiDateChange">
                  <view class="value">
                    {{ multiDispatchData.date || '请选择日期' }}
                  </view>
                </picker>
              </view>
              <view class="form-group">
                <text class="label">计薪方式：</text>
                <picker mode="selector" :range="salaryMethodOptions" :value="multiSalaryMethodIndex" @change="onMultiSalaryMethodChange">
                  <view class="value">
                    {{ multiDispatchData.salaryMethod || '计件' }}
                  </view>
                </picker>
              </view>
            </view>

            <!-- 订单派工：仅排产数量、派工数量、派工日期、计薪方式（无订单数量） -->
            <view class="row-group" v-if="dispatchMode !== 'product'">
              <view class="form-group">
                <text class="label">{{ multiDispatchSummaryProdColTitle }}：</text>
                <text class="value-readonly">{{ multiDispatchOrderModeProductionDisplay }}</text>
              </view>
              <view class="form-group">
                <text class="label">派工数量：</text>
                <input
                  v-model.number="multiDispatchData.quantity"
                  type="number"
                  placeholder="请输入"
                  min="0"
                  class="input-field"
                />
              </view>
            </view>
            <view class="row-group" v-if="dispatchMode !== 'product'">
              <view class="form-group">
                <text class="label">派工日期：</text>
                <picker mode="date" :value="multiDispatchData.date" @change="onMultiDateChange">
                  <view class="value">
                    {{ multiDispatchData.date || '请选择日期' }}
                  </view>
                </picker>
              </view>
              <view class="form-group">
                <text class="label">计薪方式：</text>
                <picker mode="selector" :range="salaryMethodOptions" :value="multiSalaryMethodIndex" @change="onMultiSalaryMethodChange">
                  <view class="value">
                    {{ multiDispatchData.salaryMethod || '计件' }}
                  </view>
                </picker>
              </view>
            </view>
            
            <!-- 所选工序展示 -->
            <view class="row-group">
              <view class="form-group full">
                <text class="label">所选工序：</text>
                <view class="processes-display-inline">
                  <view v-for="(process, index) in multiDispatchSelectedProcessesForModal" :key="index" class="process-display-inline-wrapper">
                    <view class="process-display-inline-box">
                      <text class="process-display-inline-name">{{ process.process.processName }}</text>
                    </view>
                    <view v-if="index < multiDispatchSelectedProcessesForModal.length - 1" class="process-display-connector">→</view>
                  </view>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 员工选择表格 -->
          <view class="employee-section">
            <view class="table-header">
              <view class="col selected">选中</view>
              <view class="col name">姓名</view>
              <view class="col totalHours">总工时数</view>
              <view class="col unrecordedHours">未派工时</view>
            </view>
            <checkbox-group @change="onMultiEmployeeCheckboxChange" class="employee-table">
              <label v-for="emp in multiEmployeeList" :key="emp.id" class="table-row">
                <view class="col selected">
                  <checkbox :value="emp.id" :checked="isMultiEmployeeSelected(emp.id)" />
                </view>
                <view class="col name">{{ emp.name }}</view>
                <view class="col totalHours">{{ emp.totalHours }} 时</view>
                <view class="col unrecordedHours">{{ emp.unrecordedHours }} 时</view>
              </label>
            </checkbox-group>
          </view>
        </scroll-view>
        
        <!-- 模态框底部按钮 -->
        <view class="modal-footer">
          <button class="btn-confirm" @click="addMultiEmployee">添加员工</button>
          <button class="btn-confirm" @click="confirmMultiDispatch" :disabled="!canMultiDispatch">确认派工</button>
        </view>
      </view>
    </view>
    
    <!-- 工序派工模态框 -->
    <view class="process-modal" v-if="showProcessModal" @click.self="closeProcessModal">
      <view class="process-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ selectedProcessData?.process?.processName }}(工序派工)</text>
          <view class="modal-close" @click="closeProcessModal">×</view>
        </view>
        
        <!-- 可滚动内容区域（包含表单信息和员工表格） -->
        <scroll-view scroll-y class="modal-scroll-content">
          <!-- 产品派工：顶部汇总列表（当前工序在各勾选单据上的数量） -->
          <view
            v-if="dispatchMode === 'product' && productDispatchModalProcessRows.length"
            class="product-dispatch-modal-summary"
          >
            <view class="product-dispatch-summary-header">
              <text class="col order">订单编号</text>
              <text class="col num">需派工数量</text>
              <text class="col num">已派工数量</text>
              <text class="col num">标准日产量</text>
              <text class="col qty-head">派工数量</text>
              <text class="col time-col">工时</text>
            </view>
            <view
              v-for="(r, idx) in productDispatchModalProcessRows"
              :key="`pd-sum-${r.orderCode}-${idx}`"
              class="product-dispatch-summary-row"
            >
              <text class="col order">{{ r.orderCode }}</text>
              <text class="col num">{{ r.needCount }}</text>
              <text class="col num">{{ r.dispatchedCount }}</text>
              <text class="col num">{{ r.dailyoutput === '-' ? '-' : r.dailyoutput }}</text>
              <view class="col qty-col">
                <input
                  v-model="productDispatchQtyByBillKey[r.billKey]"
                  type="number"
                  placeholder="请输入"
                  min="0"
                  :max="typeof r.needCount === 'number' ? r.needCount : undefined"
                  class="product-modal-qty-input"
                />
              </view>
              <text class="col time-col">{{ getProductModalRowWorkTime(r) }}</text>
            </view>
            <view class="product-dispatch-summary-footer">
              <text class="col order footer-label">总派工数量</text>
              <text class="col num"></text>
              <text class="col num"></text>
              <text class="col num"></text>
              <view class="col qty-col">
                <text class="footer-total">{{ productDispatchModalTotalQty }}</text>
              </view>
              <text class="col time-col"></text>
            </view>
            <view class="product-dispatch-summary-footer hours">
              <text class="col order footer-label">总工时</text>
              <text class="col num"></text>
              <text class="col num"></text>
              <text class="col num"></text>
              <text class="col qty-col"></text>
              <text class="col time-col footer-total">{{ productDispatchModalTotalWorkTime }}</text>
            </view>
            <view class="product-dispatch-summary-footer wage">
              <text class="col order footer-label">总工资</text>
              <text class="col num"></text>
              <text class="col num"></text>
              <text class="col num"></text>
              <view class="col qty-col">
                <text class="footer-total">{{ productDispatchModalTotalWage }}</text>
              </view>
              <text class="col time-col"></text>
            </view>
          </view>

          <!-- 表单：产品派工固定两列网格；订单派工沿用原横向 row-group -->
          <view class="modal-body" :class="{ 'modal-body--product-grid': dispatchMode === 'product' }">
            <template v-if="dispatchMode === 'product'">
              <view class="modal-form-grid">
                <view class="modal-grid-cell">
                  <text class="modal-grid-label">工序：</text>
                  <view class="modal-grid-value modal-grid-value--readonly">{{ selectedProcessData?.process?.processName }}</view>
                </view>
                <view class="modal-grid-cell">
                  <text class="modal-grid-label">机台：</text>
                  <view class="modal-grid-value modal-grid-value--tap" @click="getMachineList">
                    {{ machine?.name || '请选择机台' }}
                  </view>
                </view>
                <view class="modal-grid-cell">
                  <text class="modal-grid-label">模具：</text>
                  <view class="modal-grid-value modal-grid-value--readonly">{{ selectedProcessData?.process?.mold || '无' }}</view>
                </view>
                <view class="modal-grid-cell">
                  <text class="modal-grid-label">派工日期：</text>
                  <picker mode="date" :value="processDispatchData.date" @change="onDateChange" class="modal-grid-picker">
                    <view class="modal-grid-value modal-grid-value--tap">{{ processDispatchData.date || '请选择日期' }}</view>
                  </picker>
                </view>
                <view class="modal-grid-cell">
                  <text class="modal-grid-label">计薪方式：</text>
                  <picker mode="selector" :range="salaryMethodOptions" :value="salaryMethodIndex" @change="onSalaryMethodChange" class="modal-grid-picker">
                    <view class="modal-grid-value modal-grid-value--tap">{{ processDispatchData.salaryMethod || '请选择计薪方式' }}</view>
                  </picker>
                </view>
              </view>
            </template>
            <template v-else>
              <!-- 订单编号和工序名称 -->
              <view class="row-group">
                <view class="form-group" v-if="dispatchMode !== 'product'">
                  <text class="label">订单编号：</text>
                  <text class="value">{{ selectedProcessData?.item?.orderCode }}</text>
                </view>
                <view class="form-group">
                  <text class="label">工序：</text>
                  <text class="value">{{ selectedProcessData?.process?.processName }}</text>
                </view>
              </view>

              <!-- 已派工数量和需派工数量（订单派工） -->
              <view class="row-group" v-if="dispatchMode !== 'product'">
                <view class="form-group">
                  <text class="label">已派工数量：</text>
                  <text class="value">{{ selectedProcessData?.process?.dispatchedCount }}</text>
                </view>
                <view class="form-group">
                  <text class="label">需派工数量：</text>
                  <text class="value">{{ selectedProcessData?.process?.needCount }}</text>
                </view>
              </view>

              <!-- 本次派工数量与派工工时 -->
              <view class="row-group" v-if="dispatchMode !== 'product'">
                <view class="form-group">
                  <text class="label">派工数量：</text>
                  <input v-model.number="processDispatchData.quantity" type="number" placeholder="请输入数量"
                    :max="maxQuantity" min="0" class="input-field" />
                </view>
                <view class="form-group">
                  <text class="label">派工工时：</text>
                  <input v-model.number="processDispatchData.time" type="number" placeholder="自动计算"
                    class="input-field" readonly />
                </view>
              </view>

              <!-- 机台和模具选择 -->
              <view class="row-group">
                <view class="form-group">
                  <text class="label">机台：</text>
                  <view class="value" @click="getMachineList">
                    {{ machine?.name || '请选择机台' }}
                  </view>
                </view>
                <view class="form-group">
                  <text class="label">模具：</text>
                  <text class="value-readonly">{{ selectedProcessData?.process?.mold || '无' }}</text>
                </view>
              </view>

              <!-- 日期选择和日产量 -->
              <view class="row-group">
                <view class="form-group">
                  <text class="label">派工日期：</text>
                  <picker mode="date" :value="processDispatchData.date" @change="onDateChange">
                    <view class="value">
                      {{ processDispatchData.date || '请选择日期' }}
                    </view>
                  </picker>
                </view>
                <view class="form-group" v-if="dispatchMode !== 'product'">
                  <text class="label">标准日产量：</text>
                  <text class="value-readonly">
                    {{ selectedProcessData?.process?.dailyoutput || 0 }}
                  </text>
                </view>
              </view>

              <!-- 计薪方式和工价 -->
              <view class="row-group">
                <view class="form-group">
                  <text class="label">计薪方式：</text>
                  <picker mode="selector" :range="salaryMethodOptions" :value="salaryMethodIndex" @change="onSalaryMethodChange">
                    <view class="value">
                      {{ processDispatchData.salaryMethod || '请选择计薪方式' }}
                    </view>
                  </picker>
                </view>
                <view class="form-group" v-if="dispatchMode !== 'product'">
                  <text class="label">工价：</text>
                  <text class="value-readonly">{{ processDispatchData.price ?? 0 }}</text>
                </view>
              </view>
            </template>
          </view>
          
          <!-- 员工选择表格 -->
          <view class="employee-section">
            <view class="table-header">
              <view class="col selected">选中</view>
              <view class="col name">姓名</view>
              <view class="col totalHours">总工时数</view>
              <view class="col unrecordedHours">未派工时</view>
            </view>
            <checkbox-group @change="onEmployeeCheckboxChange" class="employee-table">
              <label v-for="emp in employeeList" :key="emp.id" class="table-row">
                <view class="col selected">
                  <checkbox :value="emp.id" :checked="isEmployeeSelected(emp.id)" />
                </view>
                <view class="col name">{{ emp.name }}</view>
                <view class="col totalHours">{{ emp.totalHours }} 时</view>
                <view class="col unrecordedHours">{{ emp.unrecordedHours }} 时</view>
              </label>
            </checkbox-group>
          </view>
        </scroll-view>
        
        <!-- 模态框底部按钮 -->
        <view class="modal-footer">
          <button class="btn-confirm" @click="addEmployee">添加员工</button>
          <button class="btn-confirm" @click.stop="onConfirmProcessDispatchTap">确认派工</button>
          <button class="btn-confirm" :disabled="isProcessOver" @click="overProcess">终止</button>
          <button class="btn-delete-process" @click="deleteProcess">删除</button>
          <!-- <button class="btn-confirm">转派</button>
          <button class="btn-confirm">修改</button> -->
        </view>
      </view>
    </view>
    
    <!-- ==================== 页面主体内容 ==================== -->
    
    <!-- 导航栏（仅左侧返回箭头 + 中间标题） -->
    <view class="header">
      <!-- 左侧返回箭头保留 -->
      <image src="/static/left-arrow.svg" @click="quit"></image>
      <view class="title">
        派工( {{ userStore?.loginName || '' }} )
      </view>
      <view class="header-tag-wrap">
        <text
          class="dispatch-mode-tag"
          :class="dispatchMode === 'product' ? 'is-product' : 'is-order'"
        >{{ dispatchMode === 'product' ? '产品派工' : '订单派工' }}</text>
      </view>
    </view>
    
    <!-- 功能按钮栏（排产类型由选择订单/选择产品传入，不再提供顶部切换） -->
    <view class="btn-list" v-show="false">
      <view class="btn-item" @click="goDispatchInquiry">派工查询</view>
      <view class="btn-item" @click="goWorkload">员工工作量查询</view>
      <view class="btn-item" v-if="workshop === '组装车间' || workshop === '喷涂车间'" @click="goDispatchInquiryMore">多对多派工查询</view>
    </view>

    <!-- 顶部信息区域：订单派工显示单条；产品派工显示多条 -->
    <view class="search-box" v-if="dispatchMode !== 'product' || selectedProductHeaders.length === 0">
      <view class="info-item">
        <text class="info-label">订单编号</text>
        <view class="info-value">{{ selectedOrderCode || '-' }}</view>
      </view>
      <view class="info-item">
        <text class="info-label">生产单号</text>
        <view class="info-value">{{ selectedProductionCode || '-' }}</view>
      </view>
      <view class="info-item">
        <text class="info-label">产品名称</text>
        <view class="info-value">{{ searchForm.orderItem || '-' }}</view>
      </view>
    </view>
    <view class="search-box multi" v-else>
      <view class="info-row" v-for="(row, idx) in selectedProductHeaders" :key="`${row.orderCode}-${row.productionCode}-${idx}`">
        <view class="info-item">
          <text class="info-label">订单编号</text>
          <view class="info-value">{{ row.orderCode || '-' }}</view>
        </view>
        <view class="info-item">
          <text class="info-label">生产单号</text>
          <view class="info-value">{{ row.productionCode || '-' }}</view>
        </view>
        <view class="info-item">
          <text class="info-label">产品名称</text>
          <view class="info-value">{{ row.name || '-' }}</view>
        </view>
        <view class="info-item">
          <text class="info-label">订单数量</text>
          <view class="info-value">{{ row.orderCount === 0 || row.orderCount ? row.orderCount : '-' }}</view>
        </view>
      </view>
    </view>

    <!-- 单据列表 -->
    <view class="orderList" :key="listKey">
      <view class="orderItem" v-for="item in billsList" :key="`${item.orderCode || ''}-${item.productionCode || ''}`">
        <view class="goodsInfo">
          <!-- 订单信息头部 -->
          <view class="goodsInfo-up">
            <view class="orderGoods">
              <view class="order-label">订单</view>
              <view class="order-number">{{ item.orderCode }}</view>
            </view>
            <view class="status-indicator">
              <view class="status-item">
                <view class="status-color normal"></view>
                <text class="status-text">正常</text>
              </view>
              <view class="status-item">
                <view class="status-color terminated"></view>
                <text class="status-text">已终止</text>
              </view>
            </view>
            <view class="buttons">
              <button
                class="btn-first-check"
                v-if="(workshop === '拉伸车间' || workshop === '组装车间') && item.billType === '正常排产' && isFirstCheckPending(item)"
                @click="sendFirstCheckReminder(item)"
              >首检提醒</button>
              <block v-if="item.billType !== '返工排产'">
                <button class="btn-sop" @click="lookSop(item)">指导书</button>
                <button class="btn-dispatch" @click="lookImage(item)">技术图纸</button>
                <button class="btn-pack" @click="lookPackImage(item)">包装图纸</button>
              </block>
              <view
                class="rework-btns-wrap"
                v-if="isReworkProgressPendingForCompleteBtn(item) || isReworkMergeProcessBtn(item)"
              >
                <button
                  class="btn-rework-start"
                  v-if="isReworkMergeProcessBtn(item)"
                  @click="openReworkStartModal(item)"
                >合并工序</button>
                <button
                  class="btn-rework-complete"
                  v-if="isReworkProgressPendingForCompleteBtn(item)"
                  @click="openReworkCompleteModal(item)"
                >返工完成</button>
              </view>
              <button class="btn-detail" :disabled="!canClickDispatch(item)" @click.stop="dispatchWork(item)">操作</button>
              <button class="btn-delete" @click="addProcess(item)">添加工序</button>
              <button class="btn-normal-process" v-if="item.billType === '返工排产'" @click="useNormalProcess(item)">使用正常工序</button>
              <button class="btn-multi-dispatch" v-if="workshop === '组装车间' || workshop === '喷涂车间'" :disabled="!canClickMultiDispatch(item)" @click="openMultiDispatchModal(item)">多对多派工</button>
              <button class="btn-one-to-many" v-if="workshop === '抛光车间' && dispatchMode !== 'product'" :disabled="!canClickOneToManyDispatch(item)" @click="openOneToManyModal(item)">一对多派工</button>
            </view>
          </view>
          
          <!-- 订单详细信息 -->
          <view class="goodsInfo-down">
            <view class="name">
              <view>产品名称：</view>
              <view>{{ item.name }}</view>
            </view>
            
            <view class="productCode">
              <view>生产执行单：</view>
              <view>{{ item.productionCode }}</view>
            </view>
            <view class="orderCount">
              <view>订单数量：</view>
              <view>{{ item.orderCount }}</view>
            </view>
            <view class="productionCount">
              <view>{{ item.billType === '返工排产' ? '返工数量' : '排产数量' }}：</view>
              <view>{{ item.billType === '返工排产' ? formatReworkFieldQtyDisplay(item.reworkFieldQty) : item.productionCount }}</view>
            </view>
          </view>
          <view class="models">
              <view>规格型号：</view>
              <view>{{ item.models }}</view>
            </view>
          <view class="bill-qty-row rework-qty" v-if="item.reworkQty > 0">
            <view>返工数量：</view>
            <view>{{ item.reworkQty }}</view>
          </view>
          <view class="bill-qty-row scrap-qty" v-if="item.scrapQty > 0">
            <view>废品数量：</view>
            <view>{{ item.scrapQty }}</view>
          </view>
          
          <!-- 问题描述 -->
          <view class="problemDescription" v-if="item.problemDescription && item.problemDescription.trim()">
            <view>问题描述：</view>
            <view>{{ item.problemDescription }}</view>
          </view>
          
          <!-- 工序进度展示 -->
          <view class="processes-section" v-if="item.processes && item.processes.length > 0" :key="`processes-${item.orderCode}-${listKey}`">
            <view class="processes-container" :key="`container-${item.orderCode}-${listKey}`">
              <view v-for="(process, index) in item.processes" :key="`${item.orderCode}-${process.processName}-${index}-${listKey}`" class="process-wrapper">
                <view class="process-item" :class="{ 
                  'process-selected': isProcessSelected(item, process), 
                  'process-over': process.isOver == 1,
                  'process-multi-selected': isMultiSelectProcessWorkshop && isMultiProcessSelected(item, process)
                }"
                @click="selectProcess(item, process)">
                  <view class="process-sequence">{{ process.sequence || '' }}</view>
                  <view class="progress-circle"
                    :style="{
                      '--percent': Math.round(
                        (parseFloat(process.dispatchedCount) || 0) /
                        Math.max(
                          // 优先使用 allcount 作为总数；没有时回退到 needCount + dispatchedCount
                          (parseFloat(process.allcount) || 0) ||
                          ((parseFloat(process.needCount) || 0) + (parseFloat(process.dispatchedCount) || 0)),
                          1
                        ) * 100
                      ) + '%'
                    }">
                    <view class="progress-inner">
                      <view class="progress-top">
                        {{ item.orderCount }}
                      </view>
                      <view class="progress-divider"></view>
                      <view class="progress-bottom">
                        <text class="bottom-left">{{ process.allcount }}</text>
                        <view class="progress-bottom-divider"></view>
                        <text class="bottom-right">{{ process.finishCount || 0 }}</text>
                      </view>
                    </view>
                  </view>
                  <text class="process-name">{{ process.processName }}</text>
                </view>
                <view v-if="index < item.processes.length - 1" class="connector"></view>
              </view>
            </view>
          </view>
        </view>
        <view class="goodsProcess">
          <view class="bill-type-badge" 
            :class="{ 'badge-normal': item.billType === '正常排产', 'badge-rework': item.billType === '返工排产' }"
            v-if="item.billType">{{ item.billType }}</view>
        </view>
      </view>
    </view>

    <!-- 右下角固定刷新按钮 -->
    <view class="fab-refresh" @click="onManualRefresh">
      <text class="fab-refresh-text">⟳</text>
    </view>
  </view>
</template>

<script setup>
// ==================== 导入部分 ====================
import {
  ref,
  computed,
  watch,
  nextTick,
  reactive
} from 'vue'
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app'
import http from '../../utils/request'
import { callWorkflowListAPIPaged } from '../../utils/workflow'
import { useUserStore } from '../../store/user.store'
import { useStatusBar } from '../../composables/useStatusBar'
import Radiobox from "../../component/radiobox/radiobox.vue"
import MachineRadiobox from "../../component/machineRadiobox/machineRadiobox.vue"
import AddWorkerRadiobox from "../../component/addWorkerRadiobox/addWorkerRadiobox.vue"

// ==================== Store和Composables ====================
const userStore = useUserStore()
const { statusBarHeight } = useStatusBar()

// ==================== 响应式数据定义 ====================

// ---------- 车间相关 ----------
const workshop = ref('拉伸车间')
const workshopOptions = ref(['拉伸车间', '喷涂车间', '抛光车间', '组装车间'])
const showWorkshopModal = ref(false)
const isWorkshopLocked = ref(false) // 车间是否被锁定（不能修改）
const modalWorkshop = ref('') // 模态框中的车间选择
const modalWorkshopIndex = computed(() => {
  const index = workshopOptions.value.indexOf(modalWorkshop.value)
  return index >= 0 ? index : 0
})

/** 工序列表支持多选：组装/抛光/喷涂（喷涂与组装一致，含多对多派工） */
const isMultiSelectProcessWorkshop = computed(() => {
  const w = workshop.value
  return w === '组装车间' || w === '抛光车间' || w === '喷涂车间'
})

// 获取当前日期（格式：YYYY-MM-DD）
const getCurrentDate = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// ---------- 机台相关 ----------
const machine = ref(null)
const machineOptions = ref([])
const showMachineModal = ref(false)

// ---------- 搜索和列表相关 ----------
// searchValue 仅作为当前选中订单号的展示/占位使用，不再从输入框录入
const searchValue = ref('')
// 搜索条件：销售订单、产品名称（orderItem 字段）
const searchForm = ref({
  salesOrder: '',
  orderItem: ''
})
// 当前选中的订单号和生产单号（由选择单据页面传入，兼容历史逻辑，不再作为筛选必填项）
const selectedOrderCode = ref('')
const selectedProductionCode = ref('')
const selectedProductHeaders = ref([])
const dispatchMode = ref('order')
const billTypeFilter = ref('正常排产')  // 单据类型过滤参数：正常排产、返工排产（用于获取单据）
// 排产类型下拉选项
const billTypeOptions = ref(['正常排产', '返工排产'])
const billTypeIndex = ref(0)
const isBillTypeReadonly = ref(false)
const billsList = ref([])
const processList = ref([])
const listKey = ref(0)

/** 返工排产时列表/模态中替代排产数量展示的字段（与选择产品页一致） */
const formatReworkFieldQtyDisplay = (raw) => {
  if (raw == null || raw === '' || String(raw).trim() === '') return '-'
  return raw
}

/** 多对多等派工接口用的单据排产/返工数量（正常排产与原 productionCount ?? orderCount 一致） */
const getBillProductionQtyForDispatch = (item) => {
  if (!item) return 0
  if (item.billType === '返工排产') {
    const r = Number(item.reworkFieldQty)
    if (Number.isFinite(r) && r > 0) return r
    return Number(item.orderCount) || 0
  }
  const n = Number(item.productionCount ?? item.orderCount)
  return Number.isFinite(n) ? n : 0
}

/** 产品派工 dispatchList：工序 rowid、派工数量、该行工时（派工数量/小时产量，与界面一致） */
const buildProductProcessModalDispatchList = (rows) => {
  return (rows || []).map((r) => {
    const q = Number(productDispatchQtyByBillKey[r.billKey]) || 0
    const h = toFiniteNum(r.hourlyoutput, 0)
    const worktime = h > 0 && q > 0 ? parseFloat((q / h).toFixed(2)) : 0
    return {
      processRowid: r.processRowid || '',
      dispatchQuantity: q,
      worktime
    }
  })
}

/** 多对多派工：弹窗汇总列表整表快照，经额外字段 dispatchList 传给接口 */
const buildMultiDispatchModalListPayload = (targets, productMode, orderModeQty) => {
  return (targets || []).map((t) => {
    const b = t.item
    const bk = billKeyForMultiDispatch(b)
    const q = productMode ? Number(multiDispatchQtyByBillKey.value[bk]) || 0 : orderModeQty
    return {
      billKey: bk,
      billRowid: b?.billRowid || '',
      orderCode: b?.orderCode || '',
      productionCode: b?.productionCode || '',
      billType: b?.billType || '',
      productionCount: getBillProductionQtyForDispatch(b),
      productionQtyDisplay:
        b?.billType === '返工排产'
          ? formatReworkFieldQtyDisplay(b.reworkFieldQty)
          : String(getBillProductionQtyForDispatch(b)),
      dispatchQuantity: q,
      processRowids: (t.processes || []).map((p) => p.process?.rowid).filter(Boolean)
    }
  })
}

// ---------- 图片预览相关 ----------
const showImagePreview = ref(false)
const previewImageUrls = ref([])   // 多图预览的 URL 列表
const previewImageIndex = ref(0)  // 当前显示的图片下标

// ---------- 工序模态相关 ----------
const showProcessModal = ref(false)
/** 单次点击被触发两遍时（常见于 uni-app button），防止重复打开工序派工弹窗 */
const openingProcessModalGuard = ref(false)
const selectedProcessData = ref(null)
const selectedProcess = ref(null) // 当前选中的工序 { item, process }
/** 产品派工：当前跨单据同步的工序键（仅工序名称），与 selectedProcess 同时维护 */
const productDispatchProcessSyncKey = ref(null)
const processDispatchData = ref({
  employee: '',
  quantity: 0,
  time: 0,
  machine: '',
  mold: '',
  date: '',
  salaryMethod: '计件',  // 计薪方式：计件、计时，默认值为计件
  price: 0,  // 工价
  isLast: '否'  // 最终工序：是、否，默认值为否
})

// 计薪方式选项
const salaryMethodOptions = ref(['计件', '计时'])
const salaryMethodIndex = ref(0)  // 默认选中第一个选项（计件）

// 最终工序选项
const isLastOptions = ref(['是', '否'])
const isLastIndex = ref(1)  // 默认选中第二个选项（否）

// ---------- 终止派工模态相关 ----------
const showTerminateModal = ref(false)
const terminateReason = ref('')

// ---------- 删除工序确认模态 ----------
const showDeleteConfirmModal = ref(false)

// ---------- 返工完成模态 ----------
const showReworkCompleteModal = ref(false)
const reworkCompleteItem = ref(null)
const reworkTransferToNext = ref(true)
const reworkCompleteWorkshopIndex = ref(0)

/** 返工进度 69ccb3e7665ab27f39105da2 为「未完成」时显示返工完成按钮（正常/返工排产均适用） */
const isReworkProgressPendingForCompleteBtn = (item) => {
  const raw = item?.reworkProgress
  const p = raw == null ? '' : String(raw).trim()
  return p === '未完成'
}

/** 69ccaf64665ab27f39105bed 是否合并：为 0 且排产类型为返工排产时显示「合并工序」 */
const isReworkMergeProcessBtn = (item) => {
  if (item?.billType !== '返工排产') return false
  const v = item?.reworkMergeFlag
  if (v === null || v === undefined || v === '') return false
  if (v === 0 || v === '0') return true
  const n = Number(v)
  return Number.isFinite(n) && n === 0
}

// ---------- 合并工序模态（按车间拉工序字典，同添加工序页 getProcessList） ----------
const showReworkStartModal = ref(false)
const reworkStartItem = ref(null)
const mergeProcessTableData = ref([])
const mergeProcessLoading = ref(false)
const mergeProcessPage = ref(1)
const mergeProcessPageSize = ref(10)
const mergeProcessHasMore = ref(true)
const mergeProcessSearchValue = ref('')
const selectedMergeRowids = ref([])

const fetchMergeProcessList = async (pageNum, isRefresh = false) => {
  if (mergeProcessLoading.value) return
  const ws = workshop.value || ''
  if (!ws) {
    uni.showToast({ title: '未选择车间', icon: 'none' })
    return
  }
  mergeProcessLoading.value = true
  const baseFilters = [
    { controlId: '6614d7ed1f7f1264f3a332c3', dataType: 30, spliceType: 1, filterType: 2, values: ['工序'] },
    { controlId: '66b07c4a965ba588586ec783', dataType: 30, spliceType: 1, filterType: 2, values: ['三级'] },
    { controlId: '691e8522d50c894e2e798d03', dataType: 30, spliceType: 1, filterType: 2, values: [ws] }
  ]
  let filters = [...baseFilters]
  if (mergeProcessSearchValue.value.trim()) {
    filters.push({
      controlId: '6614b6721103c1d5d3a08122',
      dataType: 30,
      spliceType: 1,
      filterType: 1,
      values: [mergeProcessSearchValue.value.trim()]
    })
  }
  const params = {
    worksheetId: 'shujuzidian',
    filters,
    silent: true
  }
  try {
    const res = await callWorkflowListAPIPaged(params, mergeProcessPageSize.value, pageNum)
    const mapped = (res.data || []).map((item) => ({
      processName: item['Name'],
      rowid: item['rowid'] || ''
    }))
    if (isRefresh) {
      mergeProcessTableData.value = mapped
    } else {
      mergeProcessTableData.value = [...mergeProcessTableData.value, ...mapped]
    }
    mergeProcessPage.value = pageNum
    mergeProcessHasMore.value =
      mapped.length === mergeProcessPageSize.value && res.total > mergeProcessTableData.value.length
  } catch (e) {
    console.error('合并工序-加载工序列表失败:', e)
    if (isRefresh) mergeProcessTableData.value = []
    mergeProcessHasMore.value = false
    uni.showToast({ title: '加载工序失败', icon: 'none' })
  } finally {
    mergeProcessLoading.value = false
  }
}

const loadMoreMergeProcess = () => {
  if (!mergeProcessHasMore.value || mergeProcessLoading.value) return
  fetchMergeProcessList(mergeProcessPage.value + 1, false)
}

const onMergeProcessSearchInput = () => {
  mergeProcessPage.value = 1
  mergeProcessHasMore.value = true
  fetchMergeProcessList(1, true)
}

const toggleMergeProcessSelect = (p) => {
  const id = p.rowid
  if (!id) return
  const arr = [...selectedMergeRowids.value]
  const i = arr.indexOf(id)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(id)
  selectedMergeRowids.value = arr
}

const isMergeProcessSelected = (rowid) => !!rowid && selectedMergeRowids.value.includes(rowid)

const openReworkStartModal = (item) => {
  reworkStartItem.value = item
  mergeProcessSearchValue.value = ''
  selectedMergeRowids.value = []
  mergeProcessPage.value = 1
  mergeProcessHasMore.value = true
  mergeProcessTableData.value = []
  showReworkStartModal.value = true
  fetchMergeProcessList(1, true)
}

const closeReworkStartModal = () => {
  showReworkStartModal.value = false
  reworkStartItem.value = null
  mergeProcessTableData.value = []
  mergeProcessSearchValue.value = ''
  selectedMergeRowids.value = []
  mergeProcessPage.value = 1
  mergeProcessHasMore.value = true
}

/** 返工完成 / 合并工序 成功后：带当前筛选条件整页重进派工页 */
const reloadDispatchWorkPage = () => {
  const parts = []
  if (billTypeFilter.value) {
    parts.push(`billType=${encodeURIComponent(billTypeFilter.value)}`)
  }
  if (selectedOrderCode.value) {
    parts.push(`orderCode=${encodeURIComponent(selectedOrderCode.value)}`)
  }
  if (selectedProductionCode.value) {
    parts.push(`productionCode=${encodeURIComponent(selectedProductionCode.value)}`)
  }
  if (searchForm.value.orderItem) {
    parts.push(`orderItem=${encodeURIComponent(searchForm.value.orderItem)}`)
  }
  const qs = parts.length ? `?${parts.join('&')}` : ''
  setTimeout(() => {
    uni.reLaunch({ url: `/pages/dispatchWork/dispatchWork${qs}` })
  }, 400)
}

const confirmReworkStart = async () => {
  const item = reworkStartItem.value
  if (!item) return
  if (selectedMergeRowids.value.length === 0) {
    uni.showToast({ title: '请选择要合并的工序', icon: 'none' })
    return
  }
  const mergeProcessNames = mergeProcessTableData.value
    .filter((p) => selectedMergeRowids.value.includes(p.rowid))
    .map((p) => p.processName)
  const payload = {
    billRowid: item.billRowid || '',
    orderCode: item.orderCode || '',
    productionCode: item.productionCode || '',
    workshop: workshop.value || '',
    billType: item.billType || '',
    loginCode: userStore.loginCode || '',
    mergeProcessRowids: [...selectedMergeRowids.value],
    mergeProcessNames
  }

  try {
    const resp = await http.post(REWORK_START_HOOK, payload)
    if (resp.status === 1) {
      uni.showToast({ title: resp.message || resp.msg || '提交失败', icon: 'none' })
      return
    }
    uni.showToast({ title: '提交成功' })
    closeReworkStartModal()
    await search()
    reloadDispatchWorkPage()
  } catch (error) {
    console.error('合并工序提交失败:', error)
    uni.showToast({ title: '提交失败：' + (error.message || '未知错误'), icon: 'none' })
  }
}

const openReworkCompleteModal = (item) => {
  reworkCompleteItem.value = item
  reworkTransferToNext.value = true
  reworkCompleteWorkshopIndex.value = 0
  showReworkCompleteModal.value = true
}

const closeReworkCompleteModal = () => {
  showReworkCompleteModal.value = false
  reworkCompleteItem.value = null
}

const onReworkTransferRadioChange = (e) => {
  reworkTransferToNext.value = e.detail.value === 'yes'
}

const onReworkCompleteWorkshopChange = (e) => {
  const idx = Number(e.detail.value)
  reworkCompleteWorkshopIndex.value = Number.isFinite(idx) ? idx : 0
}

const confirmReworkComplete = async () => {
  const item = reworkCompleteItem.value
  if (!item) return
  if (reworkTransferToNext.value) {
    const name = workshopOptions.value[reworkCompleteWorkshopIndex.value]
    if (!name) {
      uni.showToast({ title: '请选择返工车间', icon: 'none' })
      return
    }
  }

  const targetWorkshop = reworkTransferToNext.value
    ? (workshopOptions.value[reworkCompleteWorkshopIndex.value] || '')
    : ''

  const payload = {
    billRowid: item.billRowid || '',
    orderCode: item.orderCode || '',
    productionCode: item.productionCode || '',
    workshop: workshop.value || '',
    billType: item.billType || '',
    transferToNextWorkshop: reworkTransferToNext.value,
    targetWorkshop,
    loginCode: userStore.loginCode || ''
  }

  try {
    const resp = await http.post(REWORK_COMPLETE_HOOK, payload)
    if (resp.status === 1) {
      uni.showToast({ title: resp.message || resp.msg || '提交失败', icon: 'none' })
      return
    }
    uni.showToast({ title: '提交成功' })
    closeReworkCompleteModal()
    await search()
    reloadDispatchWorkPage()
  } catch (error) {
    console.error('返工完成提交失败:', error)
    uni.showToast({ title: '提交失败：' + (error.message || '未知错误'), icon: 'none' })
  }
}

// ---------- 派工确认模态相关 ----------
const showDispatchConfirmModal = ref(false)
const dispatchConfirmRows = ref([])
const dispatchConfirmAction = ref(null)
/** 防止确认二次弹窗里「确认派工」连触导致 hook 执行两遍 */
const processDispatchConfirmSubmitting = ref(false)

// ---------- 员工相关 ----------
const employeeList = ref([])
const selectedEmployee = ref([])
const showAddEmployeeModal = ref(false)
const selectedEmployeesForAdd = ref([])
const allEmployeesOptions = ref([])
const allEmployeesMap = ref({})

// ---------- 多对多派工相关 ----------
const showMultiDispatchModal = ref(false)
const selectedMultiProcesses = ref([]) // 多选的工序列表 [{ item, process }]
const multiDispatchData = ref({
  quantity: 0, // 订单派工多对多：单一派工数量；产品派工用 multiDispatchQtyByBillKey
  date: '', // 派工日期
  isLast: '否', // 是否包含最终工序：是、否，默认值为否
  salaryMethod: '计件' // 计薪方式：计件、计时，默认计件
})
/** 多对多：每张单据一行派工数量，key 与 billKeyForMultiDispatch 一致 */
const multiDispatchQtyByBillKey = ref({})
const multiIsLastIndex = ref(1) // 多对多派工最终工序索引，默认选中第二个选项（否）
const multiSalaryMethodIndex = ref(0) // 多对多派工计薪方式索引，默认选中计件
const multiEmployeeList = ref([])
const selectedMultiEmployees = ref([])
const currentMultiDispatchItem = ref(null) // 当前多对多派工的单据
/** 多对多：与当前锚点工序组合一致的全部单据 [{ item, processes }] */
const multiDispatchTargets = ref([])

// ---------- 一对多派工相关（多工序，每工序独立派工数量，同一批员工） ----------
const showOneToManyModal = ref(false)
const oneToManyProcessRows = ref([]) // { processName, productionCountDisplay, needCountDisplay, maxQuantity, quantity, processRowid }
const oneToManyDispatchDate = ref('')
const oneToManyEmployeeList = ref([])
/** 一对多派工仅允许一名员工，存员工 id（字符串，与 radio value 一致） */
const selectedOneToManyEmployeeId = ref('')
const currentOneToManyItem = ref(null)

// 一对多派工打开「添加员工」时限制为单选
const addEmployeeMaxSelection = computed(() => (showOneToManyModal.value ? 1 : 0))

// 一对多派工 webhook：processDispatchList[{ rowid1, dispatchCount1 }, { rowid2, dispatchCount2 }…] + date + 员工信息
const ONE_TO_MANY_DISPATCH_HOOK = 'https://www.dachen.vip/api/workflow/hooks/NjljMGRhMjAwZjBkMGFkODBmYTQyZGNj'
/** 订单派工 / 产品派工同一 webhook；产品派工一次请求，明细在 dispatchList [{ processRowid, dispatchQuantity, worktime }] */
const PROCESS_DISPATCH_HOOK = 'https://www.dachen.vip/api/workflow/hooks/NjkyMTJlNzdhOWE4ZGM2YmMxZjczYzlk'

/** 相同 body 并发时合并为一次 uni.request（防止极端双击） */
const processDispatchPostInflight = new Map()
const postProcessDispatchHook = (dispatchData) => {
  let key
  try {
    key = JSON.stringify(dispatchData)
  } catch {
    key = `${Date.now()}-${Math.random()}`
  }
  const existing = processDispatchPostInflight.get(key)
  if (existing) return existing

  const promise = http.post(PROCESS_DISPATCH_HOOK, dispatchData).finally(() => {
    processDispatchPostInflight.delete(key)
  })
  processDispatchPostInflight.set(key, promise)
  return promise
}

// 返工完成
const REWORK_COMPLETE_HOOK = 'https://www.dachen.vip/api/workflow/hooks/NjljY2I3ZTEzMzBiMjAyNjg5ODQ1YTYx'
// 合并工序（原返工开始 webhook）
const REWORK_START_HOOK = 'https://www.dachen.vip/api/workflow/hooks/NjljY2MzYjEzMzBiMjAyNjg5ODY0NDg4'
// 首检提醒
const FIRST_CHECK_REMIND_HOOK = 'https://www.dachen.vip/api/workflow/hooks/NjllMDdhZWIzMzBiMjAyNjg5NDVmOTE5'

// ==================== 计算属性 ====================
// 最大派工数量：需派工数量
const maxQuantity = computed(() => {
  return selectedProcessData.value?.process?.needCount || 0
})

// 判断当前工序是否已终止
const isProcessOver = computed(() => {
  return selectedProcessData.value?.process?.isOver === 1
})

/** 列表/工作流字段常为字符串，转成有限数字（避免 canDispatch、max 等严格类型判断失效） */
const toFiniteNum = (v, fallback = 0) => {
  if (v === null || v === undefined || v === '') return fallback
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : fallback
}

/** 产品派工：工序弹窗顶部列表行（含 billKey、工序 rowid 等，供逐单派工） */
const getProductDispatchModalRows = () => {
  if (dispatchMode.value !== 'product' || !selectedProcessData.value?.process || !billsList.value.length) {
    return []
  }
  const selProc = selectedProcessData.value.process
  const pname = selProc.processName

  return billsList.value.map((bill) => {
    const list = bill?.processes || []
    const p = pname != null ? list.find(pr => pr.processName === pname) : null
    const billKey = `${bill?.orderCode || ''}__${bill?.productionCode || ''}`
    return {
      billKey,
      orderCode: bill?.orderCode || '-',
      productionCode: bill?.productionCode || '',
      productCode: bill?.productCode || '',
      processRowid: p?.rowid || '',
      needCount: p ? toFiniteNum(p.needCount, 0) : '-',
      dispatchedCount: p ? toFiniteNum(p.dispatchedCount, 0) : '-',
      hourlyoutput: p ? toFiniteNum(p.hourlyoutput, 0) : 0,
      dailyoutput: p ? toFiniteNum(p.dailyoutput, 0) : '-',
      finishCount: p ? toFiniteNum(p.finishCount, 0) : 0,
      mold: p?.mold || '',
      price: toFiniteNum(p?.price, 0)
    }
  }).filter(row => row.needCount !== '-' || row.dispatchedCount !== '-')
}

const productDispatchModalProcessRows = computed(() => getProductDispatchModalRows())

/** 产品派工模态框：列表中各单「派工数量」合计 */
const productDispatchModalTotalQty = computed(() => {
  let s = 0
  for (const r of productDispatchModalProcessRows.value) {
    s += Number(productDispatchQtyByBillKey[r.billKey]) || 0
  }
  return s
})

/** 产品派工模态框：按每单 派工数量 * 工价 汇总总工资 */
const productDispatchModalTotalWage = computed(() => {
  let s = 0
  for (const r of productDispatchModalProcessRows.value) {
    const qty = Number(productDispatchQtyByBillKey[r.billKey]) || 0
    const price = Number(r.price) || 0
    s += qty * price
  }
  return Number(s.toFixed(2))
})

/** 产品派工模态框：各单派工数量/小时产量 之和（与订单派工单行公式一致） */
const productDispatchModalTotalWorkTime = computed(() => {
  let t = 0
  for (const r of productDispatchModalProcessRows.value) {
    const q = Number(productDispatchQtyByBillKey[r.billKey]) || 0
    const h = toFiniteNum(r.hourlyoutput, 0)
    if (h > 0 && q > 0) t += q / h
  }
  return parseFloat(t.toFixed(2))
})

/** 产品派工列表行：该单派工工时 = 派工数量 / 小时产量 */
const getProductModalRowWorkTime = (r) => {
  const q = Number(productDispatchQtyByBillKey[r.billKey]) || 0
  const h = toFiniteNum(r.hourlyoutput, 0)
  if (h <= 0 || q <= 0) return 0
  return parseFloat((q / h).toFixed(2))
}

/** 产品派工模态框：每单派工数量（key = 订单__生产单） */
const productDispatchQtyByBillKey = reactive({})

/** 产品派工列表某行：派工数量已填且为大于 0 的数字 */
const isValidPositiveProductDispatchQty = (billKey) => {
  const raw = productDispatchQtyByBillKey[billKey]
  if (raw === undefined || raw === null) return false
  if (String(raw).trim() === '') return false
  const n = Number(raw)
  return Number.isFinite(n) && n > 0
}

// 判断是否可以派工（订单派工：需派工>0；产品派工：列表每一行派工数量都必须 >0）
const canDispatch = computed(() => {
  if (dispatchMode.value === 'product') {
    const rows = productDispatchModalProcessRows.value
    if (!rows.length) return false
    return rows.every((r) => isValidPositiveProductDispatchQty(r.billKey))
  }
  const needCount = selectedProcessData.value?.process?.needCount || 0
  return needCount > 0
})

// 获取指定订单的选中工序数量
const getSelectedProcessCount = (item) => {
  if (
    dispatchMode.value === 'product' &&
    productDispatchProcessSyncKey.value &&
    !isMultiSelectProcessWorkshop.value
  ) {
    const name = productDispatchProcessSyncKey.value.processName || ''
    if (!name) return 0
    return (item.processes || []).filter((p) => p.processName === name).length
  }
  if (isMultiSelectProcessWorkshop.value) {
    // 组装/抛光/喷涂：统计当前单据上的多选工序数量
    return selectedMultiProcesses.value.filter(p => isSameBillAs(p.item, item)).length
  } else {
    // 其他车间（包括喷涂）：检查是否有单选工序
    return selectedProcess.value && selectedProcess.value.item.orderCode === item.orderCode ? 1 : 0
  }
}

// 判断是否可以点击操作按钮（单个派工）
const canClickDispatch = (item) => {
  const count = getSelectedProcessCount(item)
  return count === 1
}

// 判断是否可以点击多对多派工按钮
const canClickMultiDispatch = (item) => {
  if (workshop.value !== '组装车间' && workshop.value !== '喷涂车间') {
    return false
  }
  const count = getSelectedProcessCount(item)
  return count >= 2
}

// 判断是否可以点击一对多派工（仅抛光车间；至少两个工序）
const canClickOneToManyDispatch = (item) => {
  if (workshop.value !== '抛光车间') {
    return false
  }
  const count = getSelectedProcessCount(item)
  return count >= 2
}

// 是否首检为 0 时，才允许显示首检提醒按钮
const isFirstCheckPending = (item) => {
  const raw = item?.isFirstCheck
  if (raw === 0 || raw === '0') return true
  const n = Number(raw)
  return Number.isFinite(n) && n === 0
}

// 打开终止派工模态框
const overProcess = () => {
  if (selectedProcessData.value?.process?.isOver === 1) {
    uni.showToast({ title: '该工序已终止', icon: 'none' })
    return
  }
  
  // 重置终止原因
  terminateReason.value = ''
  // 打开终止模态框
  showTerminateModal.value = true
}

// 关闭终止派工模态框
const closeTerminateModal = () => {
  showTerminateModal.value = false
  terminateReason.value = ''
}

// 确认终止工序
const confirmTerminate = async () => {
  // 验证终止原因
  if (!terminateReason.value || !terminateReason.value.trim()) {
    uni.showToast({ title: '请输入终止原因', icon: 'none' })
    return
  }
  
  try {
    const result = await http.post('https://www.dachen.vip/api/workflow/hooks/Njk0NGRjYTI0NDUzNWFkMTg3ZWFiZmFj', {
      rowid: selectedProcessData.value?.process?.rowid || '',
      terminateReason: terminateReason.value.trim(),
      loginCode: userStore.loginCode || ''
    })
    
    if (result.status === 1) {
      uni.showToast({ title: '终止失败', icon: 'none' })
      return
    }
    
    uni.showToast({ title: '终止成功' })
    showTerminateModal.value = false
    showProcessModal.value = false
    terminateReason.value = ''
    // 刷新数据
    search()
  } catch (error) {
    console.error('终止工序失败:', error)
    uni.showToast({ title: '终止失败：' + (error.message || '未知错误'), icon: 'none' })
  }
}

// ==================== 方法定义 ====================

// ---------- 车间相关方法 ----------
const handleWorkshopConfirm = (value) => {
  workshop.value = value
  showWorkshopModal.value = false
  // 进入多选工序车间时清空产品派工「同名同步」状态，避免干扰多对多/一对多多选
  if (value === '组装车间' || value === '抛光车间' || value === '喷涂车间') {
    if (dispatchMode.value === 'product') {
      productDispatchProcessSyncKey.value = null
    }
  }
  // 切换车间时，组装/抛光/喷涂使用多选；离开这些车间时清空多选状态
  if (value !== '组装车间' && value !== '抛光车间' && value !== '喷涂车间') {
    selectedMultiProcesses.value = []
    if (dispatchMode.value === 'product') {
      productDispatchProcessSyncKey.value = null
    }
  }
  search()
}

const closeWorkshopOptions = () => {
  // 空函数，防止warn
}

// ---------- 机台相关方法 ----------
const getMachineList = async () => {
  try {
    const res = await callWorkflowListAPIPaged({
      worksheetId: 'shebeidangan',
      filters: [
        {
          "controlId": "67ac0a87d6566fd9d09a2340",
          "dataType": 30,
          "spliceType": 1,
          "filterType": 2,
          "values": [workshop.value]
        }
      ]
    })
    if (!res.data || res.data.length === 0) {
      uni.showToast({ title: '无机台数据', icon: 'none' })
      return
    }
    machineOptions.value = res.data.map(item => ({
      workshop: item['67ac0a87d6566fd9d09a2340'] || '',
      code: item['63db6b67e134b5cd4f9f96bb'] || '',
      name: item['63db6b67e134b5cd4f9f96bc'] || '',
      value: item['63db6b67e134b5cd4f9f96bb'] || ''
    })).filter(item => item.value)
    showMachineModal.value = true
  } catch (error) {
    console.error('获取机台列表失败:', error)
    uni.showToast({ title: '获取机台列表失败', icon: 'none' })
  }
}

const handleMachineConfirm = (value) => {
  machine.value = value
  showMachineModal.value = false
}

// ---------- 搜索和列表相关方法 ----------
// 根据单据的billType获取对应的工序类型参数
const getProcessTypeParam = (billType) => {
  return billType === '返工排产' ? '返工派工' : '正常派工'
}

// 根据当前车间和单据类型获取工序列表（统一获取后在前端按订单匹配）
const getProcessRaw = async (billTypeValue = '') => {
  const processTypeParam = getProcessTypeParam(billTypeValue || '正常排产')

  const filters = [{
    controlId: '669a6cae2503723eec1b49bb',
    dataType: 30,
    spliceType: 1,
    filterType: 2,
    values: [workshop.value]
  }, {
    controlId: '6954ad997a59e0522d85df35',
    dataType: 30,
    spliceType: 1,
    filterType: 2,
    values: [processTypeParam]
  }]

  // 订单派工时：接口层按订单号 + 生产单号过滤；产品派工改为前端按 selectedProducts 过滤
  if (dispatchMode.value !== 'product' && selectedOrderCode.value) {
    filters.push({
      controlId: '6593b07ae97eb866a50eeba1', // 工序中的订单号字段 processOrder
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [selectedOrderCode.value]
    })
  }

  if (dispatchMode.value !== 'product' && selectedProductionCode.value) {
    filters.push({
      controlId: '691d6160535b29cbd5c6c0a9', // 工序中的生产单号 / 产品编号字段 productcode
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [selectedProductionCode.value]
    })
  }

  const res = await callWorkflowListAPIPaged({
    worksheetId: 'paigongdan',
    filters
  })

  return res
}

/** 按指定订单号 + 生产单号拉取工序（产品派工多单据时逐单请求，避免全表只取第一页导致其它单据无工序） */
const getProcessRawForOrderProduct = async (billTypeValue, orderCode, productionCode) => {
  const processTypeParam = getProcessTypeParam(billTypeValue || '正常排产')
  const filters = [{
    controlId: '669a6cae2503723eec1b49bb',
    dataType: 30,
    spliceType: 1,
    filterType: 2,
    values: [workshop.value]
  }, {
    controlId: '6954ad997a59e0522d85df35',
    dataType: 30,
    spliceType: 1,
    filterType: 2,
    values: [processTypeParam]
  }]
  if (orderCode) {
    filters.push({
      controlId: '6593b07ae97eb866a50eeba1',
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [orderCode]
    })
  }
  if (productionCode) {
    filters.push({
      controlId: '691d6160535b29cbd5c6c0a9',
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [productionCode]
    })
  }
  return callWorkflowListAPIPaged({
    worksheetId: 'paigongdan',
    filters,
    silent: true
  })
}

/** 产品派工：为 baseBills 中每条单据拉工序并合并（按 rowid 去重） */
const loadProcessesForProductBills = async (baseBills, billTypeValue) => {
  const pairMap = new Map()
  for (const b of baseBills) {
    const k = `${b.orderCode || ''}__${b.productionCode || ''}`
    if (!pairMap.has(k)) {
      pairMap.set(k, { orderCode: b.orderCode, productionCode: b.productionCode })
    }
  }
  const merged = []
  const rowidSeen = new Set()
  for (const { orderCode, productionCode } of pairMap.values()) {
    const res = await getProcessRawForOrderProduct(billTypeValue, orderCode, productionCode)
    const rows = res.data || []
    for (const row of rows) {
      const rid = row.rowid
      if (rid != null && rowidSeen.has(rid)) continue
      if (rid != null) rowidSeen.add(rid)
      merged.push(row)
    }
  }
  return merged
}

// 根据当前车间和单据类型获取单据列表
const getBillsListRaw = async () => {
  const filters = [{
    controlId: '67de26c9c5377d50a523c735',
    dataType: 30,
    spliceType: 1,
    filterType: 2,
    values: [workshop.value]
  }, {
    controlId: '694a3954687045435008a7c3',
    dataType: 30,
    spliceType: 1,
    filterType: 2,
    values: [billTypeFilter.value]
  }, {
    controlId: '66974cda2503723eec1af600',
    dataType: 30,
    spliceType: 1,
    filterType: 8
  }]

  // 订单派工时：接口层按订单号 + 生产单号过滤；产品派工改为前端按 selectedProducts 过滤
  if (dispatchMode.value !== 'product' && selectedOrderCode.value) {
    filters.push({
      controlId: '655e1cbbbd2094b316347f92', // 单据中的订单号字段
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [selectedOrderCode.value]
    })
  }

  if (dispatchMode.value !== 'product' && selectedProductionCode.value) {
    filters.push({
      controlId: '698438933b5e707f84cf51fd', // 单据中的生产单号字段
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [selectedProductionCode.value]
    })
  }

  const res = await callWorkflowListAPIPaged({
    worksheetId: 'paichanjihua',
    filters
  })
  return res
}

// 排产编号非空时参与工序-单据匹配；任一侧为空则仍仅按订单号+生产单号匹配
const isScheduleCodeNonEmpty = (v) => {
  if (v === null || v === undefined) return false
  const s = typeof v === 'string' ? v.trim() : String(v).trim()
  return s.length > 0 && s !== '[]'
}

const scheduleCodesMatchWhenBothSet = (billSchedule, processSchedule) => {
  const b = isScheduleCodeNonEmpty(billSchedule)
  const p = isScheduleCodeNonEmpty(processSchedule)
  if (b && p) {
    return String(billSchedule).trim() === String(processSchedule).trim()
  }
  return true
}

const search = async () => {
  // 清除选中状态
  selectedProcess.value = null
  productDispatchProcessSyncKey.value = null
  // 每次刷新都清空多选工序，避免删除/刷新后残留旧 rowid 影响按钮可用性
  selectedMultiProcesses.value = []

  // 获取单据列表（按车间和单据类型从后端筛选）
  const billsRes = await getBillsListRaw()

  if (!billsRes.data || billsRes.data.length === 0) {
    billsList.value = []
    processList.value = []
    return
  }

  // 固定过滤：
  // 1. 正常排产：69a8e4563b5e707f84d33c0c（未完成工序数量）需大于 0
  // 2. 返工排产：不用数量>0；按 69ccb3e7665ab27f39105da2 返工进度排除「已完成」
  const FIELD_REWORK_PROGRESS = '69ccb3e7665ab27f39105da2'
  const FIELD_INCOMPLETE_PROCESS_QTY = '69a8e4563b5e707f84d33c0c'
  const isReworkProgressCompleted = (row) => {
    const raw = row[FIELD_REWORK_PROGRESS]
    const p = raw == null ? '' : String(raw).trim()
    return p === '已完成'
  }
  const filteredBillsData = billsRes.data.filter(item => {
    if (billTypeFilter.value === '返工排产') {
      return !isReworkProgressCompleted(item)
    }
    const num = Number(item[FIELD_INCOMPLETE_PROCESS_QTY])
    return !Number.isNaN(num) && num > 0
  })

  if (!filteredBillsData.length) {
    billsList.value = []
    processList.value = []
    return
  }

  // 先做基础映射（不带工序）
  let baseBills = filteredBillsData.map(item => {
    const orderGoods = item['691c47ee1c02c451c72a81c5']
    const orderCode = item['655e1cbbbd2094b316347f92']
    const productionCode = item['698438933b5e707f84cf51fd']
    const scheduleCode = item['69cb5ea03b5e707f84ddefa0'] // 排产编号
    const billType = item['694a3954687045435008a7c3'] || '正常排产'

    let imageData = item['6683a0448d2110bec155ac64']
    if (typeof imageData === 'string' && imageData.trim()) {
      try {
        imageData = JSON.parse(imageData)
      } catch (e) {
        // ignore
      }
    }

    const sop = item['697b206a3b5e707f84cd9c48']

    const reworkNum = Number(item['6971989c3b5e707f84cb78e1'])
    const scrapNum = Number(item['6971989c3b5e707f84cb78e2'])

    return {
      orderGoods,
      orderCount: item['69e33354665ab27f3916f758'],
      productionCount: item['67de8eb5c5377d50a523ef9b'],
      reworkFieldQty: item['653f1c62df3ac906c8a8f4f6'],
      name: item['6937d255ff2b019b3cb34be3'],
      models: item['6937d255ff2b019b3cb34be4'],
      reworkQty: Number.isFinite(reworkNum) ? reworkNum : 0,
      scrapQty: Number.isFinite(scrapNum) ? scrapNum : 0,
      productionCode,
      image: imageData,
      sop,
      productCode: item['691d6336535b29cbd5c6c0ca'],
      orderCode,
      scheduleCode,
      problemDescription: item['694ba108dc025d98887fd782'] || '',
      billRowid: item['rowid'],
      billType,
      reworkProgress: item['69ccb3e7665ab27f39105da2'],
      reworkMergeFlag: item['69ccaf64665ab27f39105bed'],
      isFirstCheck: item['69e080b4665ab27f3915d89d']
    }
  })

  // 产品派工：仅保留选择产品页勾选带入的单据（订单号 + 生产单号）
  if (dispatchMode.value === 'product' && selectedProductHeaders.value.length > 0) {
    const selectedKeys = new Set(
      selectedProductHeaders.value.map(h => `${h.orderCode || ''}__${h.productionCode || ''}`)
    )
    baseBills = baseBills.filter(b => selectedKeys.has(`${b.orderCode || ''}__${b.productionCode || ''}`))
  }

  if (!baseBills.length) {
    billsList.value = []
    processList.value = []
    return
  }

  // 获取当前单据类型对应的工序列表
  // 订单派工：车间 + 工序类型 + 当前选中订单/生产单（接口过滤）
  // 产品派工：按每条单据的订单号+生产单分别请求后合并，避免分页只返回一页导致其它单据无工序
  let processRowsRaw = []
  if (dispatchMode.value === 'product' && baseBills.length > 0) {
    processRowsRaw = await loadProcessesForProductBills(baseBills, billTypeFilter.value)
  } else {
    const processRes = await getProcessRaw(billTypeFilter.value)
    processRowsRaw = processRes.data || []
  }

  if (!processRowsRaw.length) {
    processList.value = []
  } else {
    const allProcesses = processRowsRaw.map(item => ({
      processName: item['656ffd1bba5ef3863bf3ec1e'],
      needCount: item['690dc19f8d797ee211e7fc60'], // 需派工数量
      finishCount: item['697c8b023b5e707f84ce02cc'], // 完成总数量
      allcount: item['68099ac75d6fc47331574e82'], // 需完成数量
      dispatchedCount: item['69840b633b5e707f84cf341e'], // 已派工数量
      processOrder: item['6593b07ae97eb866a50eeba1'],
      productcode: item['691d6160535b29cbd5c6c0a9'],
      scheduleCode: item['69cb73ee3b5e707f84de06f6'], // 排产编号
      worktime: item['69211dac21066a9f124f62df'],
      sequence: item['693a62040f64427fac25ae80'],
      hourlyoutput: item['693a879a0f64427fac25da92'],
      dailyoutput: item['69a96d623b5e707f84d380b6'], // 日产量
      rowid: item['rowid'],
      isOver: item['6940f719c81c746aae8ede5d'],
      price: item['657b282cd13eaaec2c6606b5'],
      sonoutput: item['66974d062503723eec1af614'],
      mold: item['695222a27a59e0522d853edf'],
      // 新增记录次数字段 recordCount
      recordCount: item['697c8b023b5e707f84ce02cc'] || 0
    }))

    processList.value = allProcesses.map(p => ({ ...p }))
  }

  const allProcesses = processList.value || []

  const newBillsList = baseBills.map(bill => {
    const processes = allProcesses
      .filter(p =>
        p.processOrder === bill.orderCode &&
        p.productcode === bill.productionCode &&
        p.sonoutput !== '[]' &&
        scheduleCodesMatchWhenBothSet(bill.scheduleCode, p.scheduleCode)
      )
      .sort((a, b) => {
        const seqA = a.sequence || 0
        const seqB = b.sequence || 0
        return seqA - seqB
      })

    const completedProcessText =
      processes.length > 0
        ? `${processes.filter(p => p.finishCount === p.needCount).length}/${processes.length}`
        : '0'

    return {
      ...bill,
      processes: processes.map(p => ({ ...p })),
      completedProcess: completedProcessText
    }
  })

  billsList.value = []
  await nextTick()
  billsList.value = newBillsList
  listKey.value = Date.now()
  await nextTick()
}

// ---------- 图片 / SOP 相关方法 ----------
// 技术图纸（原查看图片）
const lookImage = (item) => {
  let imageData = item?.image
  
  if (!imageData) {
    uni.showToast({ title: '暂无技术图纸', icon: 'none' })
    return
  }
  
  if (typeof imageData === 'string') {
    try {
      imageData = JSON.parse(imageData)
    } catch (e) {
      uni.showToast({ title: '技术图纸数据格式错误', icon: 'none' })
      return
    }
  }
  
  const imageArray = Array.isArray(imageData) ? imageData : (imageData ? [imageData] : [])
  
  if (!imageArray || imageArray.length === 0) {
    uni.showToast({ title: '暂无技术图纸', icon: 'none' })
    return
  }
  
  const urls = imageArray
    .map(img => img?.DownloadUrl)
    .filter(Boolean)
  
  if (urls.length === 0) {
    uni.showToast({ title: '技术图纸地址不存在', icon: 'none' })
    return
  }
  
  previewImageUrls.value = urls
  previewImageIndex.value = 0
  showImagePreview.value = true
}

// 包装图纸（当前无单独字段，优先使用 packImage，退化为 image）
const lookPackImage = (item) => {
  let imageData = item?.packImage || item?.image
  
  if (!imageData) {
    uni.showToast({ title: '暂无包装图纸', icon: 'none' })
    return
  }
  
  if (typeof imageData === 'string') {
    try {
      imageData = JSON.parse(imageData)
    } catch (e) {
      uni.showToast({ title: '包装图纸数据格式错误', icon: 'none' })
      return
    }
  }
  
  const imageArray = Array.isArray(imageData) ? imageData : (imageData ? [imageData] : [])
  
  if (!imageArray || imageArray.length === 0) {
    uni.showToast({ title: '暂无包装图纸', icon: 'none' })
    return
  }
  
  const urls = imageArray
    .map(img => img?.DownloadUrl)
    .filter(Boolean)
  
  if (urls.length === 0) {
    uni.showToast({ title: '包装图纸地址不存在', icon: 'none' })
    return
  }
  
  previewImageUrls.value = urls
  previewImageIndex.value = 0
  showImagePreview.value = true
}

const lookSop = (item) => {
  let sop = item?.sop

  if (!sop) {
    uni.showToast({ title: '暂无SOP文件', icon: 'none' })
    return
  }

  // sop 可能是字符串或对象数组，这里统一转为数组处理
  if (typeof sop === 'string') {
    try {
      sop = JSON.parse(sop)
    } catch (e) {
      // 解析失败则当作单个对象或无效数据处理
    }
  }

  const sopArray = Array.isArray(sop) ? sop : (sop ? [sop] : [])
  if (!sopArray.length) {
    uni.showToast({ title: '暂无SOP文件', icon: 'none' })
    return
  }

  const first = sopArray[0] || {}
  // 优先使用 DownloadUrl，其次 original_file_full_path，最后 file_path + file_name 兜底
  let url = first.DownloadUrl || first.original_file_full_path || (first.file_path && first.file_name ? first.file_path + first.file_name : '')

  if (!url) {
    uni.showToast({ title: 'SOP文件地址不存在', icon: 'none' })
    return
  }

  // H5 环境下通过本地代理转发，去掉固定域名，避免 CORS；App 等其他端保留完整地址
  if (process.env.UNI_PLATFORM === 'h5') {
    const domainPrefix = 'https://www.dachen.vip'
    if (url.startsWith(domainPrefix)) {
      url = url.slice(domainPrefix.length)
    }
  }

  const fileName = first.original_file_name || first.file_name || 'SOP文件'

  uni.showLoading({ title: '正在打开SOP...' })

  uni.downloadFile({
    url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          success: () => {
            // 打开成功，无需额外提示
          },
          fail: () => {
            uni.showToast({ title: '无法打开SOP文件', icon: 'none' })
            // APP 端兜底：尝试使用系统浏览器打开链接
            // #ifdef APP-PLUS
            try {
              plus.runtime.openURL(url)
            } catch (e) {
              // 兜底也失败就不再额外处理
            }
            // #endif
          },
          complete: () => {
            uni.hideLoading()
          }
        })
      } else {
        uni.hideLoading()
        uni.showToast({ title: 'SOP文件下载失败', icon: 'none' })
      }
    },
    fail: (err) => {
      uni.hideLoading()
      uni.showToast({ title: 'SOP文件下载失败', icon: 'none' })
    }
  })
}

const onPreviewSwiperChange = (e) => {
  previewImageIndex.value = e.detail?.current ?? 0
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrls.value = []
  previewImageIndex.value = 0
}

const handleImageError = (e) => {
  uni.showToast({ title: '图片加载失败', icon: 'none' })
}


// ---------- 工序模态相关方法 ----------
const buildProductDispatchSyncKey = (process) => ({
  processName: process?.processName || ''
})

const syncKeysEqual = (a, b) => {
  if (!a || !b) return false
  return a.processName === b.processName
}

/** 产品派工：在一张单据上找到与同步键对应的工序（仅按工序名称，多条同名取第一条） */
const findProcessOnBillBySyncKey = (bill, key) => {
  if (!bill?.processes?.length || !key?.processName) return null
  return bill.processes.find(pr => pr.processName === key.processName) || null
}

const collectProductDispatchSyncedPairs = (key) => {
  const pairs = []
  for (const bill of billsList.value) {
    const p = findProcessOnBillBySyncKey(bill, key)
    if (p) pairs.push({ item: bill, process: p })
  }
  return pairs
}

/** 是否为同一单据（订单号 + 生产单号） */
const isSameBillAs = (bill, anchor) => {
  if (!bill || !anchor) return false
  return (
    String(bill.orderCode || '') === String(anchor.orderCode || '') &&
    String(bill.productionCode || '') === String(anchor.productionCode || '')
  )
}

/** 多对多分桶：优先 billRowid，避免生产单号缺失时多张单据被合并成一组 */
const billKeyForMultiDispatch = (item) => {
  const rid = item?.billRowid
  if (rid != null && String(rid).trim() !== '') return `rid:${String(rid)}`
  return `${item?.orderCode || ''}__${item?.productionCode || ''}`
}

/** 组装/抛光/喷涂：勾选一道工序时，所有单据上同名工序一并勾选或取消（键为工序名） */
const toggleMultiProcessSyncedGroup = (item, process) => {
  const key = buildProductDispatchSyncKey(process)
  const pairs = collectProductDispatchSyncedPairs(key)
  if (!pairs.length) return
  const pairIncluded = (pair) =>
    selectedMultiProcesses.value.some(
      s => isSameBillAs(s.item, pair.item) && s.process.rowid === pair.process.rowid
    )
  const allSelected = pairs.every(pairIncluded)
  if (allSelected) {
    selectedMultiProcesses.value = selectedMultiProcesses.value.filter(
      s => !pairs.some(p => isSameBillAs(p.item, s.item) && p.process.rowid === s.process.rowid)
    )
  } else {
    for (const p of pairs) {
      if (!pairIncluded(p)) {
        selectedMultiProcesses.value.push({ item: p.item, process: p.process })
      }
    }
  }
  const rem = selectedMultiProcesses.value.find(r => isSameBillAs(r.item, item))
  selectedProcess.value = rem ? { item: rem.item, process: rem.process } : null
}

// 选择工序
const selectProcess = (item, process) => {
  // 产品派工仅对「单选工序」车间做跨单同名同步；组装/抛光/喷涂仍走多选以便多对多/一对多
  if (dispatchMode.value === 'product' && !isMultiSelectProcessWorkshop.value) {
    const key = buildProductDispatchSyncKey(process)
    if (productDispatchProcessSyncKey.value && syncKeysEqual(productDispatchProcessSyncKey.value, key)) {
      productDispatchProcessSyncKey.value = null
      selectedProcess.value = null
      selectedMultiProcesses.value = []
      return
    }
    productDispatchProcessSyncKey.value = { ...key }
    selectedProcess.value = { item, process }
    return
  }

  if (isMultiSelectProcessWorkshop.value) {
    toggleMultiProcessSyncedGroup(item, process)
  } else {
    // 其他车间：使用单选逻辑
    if (isProcessSelected(item, process)) {
      selectedProcess.value = null
    } else {
      selectedProcess.value = { item, process }
    }
  }
}

// 判断工序是否被选中（产品派工跨单同步仅按工序名称；其它车间以订单 + rowid）
const isProcessSelected = (item, process) => {
  if (
    dispatchMode.value === 'product' &&
    productDispatchProcessSyncKey.value &&
    !isMultiSelectProcessWorkshop.value
  ) {
    const kn = productDispatchProcessSyncKey.value.processName || ''
    return kn !== '' && (process?.processName || '') === kn
  }
  if (!selectedProcess.value) return false
  return selectedProcess.value.item.orderCode === item.orderCode &&
         selectedProcess.value.process.rowid === process.rowid
}

// 多选工序相关方法（以订单编码 + 工序 rowid 为基准）
const toggleMultiProcess = (item, process) => {
  const index = selectedMultiProcesses.value.findIndex(p =>
    p.item.orderCode === item.orderCode && p.process.rowid === process.rowid
  )
  
  if (index >= 0) {
    // 取消选中
    selectedMultiProcesses.value.splice(index, 1)
  } else {
    // 选中
    selectedMultiProcesses.value.push({ item, process })
  }
}

// 判断工序是否被多选（以订单编码 + 工序 rowid 为基准）
const isMultiProcessSelected = (item, process) => {
  if (
    dispatchMode.value === 'product' &&
    productDispatchProcessSyncKey.value &&
    !isMultiSelectProcessWorkshop.value
  ) {
    const kn = productDispatchProcessSyncKey.value.processName || ''
    return kn !== '' && (process?.processName || '') === kn
  }
  return selectedMultiProcesses.value.some(p =>
    p.item.orderCode === item.orderCode && p.process.rowid === process.rowid
  )
}

const multiDispatchProcessPickKey = (proc) =>
  `${proc?.processName || ''}\t${String(proc?.sequence ?? '')}`

const countKeysFromMultiEntries = (entries) => {
  const m = new Map()
  for (const p of entries) {
    const k = multiDispatchProcessPickKey(p.process)
    m.set(k, (m.get(k) || 0) + 1)
  }
  return m
}

const multiDispatchKeyMapsEqual = (a, b) => {
  if (a.size !== b.size) return false
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false
  }
  return true
}

/** 与锚点单据已选工序（工序名+序号 多重集）一致的全部单据，用于跨单多对多 */
const buildMultiDispatchTargets = (anchorItem) => {
  const listForBill = selectedMultiProcesses.value.filter(p => isSameBillAs(p.item, anchorItem))
  if (listForBill.length < 2) return []
  const anchorCounts = countKeysFromMultiEntries(listForBill)
  const byBill = new Map()
  for (const p of selectedMultiProcesses.value) {
    const bk = billKeyForMultiDispatch(p.item)
    if (!byBill.has(bk)) byBill.set(bk, [])
    byBill.get(bk).push(p)
  }
  const targets = []
  for (const entries of byBill.values()) {
    if (multiDispatchKeyMapsEqual(countKeysFromMultiEntries(entries), anchorCounts)) {
      targets.push({ item: entries[0].item, processes: entries.slice() })
    }
  }
  targets.sort((a, b) =>
    billKeyForMultiDispatch(a.item).localeCompare(billKeyForMultiDispatch(b.item))
  )
  return targets
}

/** 多对多弹窗：当前单据下的选中工序（展示顺序用） */
const multiDispatchSelectedProcessesForModal = computed(() => {
  if (!showMultiDispatchModal.value || !currentMultiDispatchItem.value) return []
  const anchor = currentMultiDispatchItem.value
  return selectedMultiProcesses.value
    .filter(p => isSameBillAs(p.item, anchor))
    .sort((a, b) => (Number(a.process?.sequence) || 0) - (Number(b.process?.sequence) || 0))
})

/** 多对多弹窗：汇总表列标题（排产/返工） */
const multiDispatchSummaryProdColTitle = computed(() => {
  if (!currentMultiDispatchItem.value) return '排产数量'
  return currentMultiDispatchItem.value.billType === '返工排产' ? '返工数量' : '排产数量'
})

/** 多对多弹窗：汇总表（每张匹配到的单据一行，含多订单） */
const multiDispatchModalSummaryRows = computed(() => {
  if (!showMultiDispatchModal.value || !multiDispatchTargets.value.length) return []
  return multiDispatchTargets.value.map(({ item: b }) => ({
    billKey: billKeyForMultiDispatch(b),
    orderCode: b.orderCode || '-',
    productionQtyDisplay:
      b.billType === '返工排产'
        ? formatReworkFieldQtyDisplay(b.reworkFieldQty)
        : String(getBillProductionQtyForDispatch(b))
  }))
})

/** 多对多：各单据派工数量之和 */
const multiDispatchTotalQty = computed(() => {
  if (!showMultiDispatchModal.value || !multiDispatchTargets.value.length) return 0
  const map = multiDispatchQtyByBillKey.value
  let sum = 0
  for (const t of multiDispatchTargets.value) {
    const n = Number(map[billKeyForMultiDispatch(t.item)])
    sum += Number.isFinite(n) ? Math.max(0, n) : 0
  }
  return sum
})

/** 订单派工多对多：弹窗内只读排产/返工数量展示（与列表一致） */
const multiDispatchOrderModeProductionDisplay = computed(() => {
  const item = currentMultiDispatchItem.value
  if (!item) return '-'
  if (item.billType === '返工排产') return formatReworkFieldQtyDisplay(item.reworkFieldQty)
  const n = item.productionCount
  return n === 0 || n ? String(n) : '-'
})

// 打开多对多派工模态框
const openMultiDispatchModal = (item) => {
  const listForBill = selectedMultiProcesses.value.filter(p => isSameBillAs(p.item, item))
  if (listForBill.length < 2) {
    uni.showToast({ title: '请至少选择两个工序', icon: 'none' })
    return
  }

  const targets = buildMultiDispatchTargets(item)
  if (!targets.length) {
    uni.showToast({ title: '未能匹配派工单据', icon: 'none' })
    return
  }
  multiDispatchTargets.value = targets
  currentMultiDispatchItem.value = item
  // 初始化日期为今天，格式：YYYY-MM-DD
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  multiDispatchData.value = {
    quantity: 0,
    date: todayStr, // 默认今天
    isLast: '否', // 默认值为否
    salaryMethod: '计件'
  }
  if (dispatchMode.value === 'product') {
    multiDispatchQtyByBillKey.value = Object.fromEntries(
      targets.map((t) => [billKeyForMultiDispatch(t.item), 0])
    )
  } else {
    multiDispatchQtyByBillKey.value = {}
  }
  multiIsLastIndex.value = 1 // 默认选中第二个选项（否）
  multiSalaryMethodIndex.value = 0
  multiEmployeeList.value = []
  selectedMultiEmployees.value = []
  
  // 初始化模态框车间为页面当前车间
  // 特殊规则：当页面车间为喷涂车间时，添加员工默认使用组装车间
  modalWorkshop.value = workshop.value === '喷涂车间' ? '组装车间' : workshop.value
  
  // 不自动加载员工列表，只有点击添加员工按钮后才加载
  showMultiDispatchModal.value = true
}

// 关闭多对多派工模态框
const closeMultiDispatchModal = () => {
  showMultiDispatchModal.value = false
  multiDispatchData.value = {
    quantity: 0,
    date: '',
    isLast: '否',
    salaryMethod: '计件'
  }
  multiDispatchQtyByBillKey.value = {}
  multiIsLastIndex.value = 1
  multiSalaryMethodIndex.value = 0
  multiEmployeeList.value = []
  selectedMultiEmployees.value = []
  currentMultiDispatchItem.value = null
  multiDispatchTargets.value = []
  modalWorkshop.value = ''
}

// ---------- 一对多派工（仅抛光车间） ----------
const openOneToManyModal = (item) => {
  if (dispatchMode.value === 'product') {
    return
  }
  if (workshop.value !== '抛光车间') {
    uni.showToast({ title: '一对多派工仅适用于抛光车间', icon: 'none' })
    return
  }
  const list = selectedMultiProcesses.value.filter(p => isSameBillAs(p.item, item))
  if (list.length < 2) {
    uni.showToast({ title: '请至少选择两个工序', icon: 'none' })
    return
  }

  oneToManyProcessRows.value = list.map((p) => {
    const process = p.process || {}
    const son = parseFloat(process.sonoutput)
    const productionCount = Number.isFinite(son) && son > 0
      ? son
      : (p.item.billType === '返工排产'
        ? getBillProductionQtyForDispatch(p.item)
        : (p.item.productionCount ?? p.item.orderCount ?? 0))
    const needMax = parseFloat(process.needCount)
    const maxNeed = Number.isFinite(needMax) ? needMax : 0
    return {
      processName: process.processName || '',
      productionCountDisplay: String(productionCount),
      needCountDisplay: String(maxNeed),
      maxQuantity: maxNeed,
      quantity: 0,
      processRowid: process.rowid,
    }
  })

  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  oneToManyDispatchDate.value = `${year}-${month}-${day}`

  oneToManyEmployeeList.value = []
  selectedOneToManyEmployeeId.value = ''
  modalWorkshop.value = workshop.value === '喷涂车间' ? '组装车间' : workshop.value
  currentOneToManyItem.value = item
  showOneToManyModal.value = true
}

const closeOneToManyModal = () => {
  showOneToManyModal.value = false
  oneToManyProcessRows.value = []
  oneToManyDispatchDate.value = ''
  oneToManyEmployeeList.value = []
  selectedOneToManyEmployeeId.value = ''
  currentOneToManyItem.value = null
  modalWorkshop.value = ''
}

const onOneToManyDateChange = (e) => {
  oneToManyDispatchDate.value = e.detail.value
}

const onOneToManyEmployeeRadioChange = (e) => {
  selectedOneToManyEmployeeId.value = e.detail.value != null ? String(e.detail.value) : ''
}

const addOneToManyEmployee = async () => {
  if (!modalWorkshop.value) {
    modalWorkshop.value = workshop.value === '喷涂车间' ? '组装车间' : workshop.value
  }
  await loadMultiEmployeesForAdd()
  selectedEmployeesForAdd.value = []
  showAddEmployeeModal.value = true
}

const canOneToManyDispatch = computed(() => {
  if (!oneToManyDispatchDate.value) return false
  if (!selectedOneToManyEmployeeId.value) return false
  if (oneToManyProcessRows.value.length === 0) return false
  for (const row of oneToManyProcessRows.value) {
    const q = Number(row.quantity)
    if (!q || q <= 0) return false
    const max = Number(row.maxQuantity) || 0
    if (max > 0 && q > max) return false
  }
  return true
})

const confirmOneToManyDispatch = async () => {
  if (!oneToManyDispatchDate.value) {
    uni.showToast({ title: '请选择派工日期', icon: 'none' })
    return
  }
  if (!selectedOneToManyEmployeeId.value) {
    uni.showToast({ title: '请选择一个员工', icon: 'none' })
    return
  }
  for (const row of oneToManyProcessRows.value) {
    const q = Number(row.quantity)
    if (!q || q <= 0) {
      uni.showToast({ title: `请为「${row.processName || '工序'}」填写有效派工数量`, icon: 'none' })
      return
    }
    const max = Number(row.maxQuantity) || 0
    if (max > 0 && q > max) {
      uni.showToast({ title: `「${row.processName}」派工数量不能超过可派工数量 ${max}`, icon: 'none' })
      return
    }
  }

  const billItem = currentOneToManyItem.value
  const selectedEmployees = oneToManyEmployeeList.value.filter(emp =>
    String(emp.id) === String(selectedOneToManyEmployeeId.value)
  )
  if (selectedEmployees.length === 0) {
    uni.showToast({ title: '请选择一个员工', icon: 'none' })
    return
  }
  const processQtyText = oneToManyProcessRows.value
    .map(r => `${r.processName || '-'}：${Number(r.quantity)}`)
    .join('；')
  const employeeNames = selectedEmployees.map(emp => emp.name).join('、')

  openDispatchConfirmModal([
    { label: '工序与数量', value: processQtyText },
    { label: '人员', value: employeeNames },
    { label: '派工日期', value: oneToManyDispatchDate.value || '' },
  ], async () => {
    const emp = selectedEmployees[0]
    const processDispatchList = oneToManyProcessRows.value.map((r, i) => {
      const n = i + 1
      return {
        [`rowid${n}`]: r.processRowid,
        [`dispatchCount${n}`]: Number(r.quantity),
      }
    })
    const dispatchParams = {
      date: oneToManyDispatchDate.value || '',
      workshop: workshop.value || '',
      orderCode: billItem?.orderCode || '',
      billRowid: billItem?.billRowid || '',
      loginCode: userStore.loginCode || '',
      employeeId: emp.id,
      employeeName: emp.name || '',
      processDispatchList,
    }

    try {
      const resp = await http.post(ONE_TO_MANY_DISPATCH_HOOK, dispatchParams)
      if (resp.status === 1) {
        uni.showToast({ title: resp.message || '派工失败', icon: 'none' })
        return
      }
      uni.showToast({ title: '派工成功' })
      showOneToManyModal.value = false
      selectedMultiProcesses.value = []
      oneToManyProcessRows.value = []
      oneToManyEmployeeList.value = []
      selectedOneToManyEmployeeId.value = ''
      currentOneToManyItem.value = null
      setTimeout(async () => {
        await search()
      }, 1000)
    } catch (error) {
      console.error('一对多派工失败:', error)
      uni.showToast({ title: '派工失败：' + (error.message || '未知错误'), icon: 'none' })
    }
  })
}

// 多对多派工添加员工
const addMultiEmployee = async () => {
  // 如果模态框车间值还没有设置，使用当前页面车间值
  if (!modalWorkshop.value) {
    // 特殊规则：当页面车间为喷涂车间时，添加员工默认使用组装车间
    modalWorkshop.value = workshop.value === '喷涂车间' ? '组装车间' : workshop.value
  }
  
  // 加载所有可选的员工列表（用于添加员工模态框）
  await loadMultiEmployeesForAdd()
  
  selectedEmployeesForAdd.value = []
  showAddEmployeeModal.value = true
}

// 加载多对多派工可选员工列表（用于添加员工模态框）
const loadMultiEmployeesForAdd = async () => {
  try {
    const currentDate = getCurrentDate()
    const selectedWorkshop = modalWorkshop.value || workshop.value
    
    const res = await callWorkflowListAPIPaged({
      worksheetId: 'yggs',
      filters: [{
        "controlId": "696075d19223cfe3a0c169dc",
        "dataType": 30,
        "spliceType": 1,
        "filterType": 2,
        "values": [selectedWorkshop]
      }, {
        "controlId": "6943bd902161a0fc58bad5ab",
        "dataType": 30,
        "spliceType": 1,
        "filterType": 8
      }],
      pageSize: 100,
      pageNum: 1
    })

    if (res.data && res.data.length > 0) {
      const mappedEmployees = res.data.map(item => {
        const totalHoursStr = item['693bcaa5f15635c61ac3507a'] || '0'
        const unrecordedHoursStr = item['693bcaa5f15635c61ac3507c'] || '0'
        const dispatchWorkDate = item['69524e7b7a59e0522d855df6'] || ''

        return {
          id: item['6943bd902161a0fc58bad5ab'] || '',
          name: item['6938db8bda0981f67b352af3'] || '',
          totalHours: totalHoursStr === '' ? 0 : parseFloat(totalHoursStr) || 0,
          unrecordedHours: unrecordedHoursStr === '' ? 0 : parseFloat(unrecordedHoursStr) || 0,
          dispatchWorkDate: dispatchWorkDate
        }
      })
      .filter(emp => emp.dispatchWorkDate === currentDate)

      // 更新allEmployeesOptions和allEmployeesMap，供添加员工模态框使用
      allEmployeesOptions.value = mappedEmployees.map(emp => ({
        label: emp.name,
        value: emp.id,
        totalHours: emp.totalHours || 0,
        unrecordedHours: emp.unrecordedHours || 0
      }))

      allEmployeesMap.value = {}
      mappedEmployees.forEach(emp => {
        allEmployeesMap.value[emp.id] = emp
      })
    } else {
      allEmployeesOptions.value = []
      allEmployeesMap.value = {}
    }
  } catch (error) {
    console.error('加载员工失败:', error)
    allEmployeesOptions.value = []
    allEmployeesMap.value = {}
  }
}

// 多对多派工：员工 id 统一成字符串；派工列表顺序以 multiEmployeeList 为准（与添加员工弹窗点选顺序一致），接口按该列表自上而下
const normalizeEmployeeId = (id) => String(id)

// 多对多派工员工选择变化（仅表示勾选集合，顺序以 multiEmployeeList 为准）
const onMultiEmployeeCheckboxChange = (e) => {
  selectedMultiEmployees.value = (e.detail.value || []).map(normalizeEmployeeId)
}

// 判断员工是否被选中（多对多派工）
const isMultiEmployeeSelected = (employeeId) => {
  const id = normalizeEmployeeId(employeeId)
  return selectedMultiEmployees.value.some((x) => normalizeEmployeeId(x) === id)
}

// 判断是否可以多对多派工（产品派工：每单数量>0；订单派工：单一派工数量>0）
const canMultiDispatch = computed(() => {
  if (!multiDispatchTargets.value.length || selectedMultiEmployees.value.length === 0) return false
  if (selectedMultiProcesses.value.length === 0) return false
  if (dispatchMode.value === 'product') {
    const map = multiDispatchQtyByBillKey.value
    return multiDispatchTargets.value.every((t) => {
      const n = Number(map[billKeyForMultiDispatch(t.item)])
      return Number.isFinite(n) && n > 0
    })
  }
  const q = Number(multiDispatchData.value.quantity)
  return Number.isFinite(q) && q > 0
})

// 确认多对多派工
const confirmMultiDispatch = async () => {
  if (dispatchMode.value === 'product') {
    const targetsCheck = multiDispatchTargets.value
    const mapCheck = multiDispatchQtyByBillKey.value
    const invalidBill = targetsCheck.find((t) => {
      const n = Number(mapCheck[billKeyForMultiDispatch(t.item)])
      return !Number.isFinite(n) || n <= 0
    })
    if (invalidBill) {
      uni.showToast({ title: '请为每张单据填写有效的派工数量 (>0)', icon: 'none' })
      return
    }
  } else {
    const q = Number(multiDispatchData.value.quantity)
    if (!Number.isFinite(q) || q <= 0) {
      uni.showToast({ title: '请填写有效的派工数量 (>0)', icon: 'none' })
      return
    }
  }
  
  if (selectedMultiProcesses.value.length === 0) {
    uni.showToast({ title: '请至少选择一个工序', icon: 'none' })
    return
  }
  
  if (selectedMultiEmployees.value.length === 0) {
    uni.showToast({ title: '请至少选择一个员工', icon: 'none' })
    return
  }
  
  if (!multiDispatchData.value.date) {
    uni.showToast({ title: '请选择派工日期', icon: 'none' })
    return
  }
  
  // 按派工模态框员工列表自上而下（= 添加员工弹窗点选顺序），仅包含当前勾选
  const selectedEmployees = multiEmployeeList.value.filter((emp) =>
    selectedMultiEmployees.value.some((x) => normalizeEmployeeId(x) === normalizeEmployeeId(emp.id))
  )
  
  const targets = multiDispatchTargets.value
  if (!targets.length) {
    uni.showToast({ title: '派工单据数据失效，请关闭后重试', icon: 'none' })
    return
  }

  const firstProcList = [...targets[0].processes].sort(
    (a, b) => (Number(a.process?.sequence) || 0) - (Number(b.process?.sequence) || 0)
  )
  const processNames = firstProcList.map(p => p.process?.processName || '').filter(Boolean).join('、')
  const employeeNames = selectedEmployees.map(emp => emp.name).join('、')
  const dispatchDate = multiDispatchData.value.date || ''
  const qtyMap = multiDispatchQtyByBillKey.value
  const orderModeQty = Number(multiDispatchData.value.quantity) || 0
  const quantityTotal =
    dispatchMode.value === 'product'
      ? targets.reduce((s, t) => {
          const n = Number(qtyMap[billKeyForMultiDispatch(t.item)])
          return s + (Number.isFinite(n) ? n : 0)
        }, 0)
      : orderModeQty * targets.length
  const orderCount = new Set(targets.map(t => t.item.orderCode)).size
  const involveLine =
    targets.length > 1 || orderCount > 1
      ? `${targets.length} 张单据 / ${orderCount} 个订单`
      : ''

  openDispatchConfirmModal(
    [
      { label: '工序', value: processNames },
      { label: '人员', value: employeeNames },
      { label: '派工日期', value: dispatchDate },
      {
        label: dispatchMode.value === 'product' ? '派工数量合计' : '派工数量',
        value:
          dispatchMode.value === 'product'
            ? String(quantityTotal)
            : String(orderModeQty)
      },
      ...(involveLine ? [{ label: '涉及', value: involveLine }] : [])
    ],
    async () => {
      const hookUrl = 'https://www.dachen.vip/api/workflow/hooks/Njk4MmRkMTUwZjBkMGFkODBmZTM1YjAy'
      try {
        const dispatchList = buildMultiDispatchModalListPayload(
          targets,
          dispatchMode.value === 'product',
          orderModeQty
        )
        for (const t of targets) {
          const billItem = t.item
          const rowQty =
            dispatchMode.value === 'product'
              ? Number(multiDispatchQtyByBillKey.value[billKeyForMultiDispatch(billItem)]) || 0
              : orderModeQty
          const dispatchParams = {
            productionCount: getBillProductionQtyForDispatch(billItem),
            billRowid: billItem?.billRowid || '',
            orderCode: billItem?.orderCode || '',
            dispatchMode: dispatchMode.value || 'order',
            workshop: workshop.value || '',
            processes: t.processes.map(p => ({
              rowid: p.process.rowid
            })),
            quantity: rowQty,
            date: multiDispatchData.value.date || '',
            isLast: multiDispatchData.value.isLast === '是' ? 1 : 0,
            salaryMethod: multiDispatchData.value.salaryMethod || '计件',
            employees: selectedEmployees.map(emp => ({
              id: emp.id
            })),
            dispatchList
          }
          const resp = await http.post(hookUrl, dispatchParams)
          if (resp.status === 1) {
            uni.showToast({
              title: resp.message || `单据 ${billItem?.orderCode || ''} 派工失败`,
              icon: 'none'
            })
            return
          }
        }

        uni.showToast({ title: '派工成功' })
        showMultiDispatchModal.value = false
        selectedMultiProcesses.value = []
        multiDispatchTargets.value = []
        multiDispatchQtyByBillKey.value = {}

        setTimeout(async () => {
          await search()
        }, 1000)
      } catch (error) {
        console.error('多对多派工失败:', error)
        uni.showToast({ title: '派工失败：' + (error.message || '未知错误'), icon: 'none' })
      }
    }
  )
}

// 打开工序派工模态框
const openProcessModal = (item, process) => {
  if (openingProcessModalGuard.value || showProcessModal.value) return
  openingProcessModalGuard.value = true

  try {
    selectedProcessData.value = { item, process }
    machine.value = null
    // 初始化日期为今天，格式：YYYY-MM-DD
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    // 初始化模态框车间为页面当前车间
    // 特殊规则：当页面车间为喷涂车间时，添加员工默认使用组装车间
    modalWorkshop.value = workshop.value === '喷涂车间' ? '组装车间' : workshop.value

    processDispatchData.value = {
      employee: '',
      quantity: 0,
      time: 0,
      machine: '',
      mold: '',
      date: todayStr,
      salaryMethod: '计件',  // 默认值为计件
      price: process?.price || 0,  // 将工序的工价赋值给派工模态框
      isLast: '否'  // 默认值为否
    }
    if (dispatchMode.value === 'product') {
      Object.keys(productDispatchQtyByBillKey).forEach((k) => {
        delete productDispatchQtyByBillKey[k]
      })
      // 不预置 0，避免输入框先出现 0 不便修改；未填的 key 在计算/提交时按 0 处理
    }
    salaryMethodIndex.value = 0  // 默认选中第一个选项（计件）
    isLastIndex.value = 1  // 默认选中第二个选项（否）
    selectedEmployee.value = []
    employeeList.value = []
    loadEmployees()
    showProcessModal.value = true
  } finally {
    nextTick(() => {
      openingProcessModalGuard.value = false
    })
  }
}

const closeProcessModal = () => {
  showProcessModal.value = false
  processDispatchData.value = { employee: '', quantity: 0, time: 0, machine: '', mold: '', date: '', salaryMethod: '计件', price: 0, isLast: '否' }
  Object.keys(productDispatchQtyByBillKey).forEach((k) => {
    delete productDispatchQtyByBillKey[k]
  })
  machine.value = null
  employeeList.value = []
  selectedEmployee.value = []
  salaryMethodIndex.value = 0
  isLastIndex.value = 1
  modalWorkshop.value = ''  // 清空模态框车间选择
  // 关闭模态框后不清空选中状态，保持选中以便再次派工
}

// 日期选择变化处理
const onDateChange = (e) => {
  processDispatchData.value.date = e.detail.value
}

// 多对多派工日期选择变化处理
const onMultiDateChange = (e) => {
  multiDispatchData.value.date = e.detail.value
}

// 多对多派工是否包含最终工序选择变化处理
const onMultiIsLastChange = (e) => {
  multiIsLastIndex.value = e.detail.value
  multiDispatchData.value.isLast = isLastOptions.value[e.detail.value]
}

// 多对多派工计薪方式选择变化处理
const onMultiSalaryMethodChange = (e) => {
  multiSalaryMethodIndex.value = e.detail.value
  multiDispatchData.value.salaryMethod = salaryMethodOptions.value[e.detail.value]
}

// 模态框车间选择变化处理
const onModalWorkshopChange = (value) => {
  modalWorkshop.value = value
  // 车间改变时，重新加载员工列表
  loadEmployees()
}

// 计薪方式选择变化处理
const onSalaryMethodChange = (e) => {
  salaryMethodIndex.value = e.detail.value
  processDispatchData.value.salaryMethod = salaryMethodOptions.value[e.detail.value]
}

// 最终工序选择变化处理
const onIsLastChange = (e) => {
  isLastIndex.value = e.detail.value
  processDispatchData.value.isLast = isLastOptions.value[e.detail.value]
}

/** 点击确认派工：前置校验与「请至少选择一个员工」一致用 Toast */
const onConfirmProcessDispatchTap = () => {
  if (dispatchMode.value === 'product') {
    const rows = productDispatchModalProcessRows.value
    const invalid = rows.find((r) => !isValidPositiveProductDispatchQty(r.billKey))
    if (invalid) {
      uni.showToast({ title: '请填写每一单的派工数量', icon: 'none' })
      return
    }
  } else if (!canDispatch.value) {
    uni.showToast({ title: '该工序无需派工', icon: 'none' })
    return
  }
  confirmProcessDispatch()
}

const confirmProcessDispatch = async () => {
  const isProduct = dispatchMode.value === 'product'
  // 订单派工：需派工为 0 不可派；产品派工由 onConfirmProcessDispatchTap / 下列校验约束
  if (!isProduct && !canDispatch.value) {
    uni.showToast({ title: '该工序无需派工', icon: 'none' })
    return
  }

  const modalRows = productDispatchModalProcessRows.value
  let productSubmitRows = null

  if (isProduct) {
    for (const r of modalRows) {
      if (!isValidPositiveProductDispatchQty(r.billKey)) {
        uni.showToast({ title: `请为订单 ${r.orderCode} 填写大于 0 的派工数量`, icon: 'none' })
        return
      }
    }
    productSubmitRows = modalRows.map((r) => ({
      ...r,
      qty: Number(productDispatchQtyByBillKey[r.billKey])
    }))
    for (const r of productSubmitRows) {
      if (!r.processRowid) {
        uni.showToast({ title: `订单 ${r.orderCode} 工序数据异常`, icon: 'none' })
        return
      }
      const maxNeed = toFiniteNum(r.needCount, 0)
      if (r.qty > maxNeed) {
        uni.showToast({ title: `订单 ${r.orderCode} 派工数量不能超过需派工 ${maxNeed}`, icon: 'none' })
        return
      }
    }
  } else {
    if (!processDispatchData.value.quantity || processDispatchData.value.quantity <= 0) {
      uni.showToast({ title: '请填写有效的派工数量 (>0)', icon: 'none' })
      return
    }
    const maxQty = maxQuantity.value
    if (processDispatchData.value.quantity > maxQty) {
      uni.showToast({ title: `派工数量不能超过需派工数量 ${maxQty}`, icon: 'none' })
      return
    }
  }

  if (!selectedEmployee.value || selectedEmployee.value.length === 0) {
    uni.showToast({ title: '请至少选择一个员工', icon: 'none' })
    return
  }
  if (!processDispatchData.value.date) {
    uni.showToast({ title: '请选择派工日期', icon: 'none' })
    return
  }

  const selectedEmployees = employeeList.value.filter(emp => selectedEmployee.value.includes(emp.id))
  const selectedEmployeeNames = selectedEmployees.map(emp => emp.name).join('、')
  processDispatchData.value.employee = selectedEmployeeNames

  const processName = selectedProcessData.value?.process?.processName || ''
  const dispatchDate = processDispatchData.value.date || ''
  const qtySummary = isProduct
    ? productSubmitRows.map((r) => `${r.orderCode}：${r.qty}`).join('；')
    : String(processDispatchData.value.quantity || 0)

  openDispatchConfirmModal(
    [
      { label: '工序', value: processName },
      { label: '人员', value: selectedEmployeeNames },
      { label: '派工日期', value: dispatchDate },
      { label: '派工数量', value: qtySummary }
    ],
    async () => {
      const dispatchList = isProduct ? buildProductProcessModalDispatchList(modalRows) : []
      const afterSuccess = () => {
        uni.showToast({ title: '派工成功' })
        showProcessModal.value = false
        setTimeout(async () => {
          await search()
        }, 1000)
      }

      if (isProduct) {
        const anchor = selectedProcessData.value
        const totalQty = productSubmitRows.reduce((s, r) => s + r.qty, 0)
        let totalTimeAcc = 0
        for (const r of productSubmitRows) {
          const h = toFiniteNum(r.hourlyoutput, 0)
          const q = r.qty
          if (h > 0 && q > 0) totalTimeAcc += q / h
        }
        const totalTime = parseFloat(totalTimeAcc.toFixed(2))
        const dispatchListFiltered = dispatchList.filter((it) => Number(it.dispatchQuantity) > 0)

        const dispatchData = {
          productCode: anchor?.item?.productCode || '',
          orderCode: anchor?.item?.orderCode || '',
          dispatchMode: 'product',
          processName,
          finishCount: anchor?.process?.finishCount ?? 0,
          needCount: toFiniteNum(anchor?.process?.needCount, 0),
          quantity: totalQty,
          time: totalTime,
          employee: processDispatchData.value.employee,
          employees: selectedEmployees,
          machine: machine.value?.code || '',
          mold: anchor?.process?.mold || '',
          workshop: workshop.value || '',
          rowid: anchor?.process?.rowid || '',
          date: processDispatchData.value.date || '',
          salaryMethod: processDispatchData.value.salaryMethod || '',
          price: processDispatchData.value.price ?? anchor?.process?.price ?? 0,
          isLast: processDispatchData.value.isLast || '否',
          dispatchList: dispatchListFiltered
        }
        const resp = await postProcessDispatchHook(dispatchData)
        if (resp.status === 1) {
          afterSuccess()
        } else {
          uni.showToast({ title: resp.message || '派工失败', icon: 'none' })
        }
      } else {
        const dispatchData = {
          productCode: selectedProcessData.value?.item?.productCode || '',
          orderCode: selectedProcessData.value?.item?.orderCode || '',
          dispatchMode: dispatchMode.value || 'order',
          processName: selectedProcessData.value?.process?.processName || '',
          finishCount: selectedProcessData.value?.process?.finishCount || 0,
          needCount: selectedProcessData.value?.process?.needCount || 0,
          quantity: processDispatchData.value.quantity,
          time: processDispatchData.value.time,
          employee: processDispatchData.value.employee,
          employees: selectedEmployees,
          machine: machine.value?.code || '',
          mold: selectedProcessData.value?.process?.mold || '',
          workshop: workshop.value || '',
          rowid: selectedProcessData.value?.process?.rowid || '',
          date: processDispatchData.value.date || '',
          salaryMethod: processDispatchData.value.salaryMethod || '',
          price: processDispatchData.value.price || 0,
          isLast: processDispatchData.value.isLast || '否',
          dispatchList
        }
        const resp = await postProcessDispatchHook(dispatchData)
        if (resp.status === 1) {
          afterSuccess()
        } else {
          uni.showToast({ title: resp.message })
        }
      }
    }
  )
}

const openDispatchConfirmModal = (rows, onConfirm) => {
  dispatchConfirmRows.value = rows || []
  dispatchConfirmAction.value = onConfirm || null
  showDispatchConfirmModal.value = true
}

const closeDispatchConfirmModal = () => {
  showDispatchConfirmModal.value = false
  dispatchConfirmRows.value = []
  dispatchConfirmAction.value = null
}

const handleDispatchConfirm = async () => {
  // 必须先同步占用锁，再读回调；否则同一时刻两次点击都会通过第一道判断（竞态）
  if (processDispatchConfirmSubmitting.value) return
  processDispatchConfirmSubmitting.value = true

  try {
    const action = dispatchConfirmAction.value
    if (typeof action !== 'function') {
      closeDispatchConfirmModal()
      return
    }
    dispatchConfirmAction.value = null
    showDispatchConfirmModal.value = false
    dispatchConfirmRows.value = []

    await action()
  } finally {
    processDispatchConfirmSubmitting.value = false
  }
}

// ---------- 员工相关方法 ----------
const loadEmployees = async () => {
  try {
    // 每次请求时获取当前日期
    const currentDate = getCurrentDate()
    
    // 使用模态框中的车间值，如果没有则使用页面车间值
    const selectedWorkshop = modalWorkshop.value || workshop.value
    
    const res = await callWorkflowListAPIPaged({
      worksheetId: 'yggs',
      filters: [{
        "controlId": "696075d19223cfe3a0c169dc",
        "dataType": 30,
        "spliceType": 1,
        "filterType": 2,
        "values": [selectedWorkshop]
      }, {
        "controlId": "6943bd902161a0fc58bad5ab",
        "dataType": 30,
        "spliceType": 1,
        "filterType": 8
      }],
      pageSize: 100,
      pageNum: 1
    })

    if (res.data && res.data.length > 0) {
      const mappedEmployees = res.data.map(item => {
        const totalHoursStr = item['693bcaa5f15635c61ac3507a'] || '0'
        const unrecordedHoursStr = item['693bcaa5f15635c61ac3507c'] || '0'
        const dispatchWorkDate = item['69524e7b7a59e0522d855df6'] || ''

        return {
          id: item['6943bd902161a0fc58bad5ab'] || '',
          name: item['6938db8bda0981f67b352af3'] || '',
          totalHours: totalHoursStr === '' ? 0 : parseFloat(totalHoursStr) || 0,
          unrecordedHours: unrecordedHoursStr === '' ? 0 : parseFloat(unrecordedHoursStr) || 0,
          dispatchWorkDate: dispatchWorkDate
        }
      })
      .filter(emp => emp.dispatchWorkDate === currentDate)

      allEmployeesOptions.value = mappedEmployees.map(emp => ({
        label: emp.name,
        value: emp.id,
        totalHours: emp.totalHours || 0,
        unrecordedHours: emp.unrecordedHours || 0
      }))

      allEmployeesMap.value = {}
      mappedEmployees.forEach(emp => {
        allEmployeesMap.value[emp.id] = emp
      })
    } else {
      allEmployeesOptions.value = []
      allEmployeesMap.value = {}
    }
  } catch (error) {
    console.error('加载员工失败:', error)
    allEmployeesOptions.value = []
    allEmployeesMap.value = {}
  }
}

const addEmployee = async () => {
  // 如果模态框车间值还没有设置，使用当前页面车间值
  if (!modalWorkshop.value) {
    // 特殊规则：当页面车间为喷涂车间时，添加员工默认使用组装车间
    modalWorkshop.value = workshop.value === '喷涂车间' ? '组装车间' : workshop.value
  }
  
  // 重新加载员工列表，确保使用最新的车间值
  await loadEmployees()
  
  selectedEmployeesForAdd.value = []
  showAddEmployeeModal.value = true
}

const handleAddEmployeeModalClose = (value) => {
  showAddEmployeeModal.value = value
}

const handleAddEmployeeConfirm = async (selectedIds) => {
  if (!selectedIds || selectedIds.length === 0) {
    uni.showToast({ title: '请至少选择一个员工', icon: 'none' })
    return
  }
  
  // 判断是在哪个模态框中添加员工（一对多 / 多对多 / 普通派工）
  const isOneToMany = showOneToManyModal.value
  const isMultiDispatch = showMultiDispatchModal.value
  
  if (isOneToMany) {
    if (Object.keys(allEmployeesMap.value).length === 0) {
      await loadMultiEmployeesForAdd()
    }
    // 一对多：仅保留一名员工（添加员工弹窗已 maxSelection=1）
    const rawId = selectedIds[0]
    const id = rawId != null ? String(rawId) : ''
    let empRow = null
    if (id) {
      const fullEmployee = allEmployeesMap.value[id] || allEmployeesMap.value[rawId]
      if (fullEmployee) {
        empRow = {
          id: fullEmployee.id,
          name: fullEmployee.name,
          totalHours: fullEmployee.totalHours || 0,
          unrecordedHours: fullEmployee.unrecordedHours || 0
        }
      } else {
        const option = allEmployeesOptions.value.find(opt => String(opt.value) === id)
        if (option) {
          empRow = {
            id: option.value,
            name: option.label,
            totalHours: option.totalHours || 0,
            unrecordedHours: option.unrecordedHours || 0
          }
        }
      }
    }
    showAddEmployeeModal.value = false
    if (empRow) {
      oneToManyEmployeeList.value = [empRow]
      selectedOneToManyEmployeeId.value = String(empRow.id)
      uni.showToast({ title: '已选择员工', icon: 'success' })
    } else {
      uni.showToast({ title: '未找到所选员工', icon: 'none' })
    }
  } else if (isMultiDispatch) {
    // 多对多派工模态框
    if (Object.keys(allEmployeesMap.value).length === 0) {
      await loadMultiEmployeesForAdd()
    }
    
    let addedCount = 0
    
    selectedIds.forEach(id => {
      const exists = multiEmployeeList.value.find(emp => emp.id === id)
      if (!exists) {
        const fullEmployee = allEmployeesMap.value[id]
        if (fullEmployee) {
          multiEmployeeList.value.push({
            id: fullEmployee.id,
            name: fullEmployee.name,
            totalHours: fullEmployee.totalHours || 0,
            unrecordedHours: fullEmployee.unrecordedHours || 0
          })
          addedCount++
        } else {
          const option = allEmployeesOptions.value.find(opt => opt.value === id)
          if (option) {
            multiEmployeeList.value.push({
              id: option.value,
              name: option.label,
              totalHours: option.totalHours || 0,
              unrecordedHours: option.unrecordedHours || 0
            })
            addedCount++
          }
        }
      }
    })

    showAddEmployeeModal.value = false

    // 自动选中新添加的员工
    selectedIds.forEach((rawId) => {
      const id = normalizeEmployeeId(rawId)
      if (!selectedMultiEmployees.value.some((x) => normalizeEmployeeId(x) === id)) {
        selectedMultiEmployees.value.push(id)
      }
    })

    if (addedCount > 0) {
      uni.showToast({ title: `已添加 ${addedCount} 名员工`, icon: 'success' })
    } else {
      uni.showToast({ title: '所选员工已存在', icon: 'none' })
    }
  } else {
    // 普通派工模态框
    if (Object.keys(allEmployeesMap.value).length === 0) {
      await loadEmployees()
    }
    
    let addedCount = 0
    
    selectedIds.forEach(id => {
      const exists = employeeList.value.find(emp => emp.id === id)
      if (!exists) {
        const fullEmployee = allEmployeesMap.value[id]
        if (fullEmployee) {
          employeeList.value.push({
            id: fullEmployee.id,
            name: fullEmployee.name,
            totalHours: fullEmployee.totalHours || 0,
            unrecordedHours: fullEmployee.unrecordedHours || 0
          })
          addedCount++
        } else {
          const option = allEmployeesOptions.value.find(opt => opt.value === id)
          if (option) {
            employeeList.value.push({
              id: option.value,
              name: option.label,
              totalHours: 0,
              unrecordedHours: 0
            })
            addedCount++
          }
        }
      }
    })

    showAddEmployeeModal.value = false

    selectedIds.forEach(id => {
      if (!selectedEmployee.value.includes(id)) {
        selectedEmployee.value.push(id)
      }
    })

    if (addedCount > 0) {
      uni.showToast({ title: `已添加 ${addedCount} 名员工`, icon: 'success' })
    } else {
      uni.showToast({ title: '所选员工已存在', icon: 'none' })
    }
  }
}

const isEmployeeSelected = (employeeId) => {
  return selectedEmployee.value.includes(employeeId)
}

const onEmployeeCheckboxChange = (e) => {
  selectedEmployee.value = e.detail.value || []
}

// ---------- 页面跳转方法 ----------
const goDispatchInquiry = () => {
  uni.navigateTo({
    url: `/pages/dispatchInquiry/dispatchInquiry?workshop=${encodeURIComponent(workshop.value)}`
  })
}

const goWorkload = () => {
  uni.navigateTo({
    url: '/pages/workload/workload'
  })
}

const goDispatchInquiryMore = () => {
  uni.navigateTo({
    url: `/pages/dispatchInquiryMore/dispatchInquiryMore?workshop=${encodeURIComponent(workshop.value)}`
  })
}

const goWorkGuide = () => {
  uni.navigateTo({
    url: '/pages/workGuide/workGuide'
  })
}

const goSelectBills = () => {
  billTypeFilter.value = '正常排产'
  uni.navigateTo({
    url: `/pages/selectBills/selectBills?workshop=${workshop.value}&type=${encodeURIComponent('正常排产')}`
  })
}

const goSelectReworkBills = () => {
  billTypeFilter.value = '返工排产'
  uni.navigateTo({
    url: `/pages/selectBills/selectBills?workshop=${workshop.value}&type=${encodeURIComponent('返工排产')}`
  })
}

// 手动刷新当前页面数据
const onManualRefresh = () => {
  search()
}

const addProcess = async (item) => {
  // 获取单据的rowid
  const billRowid = item.billRowid || ''

  // 情况0：如果该单据当前没有任何工序，允许直接添加，顺序从 1 开始
  const hasProcesses = Array.isArray(item.processes) && item.processes.length > 0
  if (!hasProcesses) {
    const selectedSequence = 1
    const processRowid = ''

    uni.navigateTo({
      url: `/pages/addProcess/addProcess?orderCode=${encodeURIComponent(item.orderCode || '')}&productCode=${encodeURIComponent(item.productCode || '')}&workshop=${workshop.value}&selectedSequence=${selectedSequence}&billRowid=${encodeURIComponent(billRowid)}&processRowid=${encodeURIComponent(processRowid)}&billType=${encodeURIComponent(item.billType || '正常排产')}`
    })
    return
  }

  // 有工序时：必须先选择工序，才能在选中工序附近插入新工序
  let baseProcess = null

  if (isMultiSelectProcessWorkshop.value) {
    // 组装/抛光/喷涂：使用多选工序列表
    const selected = selectedMultiProcesses.value.find(p => p.item.orderCode === item.orderCode)
    if (!selected) {
      uni.showToast({ title: '请先选择一个工序', icon: 'none' })
      return
    }
    baseProcess = selected.process
  } else {
    // 拉伸等车间：使用单选选中的工序（与工序点击一致）；产品派工按同步键取当前单据工序
    if (dispatchMode.value === 'product' && productDispatchProcessSyncKey.value) {
      const proc = findProcessOnBillBySyncKey(item, productDispatchProcessSyncKey.value)
      if (!proc) {
        uni.showToast({ title: '请先选择一个工序', icon: 'none' })
        return
      }
      baseProcess = proc
    } else if (!selectedProcess.value || selectedProcess.value.item.orderCode !== item.orderCode) {
      uni.showToast({ title: '请先选择一个工序', icon: 'none' })
      return
    } else {
      baseProcess = selectedProcess.value.process
    }
  }

  // 基于当前选中工序计算新工序顺序：选中工序顺序 + 0.01
  const currentSequence = parseFloat(baseProcess.sequence || 0)
  const selectedSequence = parseFloat((currentSequence + 0.01).toFixed(2))

  // 获取选中工序的 rowid
  const processRowid = baseProcess.rowid || ''

  uni.navigateTo({
    url: `/pages/addProcess/addProcess?orderCode=${encodeURIComponent(item.orderCode || '')}&productCode=${encodeURIComponent(item.productCode || '')}&workshop=${workshop.value}&selectedSequence=${selectedSequence}&billRowid=${encodeURIComponent(billRowid)}&processRowid=${encodeURIComponent(processRowid)}&billType=${encodeURIComponent(item.billType || '正常排产')}`
  })
}

const dispatchWork = (item) => {
  // 检查是否有选中的工序
  if (isMultiSelectProcessWorkshop.value) {
    // 组装/抛光/喷涂：检查多选工序（仅当前单据）
    const selectedCount = selectedMultiProcesses.value.filter(p => isSameBillAs(p.item, item)).length
    if (selectedCount === 0) {
      uni.showToast({ title: '请先选择一个工序', icon: 'none' })
      return
    }
    if (selectedCount > 1) {
      const title =
        dispatchMode.value === 'product'
          ? '产品派工请只选一个工序'
          : workshop.value === '抛光车间'
            ? '选择了多个工序，请使用一对多派工'
            : '选择了多个工序，请使用多对多派工'
      uni.showToast({ title, icon: 'none' })
      return
    }
    // 只有一个选中工序，使用第一个
    const selected = selectedMultiProcesses.value.find(p => isSameBillAs(p.item, item))
    if (selected) {
      openProcessModal(selected.item, selected.process)
    }
  } else {
    // 产品派工：按同步键取「当前单据」上的同名工序，避免选中在别的订单上导致无法打开
    if (dispatchMode.value === 'product' && productDispatchProcessSyncKey.value) {
      const proc = findProcessOnBillBySyncKey(item, productDispatchProcessSyncKey.value)
      if (!proc) {
        uni.showToast({ title: '当前单据无该工序', icon: 'none' })
        return
      }
      openProcessModal(item, proc)
      return
    }

    // 其他车间（包括喷涂）：检查单选工序
    if (!selectedProcess.value) {
      uni.showToast({ title: '请先选择一个工序', icon: 'none' })
      return
    }
    
    // 检查选中的工序是否属于当前订单
    if (selectedProcess.value.item.orderCode !== item.orderCode) {
      uni.showToast({ title: '请选择当前订单的工序', icon: 'none' })
      return
    }
    
    // 打开派工模态框
    openProcessModal(selectedProcess.value.item, selectedProcess.value.process)
  }
}

// 使用正常工序
const useNormalProcess = async (item) => {
  const billRowid = item.billRowid || ''
  
  if (!billRowid) {
    uni.showToast({ title: '单据ID不存在', icon: 'none' })
    return
  }
  
  try {
    uni.showLoading({ title: '处理中...' })
    const result = await http.post('https://www.dachen.vip/api/workflow/hooks/Njk3MWMwODkwZjBkMGFkODBmMjhjOGU1', {
      billRowid: billRowid
    })
    uni.hideLoading()
    
    if (result.status === 1) {
      uni.showToast({ title: result.msg || '操作失败', icon: 'none' })
      return
    }
    
    uni.showToast({ title: '操作成功' })
    // 刷新数据，确保数据更新
    setTimeout(async () => {
      await search()
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    console.error('使用正常工序失败:', error)
    uni.showToast({ title: '操作失败：' + (error.message || '未知错误'), icon: 'none' })
  }
}

// 首检提醒
const sendFirstCheckReminder = async (item) => {
  const orderCode = item?.orderCode || ''
  const productName = item?.name || ''
  const productionCode = item?.productionCode || ''

  if (!orderCode) {
    uni.showToast({ title: '订单编号不存在', icon: 'none' })
    return
  }
  if (!productName) {
    uni.showToast({ title: '产品名称不存在', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '发送中...' })
    const result = await http.post(FIRST_CHECK_REMIND_HOOK, {
      orderCode,
      productName,
      productionCode,
      workshop: workshop.value || ''
    })
    uni.hideLoading()

    if (result.status === 1) {
      uni.showToast({ title: result.msg || '发送失败', icon: 'none' })
      return
    }

    uni.showToast({ title: '首检提醒已发送' })
  } catch (error) {
    uni.hideLoading()
    console.error('首检提醒发送失败:', error)
    uni.showToast({ title: '发送失败：' + (error.message || '未知错误'), icon: 'none' })
  }
}

// 打开删除工序确认模态框
const deleteProcess = () => {
  const processRowid = selectedProcessData.value?.process?.rowid || ''
  if (!processRowid) {
    uni.showToast({ title: '工序ID不存在', icon: 'none' })
    return
  }
  showDeleteConfirmModal.value = true
}

const closeDeleteConfirmModal = () => {
  showDeleteConfirmModal.value = false
}

// 确认删除工序
const confirmDeleteProcess = async () => {
  const processRowid = selectedProcessData.value?.process?.rowid || ''
  if (!processRowid) {
    uni.showToast({ title: '工序ID不存在', icon: 'none' })
    return
  }
  try {
    uni.showLoading({ title: '删除中...' })
    const result = await http.post('https://www.dachen.vip/api/workflow/hooks/Njk3MWNkY2UwZjBkMGFkODBmMmE3NGM3', {
      rowid: processRowid
    })
    uni.hideLoading()

    if (result.status === 1) {
      uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
      return
    }

    uni.showToast({ title: '删除成功' })
    showDeleteConfirmModal.value = false
    showProcessModal.value = false
    setTimeout(async () => {
      await search()
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    console.error('删除工序失败:', error)
    uni.showToast({ title: '删除失败：' + (error.message || '未知错误'), icon: 'none' })
  }
}

// 左箭头固定返回到选择产品页面
const quit = () => {
  const bt = billTypeFilter.value || '正常排产'
  const readonlyPart = isBillTypeReadonly.value ? '&billTypeReadonly=1' : ''
  const modePart = `&dispatchMode=${dispatchMode.value || 'order'}`
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.redirectTo({
        url: `/pages/selectProduct/selectProduct?workshop=${encodeURIComponent(
          workshop.value || ''
        )}&orderCode=${encodeURIComponent(selectedOrderCode.value || '')}&billTypeIndex=${billTypeIndex.value}&billType=${encodeURIComponent(bt)}${modePart}${readonlyPart}`
      })
    }
  })
}

// ==================== Watch监听器 ====================
// 监听派工数量变化，验证并计算派工工时
watch(() => processDispatchData.value.quantity, (newVal) => {
  if (dispatchMode.value === 'product') return
  const maxQty = maxQuantity.value
  // 允许的最大数量：不能超过需派工数量（不再限制日产量）
  if (newVal > maxQty) {
    uni.showToast({ title: `数量不能超过需派工数量 ${maxQty}`, icon: 'none' })
    processDispatchData.value.quantity = maxQty
    return
  } else if (newVal < 0) {
    processDispatchData.value.quantity = 0
  }
  
  // 自动计算派工工时：派工数量 / 小时产量（从工序数据中获取）
  calculateWorkTime()
})

// 产品派工：列表中每单数量变化时，合计派工工时（各单行 qty/小时产量 之和）
watch(
  [productDispatchModalProcessRows, productDispatchQtyByBillKey, showProcessModal],
  () => {
    if (dispatchMode.value !== 'product' || !showProcessModal.value) return
    let t = 0
    for (const r of productDispatchModalProcessRows.value) {
      const q = Number(productDispatchQtyByBillKey[r.billKey]) || 0
      const h = Number(r.hourlyoutput) || 0
      if (h > 0 && q > 0) t += q / h
    }
    processDispatchData.value.time = parseFloat(t.toFixed(2))
  },
  { deep: true }
)

// 计算派工工时
const calculateWorkTime = () => {
  const quantity = processDispatchData.value.quantity || 0
  // 从工序数据中获取小时产量
  const hourlyOutput = selectedProcessData.value?.process?.hourlyoutput || 0
  
  if (hourlyOutput > 0 && quantity > 0) {
    // 保留2位小数
    processDispatchData.value.time = parseFloat((quantity / hourlyOutput).toFixed(2))
  } else {
    processDispatchData.value.time = 0
  }
}

// ==================== 生命周期钩子 ====================
onLoad((options) => {
  // 排产类型：优先选择产品页传入的 billType；兼容历史参数 type（如选择订单链）
  const applyBillTypeParam = (raw) => {
    if (raw == null || raw === '') return
    const type = decodeURIComponent(String(raw))
    if (type === '正常排产' || type === '返工排产') {
      billTypeFilter.value = type
      const index = billTypeOptions.value.indexOf(type)
      billTypeIndex.value = index >= 0 ? index : 0
    }
  }
  if (options && options.billType) {
    applyBillTypeParam(options.billType)
  } else if (options && options.type) {
    applyBillTypeParam(options.type)
  }
  if (options && options.billTypeIndex !== undefined && options.billTypeIndex !== '') {
    const idx = Number(options.billTypeIndex)
    if (Number.isFinite(idx) && idx >= 0 && idx < billTypeOptions.value.length) {
      billTypeIndex.value = idx
      billTypeFilter.value = billTypeOptions.value[idx]
    }
  }
  const readonlyFlag = String(options?.billTypeReadonly || '')
  isBillTypeReadonly.value = readonlyFlag === '1' || readonlyFlag.toLowerCase() === 'true'
  const mode = String(options?.dispatchMode || '').trim()
  dispatchMode.value = mode === 'product' ? 'product' : 'order'
  if (options && options.selectedProducts) {
    try {
      const parsed = JSON.parse(decodeURIComponent(options.selectedProducts))
      if (Array.isArray(parsed)) {
        selectedProductHeaders.value = parsed.map(x => ({
          orderCode: x?.orderCode || '',
          productionCode: x?.productionCode || '',
          name: x?.name || '',
          orderCount: x?.orderCount
        }))
        // 产品派工模式：不再回填首条作为接口筛选条件，避免只显示第一条单据
        selectedOrderCode.value = ''
        selectedProductionCode.value = ''
        searchValue.value = ''
        searchForm.value.salesOrder = ''
      }
    } catch (e) {
      selectedProductHeaders.value = []
    }
  }

  // 从选择订单页进入时：将订单号填入销售订单搜索框，onShow 中会执行 search() 按该订单号过滤列表
  if (dispatchMode.value !== 'product' && options && options.orderCode) {
    const orderCode = decodeURIComponent(options.orderCode)
    selectedOrderCode.value = orderCode
    searchValue.value = orderCode
    searchForm.value.salesOrder = orderCode
  }
  if (dispatchMode.value !== 'product' && options && options.productionCode) {
    selectedProductionCode.value = decodeURIComponent(options.productionCode)
  }
  // 从选择产品页面带入的产品名称，用于初始化 orderItem 搜索条件
  if (dispatchMode.value !== 'product' && options && options.orderItem) {
    const orderItem = decodeURIComponent(options.orderItem)
    searchForm.value.orderItem = orderItem
  }

  // 检查仓库中的权限字段（车间）
  if (userStore.loginLimits && userStore.loginLimits.trim()) {
    workshop.value = userStore.loginLimits
    isWorkshopLocked.value = true // 锁定车间，不允许修改
  }

  uni.$on('processAdded', (data) => {
    // 事件已接收，刷新由 onShow 处理
  })
  uni.$on('clearDispatchData', () => {
    searchValue.value = ''
    billsList.value = []
    processList.value = []
    selectedProcess.value = null
    productDispatchProcessSyncKey.value = null
    selectedMultiProcesses.value = []
  })
})

onShow(() => {
  // 每次显示页面时也检查一次权限字段（车间）
  if (userStore.loginLimits && userStore.loginLimits.trim()) {
    if (workshop.value !== userStore.loginLimits) {
      workshop.value = userStore.loginLimits
    }
    if (!isWorkshopLocked.value) {
      isWorkshopLocked.value = true
    }
  }
  
  // 页面展示时，根据当前车间与排产类型加载所有符合条件的单据和工序
  setTimeout(() => {
    search()
  }, 500)
})

onUnload(() => {
  uni.$off('processAdded')
  uni.$off('clearDispatchData')
})
</script>

<style scoped lang="scss">
/* 整体容器样式 */
.process-container {
  min-height: 100vh;
  width: 100vw;
  background-color: #f0f0f0;

  /* 导航栏样式 */
  .header {
    height: px2vw(100px);
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #5884f1;
    position: relative;

    image {
      margin: px2vw(20px);
      height: px2vw(60px);
      width: px2vw(60px);
    }

    .title {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      margin-left: 0;
      font-size: px2vw(35px);
      color: white;
    }

    .header-tag-wrap {
      position: relative;
      z-index: 2;
      margin-left: auto;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding-right: px2vw(16px);
      min-width: px2vw(100px);
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .dispatch-mode-tag {
      font-size: px2vw(22px);
      color: #fff;
      padding: px2vw(6px) px2vw(14px);
      border-radius: px2vw(10px);
      background: rgba(255, 255, 255, 0.2);
      border: px2vw(1px) solid rgba(255, 255, 255, 0.45);
      white-space: nowrap;
    }

    .dispatch-mode-tag.is-order {
      background: rgba(255, 255, 255, 0.18);
    }

    .dispatch-mode-tag.is-product {
      background: rgba(255, 193, 7, 0.35);
      border-color: rgba(255, 224, 130, 0.85);
    }
  }

  /* 按钮栏：按可见按钮数量均分整行（组装/喷涂 3 个含多对多查询、其它车间 2 个） */
  .btn-list {
    height: px2vw(120px);
    width: 100%;
    display: flex;
    align-items: center;
    box-sizing: border-box;

    .btn-item {
      flex: 1;
      min-width: 0;
      height: px2vw(80px);
      margin: px2vw(10px);
      padding: px2vw(16px) px2vw(25px);
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: px2vw(18px);
      color: #fff;
      background-color: #2755f1;
      font-size: px2vw(25px);
      box-sizing: border-box;
      
      &.btn-item-disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
      }
    }
  }

  /* 顶部排产类型按钮样式（与按钮一致） */
  .bill-type-btn {
    padding: 0;
    box-sizing: border-box;

    picker {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bill-type-text {
      font-size: px2vw(25px);
      color: #fff;
      text-align: center;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  /* 搜索区域样式 */
  .search-box {
    display: flex;
    align-items: center;
    width: 100%;
    background-color: #fff;
    height: px2vw(100px);
    padding: px2vw(15px) px2vw(20px);
    box-sizing: border-box;
    margin: px2vw(10px) px2vw(10px);
    border-radius: px2vw(18px);
    justify-content: space-between;
    gap: px2vw(10px);

    .info-item {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 px2vw(10px);

      .info-label {
        font-size: px2vw(24px);
        color: #666;
        margin-bottom: px2vw(4px);
        white-space: nowrap;
      }

      .info-value {
        font-size: px2vw(26px);
        color: #333;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    &.multi {
      height: auto;
      flex-direction: column;
      align-items: stretch;
      gap: px2vw(8px);

      .info-row {
        display: flex;
        align-items: center;
        gap: px2vw(10px);
        width: 100%;
      }
    }
  }

  /* 订单列表样式 */
  .orderList {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background-color: #f0f0f0;

    .orderItem {
      width: 98%;
      background-color: #fff;
      border-radius: px2vw(18px);
      margin: px2vw(10px);
      padding: px2vw(15px);
      display: flex;
      position: relative;

      .goodsInfo {
        width: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 1;

        .goodsInfo-up {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .orderGoods {
            display: flex;
            margin: 0 px2vw(20px);
            align-items: center;
          }

          .order-label {
            width: px2vw(120px);
            font-size: px2vw(30px);
            color: #5884f1;
            border: px2vw(2px) solid #5884f1;
            padding: px2vw(8px) 0;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: px2vw(8px);
            margin-right: px2vw(8px);
          }

          .order-number {
            height: px2vw(60px);
            padding: px2vw(8px) 0;
            border-radius: px2vw(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: px2vw(25px);
            margin-left: px2vw(8px);
            background: white;
          }

          .status-indicator {
            display: flex;
            align-items: center;
            gap: px2vw(20px);
            margin: 0 px2vw(20px);

            .status-item {
              display: flex;
              align-items: center;
              gap: px2vw(8px);

              .status-color {
                width: px2vw(20px);
                height: px2vw(20px);
                border-radius: px2vw(4px);

                &.normal {
                  background-color: #4CAF50;
                }

                &.terminated {
                  background-color: #f44336;
                }
              }

              .status-text {
                font-size: px2vw(22px);
                color: #333;
              }
            }
          }

          .buttons {
            display: flex;
            gap: px2vw(10px);
            align-items: center;

            .rework-btns-wrap {
              display: flex;
              flex-direction: row;
              gap: px2vw(10px);
              align-items: center;
            }

            button {
              width: px2vw(150px);
              padding: 0;
              font-size: px2vw(28px);
              border-radius: px2vw(8px);
              border: px2vw(2px) solid #5884f1;
              color: #5884f1;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;

              &.btn-dispatch {
                background: white;
                color: #5884f1;
              }
              
              &.btn-normal-process {
                width: px2vw(200px);
                background: white;
                color: #5884f1;
              }

              &.btn-first-check {
                width: px2vw(180px);
                background: #fff7e6;
                color: #d46b08;
                border-color: #d46b08;
              }

              &.btn-rework-complete {
                width: px2vw(180px);
                background: #fff7e6;
                color: #d46b08;
                border-color: #d46b08;
              }

              &.btn-rework-start {
                width: px2vw(180px);
                background: #f6ffed;
                color: #389e0d;
                border-color: #52c41a;
              }
              
              &.btn-multi-dispatch {
                width: px2vw(180px);
                background: white;
                color: #5884f1;
                
                &:disabled {
                  background: #f5f5f5;
                  color: #ccc;
                  border-color: #ddd;
                  cursor: not-allowed;
                  opacity: 0.6;
                }
              }

              &.btn-one-to-many {
                width: px2vw(180px);
                background: white;
                color: #5884f1;

                &:disabled {
                  background: #f5f5f5;
                  color: #ccc;
                  border-color: #ddd;
                  cursor: not-allowed;
                  opacity: 0.6;
                }
              }
              
              &.btn-detail:disabled {
                background: #f5f5f5;
                color: #ccc;
                border-color: #ddd;
                cursor: not-allowed;
                opacity: 0.6;
              }
            }
          }
        }

        .goodsInfo-down {
          display: flex;
          width: 100%;
          justify-content: space-between;
          margin-top: px2vw(10px);

          .orderItem,
          .orderCount,
          .productionCount,
          .productCode,
          .name {
            font-size: px2vw(25px);
            margin: px2vw(10px) px2vw(20px);
            display: flex;
            align-items: center;
            width: px2vw(400px);
          }
        }

        .models {
          display: flex;
          margin: px2vw(20px) px2vw(20px);
          font-size: px2vw(25px);
          width: px2vw(1800px);
        }

        .bill-qty-row {
          display: flex;
          margin: px2vw(8px) px2vw(20px) px2vw(12px);
          font-size: px2vw(25px);
          width: px2vw(1800px);

          &.rework-qty {
            color: #e6a800;
          }

          &.scrap-qty {
            color: #9e9e9e;
          }
        }

        .problemDescription{
          display: flex;
          margin: px2vw(10px) px2vw(20px);
          font-size: px2vw(25px);
          color: #f44336;
          width: px2vw(800px);
          
          view:first-child {
            font-weight: bold;
            margin-right: px2vw(10px);
            white-space: nowrap;
          }
          
          view:last-child {
            flex: 1;
            word-break: break-word;
          }
        }

        .processes-section {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: px2vw(20px);
          padding: 0 px2vw(20px);
        }

        .processes-container {
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          width: 100%;
          flex-wrap: wrap;
          gap: px2vw(10px);
        }

        .process-wrapper {
          display: flex;
          align-items: center;
          margin: 0;
        }

        .process-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 0;
          position: relative;
          padding: px2vw(11px);
          border-radius: px2vw(12px);
          min-width: px2vw(200px);
          width: px2vw(200px);
          box-sizing: border-box;

          &.process-selected {
            border: px2vw(3px) solid #4CAF50;
          }

          &.process-selected.process-over {
            border-color: #f44336;
          }
          
          &.process-multi-selected {
            border: px2vw(3px) solid #2196F3;
            background-color: rgba(33, 150, 243, 0.1);
          }

          &.process-over {
            .process-sequence {
              color: #f44336 !important;
            }

            .progress-circle {
              background: conic-gradient(#f44336 0%, #f44336 var(--percent), #E0E0E0 var(--percent), #E0E0E0 100%) !important;
            }

            .progress-text {
              color: #f44336 !important;
            }

            .process-name {
              color: #f44336 !important;
            }

            &.process-selected {
              .process-sequence {
                color: #f44336 !important;
              }

              .process-name {
                color: #f44336 !important;
              }
            }
          }
        }

        .process-sequence {
          font-size: px2vw(24px);
          font-weight: bold;
          color: #4CAF50;
          margin-bottom: px2vw(5px);
          min-height: px2vw(30px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-circle {
          width: px2vw(150px);
          height: px2vw(150px);
          border-radius: 50%;
          background: conic-gradient(#4CAF50 0%, #4CAF50 var(--percent), #E0E0E0 var(--percent), #E0E0E0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
        }

        .progress-inner {
          position: absolute;
          width: 88%;
          height: 88%;
          border-radius: 50%;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: px2vw(12px);
          top: 6%;
          left: 6%;
          padding: px2vw(6px) px2vw(4px);
          box-sizing: border-box;
          gap: px2vw(4px);
        }

        .progress-top {
          text-align: center;
          font-size: px2vw(18px);
          font-weight: bold;
          color: #333;
        }

        .progress-divider {
          width: 100%;
          min-height: 2px;
          height: 2px;
          background-color: #ccc;
          flex-shrink: 0;
        }

        .progress-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: px2vw(18px);
          color: #555;
          width: 100%;
        }

        .progress-bottom-divider {
          width: 2px;
          min-width: 2px;
          align-self: stretch;
          min-height: px2vw(14px);
          background-color: #ccc;
          flex-shrink: 0;
        }

        .bottom-left,
        .bottom-right {
          flex: 1;
          text-align: center;
          font-size: px2vw(18px);
        }

        .process-name {
          margin-top: px2vw(10px);
          font-size: px2vw(24px);
          color: #555;
          text-align: center;
          max-width: px2vw(150px);
          word-break: break-word;
        }

        .connector {
          width: px2vw(30px);
          height: px2vw(3px);
          background-color: #ccc;
          margin: 0 px2vw(8px) 0 px2vw(10px);
          position: relative;
          top: px2vw(-10px);
        }
      }
      
      .goodsProcess {
        position: absolute;
        bottom: px2vw(10px);
        right: px2vw(10px);
        flex-shrink: 0;
        z-index: 100;
        pointer-events: none;
        
        .bill-type-badge {
          color: white;
          padding: px2vw(8px) px2vw(16px);
          border-radius: px2vw(8px);
          font-size: px2vw(22px);
          font-weight: bold;
          white-space: nowrap;
          z-index: 100;
          box-shadow: 0 px2vw(2px) px2vw(8px) rgba(0, 0, 0, 0.2);
          
          &.badge-normal {
            background-color: #4CAF50; // 绿色 - 正常排产
          }
          
          &.badge-rework {
            background-color: #FFC107; // 黄色 - 返工排产
            color: white; // 白色文字
          }
        }
      }
    }
  }
}

/* 右下角刷新按钮 */
.fab-refresh {
  position: fixed;
  right: px2vw(40px);
  bottom: px2vw(40px);
  width: px2vw(90px);
  height: px2vw(90px);
  border-radius: 50%;
  background-color: #5884f1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 px2vw(4px) px2vw(10px) rgba(0, 0, 0, 0.15);
  z-index: 150;
}

.fab-refresh-text {
  color: #fff;
  font-size: px2vw(52px);
}

/* 派工确认模态框样式 */
.dispatch-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 220;

  .dispatch-confirm-content {
    width: 88%;
    max-width: px2vw(900px);
    background: #fff;
    border-radius: px2vw(18px);
    padding: px2vw(28px) px2vw(32px);
    box-sizing: border-box;
  }

  .dispatch-confirm-title {
    text-align: center;
    font-size: px2vw(40px);
    font-weight: bold;
    color: #333;
    margin-bottom: px2vw(20px);
  }

  .dispatch-confirm-list {
    display: flex;
    flex-direction: column;
    gap: px2vw(12px);
  }

  .dispatch-confirm-row {
    display: flex;
    align-items: flex-start;
    font-size: px2vw(34px);
    line-height: 1.4;
  }

  .dispatch-confirm-label {
    color: #333;
    white-space: nowrap;
  }

  .dispatch-confirm-value {
    color: #f44336;
    font-weight: bold;
    word-break: break-all;
  }

  .dispatch-confirm-tip {
    margin-top: px2vw(20px);
    text-align: center;
    font-size: px2vw(36px);
    font-weight: bold;
    color: #333;
  }

  .dispatch-confirm-footer {
    margin-top: px2vw(26px);
    display: flex;
    justify-content: center;
    gap: px2vw(18px);

    .btn-cancel,
    .btn-confirm {
      width: px2vw(220px);
      height: px2vw(74px);
      border-radius: px2vw(18px);
      font-size: px2vw(32px);
      border: none;
    }

    .btn-cancel {
      background: #f5f5f5;
      color: #666;
    }

    .btn-confirm {
      background: #5884f1;
      color: #fff;
    }
  }
}

/* 删除工序确认模态框（需盖在工序派工弹窗之上） */
.delete-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 250;
  padding: px2vw(20px);
  box-sizing: border-box;

  .delete-confirm-content {
    background: white;
    border-radius: px2vw(18px);
    width: 90%;
    max-width: px2vw(900px);
    height: auto;
    max-height: 90vh;
    box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .delete-confirm-body {
      padding: px2vw(40px) px2vw(30px) px2vw(20px);
      flex: 1;
      overflow-y: auto;
      min-height: 0;

      .delete-confirm-tip {
        font-size: px2vw(32px);
        color: #333;
        text-align: center;
        font-weight: bold;
        line-height: 1.5;
        word-break: break-word;
      }
    }

    .delete-confirm-footer {
      display: flex;
      justify-content: center;
      gap: px2vw(20px);
      padding: px2vw(20px) px2vw(30px);
      border-top: px2vw(1px) solid #eee;
      flex-shrink: 0;

      .btn-cancel,
      .btn-delete-confirm {
        flex: 1;
        max-width: px2vw(250px);
        height: px2vw(70px);
        border-radius: px2vw(18px);
        font-size: px2vw(30px);
        border: none;
        cursor: pointer;
      }

      .btn-cancel {
        background: #f5f5f5;
        color: #666;
      }

      .btn-delete-confirm {
        background: #f44336;
        color: white;
      }
    }
  }
}

/* 终止派工模态框样式 */
.terminate-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  padding: px2vw(20px);
  box-sizing: border-box;

  .terminate-content {
    background: white;
    border-radius: px2vw(18px); 
    width: 90%;
    max-width: px2vw(900px);
    height: auto;
    max-height: 90vh;
    box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .terminate-body {
      padding: px2vw(40px) px2vw(30px) px2vw(20px);
      flex: 1;
      overflow-y: auto;
      min-height: 0;

      .terminate-tip {
        font-size: px2vw(32px);
        color: #333;
        margin-bottom: px2vw(30px);
        text-align: center;
        font-weight: bold;
        line-height: 1.5;
        word-break: break-word;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: px2vw(15px);

        .label {
          font-size: px2vw(30px);
          color: #333;
          font-weight: bold;
        }

        .terminate-textarea {
          width: 100%;
          min-height: px2vw(120px);
          padding: px2vw(15px);
          border: px2vw(2px) solid #ddd;
          border-radius: px2vw(8px);
          font-size: px2vw(28px);
          box-sizing: border-box;
          resize: none;
          line-height: 1.5;

          &:focus {
            border-color: #5884f1;
            outline: none;
          }

          &::placeholder {
            color: #999;
          }
        }
      }
    }

    .terminate-footer {
      display: flex;
      justify-content: center;
      gap: px2vw(20px);
      padding: px2vw(20px) px2vw(30px);
      border-top: px2vw(1px) solid #eee;
      flex-shrink: 0;

      .btn-cancel,
      .btn-confirm {
        flex: 1;
        max-width: px2vw(250px);
        height: px2vw(70px);
        border-radius: px2vw(18px);
        font-size: px2vw(30px);
        border: none;
        cursor: pointer;
      }

      .btn-cancel {
        background: #f5f5f5;
        color: #666;
      }

      .btn-confirm {
        background: #5884f1;
        color: white;
        
        &:disabled {
          background: #ccc;
          color: #999;
          cursor: not-allowed;
          opacity: 0.6;
        }
      }
    }
  }
}

/* 返工完成模态框 */
.rework-complete-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  padding: px2vw(20px);
  box-sizing: border-box;

  .rework-complete-content {
    background: white;
    border-radius: px2vw(18px);
    width: 90%;
    max-width: px2vw(900px);
    box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .rework-complete-title {
    padding: px2vw(28px) px2vw(30px) px2vw(12px);
    font-size: px2vw(34px);
    font-weight: bold;
    color: #333;
    text-align: center;
  }

  .rework-complete-body {
    padding: px2vw(10px) px2vw(30px) px2vw(24px);
    display: flex;
    flex-direction: column;
    gap: px2vw(28px);
  }

  .rework-complete-row {
    display: flex;
    flex-direction: column;
    gap: px2vw(16px);
  }

  .rework-complete-label {
    font-size: px2vw(28px);
    color: #333;
    font-weight: bold;
  }

  .rework-complete-radio-group {
    display: flex;
    flex-direction: row;
    gap: px2vw(40px);
    align-items: center;
  }

  .rework-complete-radio-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: px2vw(10px);
    font-size: px2vw(28px);
    color: #333;
  }

  .rework-complete-picker {
    min-height: px2vw(72px);
    padding: px2vw(16px) px2vw(20px);
    border: px2vw(2px) solid #ddd;
    border-radius: px2vw(12px);
    font-size: px2vw(28px);
    color: #333;
    background: #fafafa;

    &.is-disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }

  .rework-complete-footer {
    display: flex;
    justify-content: center;
    gap: px2vw(20px);
    padding: px2vw(20px) px2vw(30px) px2vw(28px);
    border-top: px2vw(1px) solid #eee;

    .btn-cancel,
    .btn-confirm {
      flex: 1;
      max-width: px2vw(280px);
      height: px2vw(72px);
      border-radius: px2vw(18px);
      font-size: px2vw(30px);
      border: none;
    }

    .btn-cancel {
      background: #f5f5f5;
      color: #666;
    }

    .btn-confirm {
      background: #5884f1;
      color: #fff;
    }
  }
}

/* 合并工序模态框 */
.rework-start-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  padding: px2vw(20px);
  box-sizing: border-box;

  .rework-start-content {
    background: white;
    border-radius: px2vw(18px);
    width: 90%;
    max-width: px2vw(900px);
    /* 固定高度，flex 子项才能分到中间区域；仅 max-height 时容器随内容增高，列表区高度为 0，scroll-view 无法滚动 */
    height: 75vh;
    max-height: 82vh;
    box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .rework-start-title {
    padding: px2vw(28px) px2vw(30px) px2vw(12px);
    font-size: px2vw(34px);
    font-weight: bold;
    color: #333;
    text-align: center;
    flex-shrink: 0;
  }

  .merge-process-search {
    padding: 0 px2vw(24px) px2vw(16px);
    flex-shrink: 0;
  }

  .merge-process-search-input {
    width: 100%;
    height: px2vw(72px);
    padding: 0 px2vw(20px);
    font-size: px2vw(28px);
    border: px2vw(1px) solid #e0e0e0;
    border-radius: px2vw(12px);
    box-sizing: border-box;
  }

  /* 占满标题与底部条之间的剩余高度；内部 scroll-view 绝对铺满，满足 uni-app 对 scroll-view 固定高度的要求 */
  .merge-process-list-wrap {
    flex: 1;
    min-height: 0;
    position: relative;
    z-index: 1;
    overflow: hidden;
  }

  .merge-process-scroll {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    padding: px2vw(8px) px2vw(24px) px2vw(12px);
    box-sizing: border-box;
    background: #f5f6f8;
    border-radius: px2vw(12px);
  }

  /* 叠在列表之上，避免工序列表盖住按钮 */
  .merge-process-footer-bar {
    flex-shrink: 0;
    position: relative;
    z-index: 20;
    width: 100%;
    background: #ffffff;
    box-sizing: border-box;
    padding: px2vw(16px) px2vw(24px) px2vw(24px);
    border-top: px2vw(1px) solid #e8e8e8;
    box-shadow: 0 px2vw(-6px) px2vw(20px) rgba(0, 0, 0, 0.08);
  }

  .merge-process-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: px2vw(16px);
    padding: px2vw(20px) px2vw(16px);
    margin-bottom: px2vw(12px);
    border-radius: px2vw(12px);
    border: px2vw(1px) solid #eee;
    background: #fafafa;
  }

  .merge-process-row.selected {
    border-color: #5884f1;
    background: #eef3ff;
  }

  .merge-process-check {
    width: px2vw(40px);
    height: px2vw(40px);
    line-height: px2vw(40px);
    text-align: center;
    font-size: px2vw(28px);
    color: #5884f1;
    font-weight: bold;
  }

  .merge-process-name {
    flex: 1;
    font-size: px2vw(28px);
    color: #333;
  }

  .merge-process-tip {
    text-align: center;
    font-size: px2vw(24px);
    color: #999;
    padding: px2vw(16px) 0;
  }

  .rework-start-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: px2vw(20px);
    padding: 0;
    border-top: none;

    .btn-cancel,
    .btn-confirm,
    .btn-merge {
      flex: 1;
      max-width: px2vw(280px);
      height: px2vw(72px);
      border-radius: px2vw(18px);
      font-size: px2vw(30px);
      border: none;
    }

    .btn-cancel {
      background: #f5f5f5;
      color: #666;
    }

    .btn-confirm {
      background: #5884f1;
      color: #fff;
    }

    .btn-merge {
      background: #2e7d32;
      color: #fff;
    }
  }
}

/* 工序派工模态样式 */
.process-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;

  .process-content {
    background: white;
    border-radius: px2vw(18px);
    width: 90%;
    width: px2vw(1400px);
    height: px2vw(700px);
    box-shadow: 0 px2vw(5px) px2vw(15px) rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;

    &.one-to-many-content {
      height: px2vw(880px);
      max-height: 90vh;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: px2vw(30px) px2vw(40px);
      border-bottom: px2vw(2px) solid #eee;
      font-size: px2vw(35px);
      color: #333;
      position: relative;
      flex-shrink: 0;
    }
  }
}

.modal-title {
  font-weight: bold;
  font-size: px2vw(35px);
  color: #333;
  flex: 1;
  text-align: center;
}

.modal-close {
  position: absolute;
  right: px2vw(40px);
  top: 50%;
  transform: translateY(-50%);
  width: px2vw(60px);
  height: px2vw(60px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: px2vw(50px);
  color: #999;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;
  line-height: 1;
  
  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }
  
  &:active {
    background-color: #e0e0e0;
  }
}

/* 可滚动内容区域 */
.modal-scroll-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 模态主体样式 */
.modal-body {
  padding: px2vw(20px) px2vw(20px) px2vw(10px) px2vw(20px);
  display: flex;
  flex-direction: column;
  gap: px2vw(10px);

  &.modal-body--product-grid {
    display: block;
  }
}

/* 产品派工：固定两列网格，标题与控件固定高度（与列表卡片对齐风格一致） */
.modal-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: px2vw(20px);
  row-gap: px2vw(16px);
  width: 100%;
  box-sizing: border-box;
}

.modal-grid-cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: px2vw(10px);
  min-width: 0;
}

.modal-grid-label {
  flex: 0 0 px2vw(168px);
  width: px2vw(168px);
  font-size: px2vw(28px);
  color: #666;
  font-weight: bold;
  line-height: 1.25;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-grid-value {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  width: auto;
  height: px2vw(56px);
  min-height: px2vw(56px);
  padding: 0 px2vw(12px);
  font-size: px2vw(28px);
  color: #333;
  background: #f9f9f9;
  border: px2vw(1px) solid #eee;
  border-radius: px2vw(8px);
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-grid-picker {
  flex: 1;
  min-width: 0;
  width: auto;
  display: block;
  box-sizing: border-box;

  .modal-grid-value {
    width: 100%;
  }
}

/* 产品派工：工序弹窗顶部汇总表 */
.product-dispatch-modal-summary {
  margin: px2vw(16px) px2vw(20px) px2vw(8px);
  padding: px2vw(12px) px2vw(16px);
  background: #f7f8fa;
  border-radius: px2vw(12px);
  border: px2vw(1px) solid #e8eaed;

  .product-dispatch-summary-header,
  .product-dispatch-summary-row {
    display: flex;
    align-items: center;
    gap: px2vw(8px);
  }

  .product-dispatch-summary-header {
    padding-bottom: px2vw(10px);
    margin-bottom: px2vw(8px);
    border-bottom: px2vw(1px) solid #dde1e6;
    font-size: px2vw(24px);
    color: #666;
    font-weight: 500;
  }

  .product-dispatch-summary-row {
    font-size: px2vw(26px);
    color: #333;
    padding: px2vw(8px) 0;
    border-bottom: px2vw(1px) solid #eee;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  .col {
    min-width: 0;
    word-break: break-all;

    &.order {
      flex: 1.4;
    }

    &.num {
      flex: 0.85;
      text-align: right;
    }

    &.qty-head {
      flex: 0.95;
      text-align: right;
      font-size: px2vw(24px);
    }

    &.qty-col {
      flex: 0.95;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    &.time-col {
      flex: 0.72;
      text-align: right;
      font-size: px2vw(24px);
      color: #333;
    }
  }

  .product-modal-qty-input {
    width: 100%;
    max-width: px2vw(140px);
    min-width: px2vw(72px);
    height: px2vw(52px);
    padding: 0 px2vw(8px);
    font-size: px2vw(24px);
    text-align: right;
    border: px2vw(1px) solid #ccc;
    border-radius: px2vw(8px);
    box-sizing: border-box;
    background: #fff;
  }

  .product-dispatch-summary-footer {
    display: flex;
    align-items: center;
    gap: px2vw(8px);
    margin-top: px2vw(10px);
    padding-top: px2vw(12px);
    border-top: px2vw(2px) solid #dde1e6;

    .footer-label {
      font-size: px2vw(26px);
      font-weight: 600;
      color: #333;
    }

    .footer-total {
      font-size: px2vw(28px);
      font-weight: 600;
      color: #5884f1;
      text-align: right;
      width: 100%;
      max-width: px2vw(140px);
    }

    &.hours {
      margin-top: px2vw(6px);
      padding-top: px2vw(8px);
      border-top: none;

      .footer-total {
        color: #5884f1;
        font-weight: 600;
      }
    }

    &.wage {
      margin-top: px2vw(6px);
      padding-top: px2vw(8px);
      border-top: none;

      .footer-total {
        color: #2e7d32;
      }
    }
  }
}

/* 多对多派工模态：顶部汇总表（订单、排产/返工、派工数量） */
.multi-dispatch-modal-summary {
  margin: px2vw(16px) px2vw(20px) px2vw(8px);
  padding: px2vw(12px) px2vw(16px);
  background: #f7f8fa;
  border-radius: px2vw(12px);
  border: px2vw(1px) solid #e8eaed;

  .multi-dispatch-summary-header,
  .multi-dispatch-summary-row {
    display: flex;
    align-items: center;
    gap: px2vw(8px);
  }

  .multi-dispatch-summary-header {
    padding-bottom: px2vw(10px);
    margin-bottom: px2vw(8px);
    border-bottom: px2vw(1px) solid #dde1e6;
    font-size: px2vw(24px);
    color: #666;
    font-weight: 500;
  }

  .multi-dispatch-summary-row {
    font-size: px2vw(26px);
    color: #333;
    padding: px2vw(8px) 0;
    border-bottom: px2vw(1px) solid #eee;
  }

  .multi-dispatch-summary-total-row {
    display: flex;
    align-items: center;
    gap: px2vw(8px);
    margin-top: px2vw(8px);
    padding-top: px2vw(12px);
    border-top: px2vw(2px) solid #dde1e6;
    font-size: px2vw(26px);
    font-weight: 600;
    color: #333;

    .total-qty {
      color: #2e7d32;
      text-align: right;
    }
  }

  .col {
    min-width: 0;
    word-break: break-all;

    &.order {
      flex: 1.2;
    }

    &.prod {
      flex: 1;
      text-align: right;
    }

    &.qty-head {
      flex: 0.95;
      text-align: right;
      font-size: px2vw(24px);
    }

    &.qty-col {
      flex: 0.95;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
  }

  .multi-dispatch-qty-input {
    width: 100%;
    max-width: px2vw(140px);
    min-width: px2vw(72px);
    height: px2vw(52px);
    padding: 0 px2vw(8px);
    font-size: px2vw(24px);
    text-align: right;
    border: px2vw(1px) solid #ccc;
    border-radius: px2vw(8px);
    box-sizing: border-box;
    background: #fff;
  }
}

/* 一对多派工：每行四列（工序宽、后三列数值框短） */
.one-to-many-process-row {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: px2vw(8px);
  margin-bottom: px2vw(8px);
  padding-bottom: px2vw(12px);
  border-bottom: px2vw(1px) solid #eee;
  align-items: flex-end;

  /* 工序名称：占宽一些 */
  .one-to-many-col-process {
    flex: 2.2 1 0;
    min-width: px2vw(320px);

    .label {
      width: px2vw(88px);
    }

    .one-to-many-value {
      flex: 1;
      min-width: 0;
      width: auto !important;
      max-width: none !important;
    }
  }

  /* 排产 / 可派工 / 派工数量：框缩短；边距略紧 */
  .form-group.one-to-many-col-num {
    flex: 0 1 auto;
    min-width: px2vw(200px);
    max-width: px2vw(275px);
    justify-content: flex-start !important;
    align-items: center;
    gap: px2vw(6px);

    .label {
      flex-shrink: 0;
      width: auto;
      min-width: px2vw(136px);
      max-width: px2vw(156px);
      font-size: px2vw(26px);
      white-space: nowrap;
    }

    .one-to-many-value-short {
      flex: 0 0 auto;
      width: px2vw(120px) !important;
      max-width: px2vw(120px) !important;
      min-width: px2vw(72px);
      margin-right: px2vw(4px);
      padding-left: px2vw(6px);
      padding-right: px2vw(6px);
      text-align: center;
      box-sizing: border-box;
    } 

    .one-to-many-qty-input {
      flex: 0 0 auto;
      width: px2vw(120px) !important;
      max-width: px2vw(120px);
      min-width: px2vw(72px);
      margin-left: px2vw(6px);
      box-sizing: border-box;
    }
  }

  /* 「可派工数量」列略宽于前两列，数值框多留一点缝即可 */
  .form-group.one-to-many-col-num.one-to-many-col-need {
    min-width: px2vw(228px);
  }
}

.row-group {
  display: flex;
  gap: px2vw(10px);
  width: 100%;

  &.single .form-group.full {
    width: 100%;
  }
}

.form-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: px2vw(10px);
  flex: 1;

  &.full {
    width: 100%;
  }

  &.full.second-column {
    margin-left: 50%;
    width: 50%;
    justify-content: space-between;
  }

  @media (max-width: #{px2vw(750px)}) {
    flex-direction: column;
    align-items: flex-start;
    gap: px2vw(5px);
    justify-content: flex-start;
  }

  .label {
    font-size: px2vw(30px);
    color: #666;
    font-weight: bold;
    width: px2vw(120px);
    white-space: nowrap;
    flex-shrink: 0;
    text-align: left;
  }

  .value {
    width: px2vw(400px);
    font-size: px2vw(30px);
    color: #333;
    padding: px2vw(8px) px2vw(12px);
    background: #f9f9f9;
    border-radius: px2vw(5px);
    border: px2vw(1px) solid #eee;
    min-height: px2vw(50px);
    display: flex;
    align-items: center;
    box-sizing: border-box;
    cursor: pointer;
  }
  
  .value-readonly {
    width: px2vw(400px);
    font-size: px2vw(30px);
    color: #333;
    padding: px2vw(8px) px2vw(12px);
    background: #f9f9f9;
    border-radius: px2vw(5px);
    border: px2vw(1px) solid #eee;
    min-height: px2vw(50px);
    display: flex;
    align-items: center;
    box-sizing: border-box;
    cursor: default;
  }
  
  picker {
    flex: none;
    display: flex;
    width: px2vw(400px);
  }

  .input-field {
    flex: none;
    width: px2vw(400px);
    flex-shrink: 0;
    height: px2vw(60px);
    padding: px2vw(8px) px2vw(12px);
    border: px2vw(1px) solid #eee;
    border-radius: px2vw(5px);
    background: #f9f9f9;
    font-size: px2vw(30px);
    box-sizing: border-box;

    &[readonly] {
      background: #f5f5f5;
      color: #666;
      cursor: not-allowed;
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: px2vw(10px);
  padding: px2vw(30px) px2vw(40px);
  border-top: px2vw(2px) solid #eee;
  flex-shrink: 0;

  .btn-cancel,
  .btn-confirm,
  .btn-delete-process {
    width: px2vw(200px);
    height: px2vw(70px);
    border-radius: px2vw(18px);
    font-size: px2vw(30px);
    border: none;
    cursor: pointer;
  }

  .btn-cancel {
    background: #f5f5f5;
    color: #666;
  }

  .btn-confirm {
    background: #5884f1;
    color: white;
    
    &:disabled {
      background: #ccc;
      color: #999;
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
  
  .btn-delete-process {
    background: #f44336;
    color: white;
    
    &:hover {
      background: #d32f2f;
    }
    
    &:active {
      background: #b71c1c;
    }
  }
}



/* 员工选择表格样式 */
.employee-section {
  margin-top: px2vw(10px);
  padding: 0 px2vw(20px) px2vw(20px);

  .table-header {
    display: flex;
    background-color: #f5f5f5;
    font-weight: bold;
    padding: px2vw(15px);
    border-bottom: px2vw(2px) solid #eee;
    align-items: center;

    .col {
      font-size: px2vw(30px);
      padding: 0 px2vw(15px);
      text-align: left;

      &.selected {
        width: px2vw(120px);
        text-align: center;
        flex-shrink: 0;
        padding: 0 px2vw(12px);
      }

      &.name {
        flex: 2;
        padding-left: px2vw(20px);
      }

      &.totalHours {
        flex: 1;
        text-align: right;
        padding-right: px2vw(15px);
      }

      &.unrecordedHours {
        flex: 1;
        text-align: right;
        padding-right: px2vw(15px);
      }

      &.hours {
        flex: 1;
        text-align: right;
        padding-right: px2vw(15px);
      }
    }
  }

  .employee-table {
    .table-row {
      display: flex;
      align-items: center;
      padding: px2vw(15px);
      border-bottom: px2vw(1px) solid #eee;
      cursor: pointer;

      &:hover {
        background-color: #f9f9f9;
      }

      .col {
        font-size: px2vw(30px);
        padding: 0 px2vw(15px);
        text-align: left;
        display: flex;
        align-items: center;

        &.selected {
          width: px2vw(120px);
          text-align: center;
          flex-shrink: 0;
          justify-content: center;
          padding: 0 px2vw(12px);
        }

        &.name {
          flex: 2;
          padding-left: px2vw(20px);
        }

        &.totalHours {
          flex: 1;
          text-align: right;
          justify-content: flex-end;
          padding-right: px2vw(15px);
        }

        &.unrecordedHours {
          flex: 1;
          text-align: right;
          justify-content: flex-end;
          padding-right: px2vw(15px);
        }

        &.hours {
          flex: 1;
          text-align: right;
          justify-content: flex-end;
          padding-right: px2vw(15px);
        }
      }
    }
  }
}

/* 工序展示内联样式 */
.processes-display-inline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: px2vw(10px);
  padding: px2vw(10px);
  background-color: #f9f9f9;
  border-radius: px2vw(5px);
  min-height: px2vw(50px);
  flex: 1;
  
  .process-display-inline-wrapper {
    display: flex;
    align-items: center;
  }
  
  .process-display-inline-box {
    padding: px2vw(8px) px2vw(15px);
    background-color: #333;
    border-radius: px2vw(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .process-display-inline-name {
      color: white;
      font-size: px2vw(26px);
      text-align: center;
      white-space: nowrap;
    }
  }
  
  .process-display-connector {
    margin: 0 px2vw(8px);
    color: #333;
    font-size: px2vw(30px);
    font-weight: bold;
  }
}

/* 图片预览模态框样式 */
.image-preview-modal {
  position: fixed;
  top: px2vw(100px);
  left: 0;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;

  .btn-close {
    position: absolute;
    top: px2vw(30px);
    right: px2vw(30px);
    margin-top: 0;
    padding: px2vw(10px) px2vw(30px);
    background-color: #5884f1;
    color: white;
    border: none;
    border-radius: px2vw(8px);
    font-size: px2vw(28px);
    cursor: pointer;
    z-index: 10000;

    &:active {
      background-color: #2755f1;
    }
  }

  .preview-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .preview-swiper {
    width: 100%;
    height: 80vh;
  }

  .swiper-item-inner {
    width: 100%;
    height: 100%;
    min-height: 60vh;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  .preview-image {
    width: 90vw;
    height: 70vh;
    min-width: 200px;
    min-height: 200px;
    display: block;
  }

}
</style>