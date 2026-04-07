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
          <button class="btn-confirm" @click="handleDispatchConfirm">确认派工</button>
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
          <!-- 表单信息区域 -->
          <view class="modal-body">
            <!-- 排产数量（返工排产时显示为返工数量）和派工数量 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">{{ currentMultiDispatchItem?.billType === '返工排产' ? '返工数量' : '排产数量' }}：</text>
                <text class="value-readonly">{{ multiDispatchData.productionCount }}</text>
              </view>
              <view class="form-group">
                <text class="label">派工数量：</text>
                <input v-model.number="multiDispatchData.quantity" type="number" placeholder="请输入数量"
                  min="0" class="input-field" />
              </view>
            </view>
            
            <!-- 派工日期和是否包含最终工序 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">派工日期：</text>
                <picker mode="date" :value="multiDispatchData.date" @change="onMultiDateChange">
                  <view class="value">
                    {{ multiDispatchData.date || '请选择日期' }}
                  </view>
                </picker>
              </view>
              <view class="form-group">
                <text class="label">是否包含最终工序：</text>
                <picker mode="selector" :range="isLastOptions" :value="multiIsLastIndex" @change="onMultiIsLastChange">
                  <view class="value">
                    {{ multiDispatchData.isLast || '请选择' }}
                  </view>
                </picker>
              </view>
            </view>

            <!-- 计薪方式（与上面行布局一致：左侧字段 + 右侧占位） -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">计薪方式：</text>
                <picker mode="selector" :range="salaryMethodOptions" :value="multiSalaryMethodIndex" @change="onMultiSalaryMethodChange">
                  <view class="value">
                    {{ multiDispatchData.salaryMethod || '计件' }}
                  </view>
                </picker>
              </view>
              <view class="form-group"></view>
            </view>
            
            <!-- 所选工序展示 -->
            <view class="row-group">
              <view class="form-group full">
                <text class="label">所选工序：</text>
                <view class="processes-display-inline">
                  <view v-for="(process, index) in selectedMultiProcesses" :key="index" class="process-display-inline-wrapper">
                    <view class="process-display-inline-box">
                      <text class="process-display-inline-name">{{ process.process.processName }}</text>
                    </view>
                    <view v-if="index < selectedMultiProcesses.length - 1" class="process-display-connector">→</view>
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
          <!-- 表单信息区域 -->
          <view class="modal-body">
            <!-- 订单编号和工序名称 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">订单编号：</text>
                <text class="value">{{ selectedProcessData?.item?.orderCode }}</text>
              </view>
              <view class="form-group">
                <text class="label">工序：</text>
                <text class="value">{{ selectedProcessData?.process?.processName }}</text>
              </view>
            </view>
            
            <!-- 已派工数量和待派工数量 -->
            <view class="row-group">
              <view class="form-group">
                <text class="label">已派工数量：</text>
                <text class="value">{{ selectedProcessData?.process?.dispatchedCount }}</text>
              </view>
              <view class="form-group">
                <text class="label">需派工数量：</text>
                <text class="value">{{ selectedProcessData?.process?.needCount }}</text>
              </view>
            </view>
            
            <!-- 本次派工数量和时数 -->
            <view class="row-group">
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
              <view class="form-group">
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
              <view class="form-group">
                <text class="label">工价：</text>
                <input v-model.number="processDispatchData.price" type="number" placeholder="请输入工价"
                  min="0" step="0.01" class="input-field" />
              </view>
            </view>
            
            <!-- 最终工序 -->
            <view class="row-group single">
              <view class="form-group full">
                <text class="label">最终工序：</text>
                <picker mode="selector" :range="isLastOptions" :value="isLastIndex" @change="onIsLastChange">
                  <view class="value">
                    {{ processDispatchData.isLast || '请选择最终工序' }}
                  </view>
                </picker>
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
          <button class="btn-confirm" @click="confirmProcessDispatch" :disabled="!canDispatch">确认派工</button>
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
      <view></view>
    </view>
    
    <!-- 功能按钮栏（排产类型由选择订单/选择产品传入，不再提供顶部切换） -->
    <view class="btn-list">
      <view class="btn-item" @click="goDispatchInquiry">派工查询</view>
      <view class="btn-item" @click="goWorkload">员工工作量查询</view>
      <view class="btn-item" v-if="workshop === '组装车间'" @click="goDispatchInquiryMore">多对多派工查询</view>
    </view>

    <!-- 顶部信息区域：仅展示订单编号 + 生产单号 + 产品名称 -->
    <view class="search-box">
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

    <!-- 单据列表 -->
    <view class="orderList" :key="listKey">
      <view class="orderItem" v-for="item in billsList" :key="item.orderCode">
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
              <button class="btn-detail" :disabled="!canClickDispatch(item)" @click="dispatchWork(item)">操作</button>
              <button class="btn-delete" @click="addProcess(item)">添加工序</button>
              <button class="btn-normal-process" v-if="item.billType === '返工排产'" @click="useNormalProcess(item)">使用正常工序</button>
              <button class="btn-multi-dispatch" v-if="workshop === '组装车间'" :disabled="!canClickMultiDispatch(item)" @click="openMultiDispatchModal(item)">多对多派工</button>
              <button class="btn-one-to-many" v-if="workshop === '抛光车间'" :disabled="!canClickOneToManyDispatch(item)" @click="openOneToManyModal(item)">一对多派工</button>
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
                  'process-multi-selected': (workshop === '组装车间' || workshop === '抛光车间') && isMultiProcessSelected(item, process)
                }"
                @click="(workshop === '组装车间' || workshop === '抛光车间') ? toggleMultiProcess(item, process) : selectProcess(item, process)">
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
  nextTick
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
// 搜索条件：销售订单、订单物品
const searchForm = ref({
  salesOrder: '',
  orderItem: ''
})
// 当前选中的订单号和生产单号（由选择单据页面传入，兼容历史逻辑，不再作为筛选必填项）
const selectedOrderCode = ref('')
const selectedProductionCode = ref('')
const billTypeFilter = ref('正常排产')  // 单据类型过滤参数：正常排产、返工排产（用于获取单据）
// 排产类型下拉选项
const billTypeOptions = ref(['正常排产', '返工排产'])
const billTypeIndex = ref(0)
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

// ---------- 图片预览相关 ----------
const showImagePreview = ref(false)
const previewImageUrls = ref([])   // 多图预览的 URL 列表
const previewImageIndex = ref(0)  // 当前显示的图片下标

// ---------- 工序模态相关 ----------
const showProcessModal = ref(false)
const selectedProcessData = ref(null)
const selectedProcess = ref(null) // 当前选中的工序 { item, process }
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
  orderCount: 0,
  productionCount: 0,
  quantity: 0,
  date: '', // 派工日期
  isLast: '否', // 是否包含最终工序：是、否，默认值为否
  salaryMethod: '计件' // 计薪方式：计件、计时，默认计件
})
const multiIsLastIndex = ref(1) // 多对多派工最终工序索引，默认选中第二个选项（否）
const multiSalaryMethodIndex = ref(0) // 多对多派工计薪方式索引，默认选中计件
const multiEmployeeList = ref([])
const selectedMultiEmployees = ref([])
const currentMultiDispatchItem = ref(null) // 当前多对多派工的单据

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
// 返工完成
const REWORK_COMPLETE_HOOK = 'https://www.dachen.vip/api/workflow/hooks/NjljY2I3ZTEzMzBiMjAyNjg5ODQ1YTYx'
// 合并工序（原返工开始 webhook）
const REWORK_START_HOOK = 'https://www.dachen.vip/api/workflow/hooks/NjljY2MzYjEzMzBiMjAyNjg5ODY0NDg4'

// ==================== 计算属性 ====================
// 最大派工数量：需派工数量
const maxQuantity = computed(() => {
  return selectedProcessData.value?.process?.needCount || 0
})

// 判断是否可以派工：只要需派工数量大于0就可以派工
const canDispatch = computed(() => {
  const needCount = selectedProcessData.value?.process?.needCount || 0
  return needCount > 0
})

// 判断当前工序是否已终止
const isProcessOver = computed(() => {
  return selectedProcessData.value?.process?.isOver === 1
})

// 获取指定订单的选中工序数量
const getSelectedProcessCount = (item) => {
  if (workshop.value === '组装车间' || workshop.value === '抛光车间') {
    // 组装车间、抛光车间：统计多选的工序数量
    return selectedMultiProcesses.value.filter(p => p.item.orderCode === item.orderCode).length
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
  if (workshop.value !== '组装车间') {
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
  // 切换车间时，仅组装/抛光使用多选；离开这两类车间时清空多选状态
  if (value !== '组装车间' && value !== '抛光车间') {
    selectedMultiProcesses.value = []
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

  // 如果有选中的订单号和生产单号，则在接口层按订单号 + 生产单号一起过滤工序
  if (selectedOrderCode.value) {
    filters.push({
      controlId: '6593b07ae97eb866a50eeba1', // 工序中的订单号字段 processOrder
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [selectedOrderCode.value]
    })
  }

  if (selectedProductionCode.value) {
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
  }]

  // 如果有选中的订单号和生产单号，则在接口层按订单号 + 生产单号一起过滤单据
  if (selectedOrderCode.value) {
    filters.push({
      controlId: '655e1cbbbd2094b316347f92', // 单据中的订单号字段
      dataType: 30,
      spliceType: 1,
      filterType: 2,
      values: [selectedOrderCode.value]
    })
  }

  if (selectedProductionCode.value) {
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
  if (workshop.value !== '组装车间' && workshop.value !== '抛光车间') {
    selectedMultiProcesses.value = []
  }

  // 获取单据列表（按车间和单据类型从后端筛选）
  const billsRes = await getBillsListRaw()

  if (!billsRes.data || billsRes.data.length === 0) {
    billsList.value = []
    processList.value = []
    return
  }

  // 固定过滤：
  // 1. 字段 66974cda2503723eec1af600 不能为 "[]"
  // 2. 正常排产：69a8e4563b5e707f84d33c0c 需大于 0
  // 3. 返工排产：不用数量>0；按 69ccb3e7665ab27f39105da2 返工进度排除「已完成」
  const FIELD_REWORK_PROGRESS = '69ccb3e7665ab27f39105da2'
  const isReworkProgressCompleted = (row) => {
    const raw = row[FIELD_REWORK_PROGRESS]
    const p = raw == null ? '' : String(raw).trim()
    return p === '已完成'
  }
  const filteredBillsData = billsRes.data.filter(item => {
    if (item['66974cda2503723eec1af600'] === '[]') return false
    if (billTypeFilter.value === '返工排产') {
      return !isReworkProgressCompleted(item)
    }
    const num = Number(item['69a8e4563b5e707f84d33c0c'])
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
      orderCount: item['681b0b53b139204fd264c5fd'],
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
      reworkMergeFlag: item['69ccaf64665ab27f39105bed']
    }
  })

  if (!baseBills.length) {
    billsList.value = []
    processList.value = []
    return
  }

  // 获取当前单据类型对应的工序列表（按车间 + 工序类型）
  const processRes = await getProcessRaw(billTypeFilter.value)

  if (!processRes.data || processRes.data.length === 0) {
    processList.value = []
  } else {
    const allProcesses = processRes.data.map(item => ({
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
// 选择工序
const selectProcess = (item, process) => {
  if (workshop.value === '组装车间' || workshop.value === '抛光车间') {
    // 组装车间、抛光车间：使用多选逻辑（工序点击处已直接 toggleMultiProcess，此处保留兼容）
    toggleMultiProcess(item, process)
    // 同时更新单选状态，用于兼容
    if (isMultiProcessSelected(item, process)) {
      selectedProcess.value = { item, process }
    } else {
      // 如果取消多选，检查是否还有其他选中的
      const remaining = selectedMultiProcesses.value.find(p => p.item.orderCode === item.orderCode)
      selectedProcess.value = remaining ? { item: remaining.item, process: remaining.process } : null
    }
  } else {
    // 其他车间：使用单选逻辑
    if (isProcessSelected(item, process)) {
      selectedProcess.value = null
    } else {
      selectedProcess.value = { item, process }
    }
  }
}

// 判断工序是否被选中（以订单编码 + 工序 rowid 为基准，避免同名工序全部高亮）
const isProcessSelected = (item, process) => {
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
  return selectedMultiProcesses.value.some(p =>
    p.item.orderCode === item.orderCode && p.process.rowid === process.rowid
  )
}

// 打开多对多派工模态框
const openMultiDispatchModal = (item) => {
  // 检查是否有选中的工序
  if (selectedMultiProcesses.value.length === 0) {
    uni.showToast({ title: '请至少选择一个工序', icon: 'none' })
    return
  }
  
  // 检查选中的工序是否都属于当前订单
  const allFromSameOrder = selectedMultiProcesses.value.every(p => p.item.orderCode === item.orderCode)
  if (!allFromSameOrder) {
    uni.showToast({ title: '请选择同一订单的工序', icon: 'none' })
    return
  }
  
  currentMultiDispatchItem.value = item
  // 初始化日期为今天，格式：YYYY-MM-DD
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  multiDispatchData.value = {
    orderCount: item.orderCount || 0,
    productionCount: getBillProductionQtyForDispatch(item),
    quantity: 0,
    date: todayStr, // 默认今天
    isLast: '否', // 默认值为否
    salaryMethod: '计件'
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
    orderCount: 0,
    productionCount: 0,
    quantity: 0,
    date: '',
    isLast: '否',
    salaryMethod: '计件'
  }
  multiIsLastIndex.value = 1
  multiSalaryMethodIndex.value = 0
  multiEmployeeList.value = []
  selectedMultiEmployees.value = []
  currentMultiDispatchItem.value = null
  modalWorkshop.value = ''
}

// ---------- 一对多派工（仅抛光车间） ----------
const openOneToManyModal = (item) => {
  if (workshop.value !== '抛光车间') {
    uni.showToast({ title: '一对多派工仅适用于抛光车间', icon: 'none' })
    return
  }
  const list = selectedMultiProcesses.value.filter(p => p.item.orderCode === item.orderCode)
  if (list.length < 2) {
    uni.showToast({ title: '请至少选择两个工序', icon: 'none' })
    return
  }
  const allFromSameOrder = list.every(p => p.item.orderCode === item.orderCode)
  if (!allFromSameOrder) {
    uni.showToast({ title: '请选择同一订单的工序', icon: 'none' })
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
      .filter(emp => emp.id)
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

// 多对多派工员工选择变化
const onMultiEmployeeCheckboxChange = (e) => {
  selectedMultiEmployees.value = e.detail.value || []
}

// 判断员工是否被选中（多对多派工）
const isMultiEmployeeSelected = (employeeId) => {
  return selectedMultiEmployees.value.includes(employeeId)
}

// 判断是否可以多对多派工
const canMultiDispatch = computed(() => {
  return multiDispatchData.value.quantity > 0 && 
         selectedMultiProcesses.value.length > 0 && 
         selectedMultiEmployees.value.length > 0
})

// 确认多对多派工
const confirmMultiDispatch = async () => {
  if (!multiDispatchData.value.quantity || multiDispatchData.value.quantity <= 0) {
    uni.showToast({ title: '请填写有效的派工数量 (>0)', icon: 'none' })
    return
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
  
  // 获取选中的员工信息
  const selectedEmployees = multiEmployeeList.value.filter(emp => selectedMultiEmployees.value.includes(emp.id))
  
  // 从选中的工序中获取所属单据的信息（所有工序应该属于同一个订单）
  const firstProcess = selectedMultiProcesses.value[0]
  const billItem = firstProcess?.item

  const processNames = selectedMultiProcesses.value
    .map(p => p.process?.processName || '')
    .filter(Boolean)
    .join('、')
  const employeeNames = selectedEmployees.map(emp => emp.name).join('、')
  const dispatchDate = multiDispatchData.value.date || ''
  const quantity = multiDispatchData.value.quantity || 0

  openDispatchConfirmModal([
    { label: '工序', value: processNames },
    { label: '人员', value: employeeNames },
    { label: '派工日期', value: dispatchDate },
    { label: '派工数量', value: String(quantity) }
  ], async () => {
    // 构建请求参数
    const dispatchParams = {  
      productionCount: getBillProductionQtyForDispatch(billItem),
      billRowid: billItem?.billRowid || '',
      orderCode: billItem?.orderCode || '',
      workshop: workshop.value || '',
      processes: selectedMultiProcesses.value.map(p => ({
        rowid: p.process.rowid,
      })),
      quantity: multiDispatchData.value.quantity,
      date: multiDispatchData.value.date || '',
      isLast: multiDispatchData.value.isLast === '是' ? 1 : 0, // 是为1，否为0
      salaryMethod: multiDispatchData.value.salaryMethod || '计件',
      employees: selectedEmployees.map(emp => ({
        id: emp.id,
      }))
    }

    try {
      const resp = await http.post('https://www.dachen.vip/api/workflow/hooks/Njk4MmRkMTUwZjBkMGFkODBmZTM1YjAy', dispatchParams)
      
      if (resp.status === 1) {
        uni.showToast({ title: resp.message || '派工失败', icon: 'none' })
        return
      }
      
      uni.showToast({ title: '派工成功' })
      showMultiDispatchModal.value = false
      selectedMultiProcesses.value = []
      
      // 派工成功后刷新数据（不再依赖是否带入订单/生产单号）
      setTimeout(async () => {
        await search()
      }, 1000)
    } catch (error) {
      console.error('多对多派工失败:', error)
      uni.showToast({ title: '派工失败：' + (error.message || '未知错误'), icon: 'none' })
    }
  })
}

// 打开工序派工模态框
const openProcessModal = (item, process) => {
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
  salaryMethodIndex.value = 0  // 默认选中第一个选项（计件）
  isLastIndex.value = 1  // 默认选中第二个选项（否）
  selectedEmployee.value = []
  employeeList.value = []
  loadEmployees()
  showProcessModal.value = true
}

const closeProcessModal = () => {
  showProcessModal.value = false
  processDispatchData.value = { employee: '', quantity: 0, time: 0, machine: '', mold: '', date: '', salaryMethod: '计件', price: 0, isLast: '否' }
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

const confirmProcessDispatch = async () => {
  // 检查是否可以派工
  if (!canDispatch.value) {
    uni.showToast({ title: '该工序需派工数量为0，无法派工', icon: 'none' })
    return
  }
  
  if (!processDispatchData.value.quantity || processDispatchData.value.quantity <= 0) {
    uni.showToast({ title: '请填写有效的派工数量 (>0)', icon: 'none' })
    return
  }
  
  // 检查派工数量是否超过需派工数量（不再限制日产量）
  const maxQty = maxQuantity.value
  if (processDispatchData.value.quantity > maxQty) {
    uni.showToast({ title: `派工数量不能超过需派工数量 ${maxQty}`, icon: 'none' })
    return
  }
  
  const hourlyOutput = selectedProcessData.value?.process?.hourlyoutput || 0
  // if (!hourlyOutput || hourlyOutput <= 0) {
  //   uni.showToast({ title: '该工序的小时产量数据异常，无法计算派工工时', icon: 'none' })
  //   return
  // }
  
  // if (!processDispatchData.value.time || processDispatchData.value.time <= 0) {
  //   uni.showToast({ title: '派工工时计算错误，请检查派工数量', icon: 'none' })
  //   return
  // }
  // if (!machine.value?.code) {
  //   uni.showToast({ title: '请选择机台', icon: 'none' })
  //   return
  // }
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
  const quantity = processDispatchData.value.quantity || 0

  openDispatchConfirmModal([
    { label: '工序', value: processName },
    { label: '人员', value: selectedEmployeeNames },
    { label: '派工日期', value: dispatchDate },
    { label: '派工数量', value: String(quantity) }
  ], async () => {
    const dispatchData = {
      productCode: selectedProcessData.value?.item?.productCode || '',
      orderCode: selectedProcessData.value?.item?.orderCode || '',
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
      isLast: processDispatchData.value.isLast || '否'
    }

    const resp = await http.post('https://www.dachen.vip/api/workflow/hooks/NjkyMTJlNzdhOWE4ZGM2YmMxZjczYzlk', dispatchData)
    if (resp.status === 1) {
      uni.showToast({ title: '派工成功' })
      showProcessModal.value = false
      // 派工成功后刷新数据，确保进度条更新（不再依赖是否带入订单/生产单号）
      setTimeout(async () => {
        await search()
      }, 1000)
    } else {
      uni.showToast({ title: resp.message })
    }
  })
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
  const action = dispatchConfirmAction.value
  closeDispatchConfirmModal()
  if (typeof action === 'function') {
    await action()
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
      .filter(emp => emp.id)
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
    selectedIds.forEach(id => {
      if (!selectedMultiEmployees.value.includes(id)) {
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

  if (workshop.value === '组装车间' || workshop.value === '抛光车间') {
    // 组装车间、抛光车间：使用多选工序列表
    const selected = selectedMultiProcesses.value.find(p => p.item.orderCode === item.orderCode)
    if (!selected) {
      uni.showToast({ title: '请先选择一个工序', icon: 'none' })
      return
    }
    baseProcess = selected.process
  } else {
    // 喷涂及其他车间：使用单选选中的工序（与工序点击逻辑一致）
    if (!selectedProcess.value || selectedProcess.value.item.orderCode !== item.orderCode) {
      uni.showToast({ title: '请先选择一个工序', icon: 'none' })
      return
    }
    baseProcess = selectedProcess.value.process
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
  if (workshop.value === '组装车间' || workshop.value === '抛光车间') {
    // 组装车间、抛光车间：检查多选工序
    const selectedCount = selectedMultiProcesses.value.filter(p => p.item.orderCode === item.orderCode).length
    if (selectedCount === 0) {
      uni.showToast({ title: '请先选择一个工序', icon: 'none' })
      return
    }
    if (selectedCount > 1) {
      uni.showToast({
        title: workshop.value === '抛光车间' ? '选择了多个工序，请使用一对多派工' : '选择了多个工序，请使用多对多派工',
        icon: 'none'
      })
      return
    }
    // 只有一个选中工序，使用第一个
    const selected = selectedMultiProcesses.value.find(p => p.item.orderCode === item.orderCode)
    if (selected) {
      openProcessModal(selected.item, selected.process)
    }
  } else {
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
  uni.redirectTo({
    url: `/pages/selectProduct/selectProduct?workshop=${encodeURIComponent(
      workshop.value || ''
    )}&orderCode=${encodeURIComponent(selectedOrderCode.value || '')}&billType=${encodeURIComponent(bt)}`
  })
}

// ==================== Watch监听器 ====================
// 监听派工数量变化，验证并计算派工工时
watch(() => processDispatchData.value.quantity, (newVal) => {
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

  // 从选择订单页进入时：将订单号填入销售订单搜索框，onShow 中会执行 search() 按该订单号过滤列表
  if (options && options.orderCode) {
    const orderCode = decodeURIComponent(options.orderCode)
    selectedOrderCode.value = orderCode
    searchValue.value = orderCode
    searchForm.value.salesOrder = orderCode
  }
  if (options && options.productionCode) {
    selectedProductionCode.value = decodeURIComponent(options.productionCode)
  }
  // 从选择产品页面带入的物品名称，用于初始化订单物品搜索条件
  if (options && options.orderItem) {
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
  }

  /* 按钮栏：按可见按钮数量均分整行（组装车间 3 个、其它车间 2 个） */
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