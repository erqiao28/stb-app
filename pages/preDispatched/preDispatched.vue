<template>
	<view class="pre-dispatched-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="header">
			<image src="/static/left-arrow.svg" @click="goBack"></image>
			<!-- 日期选择器：暂时隐藏，后续如需恢复去掉 v-if="false" 即可 -->
			<picker v-if="false" class="header-date-picker" mode="date" :value="filterDate" :start="todayDate" @change="onDateChange">
				<view class="header-date-display">
					<text class="header-date-text">{{ filterDate }}</text>
					<text class="header-date-icon">▼</text>
				</view>
			</picker>
			<view class="header-btn-bar">
			<!-- 组装车间岗位筛选按钮：数据来自岗位工序表，仅组装车间权限时显示，样式与功能按钮区分 -->
			<template v-if="loginWorkshop === '组装车间'">
				<view
					v-for="position in assemblyPositionButtons"
					:key="position.rowid"
					class="header-btn header-btn-position"
					:class="{ active: activeAssemblyPosition === position.name }"
					@click="handleAssemblyPositionClick(position)"
				>{{ position.name }}</view>
			</template>
			<view class="header-btn" :class="{ active: showProcessPanel }" @click="toggleProcessPanel">岗位工序</view>
			<view class="header-btn" :class="{ active: showAttendancePanel }" @click="toggleAttendancePanel">员工出勤</view>
			<view class="header-btn" v-if="loginWorkshop === '喷涂车间'" :class="{ active: showSprayPanel }" @click="toggleSprayPanel">喷涂工序</view>
		</view>
			<view class="header-refresh-btn" @click="handleHeaderRefresh">刷新</view>
		<view class="header-config-btn" @click="goToProcessConfig">工艺配置</view>
	</view>

	<view class="dropdown-panel-overlay" v-if="showAttendancePanel || showProcessPanel || showSprayPanel" @click="closeAllPanels"></view>
	<view class="dropdown-panel-wrapper attendance-panel" :class="{ open: showAttendancePanel }">
		<view class="dropdown-panel">
			<view class="dropdown-panel-content">
				<view class="employee-chart-scroll">
					<view class="employee-chart">
						<view class="employee-chart-column" v-for="(emp, index) in employeeList" :key="emp.id">
						<view class="employee-chart-bar attendance-bar" :style="{ height: '100%', backgroundColor: emp.barColor }">
							<view class="attendance-btn attendance-btn-up" @click.stop="handleChartEmployeeSwipeUp(emp)">到</view>
							<text class="employee-chart-name">{{ emp.name }}</text>
							<view class="attendance-btn attendance-btn-down" @click.stop="handleChartEmployeeSwipeDown(emp)">缺</view>
						</view>
					</view>
						<view class="employee-chart-empty" v-if="!employeeList.length">
							<text>暂无员工数据</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>

	<view class="dropdown-panel-wrapper process-panel" :class="{ open: showProcessPanel }">
		<view class="dropdown-panel">
			<view class="dropdown-panel-content">
				<view class="employee-chart-scroll">
					<view class="employee-chart">
						<template v-for="(emp, index) in positionProcessEmployeeList" :key="emp.id">
							<view class="employee-chart-column">
								<view class="employee-chart-bar process-bar" :style="{ height: '100%', backgroundColor: emp.barColor }" @click="toggleEmployeeExpand(emp)">
									<view class="attendance-btn attendance-btn-up" @click.stop="handlePositionEmployeeNew(emp)">新</view>
									<text class="employee-chart-name">{{ emp.name }}</text>
									<view class="attendance-btn attendance-btn-down" @click.stop="handlePositionEmployeeOld(emp)">老</view>
								</view>
							</view>
							<view class="employee-expand-panel" v-if="expandedEmployeeId === emp.id">
							<view
								class="expand-process-item"
								:class="{ selected: selectedProcessSeq === idx + 1 }"
								v-for="(processName, idx) in emp.processNames"
								:key="idx"
								@click.stop="handleProcessItemClick(emp, idx + 1)"
							>
								<text class="expand-process-seq">{{ idx + 1 }}</text>
								<text class="expand-process-name">{{ processName }}</text>
								<text class="expand-process-delete" @click.stop="handleProcessDelete(emp, idx + 1)">×</text>
							</view>
						</view>
					</template>
						<view class="employee-chart-empty" v-if="!positionProcessEmployeeList.length">
							<text>暂无员工数据</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>

<view class="process-dropdown-wrapper" :class="{ open: showProcessDropdownPanel && showProcessPanel }">
		<view class="dropdown-panel">
			<view class="dropdown-panel-content">
				<view class="employee-chart-scroll">
					<view class="employee-chart">
						<view
							class="employee-chart-column"
							v-for="(proc, index) in processDropdownList"
							:key="proc.rowid"
							@click="handleProcessDropdownItemClick(proc)"
						>
							<view class="employee-chart-bar process-bar" :style="{ height: '100%' }">
								<text class="employee-chart-name">{{ proc.processName }}</text>
							</view>
						</view>
						<view class="employee-chart-empty" v-if="!processDropdownList.length">
							<text>暂无工序数据</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>

	<view class="dropdown-panel-wrapper spray-panel" :class="{ open: showSprayPanel }">
		<view class="dropdown-panel">
			<view class="dropdown-panel-content">
				<view class="spray-grid">
					<view
						class="spray-item"
						:class="{ expanded: sprayExpandedId === item.id }"
						v-for="item in sprayProcessList"
						:key="item.id"
						@click="toggleSprayItemExpand(item)"
					>
						<view class="spray-half spray-left">{{ item.processName }}</view>
						<view class="spray-half spray-right">{{ item.employeeName }}</view>
					</view>
					<view class="employee-chart-empty" v-if="!sprayProcessList.length">
						<text>暂无喷涂工序数据</text>
					</view>
				</view>
			</view>
		</view>
	</view>

	<view class="spray-process-dropdown-wrapper" :class="{ open: showSprayPanel && sprayExpandedId }">
		<view class="dropdown-panel">
			<view class="dropdown-panel-content">
				<view class="employee-chart-scroll">
					<view class="employee-chart">
						<view class="employee-chart-column" v-for="(emp, index) in sprayEmployeeList" :key="emp.id">
							<view class="employee-chart-bar process-bar" :style="{ height: '100%', backgroundColor: '#f5c842' }" @click="handleSprayEmployeeClick(emp)">
								<text class="employee-chart-name">{{ emp.name }}</text>
							</view>
						</view>
						<view class="employee-chart-empty" v-if="!sprayEmployeeList.length">
							<text>暂无员工数据</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>

		<view class="main-content">
			<view class="left-panel">
				<view class="panel-title">
					<view class="panel-refresh-btn" @click="handleRefresh">刷新</view>
					<text>产品列表({{ productListStats.selected }}/{{ productListStats.total }})</text>
					<view class="sync-select-switch" @click.stop="syncSelectEnabled = !syncSelectEnabled">
						<view class="switch-btn" :class="{ 'switch-on': syncSelectEnabled }">
							{{ syncSelectEnabled ? '打开' : '关闭' }}
						</view>
					</view>
				</view>
				<scroll-view class="product-list" scroll-y>
					<view class="order-group" v-for="(group, gIdx) in groupedProductList" :key="group.orderNo">
						<view class="order-header" @click="toggleOrderCollapse(group.orderNo)">
						<text class="order-index">{{ chineseNumberMap[gIdx + 1] || (gIdx + 1) }}</text>
						<view class="order-header-main">
							<text class="order-no">{{ group.orderNo || '-' }}</text>
							<text class="order-delivery-date" v-if="group.productDeliveryDate">{{ group.productDeliveryDate }}</text>
						</view>
						<text class="order-count">({{ group.products.length }})</text>
					</view>
						<view class="order-products" v-show="!isOrderCollapsed(group.orderNo)">
							<view
								v-for="(product, idx) in group.products"
								:key="product.uniqueKey || ('product-' + idx)"
								class="product-item"
								:class="{ 'product-active': selectedProductIds.includes(product.uniqueKey) }"
								@click="handleProductClick(product)"
							>
								<text class="product-index">{{ idx + 1 }}</text>
								<view class="product-info">
									<text class="product-name">{{ product.productNameNew || '-' }}</text>
									<text class="product-delivery-date" v-if="product.productDeliveryDate">{{ product.productDeliveryDate }}</text>
								</view>
								<view class="product-btns">
									<text class="expand-btn" @click.stop="toggleExpand(product.uniqueKey)">{{ expandedIds.includes(product.uniqueKey) ? '▼' : '▲' }}</text>
								</view>
								<view class="product-spec" v-if="expandedIds.includes(product.uniqueKey)">
								<view
									class="spec-row"
									v-for="(specItem, sIdx) in (product.specification || '-').split(/[;；]/).filter(Boolean)"
									:key="sIdx"
								>
									<text class="spec-value">{{ specItem.trim() }}</text>
								</view>
							</view>
						</view>
					</view>
			</view>
			<view class="empty-wrap" v-if="!productList.length && !loadingProducts">
				<text class="empty-text">暂无产品</text>
				<text class="empty-tip">点击左下角添加产品</text>
			</view>
		</scroll-view>
		<view class="left-bottom-btns">
					<view class="left-btn left-btn-add" @click="handleAddProduct">添加产品</view>
					<view class="left-btn left-btn-delay" @click="handleDelayDispatch">延后</view>
					<view class="left-btn left-btn-remove" @click="handleRemoveDispatch">移除</view>
					<view class="left-btn left-btn-confirm" @click="handleConfirmDispatch">确认派工</view>
				</view>
			</view>

			<view class="right-panel" :class="{ 'employee-expanded': isEmployeeExpanded }">
			<view class="right-panel-top">
				<scroll-view class="process-list" scroll-y scroll-x>
						<view
							v-for="group in groupedProcessList"
							:key="group.productRowid"
							class="process-table-grid"
							:style="{ gridTemplateColumns: 'calc(50 / 1920 * 100vw) calc(50 / 1920 * 100vw) min-content repeat(' + group.processes.length + ', min-content)' }"
						>
							<!-- 第一栏：订单编号 + 产品名称 -->
							<view class="grid-order-info" style="grid-row: 1 / span 10; grid-column: 1">
								<view class="grid-orderno">{{ group.orderNo.replace(/-/g, '|') }}</view>
								<view class="grid-product-name-v">{{ group.productName }}</view>
							</view>
							<!-- 第二栏：按钮 -->
							<view class="grid-product-name" style="grid-row: 1 / span 10; grid-column: 2">
								<view class="grid-product-refresh" @click.stop="refreshProcessList(group.productRowid)">刷新</view>
								<view
									class="grid-product-action"
									:style="{ backgroundColor: isProcessActionEnabled(group.productRowid) ? '#5884f1' : '#999' }"
									@click.stop="openProcessActionModalByRowid(group.productRowid)"
								>工艺调整</view>
								<view
									class="grid-product-dispatch"
									:style="{ backgroundColor: isDispatchEnabled(group.productRowid) ? '#5884f1' : '#999' }"
									@click.stop="openDispatchModalFromRowid(group.productRowid)"
								>派工设置</view>
								<view class="grid-product-confirm" @click.stop="handleProcessListConfirm(group.productRowid)">确定</view>
							</view>
							<view class="grid-label-cell" style="grid-row: 1; grid-column: 3">选中</view>
							<view class="grid-label-cell" style="grid-row: 2; grid-column: 3">顺序</view>
							<view class="grid-label-cell" style="grid-row: 3; grid-column: 3">工序</view>
							<view class="grid-label-cell" style="grid-row: 4; grid-column: 3">日产量</view>
							<view class="grid-label-cell" style="grid-row: 5; grid-column: 3">订单数</view>
							<view class="grid-label-cell" style="grid-row: 6; grid-column: 3">生产数</view>
							<view class="grid-label-cell" style="grid-row: 7; grid-column: 3">待派工</view>
							<view class="grid-label-cell" style="grid-row: 8; grid-column: 3">已完成</view>
							<view class="grid-label-cell" style="grid-row: 9; grid-column: 3">派工数量</view>
							<view class="grid-label-cell" style="grid-row: 10; grid-column: 3">员工</view>
							<template v-for="(p, idx) in group.processes" :key="p.rowid">
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 1, gridColumn: 4 + idx }">
								<!-- 自定义勾选框：完全受 selectedProcessIds 控制，避免 checkbox 组件内部状态不同步问题 -->
								<view class="grid-checkbox" :class="{ checked: selectedProcessIds.includes(p.rowid) }" @click.stop="toggleProcessSelection(p)">
									<text v-if="selectedProcessIds.includes(p.rowid)" class="grid-checkbox-icon">✓</text>
								</view>
							</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 2, gridColumn: 4 + idx }">{{ p.sequence || '-' }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 3, gridColumn: 4 + idx }">{{ p.processName || '-' }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 4, gridColumn: 4 + idx }">{{ p.dailyOutput || 0 }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 5, gridColumn: 4 + idx }">{{ p.orderCount || 0 }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 6, gridColumn: 4 + idx }">{{ p.allcount || 0 }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 7, gridColumn: 4 + idx }">{{ p.needCount || 0 }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 8, gridColumn: 4 + idx }">{{ p.finishCount || 0 }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 9, gridColumn: 4 + idx }">{{ p.dispatchCount || 0 }}</view>
							<view
							v-if="isEmployeeGroupStart(group.processes, idx)"
							class="grid-cell employee-cell"
							:class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }"
							:style="getEmployeeCellStyle(group.processes, idx)"
							@click="openEmployeeSelectorFromProcess(group.processes, idx)"
						>{{ getEmployeeCellText(group.processes, idx) }}</view>
						</template>
						</view>
						<view class="empty-wrap" v-if="!processList.length && !loadingProducts">
							<text class="empty-text">暂无工序</text>
						</view>
					</scroll-view>
				</view>
				<view class="right-panel-bottom">
				<view class="employee-expand-bar" @click="toggleEmployeeSection">
					<text class="employee-expand-icon">{{ isEmployeeExpanded ? '⛶' : '⛶' }}</text>
				</view>
				<view class="employee-summary">
					<view class="summary-item">
						<text class="summary-label">员工数量</text>
						<text class="summary-value">{{ employeeSummary.total }}</text>
					</view>
					<view class="summary-item">
						<text class="summary-label">未派人员</text>
						<text class="summary-value">{{ employeeSummary.unassigned }}</text>
					</view>
					<view class="summary-item">
						<text class="summary-label">已满人员</text>
						<text class="summary-value">{{ employeeSummary.full }}</text>
					</view>
					<view class="summary-item">
						<text class="summary-label">未满人员</text>
						<text class="summary-value">{{ employeeSummary.incomplete }}</text>
					</view>
					<view class="summary-item">
						<text class="summary-label">请假数量</text>
						<text class="summary-value">{{ employeeSummary.leave }}</text>
					</view>
				</view>
				<scroll-view class="employee-chart-scroll" scroll-x scroll-y>
					<view
						class="employee-dispatch-table"
						:style="{ gridTemplateColumns: 'min-content min-content min-content' + (maxEmployeeRecordCount > 0 ? ' repeat(' + (maxEmployeeRecordCount + 1) + ', min-content min-content min-content min-content min-content)' : '') + ' min-content' }"
						v-if="isEmployeeExpanded && employeeDispatchSummary.length > 0"
					>
						<view class="table-header" style="grid-row: 1; grid-column: 1">员工姓名</view>
						<view class="table-header" style="grid-row: 1; grid-column: 2">总工资</view>
						<view class="table-header" style="grid-row: 1; grid-column: 3">总工时</view>
						<view
							class="table-header"
							v-for="i in maxEmployeeRecordCount + 1"
							:key="'order-' + i"
							:style="{ gridRow: 1, gridColumn: 4 + (i - 1) * 5 }"
						>订单编号</view>
						<view
							class="table-header"
							v-for="i in maxEmployeeRecordCount + 1"
							:key="'product-' + i"
							:style="{ gridRow: 1, gridColumn: 5 + (i - 1) * 5 }"
						>产品名称</view>
						<view
							class="table-header"
							v-for="i in maxEmployeeRecordCount + 1"
							:key="'count-' + i"
							:style="{ gridRow: 1, gridColumn: 6 + (i - 1) * 5 }"
						>数量</view>
						<view
							class="table-header"
							v-for="i in maxEmployeeRecordCount + 1"
							:key="'time-' + i"
							:style="{ gridRow: 1, gridColumn: 7 + (i - 1) * 5 }"
						>工时</view>
						<view
							class="table-header"
							v-for="i in maxEmployeeRecordCount + 1"
							:key="'wage-' + i"
							:style="{ gridRow: 1, gridColumn: 8 + (i - 1) * 5 }"
						>工资</view>
						<template v-for="(emp, empIdx) in employeeDispatchSummary" :key="emp.employeeName">
							<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 1 }">{{ emp.employeeName }}</view>
							<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 2 }">{{ emp.totalWage.toFixed(2) }}</view>
							<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 3 }">{{ emp.totalWorktime.toFixed(2) }}</view>
							<template v-for="(rec, recIdx) in emp.records" :key="recIdx">
								<view
									class="table-cell"
									:class="[('record-group-' + (recIdx % RECORD_BG_COLORS.length)), emp.rowClass]"
									:style="{ gridRow: 2 + empIdx, gridColumn: 4 + recIdx * 5 }"
								>{{ rec.orderNo }}</view>
								<view
									class="table-cell"
									:class="[('record-group-' + (recIdx % RECORD_BG_COLORS.length)), emp.rowClass]"
									:style="{ gridRow: 2 + empIdx, gridColumn: 5 + recIdx * 5 }"
								>{{ rec.productName }}</view>
								<view
									class="table-cell"
									:class="[('record-group-' + (recIdx % RECORD_BG_COLORS.length)), emp.rowClass]"
									:style="{ gridRow: 2 + empIdx, gridColumn: 6 + recIdx * 5 }"
								>{{ rec.dispatchCount }}</view>
								<view
									class="table-cell"
									:class="[('record-group-' + (recIdx % RECORD_BG_COLORS.length)), emp.rowClass]"
									:style="{ gridRow: 2 + empIdx, gridColumn: 7 + recIdx * 5 }"
								>{{ rec.worktime }}</view>
								<view
									class="table-cell"
									:class="[('record-group-' + (recIdx % RECORD_BG_COLORS.length)), emp.rowClass]"
									:style="{ gridRow: 2 + empIdx, gridColumn: 8 + recIdx * 5 }"
								>{{ rec.wage }}</view>
							</template>
							<template v-for="padIdx in maxEmployeeRecordCount - emp.records.length" :key="'pad-' + padIdx">
								<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 4 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
								<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 5 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
								<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 6 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
								<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 7 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
								<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 8 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
							</template>
							<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 2 + maxEmployeeRecordCount * 5 }"></view>
							<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 3 + maxEmployeeRecordCount * 5 }"></view>
							<view class="table-cell" :class="emp.rowClass" :style="{ gridRow: 2 + empIdx, gridColumn: 4 + maxEmployeeRecordCount * 5 }"></view>
						</template>
					</view>
					<view class="empty-wrap" v-if="isEmployeeExpanded && employeeDispatchSummary.length === 0">
						<text class="empty-text">暂无数据</text>
					</view>
					<view class="employee-chart" v-if="!isEmployeeExpanded">
						<view
							v-for="(emp, index) in employeeList"
							:key="emp.id"
							class="employee-column"
							:id="'emp-column-' + index"
							@click="openEmployeeTaskPopover(emp, index)"
						>
							<text class="emp-wage">{{ Number(emp.wage || 0).toFixed(2) }}</text>
							<view class="emp-bar-container">
								<text v-if="emp.attendance === '请假'" class="emp-status emp-status-leave">请假</text>
								<text v-else-if="emp.isNewEmployee && !emp.hasPreDispatch" class="emp-status emp-status-new">新人</text>
								<view
									v-else
									class="emp-bar"
									:style="{ height: emp.barHeight, backgroundColor: emp.barColor }"
								>
									<text v-if="emp.totalHours >= 3" class="emp-hours">{{ emp.totalHours }}</text>
								</view>
							</view>
							<text class="emp-name">{{ emp.name }}</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>

	<view class="confirm-dispatch-modal" v-if="showConfirmDispatchModal" @click.self="closeConfirmDispatchModal">
		<view class="confirm-dispatch-content">
			<view class="confirm-dispatch-title">确认派工</view>
			<view class="confirm-dispatch-body">
				<text class="confirm-dispatch-tip">确定要将 {{ confirmDispatchCount }} 条预派工转为正式派工吗？</text>
			</view>
			<view class="confirm-dispatch-buttons">
				<view class="confirm-dispatch-btn-cancel" @click="closeConfirmDispatchModal">取消</view>
				<view class="confirm-dispatch-btn-confirm" @click="doConfirmDispatch">确认</view>
			</view>
		</view>
	</view>

	<!-- 添加产品模态框 - 订单层级选择 -->
	<view class="add-product-modal" v-if="showAddProductModal" @click.self="closeAddProductModal">
		<view class="add-product-container">
			<!-- 左侧：产品选择列表 -->
			<view class="add-product-content">
				<view class="add-product-header">
					<text class="add-product-title">添加产品</text>
					<view class="add-product-close" @click="closeAddProductModal">×</view>
				</view>
				<view class="add-product-search">
					<input
						v-model="addProductOrderSearch"
						type="text"
						placeholder="订单编号"
						class="add-product-input"
						@input="filterAddProductList"
					/>
					<input
						v-model="addProductNameSearch"
						type="text"
						placeholder="产品名称"
						class="add-product-input"
						@input="filterAddProductList"
					/>
				</view>
				<scroll-view
					class="add-product-list"
					scroll-y
					:refresher-enabled="true"
					:refresher-triggered="addProductRefresherTriggered"
					@refresherrefresh="onAddProductRefresh"
					@scrolltolower="onAddProductLoadMore"
					lower-threshold="100"
				>
					<!-- 订单分组列表 -->
					<view
						v-for="orderGroup in filteredAddProductList"
						:key="orderGroup.orderCode"
						class="order-group"
					>
						<!-- 订单行（可点击展开） -->
						<view
							class="order-group-header"
							:class="{ 'expanded': expandedOrderKeys.includes(orderGroup.orderCode) }"
							@click="toggleOrderExpand(orderGroup.orderCode)"
						>
							<view class="order-header-left">
								<text class="order-expand-icon">{{ expandedOrderKeys.includes(orderGroup.orderCode) ? '▼' : '▶' }}</text>
								<text class="order-code">{{ orderGroup.orderCode }}</text>
							</view>
							<view class="order-header-right">
								<text class="order-product-count">{{ orderGroup.products.length }}个产品</text>
							</view>
						</view>
						<!-- 产品列表（展开时显示） -->
						<view class="order-products" v-if="expandedOrderKeys.includes(orderGroup.orderCode)">
							<view
								v-for="product in orderGroup.products"
								:key="product.productionCode"
								class="product-select-item"
								:class="{ 'selected': multiSelectProductKeys.includes(product.productionCode) }"
							>
								<view class="product-main" @click="toggleMultiProductSelection(product)">
									<view class="product-checkbox">
										<text class="checkbox-icon">{{ multiSelectProductKeys.includes(product.productionCode) ? '✓' : '' }}</text>
									</view>
									<view class="product-info">
										<text class="product-name">{{ product.name || '-' }}</text>
										<text class="product-order-count" v-if="product.orderCount">订单数: {{ product.orderCount }}</text>
										<text class="product-delivery">交货: {{ product.deliveryDate || '-' }}</text>
										<view class="product-spec-btn" @click.stop="toggleProductSpecExpand(product)">
											<text>{{ expandedProductSpecs.includes(product.productionCode) ? '收起' : '规格' }}</text>
										</view>
									</view>
								</view>
								<view class="product-spec-container" v-if="expandedProductSpecs.includes(product.productionCode)">
									<view
										class="spec-row"
										v-for="(specItem, sIdx) in (product.models || '-').split(/[;；]/).filter(Boolean)"
										:key="sIdx"
									>
										<text class="spec-value">{{ specItem.trim() }}</text>
									</view>
								</view>
							</view>
						</view>
					</view>
					<view v-if="addProductLoading" class="add-product-loading">加载中...</view>
					<view v-else-if="!filteredAddProductList.length" class="add-product-empty">暂无数据</view>
				</scroll-view>
				<view class="add-product-footer">
					<text class="selected-count">已选 {{ multiSelectProductKeys.length }} 个产品</text>
					<view class="add-product-btn-cancel" @click="closeAddProductModal">取消</view>
					<view
						class="add-product-btn-confirm"
						:class="{ 'btn-active': multiSelectProductKeys.length > 0 }"
						@click="confirmMultiSelectedProducts"
					>确定</view>
				</view>
			</view>
			<!-- 右侧：选中产品清单 -->
			<view class="selected-product-list">
				<view class="selected-list-header">
					<text class="selected-list-title">已选清单</text>
					<text class="selected-list-count">{{ selectedProductList.length }}个</text>
				</view>
				<scroll-view class="selected-list-content" scroll-y>
					<view
						v-for="item in selectedProductList"
						:key="item.productionCode"
						class="selected-list-item"
					>
						<text class="selected-order-code">{{ item.orderCode }}</text>
						<text class="selected-product-name">{{ item.productName }}</text>
					</view>
					<view v-if="!selectedProductList.length" class="selected-list-empty">暂无选中产品</view>
				</scroll-view>
			</view>
		</view>
	</view>

	<view class="edit-modal" v-if="showEditModal" @click.self="closeEditModal">
		<view class="edit-modal-content" @click.stop>
			<view class="edit-modal-title">预派工调整</view>
			<view class="edit-modal-body">
				<view class="edit-form">
					<view class="edit-row">
						<text class="edit-label">订单编号:</text>
						<text class="edit-value">{{ editData.orderNo || '-' }}</text>
					</view>
					<view class="edit-row">
						<text class="edit-label">产品名称:</text>
						<text class="edit-value">{{ editData.productNameNew || '-' }}</text>
					</view>
					<view class="edit-row">
						<text class="edit-label">工序:</text>
						<text class="edit-value">{{ editData.processDisplay || '-' }}</text>
					</view>
					<view class="edit-row">
						<text class="edit-label">派工日期:</text>
						<picker mode="date" :value="editData.dispatchDate" @change="onDispatchDateChange">
							<view class="edit-date-picker">
								<text class="edit-date-text">{{ editData.dispatchDate || '请选择日期' }}</text>
								<text class="edit-date-arrow">▼</text>
							</view>
						</picker>
					</view>
					<view class="edit-row">
						<text class="edit-label">派工数量:</text>
						<input
							v-model="editData.dispatchCount"
							type="number"
							class="edit-input"
							placeholder="请输入派工数量"
						/>
					</view>
					<view class="edit-row">
						<text class="edit-label">员工姓名:</text>
						<view class="edit-employee-tags">
							<view v-for="(name, idx) in editData.selectedEmployeeNames" :key="idx" class="employee-tag">{{ name }}</view>
							<view v-if="!editData.selectedEmployeeNames || editData.selectedEmployeeNames.length === 0" class="edit-value">-</view>
						</view>
					</view>
					<view class="edit-row">
						<text class="edit-label">工时:</text>
						<text class="edit-value">{{ editData.worktime || '-' }}</text>
					</view>
					<view class="edit-row">
						<text class="edit-label">工价:</text>
						<text class="edit-value">{{ editData.wage || '-' }}</text>
					</view>
				</view>
			</view>
			<view class="edit-modal-buttons">
				<view class="edit-btn-cancel" @click="closeEditModal">取消</view>
				<view class="edit-btn-confirm" @click="confirmEdit">确认</view>
			</view>
		</view>
	</view>

	<view class="employee-modal" :class="{ show: showEmployeeSelector }" @click.self="closeEmployeeSelector">
		<view class="employee-modal-content" @click.stop :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="employee-modal-header" @click="showWorkshopDropdown = false">
				<view class="header-controls">
					<view class="employee-type-switch">
						<view
							class="switch-btn"
							:class="{ active: employeeTypeFilter === 'normal' }"
							@click.stop="switchEmployeeType('normal')"
						>正</view>
						<view
							class="switch-btn"
							:class="{ active: employeeTypeFilter === 'temp' }"
							@click.stop="switchEmployeeType('temp')"
						>临</view>
					</view>
					<view class="workshop-picker-wrap">
						<view class="workshop-picker" @click.stop="toggleWorkshopDropdown">
							<text>{{ selectedSelectorWorkshop || '请选择车间' }}</text>
							<text class="picker-arrow">{{ showWorkshopDropdown ? '▲' : '▼' }}</text>
						</view>
						<view class="workshop-dropdown" v-if="showWorkshopDropdown" @click.stop>
							<view
								v-for="ws in workshopOptions"
								:key="ws"
								class="workshop-dropdown-item"
								:class="{ active: ws === selectedSelectorWorkshop }"
								@click="selectWorkshop(ws)"
							>
								{{ ws }}
							</view>
						</view>
					</view>
				</view>
				<view class="employee-modal-close" @click="closeEmployeeSelector">×</view>
			</view>
			<scroll-view scroll-y class="employee-modal-list">
				<view
					v-for="emp in filteredEmployees"
					:key="emp.id"
					class="employee-modal-item"
					:class="{ active: editData.selectedEmployeeIds.includes(emp.id) }"
					@click="toggleEmployee(emp)"
				>
					<view class="employee-modal-check">
						<text v-if="editData.selectedEmployeeIds.includes(emp.id)" class="check-icon">✓</text>
					</view>
					<view class="employee-modal-info">
						<view class="employee-modal-info-main">
							<text class="employee-modal-name">{{ emp.name }}</text>
							<text class="employee-type-tag" :class="emp.isNewEmployee ? 'is-new' : 'is-old'">{{ emp.isNewEmployee ? '新' : '老' }}</text>
						</view>
						<view class="employee-modal-info-extra">
							<text class="employee-modal-hours">{{ emp.totalHours || 0 }}</text>
							<text class="employee-modal-wage">{{ emp.wage || 0 }}</text>
						</view>
					</view>
				</view>
			<!-- 空态提示：放在滚动列表内部，居中显示 -->
			<view class="employee-modal-empty" v-if="allEmployeeOptions.length === 0">
				<view v-if="employeeListLoading" class="empty-loading-text">
					<view class="empty-spinner"></view>
					<text>获取员工数据中...</text>
				</view>
				<text v-else>暂无员工</text>
			</view>
		</scroll-view>
			<view v-if="employeeSelectorMode === 'process'" class="employee-modal-footer">
				<view class="employee-modal-btn-cancel" @click="closeEmployeeSelector">取消</view>
				<view class="employee-modal-btn-confirm" @click="confirmEmployeeEdit">确定</view>
			</view>
		</view>
	</view>

	<view class="dispatch-modal" v-if="showDispatchModal" @click.self="closeDispatchModal">
		<view class="dispatch-modal-content" @click.stop>
			<view class="dispatch-modal-title">派工设置</view>
			<view class="dispatch-modal-product-info">
				<text class="product-info-order">{{ dispatchModalProduct?.orderNo || '-' }}</text>
				<text class="product-info-name">{{ dispatchModalProduct?.productName || '-' }}</text>
			</view>
			<view class="dispatch-modal-body">
				<view class="dispatch-grid">
					<view class="dispatch-grid-cell">
						<text class="grid-cell-label">订单数量</text>
						<text class="grid-cell-value">{{ dispatchModalProduct?.orderCount || '-' }}</text>
					</view>
					<view class="dispatch-grid-cell">
						<text class="grid-cell-label">可派数量</text>
						<text class="grid-cell-value">{{ dispatchModalDispatchCount }}</text>
					</view>
					<view class="dispatch-grid-cell">
						<text class="grid-cell-label">完成数量</text>
						<text class="grid-cell-value">{{ dispatchModalFinishCount }}</text>
					</view>
					<view class="dispatch-grid-cell">
						<text class="grid-cell-label">小时产量</text>
						<text class="grid-cell-value">{{ Math.round(dispatchModalAverageHourlyOutput) }}</text>
					</view>
					<view class="dispatch-grid-cell">
						<text class="grid-cell-label">派工数量</text>
						<input
							v-model="dispatchModalInput"
							type="number"
							class="dispatch-input"
							placeholder="请输入"
						/>
					</view>
					<view class="dispatch-grid-cell">
						<text class="grid-cell-label">工时</text>
						<text class="grid-cell-value">{{ dispatchModalWorkHours.toFixed(2) }}</text>
					</view>
				</view>
			</view>
			<view class="dispatch-modal-buttons">
				<view class="dispatch-btn-cancel" @click="closeDispatchModal">取消</view>
				<view class="dispatch-btn-confirm" @click="saveDispatchModal">确认</view>
			</view>
		</view>
	</view>

	<view class="employee-task-popover" v-if="showEmployeeTaskPopover" @click="closeEmployeeTaskPopover">
		<view class="employee-task-content" :style="employeeTaskPopoverStyle" @click.stop>
			<view class="employee-task-arrow" :style="employeeTaskArrowStyle"></view>
			<view class="employee-task-list">
				<view class="employee-task-header">
					<text class="task-header-cell">订单编号</text>
					<text class="task-header-cell">产品名称</text>
					<text class="task-header-cell">工序</text>
					<text class="task-header-cell">派工数量</text>
					<text class="task-header-cell task-header-cell-op">操作</text>
				</view>
				<view
					class="employee-task-item"
					v-for="(task, idx) in selectedEmployeeForPopover?.tasks || []"
					:key="idx"
				>
					<text class="task-cell">{{ task.orderNo }}</text>
					<text class="task-cell">{{ task.productName }}</text>
					<text class="task-cell">{{ task.processName }}</text>
					<text class="task-cell">{{ task.dispatchCount }}</text>
					<view class="task-cell task-cell-op">
						<text class="task-delete-btn" @click.stop="handleDeleteTask(task, idx)">删除</text>
					</view>
				</view>
				<view class="employee-task-empty" v-if="!(selectedEmployeeForPopover?.tasks || []).length">
					<text>暂无任务</text>
				</view>
			</view>
		</view>
	</view>

	<view class="process-action-modal" v-if="showProcessActionModal" @click.self="closeProcessActionModal">
		<view class="process-action-content" @click.stop>
			<view class="process-action-header">
				<text class="process-action-title">工艺调整</text>
				<view class="process-action-close" @click="closeProcessActionModal">&times;</view>
			</view>
			<view class="process-action-body">
				<view class="process-action-filter">
					<view class="process-action-search">
						<input type="text" placeholder="请输入工序名称" v-model="processActionSearch" @input="handleProcessActionSearch" />
					</view>
				</view>
				<view class="process-action-main">
					<view class="process-action-list-section">
						<scroll-view scroll-y class="process-action-list">
							<view class="process-action-list-header">工序名称</view>
							<view
								v-for="item in processActionList"
								:key="item.rowid"
								class="process-action-list-item"
								:class="{ selected: processActionSelected?.rowid === item.rowid }"
								@click="selectProcessActionItem(item)"
							>
								{{ item.processName }}
							</view>
							<view class="process-action-empty" v-if="!processActionList.length && !processActionLoading">
								<text>暂无数据</text>
							</view>
						</scroll-view>
					</view>
					<view class="process-action-form">
						<view class="process-action-form-group">
							<text class="process-action-form-label">操作方式</text>
							<view class="process-action-mode-buttons">
								<view
									v-for="mode in processActionModeOptions"
									:key="mode"
									class="process-action-mode-btn"
									:class="{ active: processActionModeOptions[processActionModeIndex] === mode }"
									@click="onProcessActionModeChange(mode)"
								>
									{{ mode }}
								</view>
							</view>
						</view>
						<view class="process-action-form-group" v-if="processActionModeOptions[processActionModeIndex] === '添加'">
							<text class="process-action-form-label">生产顺序</text>
							<input type="number" class="process-action-input" placeholder="请输入顺序" v-model="processActionSequence" step="0.01" />
						</view>
					</view>
				</view>
			</view>
			<view class="process-action-footer">
				<view class="process-action-btn-cancel" @click="closeProcessActionModal">取消</view>
				<view class="process-action-btn-confirm" @click="confirmProcessAction">确定</view>
			</view>
		</view>
	</view>
</view>
</template>

<script setup>
import { ref, onMounted, computed, getCurrentInstance, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callWorkflowListAPIPaged, callWorkflowListAll } from '../../utils/workflow'
import { useStatusBar } from '../../composables/useStatusBar'
import { useUserStore } from '../../store/user.store'
import http from '../../utils/request'
import { PRE_DISPATCH_VOID_URL, PRE_DISPATCH_UPDATE_URL, PRE_DISPATCH_CONFIRM_URL, PRE_DISPATCH_PROCESS_CONFIRM_URL, PRE_DISPATCH_PRODUCT_ADD_URL, ATTENDANCE_SUBMIT_URL, DELETE_PROCESS_URL, OPERATE_PROCESS_URL, OPERATE_PROCESS_SYNC_URL, POSITION_PROCESS_SELECT_URL, POSITION_PROCESS_DELETE_URL, SPRAY_PROCESS_EMPLOYEE_URL, getApiRequestBase } from '../../utils/api'

const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const workshopOptions = ['拉伸车间', '喷涂车间', '抛光车间', '组装车间']

const loginWorkshop = computed(() => {
	const lim = (userStore.loginLimits || '').trim()
	return workshopOptions.includes(lim) ? lim : ''
})

// 员工相关数据查询车间：权限车间是什么就查什么
const employeeWorkshopFilter = computed(() => {
	return loginWorkshop.value
})

// 员工选择框查询车间：默认为权限车间，支持手动切换
const selectedSelectorWorkshop = ref(loginWorkshop.value || '')
const showWorkshopDropdown = ref(false)
// 监听权限车间变化，同步更新选择器车间
watch(loginWorkshop, (newVal) => {
	if (newVal && !selectedSelectorWorkshop.value) {
		selectedSelectorWorkshop.value = newVal
	}
})

const PRE_DISPATCH_WORKSHEET_ID = '6a1e468d27514927ff33cbae'

const PRE_DISPATCH_FIELD_MAP = {
	orderNo: '6a1e47d727514927ff33cc45',
	pureOrderNo: '6a1fff8738176d619e00e008',
	productName: '6a1e47d727514927ff33cc47',
	productNameNew: '6a3a4b306d70ffabc66ec686',
	workshop: '6a1e4c1427514927ff33cda4',
	dispatchDate: '6a1e488327514927ff33cca9',
	dispatchCount: '6a1e47d727514927ff33cc4b',
	worktime: '6a7d8cff533d90c2eadfbbb3',
	wage: '6a7d8e24533d90c2eadfbbd3',
	specification: '6a1e4a2327514927ff33cd1a',
	processName: '6a1e48b627514927ff33ccc0',
	employeeName: '6a1e48b627514927ff33ccc1',
	processDetail: '6a1e47d727514927ff33cc4c',
	craftPosition: '6a3a1e6b6d70ffabc66e6757',
	positionProcess: '6a6d5f904239d5290f2b5bd2',
	dailyWage: '6a1e47d727514927ff33cc4e',
	productionCode: '6a1fee4638176d619e00db16',
	thickness: '6a3deb356d70ffabc6702cfd',
	guokouSpec: '6a3deb356d70ffabc6702cfe',
	guokouSizeSpec: '6a3deb356d70ffabc6702cff',
	craftSpec: '6a3deb356d70ffabc6702d00',
	paintSpec: '6a3deb356d70ffabc6702d01',
	polishSpec: '6a3deb356d70ffabc6702d02',
	materialSizeSpec: '6a3debe76d70ffabc6702dbb',
	productDeliveryDate: '6a1e7d2c27514927ff33e56b',
	status: '6a1e49c427514927ff33ccf5'
}

const DAILY_WAGE_WORKSHEET_ID = '692112b021066a9f124f5c9f'
const DAILY_WAGE_EMPLOYEE_NAME_FIELD = '6938db8bda0981f67b352af3'

const DAILY_WAGE_FIELD_MAP = {
	employeeName: '6938db8bda0981f67b352af3',
	dispatchDate: '69524e7b7a59e0522d855df6',
	workshop: '696075d19223cfe3a0c169dc',
	totalHours: '6a4f304c6d70ffabc67913b8',
	totalWage: '6a4f304c6d70ffabc67913b9',
	preDispatch: '6a1e47d727514927ff33cc4f',
	wageThreshold: '6a7f1a7f533d90c2eae04627',
}

const CRAFT_POSITION_WORKSHEET_ID = '6a276f516d70ffabc66285e7'
const CRAFT_POSITION_FIELD_ID = '6a276ffc6d70ffabc66285f8'
const CRAFT_POSITION_NAME_FIELD = '6a276ffc6d70ffabc66285f8'  // 工序归类名称
const CRAFT_POSITION_RELATED_PROCESS_FIELD = '6a276ffc6d70ffabc66285f9'  // 关联工序字段

// 工艺岗位字典（用于 craftPosition ID 转名称）
const CRAFT_POSITION_DICT_WORKSHEET_ID = '6a6d5f904239d5290f2b5bd2'
const CRAFT_POSITION_DICT_NAME_FIELD = 'Name'
const craftPositionDictMap = ref(new Map())  // 工艺岗位ID -> 工艺岗位名称

// 岗位工序字典（用于 positionProcess ID 转名称）
const POSITION_PROCESS_DICT_WORKSHEET_ID = ASSEMBLY_POSITION_WORKSHEET_ID
const POSITION_PROCESS_DICT_NAME_FIELD = ASSEMBLY_POSITION_FIELD_ID
const positionProcessDictMap = ref(new Map())  // 岗位工序ID -> 岗位工序名称

// 工序字典（数据字典 worksheetId 与类型字段，用于把工序 rowid 解析成名称）
const PROCESS_DICT_WORKSHEET_ID = 'shujuzidian'
const PROCESS_DICT_TYPE_FIELD = '6614d7ed1f7f1264f3a332c3'
const processDictMap = ref(new Map())  // 工序字典 rowid -> 工序名称

// 工序归类表数据
const craftPositionList = ref([])
const craftPositionMap = ref(new Map())  // 工序归类名称 -> 关联工序名称列表

const filterOrderCode = ref('')
const filterProductName = ref('')
const filterCraft = ref('')
const filterInnerPaint = ref('')
const filterPolish = ref('')
const filterGuokou = ref('')
const filterDate = ref(getTomorrowDate())
// 日期选择器最小可选日期（今天），用于限制只能选择今天及以后
const todayDate = ref(getTodayDate())

const productList = ref([])
const loadingProducts = ref(false)

const selectedProductIds = ref([])
const syncSelectEnabled = ref(false) // 同组产品同步勾选开关
const SYNC_SELECT_ENABLED_STORAGE_KEY = 'preDispatched_syncSelectEnabled'

// 持久化同步勾选开关状态
watch(syncSelectEnabled, (val) => {
	try {
		uni.setStorageSync(SYNC_SELECT_ENABLED_STORAGE_KEY, val)
	} catch (e) {
		console.error('保存同步勾选开关状态失败:', e)
	}
})

const loadSyncSelectEnabled = () => {
	try {
		const stored = uni.getStorageSync(SYNC_SELECT_ENABLED_STORAGE_KEY)
		if (typeof stored === 'boolean') {
			syncSelectEnabled.value = stored
		}
	} catch (e) {
		console.error('读取同步勾选开关状态失败:', e)
	}
}

const expandedIds = ref([])
const collapsedOrderIds = ref([])
const chineseNumberMap = {
	1: '一',
	2: '二',
	3: '三',
	4: '四',
	5: '五',
	6: '六',
	7: '七',
	8: '八',
	9: '九',
	10: '十',
	11: '十一',
	12: '十二',
	13: '十三',
	14: '十四',
	15: '十五',
	16: '十六',
	17: '十七',
	18: '十八',
	19: '十九',
	20: '二十'
}
const processList = ref([])
const loadedProductIds = ref([])
const selectedProcessIds = ref([])
// 记录产品列表的排列顺序（首次加载产品列表时记录），用于工序列表按此顺序排列
const productOrderMap = ref(new Map())
// 记录用户主动勾选过的工序ID，刷新时只对这些工序进行关联预派工自动勾选
const userCheckedProcessIds = ref(new Set())
// 记录用户手动取消勾选的工序ID，用于刷新时保留用户的操作
const manuallyDeselectedProcessIds = ref(new Set())
const employeeList = ref([])
const positionProcessEmployeeList = ref([])
const employeeDispatchSummary = ref([])

const productDispatchCounts = ref({})
const showDispatchModal = ref(false)
const dispatchModalProduct = ref(null)
const dispatchModalInput = ref('0')
const dispatchModalDispatchCount = ref(0)
const dispatchModalFinishCount = ref(0)

// 派工设置弹窗：勾选工序的平均小时产量
const dispatchModalAverageHourlyOutput = computed(() => {
	const product = dispatchModalProduct.value
	if (!product) return 0
	const checkedProcesses = processList.value.filter(
		(p) => p.productRowid === product.uniqueKey && selectedProcessIds.value.includes(p.rowid)
	)
	if (checkedProcesses.length === 0) return 0
	const total = checkedProcesses.reduce((sum, p) => sum + (parseFloat(p.hourlyoutput) || 0), 0)
	return total / checkedProcesses.length
})

// 派工设置弹窗：工时 = 派工数量 / 平均小时产量，保留两位小数
const dispatchModalWorkHours = computed(() => {
	const avg = dispatchModalAverageHourlyOutput.value
	const input = parseFloat(dispatchModalInput.value)
	if (!avg || !Number.isFinite(input) || input <= 0) return 0
	return parseFloat((input / avg).toFixed(2))
})

const isEmployeeExpanded = ref(false)

const showEmployeeTaskPopover = ref(false)
const selectedEmployeeForPopover = ref(null)
const employeeTaskPopoverStyle = ref({})
const employeeTaskArrowStyle = ref({})

const instance = getCurrentInstance()

const employeeSummary = computed(() => {
	const total = employeeList.value.length
	// 四类互斥统计：请假 > 未派 > 已满/未满
	// 请假人员：出勤为请假（不再参与其他分类）
	const leave = employeeList.value.filter((e) => String(e.attendance).trim() === '请假').length
	// 未派人员：非请假，且没有预派工数据关联
	const unassigned = employeeList.value.filter((e) => String(e.attendance).trim() !== '请假' && !e.hasPreDispatch).length
	// 已满人员：非请假，有预派工，有工资阀值，且总工资达到阀值
	const full = employeeList.value.filter((e) => String(e.attendance).trim() !== '请假' && e.hasPreDispatch && e.wageThreshold > 0 && e.isFull).length
	// 未满人员：非请假，有预派工，无工资阀值或总工资未达到阀值（无阀值时保守算未满）
	const incomplete = employeeList.value.filter((e) => String(e.attendance).trim() !== '请假' && e.hasPreDispatch && (e.wageThreshold <= 0 || !e.isFull)).length
	return { total, unassigned, full, incomplete, leave }
})

const maxEmployeeRecordCount = computed(() => {
	return Math.max(0, ...employeeDispatchSummary.value.map((e) => e.records.length))
})

const PROCESS_DETAIL_WORKSHEET_ID = 'paigongdan'
const PROCESS_DETAIL_FIELD_MAP = {
	sequence: '693a62040f64427fac25ae80',
	processName: '656ffd1bba5ef3863bf3ec1e',
	needCount: '690dc19f8d797ee211e7fc60',
	finishCount: '697c8b023b5e707f84ce02cc',
	allcount: '68099ac75d6fc47331574e82',
	orderCount: '6a015a2ac03685667d63787f',
	dailyOutput: '69a96d623b5e707f84d380b6',
	hourlyoutput: '693a879a0f64427fac25da92',
}

const EMPLOYEE_WORKSHEET_ID = 'yggs'
const EMPLOYEE_FIELD_MAP = {
	workshop: '696075d19223cfe3a0c169dc',
	dispatchDate: '69524e7b7a59e0522d855df6',
	totalHours: '6a4f304c6d70ffabc67913b8',
	wage: '6a4f304c6d70ffabc67913b9',
	employeeName: '6938db8bda0981f67b352af3',
	attendance: '6959e1077a59e0522d877f8b',
	position: '6943bf332161a0fc58bad7a4',
	isNewEmployee: '6a7155014239d5290f2ca6db',
	isTempEmployee: '6a744cdb4239d5290f2f6e4a'
}

const MAX_EMPLOYEE_HOURS = 11

// 岗位工序匹配表中员工所属工序字段映射
const POSITION_PROCESS_FIELD_MAP = {
	stretchAndPolish: ['6a55c3db6d70ffabc67ae835', '6a55c3db6d70ffabc67ae837', '6a55c3db6d70ffabc67ae839', '6a6975376d70ffabc6822704', '6a6975376d70ffabc6822706'],
	assembly: ['6a55d98e6d70ffabc67afbe1', '6a55d98e6d70ffabc67afbe3', '6a55d98e6d70ffabc67afbe5', '6a6975596d70ffabc6822737', '6a6975596d70ffabc6822739']
}
const ASSEMBLY_POSITION_WORKSHEET_ID = '6a55c4956d70ffabc67ae898'
const ASSEMBLY_POSITION_FIELD_ID = '6a276ffc6d70ffabc66285f8'

const SPRAY_PROCESS_WORKSHEET_ID = '6a3cd2a06d70ffabc66fd87f'
const SPRAY_PROCESS_FIELD_MAP = {
	processName: '6a5599736d70ffabc67ad331',
	employeeName: '6a3cd2e76d70ffabc66fd8ac'
}

const RECORD_BG_COLORS = ['#e8f4f8', '#f2f0e6', '#f9f0f4', '#eaf6ea', '#fff6e6']

// 组装车间岗位筛选按钮（仅权限车间为组装车间时显示），数据来自岗位工序表
// 按钮结构：{ name: 显示名, rowid: 主岗位工序rowid, positionRowids: 内部岗位rowid数组, positionNames: 内部岗位名数组 }
const assemblyPositionButtons = ref([])
// 当前选中的岗位按钮名称（单选），用于筛选产品列表及添加产品传参
const activeAssemblyPosition = ref('')



const showConfirmDispatchModal = ref(false)
const confirmDispatchCount = ref(0)
const confirmDispatchRowids = ref([])
const isConfirmDispatching = ref(false)
// 确认派工前的初始预派工总条数（用于轮询判断，产品行可能对应多条预派工，按预派工条数计算）
const initialPreDispatchCountForConfirm = ref(0)

// 订单选择相关
const showSelectOrderModal = ref(false)
const orderList = ref([])
const filteredOrderList = ref([])
const orderSearchKeyword = ref('')
const selectedOrder = ref(null)
const orderPageNum = ref(1)
const orderHasMore = ref(true)
const orderLoadingMore = ref(false)
const orderRefresherTriggered = ref(false)

// 产品选择相关
const showSelectProductModal = ref(false)
const selectProductList = ref([])
const filteredSelectProductList = ref([])
const productSearchKeyword = ref('')
const selectedProductKeys = ref([])
const productPageNum = ref(1)
const productHasMore = ref(true)
const productLoadingMore = ref(false)
const productRefresherTriggered = ref(false)
const expandedProductKeys = ref([])

const showEditModal = ref(false)
const editData = ref({
	rowid: '',
	orderNo: '',
	productNameNew: '',
	processDisplay: '',
	dispatchDate: '',
	dispatchCount: '',
	employeeName: '',
	employeeId: '',
	employeeNames: [],
	selectedEmployeeIds: [],
	selectedEmployeeNames: [],
	worktime: '',
	wage: ''
})

// 添加产品弹窗（合并订单+产品选择）
const showAddProductModal = ref(false)
const addProductOrderSearch = ref('') // 订单编号搜索
const addProductNameSearch = ref('') // 产品名称搜索
const addProductList = ref([]) // 订单分组列表
const filteredAddProductList = ref([])
const expandedOrderKeys = ref([]) // 展开的订单
const multiSelectProductKeys = ref([]) // 多选的产品
const expandedProductSpecs = ref([]) // 展开规格的产品
const addProductLoading = ref(false)
const addProductRefresherTriggered = ref(false)

const showEmployeeSelector = ref(false)
// 员工选择框打开模式：edit-依附预派工调整弹窗；process-从工序员工栏独立打开
const employeeSelectorMode = ref('edit')
const allEmployeeOptions = ref([])
// 员工选择框数据加载中标记：列表为空时用于显示"获取员工数据中"提示
const employeeListLoading = ref(false)

// 记录上次加载员工列表时的筛选条件，用于判断是否需要重新加载
const lastEmployeeOptionsParams = ref({
	workshop: '',
	date: '',
	type: 'normal'
})

// 员工类型切换：normal-正常员工，temp-临时工
const employeeTypeFilter = ref('normal')

// 筛选后的员工列表（前端根据 employeeTypeFilter 过滤显示）
const filteredEmployees = computed(() => {
	if (employeeTypeFilter.value === 'normal') {
		return allEmployeeOptions.value.filter(emp => !emp.isTempEmployee)
	} else if (employeeTypeFilter.value === 'temp') {
		return allEmployeeOptions.value.filter(emp => emp.isTempEmployee)
	}
	return allEmployeeOptions.value
})

const showProcessActionModal = ref(false)
const processActionProduct = ref(null)
const processActionSearch = ref('')
const processActionList = ref([])
const processActionSelected = ref(null)
const processActionModeIndex = ref(0)
const processActionModeOptions = ['添加', '替换', '删除']
const processActionLoading = ref(false)
const processActionSequence = ref('')

const showAttendancePanel = ref(false)
const showProcessPanel = ref(false)
const expandedEmployeeId = ref('')

// 面板开关延迟定时器（快速切换时取消旧定时器，避免已关闭的面板重新打开）
let attendancePanelTimer = null
let processPanelTimer = null

const showProcessDropdownPanel = ref(false)
const processDropdownList = ref([])
const selectedProcessDropdownEmployee = ref(null)
const selectedProcessSeq = ref(0)

const showSprayPanel = ref(false)
const sprayProcessList = ref([])
const sprayExpandedId = ref('')
const sprayEmployeeList = ref([])

const submitAttendance = async (status, emp) => {
	if (!emp.id) {
		uni.showToast({ title: '缺少员工ID', icon: 'none' })
		return
	}
	try {
		uni.showLoading({ title: '提交中...', mask: true })
		// 明道云 hook 成功失败均返回 status:1，无法据此区分，HTTP 请求成功即视为业务成功
		await http.post(ATTENDANCE_SUBMIT_URL, {
			rowid: emp.id,
			status
		})
		uni.hideLoading()
		uni.showToast({ title: `${status}打卡成功`, icon: 'success' })
		loadWorkshopEmployees()
	} catch (e) {
		uni.hideLoading()
		console.error('出勤提交失败:', e)
		uni.showToast({ title: '提交失败', icon: 'none' })
	}
}

const handleChartEmployeeSwipeUp = (emp) => {
	submitAttendance('到', emp)
}

const handleChartEmployeeSwipeDown = (emp) => {
	submitAttendance('缺', emp)
}

// 岗位工序员工柱-新按钮点击
const handlePositionEmployeeNew = async (emp) => {
	uni.showLoading({ title: '提交中...' })
	try {
		await http.post('/api/workflow/hooks/NmE3MTczNTI0MzJhMDUzZDgyMGU1ODRj', {
			employeeRowid: emp.rowid,
			type: '新'
		})
		uni.hideLoading()
		uni.showToast({ title: '提交成功', icon: 'success' })
		loadPositionProcessEmployees()
	} catch (e) {
		uni.hideLoading()
		uni.showToast({ title: e.message || '提交失败', icon: 'none' })
	}
}

// 岗位工序员工柱-老按钮点击
const handlePositionEmployeeOld = async (emp) => {
	uni.showLoading({ title: '提交中...' })
	try {
		await http.post('/api/workflow/hooks/NmE3MTczNTI0MzJhMDUzZDgyMGU1ODRj', {
			employeeRowid: emp.rowid,
			type: '老'
		})
		uni.hideLoading()
		uni.showToast({ title: '提交成功', icon: 'success' })
		loadPositionProcessEmployees()
	} catch (e) {
		uni.hideLoading()
		uni.showToast({ title: e.message || '提交失败', icon: 'none' })
	}
}

const toggleAttendancePanel = () => {
	if (attendancePanelTimer) clearTimeout(attendancePanelTimer)
	if (showAttendancePanel.value) {
		showAttendancePanel.value = false
		closeProcessDropdownPanel()
		return
	}
	showProcessPanel.value = false
	showSprayPanel.value = false
	sprayExpandedId.value = ''
	closeProcessDropdownPanel()
	attendancePanelTimer = setTimeout(() => {
		showAttendancePanel.value = true
		loadWorkshopEmployees()
	}, 300)
}

const toggleProcessPanel = () => {
	if (processPanelTimer) clearTimeout(processPanelTimer)
	if (showProcessPanel.value) {
		showProcessPanel.value = false
		closeProcessDropdownPanel()
		return
	}
	showAttendancePanel.value = false
	showSprayPanel.value = false
	sprayExpandedId.value = ''
	closeProcessDropdownPanel()
	processPanelTimer = setTimeout(() => {
		showProcessPanel.value = true
		loadPositionProcessEmployees()
	}, 300)
}

const toggleSprayPanel = () => {
	if (showSprayPanel.value) {
		showSprayPanel.value = false
		sprayExpandedId.value = ''
	} else {
		showAttendancePanel.value = false
		showProcessPanel.value = false
		closeProcessDropdownPanel()
		showSprayPanel.value = true
		loadSprayProcessList()
		loadSprayEmployees()
	}
}

const toggleSprayItemExpand = (item) => {
	if (sprayExpandedId.value === item.id) {
		sprayExpandedId.value = ''
	} else {
		sprayExpandedId.value = item.id
	}
}

const closeAllPanels = () => {
	if (attendancePanelTimer) clearTimeout(attendancePanelTimer)
	if (processPanelTimer) clearTimeout(processPanelTimer)
	showAttendancePanel.value = false
	showProcessPanel.value = false
	showSprayPanel.value = false
	sprayExpandedId.value = ''
	closeProcessDropdownPanel()
}

const handleProcessItemClick = (emp, seq) => {
	if (showProcessDropdownPanel.value && selectedProcessSeq.value === seq && selectedProcessDropdownEmployee.value?.id === emp.id) {
		closeProcessDropdownPanel()
		return
	}
	openProcessDropdownPanel(emp, seq)
}

const toggleProcessDropdownPanel = () => {
	showProcessDropdownPanel.value = !showProcessDropdownPanel.value
	if (!showProcessDropdownPanel.value) {
		selectedProcessDropdownEmployee.value = null
		processDropdownList.value = []
		expandedEmployeeId.value = ''
	}
}

const openProcessDropdownPanel = async (emp, seq) => {
	selectedProcessDropdownEmployee.value = emp
	selectedProcessSeq.value = seq || 0
	showProcessDropdownPanel.value = true
	await loadProcessDropdownList(emp)
}

const closeProcessDropdownPanel = () => {
	showProcessDropdownPanel.value = false
	selectedProcessDropdownEmployee.value = null
	processDropdownList.value = []
	selectedProcessSeq.value = 0
}

const handleProcessDropdownItemClick = async (proc) => {
	const emp = selectedProcessDropdownEmployee.value
	if (!emp || !emp.id) {
		uni.showToast({ title: '缺少员工信息', icon: 'none' })
		return
	}
	if (!proc.rowid) {
		uni.showToast({ title: '缺少工序信息', icon: 'none' })
		return
	}
	try {
		uni.showLoading({ title: '提交中...', mask: true })
		const params = {
			employeeRowid: emp.id,
			processSeq: selectedProcessSeq.value,
			processRowid: proc.rowid,
			workshop: loginWorkshop.value || ''
		}
		await http.post(POSITION_PROCESS_SELECT_URL, params)
		uni.hideLoading()
		uni.showToast({ title: '提交成功', icon: 'success' })
		closeProcessDropdownPanel()
		loadPositionProcessEmployees()
	} catch (e) {
		uni.hideLoading()
		console.error('岗位工序选择提交失败:', e)
		uni.showToast({ title: '提交失败', icon: 'none' })
	}
}

const handleProcessDelete = async (emp, seq) => {
	if (!emp || !emp.id) {
		uni.showToast({ title: '缺少员工信息', icon: 'none' })
		return
	}
	try {
		uni.showLoading({ title: '删除中...', mask: true })
		const params = {
			employeeId: emp.id,
			processSeq: seq,
			workshop: loginWorkshop.value || ''
		}
		await http.post(POSITION_PROCESS_DELETE_URL, params)
		uni.hideLoading()
		uni.showToast({ title: '删除成功', icon: 'success' })
		loadPositionProcessEmployees()
	} catch (e) {
		uni.hideLoading()
		console.error('岗位工序删除失败:', e)
		uni.showToast({ title: '删除失败', icon: 'none' })
	}
}

const handleSprayEmployeeClick = async (emp) => {
	try {
		uni.showLoading({ title: '提交中...', mask: true })
		const params = {
			sprayProcessId: sprayExpandedId.value,
			employeeId: emp.id
		}
		await http.post(SPRAY_PROCESS_EMPLOYEE_URL, params)
		uni.hideLoading()
		uni.showToast({ title: '提交成功', icon: 'success' })
		loadSprayProcessList()
	} catch (e) {
		uni.hideLoading()
		console.error('喷涂工序员工提交失败:', e)
		uni.showToast({ title: '提交失败', icon: 'none' })
	}
}

const loadProcessDropdownList = async (emp) => {
	try {
		const ws = loginWorkshop.value

		if (ws === '拉伸车间') {
			// 拉伸车间：从工序字典获取三级工序
			const filters = [
				{ controlId: '6614d7ed1f7f1264f3a332c3', dataType: 30, spliceType: 1, filterType: 2, values: ['工序'] },
				{ controlId: '66b07c4a965ba588586ec783', dataType: 30, spliceType: 1, filterType: 2, values: ['三级'] },
				{ controlId: '6a324e7d6d70ffabc66cbe5f', dataType: 30, spliceType: 1, filterType: 2, values: ['1'] },
				{
					controlId: '691e8522d50c894e2e798d03',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: [ws]
				}
			]
			const res = await callWorkflowListAll({
				worksheetId: 'shujuzidian',
				filters,
				silent: true
			}, 100)
			const rows = Array.isArray(res?.data) ? res.data : []
			processDropdownList.value = rows.map((item) => ({
				rowid: item.rowid || '',
				processName: item['Name'] || '-'
			}))
			return
		}

		// 喷涂、抛光、组装车间：从岗位工序表获取岗位
		const filters = []
		filters.push({
			controlId: '6a3124a86d70ffabc66c8515',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: [ws]
		})

		// 喷涂车间同时获取喷涂和组装车间的岗位
		const workshopList = ws === '喷涂车间' ? ['喷涂车间', '组装车间'] : [ws]
		const allRows = []
		for (const w of workshopList) {
			const res = await callWorkflowListAll({
				worksheetId: ASSEMBLY_POSITION_WORKSHEET_ID,
				filters: [{ controlId: '6a3124a86d70ffabc66c8515', dataType: 30, spliceType: 1, filterType: 2, values: [w] }],
				silent: true
			}, 100)
			const rows = Array.isArray(res?.data) ? res.data : []
			allRows.push(...rows)
		}
		processDropdownList.value = allRows.map((item) => ({
			rowid: item.rowid || '',
			processName: item['Name'] || item[ASSEMBLY_POSITION_FIELD_ID] || '-'
		}))
	} catch (e) {
		console.error('加载工序抽屉数据失败:', e)
		processDropdownList.value = []
	}
}

const toggleEmployeeExpand = (emp) => {
	expandedEmployeeId.value = expandedEmployeeId.value === emp.id ? '' : emp.id
	if (!expandedEmployeeId.value) {
		closeProcessDropdownPanel()
	}
}

const goBack = () => {
	uni.redirectTo({
		url: '/pages/main/main'
	})
}

const goToProcessConfig = () => {
	uni.navigateTo({
		url: '/pages/processConfig/processConfig'
	})
}

const handleHeaderRefresh = async () => {
	closeAllPanels()
	// 清空已加载的工序，刷新后要为仍选中的产品重新拉取
	processList.value = []
	loadedProductIds.value = []
	await handleSearch()
	// 为刷新后仍选中的产品重新加载工序，避免点不开工序列表
	for (const id of selectedProductIds.value) {
		const product = productList.value.find((p) => p.uniqueKey === id)
		if (product) {
			await loadProductProcesses(product)
		}
	}
	uni.showToast({ title: '刷新成功', icon: 'success' })
}

const formatFieldValue = (v) => {
	if (v == null || v === '') return ''
	if (typeof v === 'string') {
		const t = v.trim()
		if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
			try {
				const p = JSON.parse(t)
				return formatFieldValue(p)
			} catch {
				return t
			}
		}
		return t
	}
	if (Array.isArray(v)) {
		const first = v[0]
		if (first && typeof first === 'object') {
			return String(first.name || first.text || first.value || first.fullname || '').trim()
		}
		return v.filter(Boolean).map((x) => (typeof x === 'string' ? x : '')).join('、').trim()
	}
	if (typeof v === 'object') {
		return String(v.name || v.text || v.value || v.label || v.title || '').trim()
	}
	return String(v).trim()
}

const extractRelationSids = (v) => {
	if (v == null || v === '') return []
	if (typeof v === 'string') {
		const t = v.trim()
		if (t.startsWith('[') && t.endsWith(']')) {
			try {
				const p = JSON.parse(t)
				return extractRelationSids(p)
			} catch {
				return []
			}
		}
		// 处理逗号分隔的 rowid 字符串（关联记录字段可能返回 "id1,id2"）
		if (t.includes(',')) {
			return t.split(',').map(s => s.trim()).filter(Boolean)
		}
		return [t]
	}
	if (Array.isArray(v)) {
		return v
			.filter(item => item != null)
			.map(item => {
				if (typeof item === 'string') return item.trim()
				if (typeof item === 'object' && item !== null) return item.sid || item.value || item.id || ''
				return ''
			})
			.filter(Boolean)
	}
	if (typeof v === 'object') {
		const sid = v.sid || v.value || v.id || ''
		return sid ? [String(sid).trim()] : []
	}
	return []
}

const parseSpecification = (spec) => {
	if (!spec) return { craft: '', innerPaint: '', polish: '', guokou: '' }
	const result = { craft: '', innerPaint: '', polish: '', guokou: '' }
	const pairs = spec.split(';')
	for (const pair of pairs) {
		const idx = pair.indexOf(':')
		if (idx > 0) {
			const key = pair.substring(0, idx).trim().toLowerCase()
			const value = pair.substring(idx + 1).trim()
			if (key === '工艺') result.craft = value
			else if (key === '内涂料') result.innerPaint = value
			else if (key === '抛光') result.polish = value
			else if (key === '锅口') result.guokou = value
		}
	}
	return result
}

const formatSpecification = (v) => {
	const raw = formatFieldValue(v)
	if (!raw) return ''
	if (loginWorkshop.value && loginWorkshop.value !== '组装车间') {
		const idx = raw.indexOf('盖子')
		if (idx !== -1) {
			return raw.substring(0, idx).trim()
		}
	}
	return raw
}

const mapPreDispatchRow = (item) => ({
	rowid: item.rowid,
	orderNo: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.pureOrderNo]) || formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.orderNo]),
	productName: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.productName]),
	productNameNew: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.productNameNew]),
	workshop: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.workshop]),
	dispatchDate: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.dispatchDate]),
	dispatchCount: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.dispatchCount]),
	worktime: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.worktime]),
	wage: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.wage]),
	specification: formatSpecification(item[PRE_DISPATCH_FIELD_MAP.specification]),
	processName: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.processName]),
	employeeName: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.employeeName]),
	processDetail: extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail]),
	craftPosition: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.craftPosition]),
	positionProcessRowids: extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.positionProcess]),
	dailyWage: extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.dailyWage]),
	productionCode: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.productionCode]),
	orderCount: formatFieldValue(item['6a5f19556d70ffabc67f0ce9']),
	...parseSpecification(item[PRE_DISPATCH_FIELD_MAP.specification]),
	thickness: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.thickness]),
	guokouSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.guokouSpec]),
	guokouSizeSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.guokouSizeSpec]),
	craftSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.craftSpec]),
	paintSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.paintSpec]),
	polishSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.polishSpec]),
	materialSizeSpec: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.materialSizeSpec]),
	productDeliveryDate: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.productDeliveryDate]) || '',
	status: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.status]) || ''
})

const DICTIONARY_WORKSHEET_ID = 'shujuzidian'
const DICTIONARY_PROCESS_TYPE_FIELD = '6614d7ed1f7f1264f3a332c3'
const DICTIONARY_PROCESS_LEVEL_FIELD = '66b07c4a965ba588586ec783'
const DICTIONARY_PROCESS_STATUS_FIELD = '6a324e7d6d70ffabc66cbe5f'
const DICTIONARY_WORKSHOP_FIELD = '691e8522d50c894e2e798d03'
const DICTIONARY_NAME_FIELD = 'Name'

const loadProcessDictionaryMap = async () => {
	try {
		const res = await callWorkflowListAll({
			worksheetId: DICTIONARY_WORKSHEET_ID,
			filters: [
				{ controlId: DICTIONARY_PROCESS_TYPE_FIELD, dataType: 30, spliceType: 1, filterType: 2, values: ['工序'] },
				{ controlId: DICTIONARY_PROCESS_LEVEL_FIELD, dataType: 30, spliceType: 1, filterType: 2, values: ['三级'] },
				{ controlId: DICTIONARY_PROCESS_STATUS_FIELD, dataType: 30, spliceType: 1, filterType: 2, values: ['1'] }
			],
			silent: true
		}, 100)
		const rows = Array.isArray(res?.data) ? res.data : []
		const map = new Map()
		rows.forEach(item => {
			if (item.rowid) {
				map.set(item.rowid, item[DICTIONARY_NAME_FIELD] || '-')
			}
		})
		return map
	} catch (e) {
		console.error('获取工序字典失败:', e)
		return new Map()
	}
}

/** 加载工艺岗位字典（用于 craftPosition ID 转名称） */
const loadCraftPositionList = async () => {
	try {
		let allRows = []
		let pageNum = 1
		const pageSize = 100
		const MAX_PAGES = 5
		while (pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: CRAFT_POSITION_DICT_WORKSHEET_ID,
				filters: [],
				silent: true
			}, pageSize, pageNum)
			const rows = Array.isArray(res?.data) ? res.data : []
			allRows.push(...rows)
			if (rows.length < pageSize) break
			pageNum++
		}
		const newMap = new Map()
		allRows.forEach(item => {
			if (item.rowid) {
				newMap.set(item.rowid, item[CRAFT_POSITION_DICT_NAME_FIELD] || '')
			}
		})
		craftPositionDictMap.value = newMap
	} catch (e) {
		console.error('获取工艺岗位字典失败:', e)
	}
}

const loadPositionProcessDict = async () => {
	try {
		let allRows = []
		let pageNum = 1
		const pageSize = 100
		const MAX_PAGES = 5
		while (pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: POSITION_PROCESS_DICT_WORKSHEET_ID,
				filters: [],
				silent: true
			}, pageSize, pageNum)
			const rows = Array.isArray(res?.data) ? res.data : []
			allRows.push(...rows)
			if (rows.length < pageSize) break
			pageNum++
		}
		const newMap = new Map()
		allRows.forEach(item => {
			if (item.rowid) {
				newMap.set(item.rowid, item[POSITION_PROCESS_DICT_NAME_FIELD] || item['Name'] || '')
			}
		})
		positionProcessDictMap.value = newMap
	} catch (e) {
		console.error('获取岗位工序字典失败:', e)
	}
}

// 加载工序字典（用于把归类表中的工序 rowid 解析为名称），最多拉取 5 页（500 条）
const loadProcessDictMap = async () => {
	try {
		let allRows = []
		let pageNum = 1
		const pageSize = 100
		const MAX_PAGES = 50  // 增加页数上限
		while (pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: PROCESS_DICT_WORKSHEET_ID,
				filters: [{
					controlId: PROCESS_DICT_TYPE_FIELD,
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: ['工序']
				}],
				silent: true
			}, pageSize, pageNum)
			const rows = Array.isArray(res?.data) ? res.data : []
			allRows.push(...rows)
			if (rows.length < pageSize) break
			pageNum++
		}
		const newMap = new Map()
		allRows.forEach(item => {
			if (item.rowid) {
				newMap.set(item.rowid, item['Name'] || '')
			}
		})
		processDictMap.value = newMap
	} catch (e) {
		console.error('获取工序字典失败:', e)
	}
}

// 加载工序归类表（用于同类别工序同步勾选），最多拉取 5 页
const loadCraftPositionMap = async () => {
	try {
		let allRows = []
		let pageNum = 1
		const pageSize = 100
		const MAX_PAGES = 50  // 增加页数上限
		while (pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: CRAFT_POSITION_WORKSHEET_ID,
				filters: [],
				silent: true
			}, pageSize, pageNum)
			const rows = Array.isArray(res?.data) ? res.data : []
			allRows.push(...rows)
			if (rows.length < pageSize) break
			pageNum++
		}
		const rows = allRows
		const newMap = new Map()
		rows.forEach(item => {
			const categoryName = formatFieldValue(item[CRAFT_POSITION_FIELD_ID]) || item['Name'] || ''
			const rawRelated = item[CRAFT_POSITION_RELATED_PROCESS_FIELD]
			if (!categoryName) return
			let processRowids = []
			if (Array.isArray(rawRelated)) {
				processRowids = rawRelated
					.map(p => (typeof p === 'string' ? p.trim() : String(p.sid || p.value || p.id || '').trim()))
					.filter(Boolean)
			} else if (typeof rawRelated === 'string' && rawRelated.trim()) {
				const t = rawRelated.trim()
				if (t.startsWith('[') && t.endsWith(']')) {
					try {
						const parsed = JSON.parse(t)
						if (Array.isArray(parsed)) {
							processRowids = parsed
								.map(p => (typeof p === 'string' ? p.trim() : String(p.sid || p.value || p.id || '').trim()))
								.filter(Boolean)
						}
					} catch {
						processRowids = []
					}
				} else {
					processRowids = t.split(/[,，]/).map(s => s.trim()).filter(Boolean)
				}
			}
			// 把工序字典 rowid 解析成名称，便于按工序名称匹配
			const processNames = processRowids
				.map(rowid => processDictMap.value.get(rowid))
				.filter(Boolean)
			newMap.set(categoryName, processNames)
		})
		craftPositionMap.value = newMap
	} catch (e) {
		console.error('获取工序归类表失败:', e)
	}
}

const handleSearch = async () => {
	await loadProducts(true)
	loadEmployeeDispatchSummary()
	loadWorkshopEmployees()
}

const handleReset = () => {
	filterOrderCode.value = ''
	filterProductName.value = ''
	filterCraft.value = ''
	filterInnerPaint.value = ''
	filterPolish.value = ''
	filterGuokou.value = ''
	filterDate.value = getTomorrowDate()
	selectedProductIds.value = []
	processList.value = []
	loadedProductIds.value = []
	handleSearch()
}

const onDateChange = (e) => {
	filterDate.value = e.detail.value
	handleSearch()
}

const handleAddPreDispatch = () => {
	const workshop = loginWorkshop.value || '拉伸车间'
	uni.navigateTo({
		url: `/pages/selectBills/selectBills?workshop=${encodeURIComponent(workshop)}&fromPreDispatch=1`
	})
}

// 添加产品：打开选择产品弹窗（合并订单+产品选择）
const handleAddProduct = () => {
	addProductOrderSearch.value = ''
	addProductNameSearch.value = ''
	addProductList.value = []
	filteredAddProductList.value = []
	expandedOrderKeys.value = []
	multiSelectProductKeys.value = []
	loadAddProductList()
}

// 加载订单产品列表（使用原产品接口，按订单分组）
const loadAddProductList = async () => {
	addProductLoading.value = true
	try {
		uni.showLoading({ title: '加载中...' })
		// 使用原来的产品接口，循环拉取直到没有更多数据
		const filters = [
			{
				controlId: '67de26c9c5377d50a523c735',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [loginWorkshop.value || '拉伸车间']
			},
			{
				controlId: '694a3954687045435008a7c3',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: ['正常排产']
			},
			{
				controlId: '655b875ffc44a9469a3aa225',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: ['已排产', '部分排产']
			},
			{
				controlId: '69db0017665ab27f3913c455',
				dataType: 30,
				spliceType: 1,
				filterType: 6,
				values: ['准时交货']
			},
			{
				controlId: '66974cda2503723eec1af600',
				dataType: 30,
				spliceType: 1,
				filterType: 8
			}
		]
		const pageSize = 100
		let pageNum = 1
		const allRows = []
		const MAX_PAGES = 500
		while (pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: 'paichanjihua',
				filters,
				pageSize,
				pageNum
			})
			const rows = Array.isArray(res?.data) ? res.data : []
			if (rows.length === 0) break
			allRows.push(...rows)
			if (rows.length < pageSize) break
			pageNum++
		}
		uni.hideLoading()

		const rows = allRows
		// 前端过滤：正常排产时，未完成工序数量 > 0
		const FIELD_INCOMPLETE_PROCESS_QTY = '69a8e4563b5e707f84d33c0c'
		const filteredRows = rows.filter(item => {
			const num = Number(item[FIELD_INCOMPLETE_PROCESS_QTY])
			return !Number.isNaN(num) && num > 0
		})

		// 映射产品数据
		const products = filteredRows.map(item => ({
			rowid: item.rowid || '',
			orderCode: item['655e1cbbbd2094b316347f92'] || '',
			customerName: item['69a8ed3c3b5e707f84d33f8b'] || '',
			name: item['6937d255ff2b019b3cb34be3'] || '',
			models: item['6937d255ff2b019b3cb34be4'] || '',
			orderCount: item['69e33354665ab27f3916f758'] || '',
			productionCode: item['698438933b5e707f84cf51fd'] || '',
			productCode: item['691d6336535b29cbd5c6c0ca'] || '',
			deliveryDate: formatFieldValue(item['69ad33ee3b5e707f84d43b09']) || ''
		}))

		// 按订单分组
		const orderGroupMap = {}
		products.forEach(product => {
			const orderCode = product.orderCode
			if (!orderGroupMap[orderCode]) {
				orderGroupMap[orderCode] = {
					orderCode,
					customerName: product.customerName,
					products: []
				}
			}
			orderGroupMap[orderCode].products.push(product)
		})

		const orderGroups = Object.values(orderGroupMap)
		addProductList.value = orderGroups
		filteredAddProductList.value = [...orderGroups]

		// 不自动展开订单，让用户手动点击展开
		expandedOrderKeys.value = []

		showAddProductModal.value = true
	} catch (e) {
		console.error('加载订单产品失败:', e)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		addProductLoading.value = false
		uni.hideLoading()
	}
}

// 切换订单展开/折叠
const toggleOrderExpand = (orderCode) => {
	const idx = expandedOrderKeys.value.indexOf(orderCode)
	if (idx >= 0) {
		expandedOrderKeys.value.splice(idx, 1)
	} else {
		expandedOrderKeys.value.push(orderCode)
	}
}

// 切换产品多选
const toggleMultiProductSelection = (product) => {
	const idx = multiSelectProductKeys.value.indexOf(product.productionCode)
	if (idx >= 0) {
		multiSelectProductKeys.value.splice(idx, 1)
	} else {
		multiSelectProductKeys.value.push(product.productionCode)
	}
}

// 选中产品清单（计算属性）
const selectedProductList = computed(() => {
	const list = []
	addProductList.value.forEach(group => {
		group.products.forEach(product => {
			if (multiSelectProductKeys.value.includes(product.productionCode)) {
				list.push({
					productionCode: product.productionCode,
					orderCode: group.orderCode,
					productName: product.name || '-'
				})
			}
		})
	})
	return list
})

// 切换规格展开
const toggleProductSpecExpand = (product) => {
	const idx = expandedProductSpecs.value.indexOf(product.productionCode)
	if (idx >= 0) {
		expandedProductSpecs.value.splice(idx, 1)
	} else {
		expandedProductSpecs.value.push(product.productionCode)
	}
}

// 搜索过滤添加产品列表
const filterAddProductList = () => {
	const orderKeyword = addProductOrderSearch.value.trim().toLowerCase()
	const nameKeyword = addProductNameSearch.value.trim().toLowerCase()
	
	// 无筛选条件时显示全部
	if (!orderKeyword && !nameKeyword) {
		filteredAddProductList.value = addProductList.value.map(group => ({
			...group,
			products: [...group.products]
		}))
		return
	}
	
	filteredAddProductList.value = addProductList.value
		.map(group => {
			// 订单编号匹配
			const orderMatch = !orderKeyword || group.orderCode.toLowerCase().includes(orderKeyword)
			// 产品名称筛选（只显示匹配的产品）
			let filteredProducts = group.products
			if (nameKeyword) {
				filteredProducts = group.products.filter(p =>
					(p.name || '').toLowerCase().includes(nameKeyword)
				)
			}
			return {
				...group,
				products: filteredProducts
			}
		})
		.filter(group => {
			// 订单编号匹配 或 有匹配的产品
			const orderMatch = !orderKeyword || group.orderCode.toLowerCase().includes(orderKeyword)
			const hasProducts = group.products.length > 0
			return orderMatch && hasProducts
		})
}

// 下拉刷新
const onAddProductRefresh = async () => {
	addProductRefresherTriggered.value = true
	await loadAddProductList()
	addProductRefresherTriggered.value = false
}

// 加载更多
const onAddProductLoadMore = () => {
	// 暂时不支持分页加载
}

// 确认多选产品
const confirmMultiSelectedProducts = async () => {
	if (multiSelectProductKeys.value.length === 0) {
		uni.showToast({ title: '请先选择产品', icon: 'none' })
		return
	}
	// 收集选中的产品 rowid
	const selectedRowids = []
	addProductList.value.forEach(group => {
		group.products.forEach(product => {
			if (multiSelectProductKeys.value.includes(product.productionCode)) {
				selectedRowids.push(product.rowid)
			}
		})
	})
	showAddProductModal.value = false
	// 调用添加产品逻辑
	await addProductsByRowids(selectedRowids)
}

// 关闭添加产品弹窗
const closeAddProductModal = () => {
	showAddProductModal.value = false
}

// 获取订单列表
const loadOrderList = async (append = false) => {
	try {
		const pageNum = append ? orderPageNum.value : 1
		if (!append) {
			uni.showLoading({ title: '加载中...' })
		}
		const res = await callWorkflowListAPIPaged({
			worksheetId: 'paichanjihua',
			filters: [
				{
					controlId: '67de26c9c5377d50a523c735',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: [loginWorkshop.value || '拉伸车间']
				},
				{
					controlId: '694a3954687045435008a7c3',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: ['正常排产']
				},
				{
					controlId: '655b875ffc44a9469a3aa225',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: ['已排产', '部分排产']
				},
				{
					controlId: '69db0017665ab27f3913c455',
					dataType: 30,
					spliceType: 1,
					filterType: 6,
					values: ['准时交货']
				},
				{
					controlId: '66974cda2503723eec1af600',
					dataType: 30,
					spliceType: 1,
					filterType: 8
				}
			],
			pageSize: 100,
			pageNum
		})
		uni.hideLoading()

		const rows = res?.data || []
		// 前端过滤：正常排产时，未完成工序数量 > 0
		const FIELD_INCOMPLETE_PROCESS_QTY = '69a8e4563b5e707f84d33c0c'
		const filteredRows = rows.filter(item => {
			const num = Number(item[FIELD_INCOMPLETE_PROCESS_QTY])
			return !Number.isNaN(num) && num > 0
		})
		// 按订单编号汇总
		const orderMap = {}
		filteredRows.forEach(item => {
			const orderCode = item['655e1cbbbd2094b316347f92'] || ''
			if (!orderCode) return
			if (!orderMap[orderCode]) {
				orderMap[orderCode] = {
					orderCode,
					customerName: item['69a8ed3c3b5e707f84d33f8b'] || '',
					deliveryTime: item['69ad33ee3b5e707f84d43b09'] || '',
					productCount: 0
				}
			}
			orderMap[orderCode].productCount += 1
		})
		
		const newOrders = Object.values(orderMap).sort((a, b) => {
			const ta = (a.deliveryTime || '').toString().trim()
			const tb = (b.deliveryTime || '').toString().trim()
			if (!ta && !tb) return 0
			if (!ta) return 1
			if (!tb) return -1
			return ta.localeCompare(tb)
		})
		
		if (append) {
			orderList.value = [...orderList.value, ...newOrders]
		} else {
			orderList.value = newOrders
		}
		
		filteredOrderList.value = [...orderList.value]
		orderPageNum.value = pageNum + 1
		orderHasMore.value = rows.length >= 100
		showSelectOrderModal.value = true
	} catch (e) {
		uni.hideLoading()
		console.error('获取订单列表失败:', e)
		uni.showToast({ title: '获取订单列表失败', icon: 'none' })
	}
}

// 下拉刷新订单列表
const onOrderRefresh = async () => {
	orderRefresherTriggered.value = true
	orderPageNum.value = 1
	orderHasMore.value = true
	await loadOrderList(false)
	orderRefresherTriggered.value = false
}

// 上拉加载更多订单
const onOrderLoadMore = async () => {
	if (orderLoadingMore.value || !orderHasMore.value) return
	orderLoadingMore.value = true
	await loadOrderList(true)
	orderLoadingMore.value = false
}

// 搜索过滤订单
const filterOrderList = () => {
	const keyword = (orderSearchKeyword.value || '').trim().toLowerCase()
	if (!keyword) {
		filteredOrderList.value = [...orderList.value]
	} else {
		filteredOrderList.value = orderList.value.filter(order =>
			(order.orderCode || '').toLowerCase().includes(keyword) ||
			(order.customerName || '').toLowerCase().includes(keyword)
		)
	}
}

// 选择订单
const selectOrder = (order) => {
	selectedOrder.value = order
}

// 关闭订单选择弹窗
const closeSelectOrderModal = () => {
	showSelectOrderModal.value = false
}

// 进入选择产品
const goToSelectProduct = () => {
	if (!selectedOrder.value) {
		uni.showToast({ title: '请先选择订单', icon: 'none' })
		return
	}
	productSearchKeyword.value = ''
	selectedProductKeys.value = []
	loadProductList()
}

// 获取产品列表
const loadProductList = async (append = false) => {
	try {
		const pageNum = append ? productPageNum.value : 1
		if (!append) {
			uni.showLoading({ title: '加载中...' })
		}
		const res = await callWorkflowListAPIPaged({
			worksheetId: 'paichanjihua',
			filters: [
				{
					controlId: '67de26c9c5377d50a523c735',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: [loginWorkshop.value || '拉伸车间']
				},
				{
					controlId: '694a3954687045435008a7c3',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: ['正常排产']
				},
				{
					controlId: '655b875ffc44a9469a3aa225',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: ['已排产', '部分排产']
				},
				{
					controlId: '69db0017665ab27f3913c455',
					dataType: 30,
					spliceType: 1,
					filterType: 6,
					values: ['准时交货']
				},
				{
					controlId: '66974cda2503723eec1af600',
					dataType: 30,
					spliceType: 1,
					filterType: 8
				}
			],
			pageSize: 100,
			pageNum
		})
		uni.hideLoading()

		const rows = res?.data || []
		// 前端过滤：正常排产时，未完成工序数量 > 0
		const FIELD_INCOMPLETE_PROCESS_QTY = '69a8e4563b5e707f84d33c0c'
		const filteredRows = rows.filter(item => {
			const num = Number(item[FIELD_INCOMPLETE_PROCESS_QTY])
			return !Number.isNaN(num) && num > 0
		})
		// 映射 + 按订单编号前端筛选
		const targetOrderCode = selectedOrder.value?.orderCode || ''
		const newProducts = filteredRows
			.filter(item => item['655e1cbbbd2094b316347f92'] === targetOrderCode)
			.map(item => ({
				rowid: item.rowid || '',
				orderCode: item['655e1cbbbd2094b316347f92'] || '',
				customerName: item['69a8ed3c3b5e707f84d33f8b'] || '',
				name: item['6937d255ff2b019b3cb34be3'] || '',
				models: item['6937d255ff2b019b3cb34be4'] || '',
				orderCount: item['69e33354665ab27f3916f758'] || '',
				productionCode: item['698438933b5e707f84cf51fd'] || '',
				productCode: item['691d6336535b29cbd5c6c0ca'] || '',
				orderCount: item['6a5f19556d70ffabc67f0ce9'] || ''
			}))
		
		if (append) {
			selectProductList.value = [...selectProductList.value, ...newProducts]
		} else {
			selectProductList.value = newProducts
		}
		
		// 后端已按订单编号筛选，前端仅需按搜索关键字过滤
		filterProductList()
		
		productPageNum.value = pageNum + 1
		productHasMore.value = rows.length >= 100
		showSelectOrderModal.value = false
		showSelectProductModal.value = true
	} catch (e) {
		uni.hideLoading()
		console.error('获取产品列表失败:', e)
		uni.showToast({ title: '获取产品列表失败', icon: 'none' })
	}
}

// 下拉刷新产品列表
const onProductRefresh = async () => {
	productRefresherTriggered.value = true
	productPageNum.value = 1
	productHasMore.value = true
	await loadProductList(false)
	productRefresherTriggered.value = false
}

// 上拉加载更多产品
const onProductLoadMore = async () => {
	if (productLoadingMore.value || !productHasMore.value) return
	productLoadingMore.value = true
	await loadProductList(true)
	productLoadingMore.value = false
}

// 搜索过滤产品
const filterProductList = () => {
	const keyword = (productSearchKeyword.value || '').trim().toLowerCase()
	if (!keyword) {
		filteredSelectProductList.value = [...selectProductList.value]
	} else {
		filteredSelectProductList.value = selectProductList.value.filter(product =>
			(product.name || '').toLowerCase().includes(keyword) ||
			(product.productionCode || '').toLowerCase().includes(keyword) ||
			(product.models || '').toLowerCase().includes(keyword)
		)
	}
}

// 获取产品唯一标识
const getProductKey = (product) => {
	return product.productionCode || product.productCode || `${product.orderCode}-${product.name}`
}

// 切换产品选中状态（产品选择框为单选）
const toggleProductSelection = (product) => {
	const key = getProductKey(product)
	if (selectedProductKeys.value.includes(key)) {
		selectedProductKeys.value = []
	} else {
		selectedProductKeys.value = [key]
	}
}

// 展开/收起产品规格
const toggleProductExpand = (product) => {
	const key = getProductKey(product)
	const idx = expandedProductKeys.value.indexOf(key)
	if (idx >= 0) {
		expandedProductKeys.value.splice(idx, 1)
	} else {
		expandedProductKeys.value.push(key)
	}
}

// 关闭产品选择弹窗
const closeSelectProductModal = () => {
	showSelectProductModal.value = false
}

// 返回选择订单
const backToSelectOrder = () => {
	showSelectProductModal.value = false
	showSelectOrderModal.value = true
}

// 确认选择产品
const confirmSelectedProducts = async () => {
	if (selectedProductKeys.value.length === 0) {
		uni.showToast({ title: '请至少选择一个产品', icon: 'none' })
		return
	}
	
	// 获取选中的产品详情
	const selectedProducts = selectProductList.value.filter(product =>
		selectedProductKeys.value.includes(getProductKey(product))
	)
	
	// 产品选择框只支持选择一个产品，传单个 rowid
	const rowid = selectedProducts[0]?.rowid
	const selectedProductionCode = selectedProducts[0]?.productionCode || selectedProducts[0]?.productCode
	
	if (!rowid) {
		uni.showToast({ title: '数据异常，无法获取产品ID', icon: 'none' })
		return
	}
	
	uni.showLoading({ title: '添加中...', mask: true })
	
	try {
		await http.post(PRE_DISPATCH_PRODUCT_ADD_URL, {
			dispatchDate: filterDate.value,  // 筛选日期
			rowid: rowid,  // 选中产品的 rowid
			positionProcessRowid: getSelectedPositionProcessRowid()  // 所选岗位工序 rowid（未选择/其他车间传空）
		})

		// 添加成功后轮询等待新产品数据写入完成再刷新渲染
		uni.showLoading({ title: '添加产品中...', mask: true })
		const MAX_RETRY = 20
		const INTERVAL = 500
		let found = false

		for (let i = 0; i < MAX_RETRY; i++) {
			await loadProducts(true, true)
			const nowExists = selectedProductionCode
				? productList.value.some(p => p.productionCode === selectedProductionCode)
				: productList.value.length > 0
			if (nowExists) {
				found = true
				break
			}
			if (i < MAX_RETRY - 1) {
				await new Promise(resolve => setTimeout(resolve, INTERVAL))
			}
		}

		uni.hideLoading()
		showSelectProductModal.value = false
		selectedProductKeys.value = []

		if (found) {
			uni.showToast({ title: '添加成功', icon: 'success' })
		} else {
			uni.showToast({ title: '添加成功，数据刷新略有延迟', icon: 'none' })
		}

		// 同步刷新员工相关数据
		loadEmployeeDispatchSummary()
		loadWorkshopEmployees()
	} catch (e) {
		uni.hideLoading()
		console.error('添加预派工失败:', e)
		uni.showToast({ title: '添加失败', icon: 'none' })
	}
}

// 根据 rowid 数组添加产品到预派工
const addProductsByRowids = async (rowids) => {
	if (rowids.length === 0) return

	uni.showLoading({ title: '添加中...', mask: true })

	try {
		// 记录初始产品数量
		const initialProductCount = productList.value.length
		// 期望的产品数量 = 初始数量 + 选中数量
		const expectedProductCount = initialProductCount + rowids.length

		// 调用添加接口，传递 rowid 数组
		await http.post(PRE_DISPATCH_PRODUCT_ADD_URL, {
			dispatchDate: filterDate.value,
			rowid: rowids,  // rowid 数组
			positionProcessRowid: getSelectedPositionProcessRowid()  // 所选岗位工序 rowid（未选择/其他车间传空）
		})

		// 添加成功后轮询等待新产品数据写入完成再刷新渲染
		// 基础等待 3 秒（6 次 × 500ms），每多添加 1 个产品增加 1 次（+500ms），最多 5 秒（10 次）
		const baseRetry = 6
		const maxRetry = Math.min(baseRetry + rowids.length, 10)
		const INTERVAL = 500
		let found = false

		for (let i = 0; i < maxRetry; i++) {
			await loadProducts(true, true)
			if (productList.value.length >= expectedProductCount) {
				found = true
				break
			}
			if (i < maxRetry - 1) {
				await new Promise(resolve => setTimeout(resolve, INTERVAL))
			}
		}

		uni.hideLoading()

		if (found) {
			uni.showToast({ title: '添加成功', icon: 'success' })
		} else {
			// 轮询未达到期望数量，但接口已成功调用，直接刷新一次
			await loadProducts(true, true)
			uni.showToast({ title: '添加成功', icon: 'success' })
		}

		// 同步刷新员工相关数据
		loadEmployeeDispatchSummary()
		loadWorkshopEmployees()
	} catch (e) {
		uni.hideLoading()
		console.error('添加预派工失败:', e)
		uni.showToast({ title: '添加失败', icon: 'none' })
	}
}

// 根据生产单号添加产品到预派工
const addProductsByCodes = async (products) => {
	if (products.length === 0) return

	uni.showLoading({ title: '添加中...', mask: true })

	try {
		// 遍历选中的产品，根据生产单号查询预派工记录
		const productionCodes = products.map(p => p.productionCode).filter(Boolean)

		// 查询预派工记录
		const res = await callWorkflowListAll({
			worksheetId: PRE_DISPATCH_WORKSHEET_ID,
			filters: [{
				controlId: PRE_DISPATCH_FIELD_MAP.productionCode,
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: productionCodes
			}],
			silent: true
		}, 100)

		const rows = Array.isArray(res?.data) ? res.data : []
		if (rows.length === 0) {
			uni.hideLoading()
			uni.showToast({ title: '未找到相关预派工记录', icon: 'none' })
			return
		}

		// 记录初始产品数量
		const initialProductCount = productList.value.length

		// 批量添加产品到预派工（只添加不在列表中的）
		const existingCodes = new Set(productList.value.map(p => p.productionCode))
		const newCodes = productionCodes.filter(code => !existingCodes.has(code))

		if (newCodes.length === 0) {
			uni.hideLoading()
			uni.showToast({ title: '产品已在列表中', icon: 'none' })
			return
		}

		// 调用添加接口
		await http.post(PRE_DISPATCH_PRODUCT_ADD_BY_CODES_URL || PRE_DISPATCH_PRODUCT_ADD_URL, {
			dispatchDate: filterDate.value,
			productionCodes: newCodes,
			positionProcessRowid: getSelectedPositionProcessRowid()  // 所选岗位工序 rowid（未选择/其他车间传空）
		})

		// 添加成功后轮询等待新产品数据写入完成再刷新渲染
		uni.showLoading({ title: '添加产品中...', mask: true })
		const MAX_RETRY = 20
		const INTERVAL = 500
		let found = false

		for (let i = 0; i < MAX_RETRY; i++) {
			await loadProducts(true, true)
			if (productList.value.length > initialProductCount) {
				found = true
				break
			}
			if (i < MAX_RETRY - 1) {
				await new Promise(resolve => setTimeout(resolve, INTERVAL))
			}
		}

		uni.hideLoading()

		if (found) {
			uni.showToast({ title: '添加成功', icon: 'success' })
		} else {
			uni.showToast({ title: '添加成功，数据刷新略有延迟', icon: 'none' })
		}

		// 同步刷新员工相关数据
		loadEmployeeDispatchSummary()
		loadWorkshopEmployees()
	} catch (e) {
		uni.hideLoading()
		console.error('添加预派工失败:', e)
		uni.showToast({ title: '添加失败', icon: 'none' })
	}
}

// 延后预派工
const handleDelayDispatch = async () => {
	// 只获取选中产品的预派工 rowid
	const allRowids = productList.value
		.filter(item => selectedProductIds.value.includes(item.uniqueKey))
		.flatMap(item => item.preDispatchRowids || [])
		.filter(Boolean)
	if (allRowids.length === 0) {
		uni.showToast({ title: '没有可延后的预派工', icon: 'none' })
		return
	}
	// 获取选中产品的信息用于确认框
	const selectedProductsInfo = productList.value
		.filter(item => selectedProductIds.value.includes(item.uniqueKey))
		.map(item => ({
			orderCode: item.orderNo,
			productName: item.productNameNew || item.productName
		}))
	showOperateConfirmModal('delay', allRowids.length, selectedProductsInfo)
}

// 移除预派工
const handleRemoveDispatch = async () => {
	// 只获取选中产品的预派工 rowid
	const allRowids = productList.value
		.filter(item => selectedProductIds.value.includes(item.uniqueKey))
		.flatMap(item => item.preDispatchRowids || [])
		.filter(Boolean)
	if (allRowids.length === 0) {
		uni.showToast({ title: '没有可移除的预派工', icon: 'none' })
		return
	}
	// 获取选中产品的信息用于确认框
	const selectedProductsInfo = productList.value
		.filter(item => selectedProductIds.value.includes(item.uniqueKey))
		.map(item => ({
			orderCode: item.orderNo,
			productName: item.productNameNew || item.productName
		}))
	showOperateConfirmModal('remove', allRowids.length, selectedProductsInfo)
}

// 操作确认弹窗
const showOperateConfirmModal = (mode, count, productsInfo) => {
	const actionText = mode === 'delay' ? '延后' : '移除'
	// 拼接产品信息
	let infoText = productsInfo.map(p => `${p.orderCode} - ${p.productName}`).join('\n')
	uni.showModal({
		title: `确认${actionText}`,
		content: `共 ${count} 条预派工\n\n${infoText}`,
		confirmText: '确定',
		cancelText: '取消',
		success: async (res) => {
			if (res.confirm) {
				await operatePreDispatch(mode, count)
			}
		}
	})
}

// 操作预派工（延后/移除）
const operatePreDispatch = async (mode, count) => {
	// 获取选中的预派工 rowid
	const allRowids = productList.value
		.filter(item => selectedProductIds.value.includes(item.uniqueKey))
		.flatMap(item => item.preDispatchRowids || [])
		.filter(Boolean)
	
	if (allRowids.length === 0) return

	uni.showLoading({ title: '处理中...', mask: true })

	try {
		// 记录初始预派工数量
		const initialPreDispatchCount = getTotalPreDispatchCount()
		// 期望的预派工数量
		const expectedPreDispatchCount = initialPreDispatchCount - count

		// 调用接口
		await http.post(PRE_DISPATCH_VOID_URL, {
			rowid: allRowids,
			mode: mode
		})

		// 轮询刷新检查
		// 基础等待 3 秒（6 次 × 500ms），最多 5 秒（10 次）
		const baseRetry = 6
		const maxRetry = 10
		const INTERVAL = 500
		let found = false
		let currentCount = 0

		for (let i = 0; i < maxRetry; i++) {
			await loadProducts(true)
			currentCount = getTotalPreDispatchCount()
			// 延后/移除都会使对应预派工从当前"未派工"列表消失，按预派工条数验证
			if (currentCount === expectedPreDispatchCount) {
				found = true
				break
			}
			if (i < maxRetry - 1) {
				await new Promise(resolve => setTimeout(resolve, INTERVAL))
			}
		}

		uni.hideLoading()
		uni.showToast({ title: '操作成功', icon: 'success' })
		if (!found) {
			console.warn('操作预派工后轮询未匹配到预期预派工数量，当前:', currentCount, '预期:', expectedPreDispatchCount)
		}

		// 刷新数据
		loadEmployeeDispatchSummary()
		loadWorkshopEmployees()
	} catch (e) {
		uni.hideLoading()
		console.error('操作预派工失败:', e)
		uni.showToast({ title: '操作失败', icon: 'none' })
	}
}

// 获取当前列表预派工总数量（不限定选中产品，与确认派工轮询口径一致）
const getTotalPreDispatchCount = () => {
	return productList.value.reduce((sum, item) => sum + (item.preDispatchRowids?.length || 0), 0)
}

const handleConfirmDispatch = async () => {
	if (isConfirmDispatching.value) return
	// 只获取选中产品的预派工 rowid，先去重避免重复查询和提交
	const allRowids = [...new Set(
		productList.value
			.filter(item => selectedProductIds.value.includes(item.uniqueKey))
			.flatMap(item => item.preDispatchRowids || [])
			.filter(Boolean)
	)]
	if (allRowids.length === 0) {
		uni.showToast({ title: '没有可确认的预派工', icon: 'none' })
		return
	}
	// 过滤出有员工的预派工
	let validRowids = []
	if (allRowids.length > 0) {
		const res = await callWorkflowListAll({
			worksheetId: PRE_DISPATCH_WORKSHEET_ID,
			filters: [{
				controlId: 'rowid',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: allRowids
			}],
			silent: true
		}, 100)
		const rows = Array.isArray(res?.data) ? res.data : []
		// 同工序可能关联多条预派工（后端历史数据重复），按"取最早一条"过滤后再筛选有员工的
		validRowids = filterFirstPreDispatchPerProcess(rows)
			.filter(item => {
				const dailyWage = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.dailyWage])
				return dailyWage && dailyWage.length > 0
			})
			.map(item => item.rowid)
	}
	// 二次去重，确保不会提交重复 rowid
	validRowids = [...new Set(validRowids)]
	if (validRowids.length === 0) {
		uni.showToast({ title: '没有可确认的预派工（均无员工）', icon: 'none' })
		return
	}
	// 记录初始预派工总条数（当前列表所有产品行的预派工数量之和），用于确认派工成功后轮询判断
	initialPreDispatchCountForConfirm.value = productList.value.reduce(
		(sum, item) => sum + (item.preDispatchRowids?.length || 0),
		0
	)
	confirmDispatchCount.value = validRowids.length
	confirmDispatchRowids.value = validRowids
	showConfirmDispatchModal.value = true
}

// 刷新单个产品的工序列表
const refreshProcessList = async (productRowid) => {
	// 找到对应的产品
	const product = productList.value.find(p => p.uniqueKey === productRowid)
	if (!product) {
		uni.showToast({ title: '未找到产品', icon: 'none' })
		return
	}
	// 移除该产品的旧工序数据
	processList.value = processList.value.filter(p => p.productRowid !== productRowid)
	// 移除已加载标记，让 loadProductProcesses 重新加载
	loadedProductIds.value = loadedProductIds.value.filter(id => id !== productRowid)
	// 重新加载工序数据
	await loadProductProcesses(product)
	uni.showToast({ title: '刷新成功', icon: 'success' })
}

const handleProcessListConfirm = async (productRowid) => {
	// 获取该产品下勾选的工序
	const checkedProcesses = processList.value.filter(p => p.productRowid === productRowid && selectedProcessIds.value.includes(p.rowid))
	if (checkedProcesses.length === 0) {
		uni.showToast({ title: '请先勾选工序', icon: 'none' })
		return
	}

	const noPreDispatchRowidSet = new Set()
	checkedProcesses.forEach(p => {
		if (!p.preDispatchRowid) {
			noPreDispatchRowidSet.add(p.rowid)
		}
	})
	const noPreDispatchRowids = [...noPreDispatchRowidSet]

	// 计算可派数量和完成数量
	const dispatchDate = filterDate.value
	let dispatchCount = 0
	let finishCount = 0

	// 有工序的预派工rowids
	let hasPreDispatchRowids = []
	// 无工序的预派工rowid（一个工序列表只会有一个）
	let noProcessPreDispatchRowid = ''

	// 获取该产品下所有预派工rowids（包括有工序和无工序的）
	const product = productList.value.find(item => item.uniqueKey === productRowid)
	const allProductPreDispatchRowids = Array.isArray(product?.preDispatchRowids) ? product.preDispatchRowids : []
	let pdRows = []
	if (allProductPreDispatchRowids.length > 0) {
		const pdRes = await callWorkflowListAll({
			worksheetId: PRE_DISPATCH_WORKSHEET_ID,
			filters: [{
				controlId: 'rowid',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: allProductPreDispatchRowids
			}],
			silent: true
		}, 100)
		pdRows = Array.isArray(pdRes?.data) ? pdRes.data : []
		// 同工序可能关联多条预派工（后端历史数据重复），按"取最早一条"过滤
		// 无工序关联的预派工（产品级兜底）由 filterFirstPreDispatchPerProcess 内部保留
		pdRows = filterFirstPreDispatchPerProcess(pdRows)

		// 按工序排产明细是否为空分类预派工；只有关联工序被勾选了才传给接口
		const checkedProcessRowidSet = new Set(checkedProcesses.map(p => p.rowid))
		pdRows.forEach(item => {
			const sids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail])
			const hasRelatedProcess = sids && sids.length > 0
			const anyProcessChecked = hasRelatedProcess && sids.some(sid => checkedProcessRowidSet.has(sid))
			if (hasRelatedProcess && anyProcessChecked) {
				hasPreDispatchRowids.push(item.rowid)
			} else if (!hasRelatedProcess) {
				// 只有完全没有关联工序的才归到 noProcessPreDispatchRowid
				noProcessPreDispatchRowid = item.rowid
			}
			// 有工序但没勾选 → 跳过，不传
		})
	}

	// 用户输入的派工数量（优先使用）
	const rawUserInput = productDispatchCounts.value[productRowid]
	// 只有当用户输入了有效数值（包括0）时才使用用户输入，为空时使用可派数量
	const hasUserInput = rawUserInput !== undefined && rawUserInput !== '' && !isNaN(parseFloat(rawUserInput)) && parseFloat(rawUserInput) >= 0
	if (rawUserInput !== undefined && rawUserInput !== '' && (isNaN(parseFloat(rawUserInput)) || parseFloat(rawUserInput) < 0)) {
		uni.showToast({ title: '派工数量无效，请重新设置', icon: 'none' })
		return
	}
	if (hasUserInput) {
		// 用户输入了有效值，传用户输入的派工数量
		dispatchCount = parseFloat(rawUserInput)
	} else {
		// 用户输入为空时，按以下优先级取值（与 openDispatchModal 逻辑一致）
		// 优先级1：产品行的 dispatchCount 字段
		const productDispatchCount = parseFloat(product?.dispatchCount)
		if (Number.isFinite(productDispatchCount) && productDispatchCount > 0) {
			dispatchCount = Math.round(productDispatchCount)
		} else if (hasPreDispatchRowids.length > 0) {
			// 优先级2：有预派工关联时，取关联工序的 needCount 平均值
			// hasPreDispatchRowids 对应的工序在 pdRows 中已通过 processDetail 关联
			// 需要筛选出有预派工关联的工序
			const associatedProcessRowids = new Set()
			pdRows.forEach(item => {
				if (hasPreDispatchRowids.includes(item.rowid)) {
					extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail]).forEach(sid => associatedProcessRowids.add(sid))
				}
			})
			const associatedProcesses = processList.value.filter(p => associatedProcessRowids.has(p.rowid))
			if (associatedProcesses.length > 0) {
				const needVals = associatedProcesses.map(p => parseFloat(p.needCount) || 0)
				if (needVals.length > 0) {
					dispatchCount = Math.round(needVals.reduce((a, b) => a + b, 0) / needVals.length)
				}
			}
		} else {
			// 优先级3：无预派工时，取勾选工序的 needCount 平均值
			const processNeedVals = checkedProcesses.map(p => parseFloat(p.needCount) || 0)
			if (processNeedVals.length > 0) {
				dispatchCount = Math.round(processNeedVals.reduce((a, b) => a + b, 0) / processNeedVals.length)
			}
		}
	}

	// 完成数量：取关联工序的 finishCount 平均值
	if (pdRows.length > 0) {
		const allRelatedProcessRowids = new Set()
		pdRows.forEach(item => {
			extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail]).forEach(sid => allRelatedProcessRowids.add(sid))
		})
		if (allRelatedProcessRowids.size > 0) {
			const processFinishVals = processList.value
				.filter(p => allRelatedProcessRowids.has(p.rowid))
				.map(p => parseFloat(p.finishCount) || 0)
			if (processFinishVals.length > 0) {
				finishCount = Math.round(processFinishVals.reduce((a, b) => a + b, 0) / processFinishVals.length)
			}
		}
	} else if (checkedProcesses.length > 0) {
		const processFinishVals = checkedProcesses.map(p => parseFloat(p.finishCount) || 0)
		if (processFinishVals.length > 0) {
			finishCount = Math.round(processFinishVals.reduce((a, b) => a + b, 0) / processFinishVals.length)
		}
	}

	try {
		uni.showLoading({ title: '提交中...' })
		await http.post(PRE_DISPATCH_PROCESS_CONFIRM_URL, {
			hasPreDispatchRowids,
			noPreDispatchRowids,
			noProcessPreDispatchRowid,
			dispatchDate,
			dispatchCount,
			finishCount
		})
		uni.hideLoading()
		uni.showToast({ title: '提交成功', icon: 'success' })
		
		// 轮询等待后端工作流完成
		const checkedProcessRowids = checkedProcesses.map(p => p.rowid)
		const product = productList.value.find(item => item.uniqueKey === productRowid)
		const isStretchWorkshop = loginWorkshop.value === '拉伸车间'
		const hasOldProcess = checkedProcesses.some(p => !p.isNewProcess)
		
		if (product) {
			// 拉伸车间 + 老工序：检查工序是否关联了预派工
			// 其他情况：检查工序的员工是否都匹配了当日工资
			if (isStretchWorkshop && hasOldProcess) {
			uni.showLoading({ title: '正在关联预派工中...', mask: true })
			await waitForPreDispatchAssociation(product, checkedProcessRowids, dispatchCount)
			uni.hideLoading()
		} else {
			uni.showLoading({ title: '正在匹配员工中...', mask: true })
			await waitForPreDispatchDailyWage(product, checkedProcessRowids, dispatchCount)
			uni.hideLoading()
		}
		}
		
		// 刷新该产品工序数据，保留勾选状态
		if (product) {
			// 保存当前勾选状态
			const savedCheckedRowids = checkedProcesses.map(p => p.rowid)
			loadedProductIds.value = loadedProductIds.value.filter(id => id !== productRowid)
			processList.value = processList.value.filter(p => p.productRowid !== productRowid)
			await loadProductProcesses(product)
			// 恢复勾选状态
			savedCheckedRowids.forEach(rowid => {
				if (!selectedProcessIds.value.includes(rowid)) {
					selectedProcessIds.value.push(rowid)
				}
			})
		}
		// 刷新员工数据
		loadWorkshopEmployees()
		loadEmployeeDispatchSummary()
	} catch (e) {
		uni.hideLoading()
		console.error('工序列表确定提交失败:', e)
		uni.showToast({ title: '提交失败', icon: 'none' })
	}
}

const doConfirmDispatch = async () => {
	if (isConfirmDispatching.value) return
	isConfirmDispatching.value = true
	showConfirmDispatchModal.value = false
	// 期望的最终预派工条数 = 初始预派工总条数 - 确认派工条数
	const expectedPreDispatchCount = initialPreDispatchCountForConfirm.value - confirmDispatchCount.value
	// 根据确认数量动态调整轮询次数：基础 6 次(3秒)，每多 1 条增加 1 次，最多 10 次(5秒)
	const BASE_RETRY = 6
	const EXTRA_PER_ITEM = 1
	const MAX_RETRY = 10
	const INTERVAL = 500
	const maxRetry = Math.min(BASE_RETRY + confirmDispatchCount.value * EXTRA_PER_ITEM, MAX_RETRY)

	try {
		uni.showLoading({ title: '确认中...' })
		await http.post(PRE_DISPATCH_CONFIRM_URL, {
			rowids: [...new Set(confirmDispatchRowids.value)]
		})
		uni.hideLoading()
		uni.showToast({ title: '确认派工成功', icon: 'success' })

		// 轮询等待预派工条数匹配后刷新
		uni.showLoading({ title: '刷新中...', mask: true })
		let found = false
		let currentCount = 0

		for (let i = 0; i < maxRetry; i++) {
			await loadProducts(true, true)
			currentCount = productList.value.reduce(
				(sum, item) => sum + (item.preDispatchRowids?.length || 0),
				0
			)
			if (currentCount === expectedPreDispatchCount) {
				found = true
				break
			}
			if (i < maxRetry - 1) {
				await new Promise(resolve => setTimeout(resolve, INTERVAL))
			}
		}

		uni.hideLoading()
		// 无论是否轮询到，都执行刷新确保数据最新
		handleSearch()
		if (!found) {
			console.warn('确认派工后轮询未匹配到预期数量，当前:', currentCount, '预期:', expectedPreDispatchCount)
		}
	} catch (e) {
		uni.hideLoading()
		console.error('确认派工失败:', e)
		uni.showToast({ title: '确认派工失败', icon: 'none' })
	} finally {
		isConfirmDispatching.value = false
	}
}

const handleRefresh = () => {
	handleSearch()
}

const loadProducts = async (reset = true, forceSilent = false) => {
	loadingProducts.value = true
	try {
		const filters = []
		filters.push({
			controlId: '6a1e49c427514927ff33ccf5',
			dataType: 11,
			spliceType: 1,
			filterType: 2,
			values: ['未派工']
		})
		if (loginWorkshop.value) {
			filters.push({
				controlId: '6a1e4c1427514927ff33cda4',
				dataType: 11,
				spliceType: 1,
				filterType: 2,
				values: [loginWorkshop.value]
			})
		}
		if (filterOrderCode.value.trim()) {
			filters.push({
				controlId: PRE_DISPATCH_FIELD_MAP.pureOrderNo,
				dataType: 11,
				spliceType: 1,
				filterType: 1,
				values: [filterOrderCode.value.trim()]
			})
		}
		if (filterProductName.value.trim()) {
			filters.push({
				controlId: PRE_DISPATCH_FIELD_MAP.productName,
				dataType: 11,
				spliceType: 1,
				filterType: 1,
				values: [filterProductName.value.trim()]
			})
		}

		// 分页循环拉取"未派工"记录，每页 100 条，最多 10 页（1000 条）兜底，防止后端 total 值偏大时死循环
		let raw = []
		let pageNum = 1
		const pageSize = 100
		const MAX_PAGES = 10
		let hasMore = true
		while (hasMore && pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: PRE_DISPATCH_WORKSHEET_ID,
				filters,
				pageSize,
				pageNum,
				// 仅首页沿用原 loading 行为，后续页静默请求；forceSilent 为 true 时全部静默
				silent: forceSilent || (pageNum === 1 ? !reset : true)
			})
			const rows = Array.isArray(res?.data) ? res.data : []
			raw.push(...rows)
			hasMore = rows.length === pageSize && raw.length < (res?.total || 0)
			pageNum++
		}

		let mapped = raw.map(mapPreDispatchRow)

		if (filterDate.value) {
			mapped = mapped.filter(item => item.dispatchDate === filterDate.value)
		}

		if (filterCraft.value.trim()) {
			const keyword = filterCraft.value.trim().toLowerCase()
			mapped = mapped.filter(item => item.craft.toLowerCase().includes(keyword))
		}
		if (filterInnerPaint.value.trim()) {
			const keyword = filterInnerPaint.value.trim().toLowerCase()
			mapped = mapped.filter(item => item.innerPaint.toLowerCase().includes(keyword))
		}
		if (filterPolish.value.trim()) {
			const keyword = filterPolish.value.trim().toLowerCase()
			mapped = mapped.filter(item => item.polish.toLowerCase().includes(keyword))
		}
		if (filterGuokou.value.trim()) {
			const keyword = filterGuokou.value.trim().toLowerCase()
			mapped = mapped.filter(item => item.guokou.toLowerCase().includes(keyword))
		}

		// 组装车间岗位筛选：只保留岗位工序关联到选中按钮任一内部岗位的预派工
		if (activeAssemblyPosition.value) {
			const activeBtn = assemblyPositionButtons.value.find(b => b.name === activeAssemblyPosition.value)
			const matchNames = activeBtn?.positionNames?.length ? activeBtn.positionNames : [activeAssemblyPosition.value]
			mapped = mapped.filter(item => {
				const rowids = item.positionProcessRowids || []
				return rowids.some(sid => matchNames.includes(positionProcessDictMap.value.get(sid)))
			})
		}

		const groupedMap = {}
		mapped.forEach((item) => {
			const orderNo = String(item.orderNo || '').trim()
			const productionCode = String(item.productionCode || '').trim()
			const displayName = String(item.productNameNew || item.productName || '').trim()

			// 以生产编号作为产品唯一键核心；无编号时回退到订单+产品名称
			const key = productionCode
				? `${orderNo}|${productionCode}`
				: `${orderNo}|${displayName || item.rowid || ''}`

			if (!groupedMap[key]) {
				groupedMap[key] = {
					...item,
					orderNo,
					productionCode,
					productNameNew: item.productNameNew || item.productName || '',
					uniqueKey: key,
					preDispatchRowids: []
				}
			}
			groupedMap[key].preDispatchRowids.push(item.rowid)

			// 先遇到的记录产品名为空时，用后续非空的记录补全显示
			if (!groupedMap[key].productNameNew && item.productNameNew) {
				groupedMap[key].productNameNew = item.productNameNew
			}
		})
		productList.value = Object.values(groupedMap).sort((a, b) => {
			// 优先按交货日期排序
			if (!a.productDeliveryDate) return 1
			if (!b.productDeliveryDate) return -1
			const dateCompare = a.productDeliveryDate.localeCompare(b.productDeliveryDate)
			if (dateCompare !== 0) return dateCompare
			// 交货日期相同时，按 rowid 字典序排序
			const aId = a.rowid || ''
			const bId = b.rowid || ''
			return aId.localeCompare(bId)
		})
		// 记录产品列表的排列顺序（使用 uniqueKey）
		productOrderMap.value = new Map()
		productList.value.forEach((product, index) => {
			productOrderMap.value.set(product.uniqueKey, index)
		})
		// 产品列表刷新后，清理列表中已不存在的选中项，避免标题计数异常（如列表为空仍显示 (2/0)）
		selectedProductIds.value = selectedProductIds.value.filter(id => productList.value.some(p => p.uniqueKey === id))
	} catch (e) {
		console.error('加载产品失败:', e)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		loadingProducts.value = false
	}
}



const handleProductClick = (product) => {
	if (!product || !product.uniqueKey) return
	const idx = selectedProductIds.value.indexOf(product.uniqueKey)
	if (idx >= 0) {
		selectedProductIds.value.splice(idx, 1)
	} else {
		selectedProductIds.value.push(product.uniqueKey)
		loadProductProcesses(product)
	}
}

// 根据 productRowid 打开派工设置弹窗
const openDispatchModalFromRowid = async (productRowid) => {
	const product = productList.value.find(p => p.uniqueKey === productRowid)
	if (!product) return
	if (!isDispatchEnabled(productRowid)) {
		uni.showToast({ title: '请先勾选工序', icon: 'none' })
		return
	}
	await openDispatchModal(product)
}

const openDispatchModal = async (product) => {
	if (!product || !product.uniqueKey) return

	// 如果该产品的工序还没加载，先加载工序数据
	const existingProcesses = processList.value.filter(p => p.productRowid === product.uniqueKey)
	if (existingProcesses.length === 0 && !loadedProductIds.value.includes(product.uniqueKey)) {
		await loadProductProcesses(product)
	}

	dispatchModalProduct.value = product
	dispatchModalInput.value = productDispatchCounts.value[product.uniqueKey] || '0'

	// 计算可派数量和完成数量
	let dispatchCount = 0
	let finishCount = 0

	// 获取该产品下的所有工序
	const productProcesses = processList.value.filter(p => p.productRowid === product.uniqueKey)
	// 有预派工关联的工序
	const associatedProcesses = productProcesses.filter(p => p.preDispatchRowid)
	// 有预派工rowids
	const pdRowids = [...new Set(associatedProcesses.map(p => p.preDispatchRowid).filter(Boolean))]

	// 计算完成数量（与可派数量逻辑独立），跳过为0的数据
	if (pdRowids.length > 0 && associatedProcesses.length > 0) {
		const finishVals = associatedProcesses.map(p => parseFloat(p.finishCount) || 0).filter(v => v > 0)
		if (finishVals.length > 0) finishCount = Math.round(finishVals.reduce((a, b) => a + b, 0) / finishVals.length)
	} else {
		const checkedProcesses = productProcesses.filter(p => selectedProcessIds.value.includes(p.rowid))
		if (checkedProcesses.length > 0) {
			const finishVals = checkedProcesses.map(p => parseFloat(p.finishCount) || 0).filter(v => v > 0)
			if (finishVals.length > 0) finishCount = Math.round(finishVals.reduce((a, b) => a + b, 0) / finishVals.length)
		}
	}

	// 优先级1：如果产品行的派工数量字段有值且不为0，直接作为可派数量
	const productDispatchCount = parseFloat(product.dispatchCount)
	if (Number.isFinite(productDispatchCount) && productDispatchCount > 0) {
		dispatchCount = Math.round(productDispatchCount)
	} else if (pdRowids.length > 0 && associatedProcesses.length > 0) {
		// 有预派工：获取预派工数据，跳过可派数量为0的数据
		const needVals = associatedProcesses.map(p => parseFloat(p.needCount) || 0).filter(v => v > 0)
		if (needVals.length > 0) dispatchCount = Math.round(needVals.reduce((a, b) => a + b, 0) / needVals.length)
	} else {
		// 无预派工：用勾选的工序，跳过可派数量为0的数据
		const checkedProcesses = productProcesses.filter(p => selectedProcessIds.value.includes(p.rowid))
		if (checkedProcesses.length > 0) {
			const needVals = checkedProcesses.map(p => parseFloat(p.needCount) || 0).filter(v => v > 0)
			if (needVals.length > 0) dispatchCount = Math.round(needVals.reduce((a, b) => a + b, 0) / needVals.length)
		}
	}

	dispatchModalDispatchCount.value = dispatchCount
	dispatchModalFinishCount.value = finishCount

	showDispatchModal.value = true
}

const closeDispatchModal = () => {
	showDispatchModal.value = false
	dispatchModalProduct.value = null
	dispatchModalInput.value = '0'
}

const saveDispatchModal = () => {
	if (!dispatchModalProduct.value) return

	const val = dispatchModalInput.value.trim()
	const num = parseFloat(val)
	if (val === '' || isNaN(num) || num < 0) {
		uni.showToast({ title: '请输入有效的非负派工数量', icon: 'none' })
		return
	}

	productDispatchCounts.value[dispatchModalProduct.value.uniqueKey] = String(num)
	closeDispatchModal()
}

const loadAssociatedProcessDetails = async (product, statusFilter = '未派工') => {
	try {
		// 按生产单号查询预派工记录，避免 product.preDispatchRowids 过期导致员工信息不刷新
		// 查到后再按当前派工日期过滤
		const res = await callWorkflowListAll({
			worksheetId: PRE_DISPATCH_WORKSHEET_ID,
			filters: [{
				controlId: PRE_DISPATCH_FIELD_MAP.productionCode,
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [product.productionCode]
			}],
			silent: true
		}, 100)
		let preDispatchRows = Array.isArray(res?.data) ? res.data : []
		if (filterDate.value) {
			preDispatchRows = preDispatchRows.filter(item => {
				const d = formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.dispatchDate])
				return d === filterDate.value
			})
		}
		// 工序列表只关联状态为未派工的预派工
		if (statusFilter) {
			preDispatchRows = preDispatchRows.filter(item => {
				const status = formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.status])
				return status === statusFilter
			})
		}
		// 收集所有预派工关联的当日工资 rowid，一次性查询建立 工资rowid -> 员工名 映射
		const dailyWageRowids = new Set()
		preDispatchRows.forEach((item) => {
			const sids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.dailyWage])
			sids.forEach((sid) => dailyWageRowids.add(sid))
		})
		const dailyWageMap = new Map()
		if (dailyWageRowids.size > 0) {
			const dwRes = await callWorkflowListAll({
				worksheetId: DAILY_WAGE_WORKSHEET_ID,
				filters: [{
					controlId: 'rowid',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: [...dailyWageRowids]
				}],
				silent: true
			}, 100)
			const dwRows = Array.isArray(dwRes?.data) ? dwRes.data : []
			dwRows.forEach((item) => {
				if (item.rowid) {
					dailyWageMap.set(item.rowid, formatFieldValue(item[DAILY_WAGE_EMPLOYEE_NAME_FIELD]) || '-')
				}
			})
		}
		// 业务规则：同一生产单号 + 工序 + 派工日期 只应存在一条预派工。
		// 后端历史数据可能产生重复（根因待排查），前端按 rowid 升序取最早创建的一条作为"权威"记录，
		// 展示、修改派工数量、修改员工均针对此条，避免数据"看起来没生效"。
		const sortedPreDispatchRows = [...preDispatchRows].sort((a, b) =>
			String(a.rowid || '').localeCompare(String(b.rowid || ''))
		)
		// 调试用：检测到同工序关联多条预派工时输出被忽略的 rowid，便于后端定位重复来源
		const firstPdRowidByProcess = new Map()
		sortedPreDispatchRows.forEach((item) => {
			const sids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail])
			sids.forEach((sid) => {
				const existing = firstPdRowidByProcess.get(sid)
				if (existing && existing !== item.rowid) {
					console.warn(`[preDispatched] 工序 ${sid} 关联了多条预派工，已忽略 rowid=${item.rowid}（保留 rowid=${existing}）`)
				} else {
					firstPdRowidByProcess.set(sid, item.rowid)
				}
			})
		})

		// 每道工序只关联第一条（最早创建的）预派工；
		// 员工名直接取该权威预派工自身的当日工资，不再跨预派工合并
		const preDispatchRowidMap = new Map()  // 工序 rowid -> 权威预派工 rowid
		const processNamesMap = new Map()      // 工序 rowid -> 权威预派工的员工名数组
		sortedPreDispatchRows.forEach((item) => {
			const pdRowid = item.rowid
			const processSids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail])
			const dailyWageSids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.dailyWage])
			const names = dailyWageSids
				.map((sid) => dailyWageMap.get(sid))
				.filter((name) => name && name !== '-')
			processSids.forEach((sid) => {
				if (!preDispatchRowidMap.has(sid)) {
					preDispatchRowidMap.set(sid, pdRowid)
					processNamesMap.set(sid, names)
				}
			})
		})

		// 工艺岗位 / 岗位工序 / 派工数量 按权威预派工 rowid 索引
		const craftPositionMap = new Map()
		const positionProcessMap = new Map()
		const dispatchCountMap = new Map()
		sortedPreDispatchRows.forEach((item) => {
			const pdRowid = item.rowid
			const craftPositionId = formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.craftPosition]) || ''
			// 尝试用工艺岗位字典转换 ID 为名称，找不到则留空
			const craftPositionName = craftPositionId ? (craftPositionDictMap.value.get(craftPositionId) || '') : ''
			craftPositionMap.set(pdRowid, craftPositionName)

			const positionProcessSids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.positionProcess]) || []
			const positionProcessName = positionProcessSids
				.map((sid) => positionProcessDictMap.value.get(sid))
				.filter(Boolean)
				.join('、')
			positionProcessMap.set(pdRowid, positionProcessName)

			// 提取预派工的派工数量
			const dispatchCount = formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.dispatchCount]) || 0
			dispatchCountMap.set(pdRowid, dispatchCount)
		})

		const resultMap = new Map()
		preDispatchRowidMap.forEach((pdRowid, sid) => {
			resultMap.set(sid, {
				employeeNames: processNamesMap.get(sid) || [],
				preDispatchRowid: pdRowid,
				craftPosition: craftPositionMap.get(pdRowid) || '',
				positionProcess: positionProcessMap.get(pdRowid) || '',
				dispatchCount: dispatchCountMap.get(pdRowid) || 0
			})
		})
		return resultMap
	} catch (e) {
		console.error('加载关联工序失败:', e)
		return new Map()
	}
}

/**
 * 业务规则：同一生产单号 + 工序 + 派工日期 只应存在一条预派工。
 * 后端历史数据可能产生重复（根因待排查），前端按 rowid 升序取每道工序最早创建的那条作为"权威"记录。
 * 没有工序关联的预派工（如产品级兜底预派工）始终保留，不参与按工序去重。
 * @param {Array} preDispatchRows 预派工记录数组
 * @returns {Array} 过滤后的预派工记录数组（每道工序最多保留一条）
 */
const filterFirstPreDispatchPerProcess = (preDispatchRows) => {
	if (!Array.isArray(preDispatchRows) || preDispatchRows.length === 0) return []
	const sorted = [...preDispatchRows].sort((a, b) =>
		String(a.rowid || '').localeCompare(String(b.rowid || ''))
	)
	const firstByProcess = new Map()  // 工序 rowid -> 第一条预派工 rowid
	const keptRowids = new Set()       // 保留的预派工 rowid
	sorted.forEach((item) => {
		const sids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail])
		if (sids.length === 0) {
			// 无工序关联的预派工（产品级兜底）始终保留
			keptRowids.add(item.rowid)
			return
		}
		sids.forEach((sid) => {
			if (!firstByProcess.has(sid)) {
				firstByProcess.set(sid, item.rowid)
				keptRowids.add(item.rowid)
			}
		})
	})
	return sorted.filter(item => keptRowids.has(item.rowid))
}

/**
 * 轮询等待已勾选的工序都关联上预派工及当日工资记录。
 * 当所有 checkedProcessRowids 都能查到 employeeNames 时返回 true，否则超时后返回 false。
 */
const waitForPreDispatchDailyWage = async (product, checkedProcessRowids, targetDispatchCount, maxRetries = 15, interval = 1000) => {
	if (!checkedProcessRowids || checkedProcessRowids.length === 0) return true
	for (let i = 0; i < maxRetries; i++) {
		await new Promise(resolve => setTimeout(resolve, interval))
		const associatedMap = await loadAssociatedProcessDetails(product)
		const allReady = checkedProcessRowids.every(rowid => {
			const info = associatedMap.get(rowid)
			if (!info) return false
			// 员工为空时按原逻辑等待员工匹配完成
			if (!info.employeeNames || info.employeeNames.length === 0) return false
			// 员工已存在时，还要等待派工数量更新到提交值
			if (targetDispatchCount !== undefined) {
				return parseFloat(info.dispatchCount) === parseFloat(targetDispatchCount)
			}
			return true
		})
		if (allReady) {
			return true
		}
	}
	return false
}

/**
 * 轮询等待单个预派工记录的员工信息更新完成。
 * 通过比对 dailyWage 中的员工 ID 与目标员工 ID 是否一致来判断是否更新完成。
 */
const waitForPreDispatchEmployeeUpdate = async (preDispatchRowid, targetEmployeeIds, maxRetries = 15, interval = 1000) => {
	for (let i = 0; i < maxRetries; i++) {
		await new Promise(resolve => setTimeout(resolve, interval))
		// 查询该预派工记录
		const res = await callWorkflowListAll({
			worksheetId: PRE_DISPATCH_WORKSHEET_ID,
			filters: [{
				controlId: 'rowid',
				dataType: 30,
				spliceType: 1,
				filterType: 1,
				values: [preDispatchRowid]
			}],
			silent: true
		}, 10)
		const rows = Array.isArray(res?.data) ? res.data : []
		const row = rows.find(item => item.rowid === preDispatchRowid)
		if (!row) continue
		// 获取 dailyWage 关联的员工 ID
		const sids = extractRelationSids(row[PRE_DISPATCH_FIELD_MAP.dailyWage])
		// 比对员工 ID 是否一致
		const targetSet = new Set(targetEmployeeIds)
		const sidSet = new Set(sids)
		const isMatch = targetSet.size === sidSet.size && [...targetSet].every(id => sidSet.has(id))
		if (isMatch) {
			return true
		}
	}
	return false
}

/**
 * 轮询等待工序关联预派工记录完成。
 * 检查勾选的工序是否都关联了预派工（preDispatchRowid 不为空）。
 */
const waitForPreDispatchAssociation = async (product, checkedProcessRowids, targetDispatchCount, maxRetries = 15, interval = 1000) => {
	for (let i = 0; i < maxRetries; i++) {
		await new Promise(resolve => setTimeout(resolve, interval))
		const associatedMap = await loadAssociatedProcessDetails(product)
		const allAssociated = checkedProcessRowids.every(rowid => {
			const info = associatedMap.get(rowid)
			// 还没绑定预派工时，先等预派工关联完成
			if (!info || !info.preDispatchRowid || info.preDispatchRowid.length === 0) return false
			// 已经绑定预派工后，等待派工数量更新到提交值
			if (targetDispatchCount !== undefined) {
				return parseFloat(info.dispatchCount) === parseFloat(targetDispatchCount)
			}
			return true
		})
		if (allAssociated) {
			return true
		}
	}
	return false
}

const loadProductProcesses = async (product) => {
	if (!product || !product.uniqueKey) return
	// 已在加载中或已加载完成的产品不再触发，防止连点/网络抖动导致重复请求
	if (loadedProductIds.value.includes(product.uniqueKey)) return
	const productionCode = product.productionCode
	if (!productionCode) return

	// 先标记为已加载，阻止并发请求；加载失败时会移除标记
	loadedProductIds.value.push(product.uniqueKey)

	// 记录当前产品的旧工序 rowid，刷新后只清理该产品的选中状态，不影响其他产品
	const oldProductProcessRowids = new Set(
		processList.value.filter(p => p.productRowid === product.uniqueKey).map(p => p.rowid)
	)

	try {
		const associatedMap = await loadAssociatedProcessDetails(product)
		const associatedRowids = new Set(associatedMap.keys())
		const filters = [{
			controlId: '691d6160535b29cbd5c6c0a9',
			dataType: 30,
			spliceType: 1,
			filterType: 1,
			values: [productionCode]
		}]
		if (loginWorkshop.value) {
			filters.push({
				controlId: '669a6cae2503723eec1b49bb',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [loginWorkshop.value]
			})
		}
		const res = await callWorkflowListAll({
			worksheetId: PROCESS_DETAIL_WORKSHEET_ID,
			filters,
			silent: true
		}, 100)
		const rows = Array.isArray(res?.data) ? res.data : []
		const sequenceList = rows
			.filter((item) => associatedRowids.has(item.rowid))
			.map((item) => parseFloat(formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.sequence])) || 0)
		const maxAssociatedSequence = sequenceList.length > 0 ? Math.max(...sequenceList) : -1
		const newProcesses = rows.map((item) => {
			const seq = parseFloat(formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.sequence])) || 0
			const isAssociated = associatedRowids.has(item.rowid)
			const associatedInfo = associatedMap.get(item.rowid) || { employeeNames: [], preDispatchRowid: '', craftPosition: '', positionProcess: '' }
			// 工序名称字段可能是关联到数据字典，提取字典 rowid 用于归类联动匹配
			const processDictRowids = extractRelationSids(item[PROCESS_DETAIL_FIELD_MAP.processName])
			// 新工序字段：值为 1 是新工序，0 是老工序
			const isNewProcess = formatFieldValue(item['6a758fd34239d5290f312518']) == '1'
			return {
				rowid: item.rowid || '',
				productRowid: product.uniqueKey,
				productName: product.productNameNew || product.productName || '-',
				sequence: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.sequence]),
				processName: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.processName]),
				processDictRowid: processDictRowids[0] || '',
				orderCount: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.orderCount]) || 0,
				dailyOutput: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.dailyOutput]) || 0,
				hourlyoutput: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.hourlyoutput]) || 0,
				allcount: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.allcount]) || 0,
				needCount: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.needCount]) || 0,
				finishCount: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.finishCount]) || 0,
				isAssociated,
				isBeforeAssociated: !isAssociated && seq <= maxAssociatedSequence,
				isAfterAssociated: !isAssociated && seq > maxAssociatedSequence,
				employeeNames: associatedInfo.employeeNames,
				preDispatchRowid: associatedInfo.preDispatchRowid,
				craftPosition: associatedInfo.craftPosition,
				positionProcess: associatedInfo.positionProcess,
				isNewProcess,
				dispatchCount: associatedInfo.dispatchCount
			}
		}).sort((a, b) => (parseFloat(a.sequence) || 0) - (parseFloat(b.sequence) || 0))
		// 先清除该产品已有的工序数据，避免重复点击或网络抖动导致同一工序重复渲染
		processList.value = processList.value.filter(p => p.productRowid !== product.uniqueKey)
		processList.value.push(...newProcesses)
		// 只清理当前产品中已不存在的工序选中状态，不影响其他产品的勾选
		const currentProcessRowids = new Set(newProcesses.map(p => p.rowid))
		selectedProcessIds.value = selectedProcessIds.value.filter(rowid => {
			return !oldProductProcessRowids.has(rowid) || currentProcessRowids.has(rowid)
		})
		// 只对用户主动勾选过的工序进行关联预派工自动勾选
		newProcesses.forEach(p => {
			if (p.isAssociated && userCheckedProcessIds.value.has(p.rowid) && !manuallyDeselectedProcessIds.value.has(p.rowid)) {
				selectedProcessIds.value.push(p.rowid)
			}
		})
	} catch (e) {
		console.error('加载工序失败:', e)
		// 加载失败时移除已加载标记，否则失败后无法再次加载
		loadedProductIds.value = loadedProductIds.value.filter(id => id !== product.uniqueKey)
	}
}

const toggleProcessSelection = (process) => {
	if (!process.rowid) return
	const index = selectedProcessIds.value.indexOf(process.rowid)
	if (index > -1) {
		// 取消勾选，记录该工序ID，刷新时保留取消状态
		selectedProcessIds.value.splice(index, 1)
		if (process.isAssociated) {
			manuallyDeselectedProcessIds.value.add(process.rowid)
		}
		// 归类联动：开关开启时才联动
		if (syncSelectEnabled.value) {
			autoDeselectRelatedProcesses(process)
		}
	} else {
		selectedProcessIds.value.push(process.rowid)
		// 记录用户主动勾选，刷新时保留勾选状态
		userCheckedProcessIds.value.add(process.rowid)
		// 归类联动：开关开启时才联动
		if (syncSelectEnabled.value) {
			autoSelectRelatedProcesses(process)
		}
	}
}

// 根据工序归类自动取消勾选同类别工序
const autoDeselectRelatedProcesses = (process) => {
	if (!process.processName || !craftPositionMap.value || craftPositionMap.value.size === 0) return

	// 查找该工序所属的归类名称（使用前缀匹配）
	let craftPositionName = ''
	craftPositionMap.value.forEach((processNames, name) => {
		// 检查工序名称是否在归类的工序列表中，或者工序名称是否是某个归类工序的前缀
		if (processNames.includes(process.processName)) {
			craftPositionName = name
		} else {
			// 检查工序名称是否是归类工序的前缀
			for (const classifiedProcess of processNames) {
				if (classifiedProcess.startsWith(process.processName) || process.processName.startsWith(classifiedProcess)) {
					craftPositionName = name
					break
				}
			}
		}
	})

	if (!craftPositionName) return

	// 获取该归类下的所有工序名称
	const relatedProcessNames = craftPositionMap.value.get(craftPositionName) || []

	// 在当前已加载的产品工序中，找出同归类的工序并取消勾选
	processList.value.forEach(p => {
		if (p.rowid && p.productRowid === process.productRowid) {
			// 检查工序名称是否匹配
			const isMatch = relatedProcessNames.includes(p.processName) ||
				relatedProcessNames.some(cp => p.processName.startsWith(cp) || cp.startsWith(p.processName))
			if (isMatch) {
				const idx = selectedProcessIds.value.indexOf(p.rowid)
				if (idx > -1) {
					selectedProcessIds.value.splice(idx, 1)
				}
			}
		}
	})
}

// 根据工序归类自动勾选同类别工序
const autoSelectRelatedProcesses = (process) => {
	if (!process.processName || !craftPositionMap.value || craftPositionMap.value.size === 0) {
		return
	}
	
	// 查找该工序所属的归类名称（使用前缀匹配）
	let craftPositionName = ''
	craftPositionMap.value.forEach((processNames, name) => {
		// 检查工序名称是否在归类的工序列表中，或者工序名称是否是某个归类工序的前缀
		if (processNames.includes(process.processName)) {
			craftPositionName = name
		} else {
			// 检查工序名称是否是归类工序的前缀
			for (const classifiedProcess of processNames) {
				if (classifiedProcess.startsWith(process.processName) || process.processName.startsWith(classifiedProcess)) {
					craftPositionName = name
					break
				}
			}
		}
	})
	
	if (!craftPositionName) return
	
	// 获取该归类下的所有工序名称
	const relatedProcessNames = craftPositionMap.value.get(craftPositionName) || []
	
	// 在当前已加载的产品工序中，找出同归类的工序并勾选
	processList.value.forEach(p => {
		if (p.rowid && p.productRowid === process.productRowid) {
			// 检查工序名称是否匹配
			const isMatch = relatedProcessNames.includes(p.processName) ||
				relatedProcessNames.some(cp => p.processName.startsWith(cp) || cp.startsWith(p.processName))
			if (isMatch && !selectedProcessIds.value.includes(p.rowid)) {
				selectedProcessIds.value.push(p.rowid)
				userCheckedProcessIds.value.add(p.rowid)  // 记录用户主动勾选
			}
		}
	})
}

const toggleExpand = (rowid) => {
	const index = expandedIds.value.indexOf(rowid)
	if (index > -1) {
		expandedIds.value.splice(index, 1)
	} else {
		expandedIds.value.push(rowid)
	}
}

const isOrderCollapsed = (orderNo) => {
	return collapsedOrderIds.value.includes(orderNo)
}

const toggleOrderCollapse = (orderNo) => {
	const idx = collapsedOrderIds.value.indexOf(orderNo)
	if (idx >= 0) {
		collapsedOrderIds.value.splice(idx, 1)
	} else {
		collapsedOrderIds.value.push(orderNo)
	}
}

// 加载员工信息映射（员工姓名 -> { 出勤状态, 是否新手 }），供员工任务汇总标记请假/新手员工
const loadEmployeeInfoMap = async () => {
	const infoMap = new Map()
	try {
		const currentDate = filterDate.value
		const wsFilter = employeeWorkshopFilter.value
		const filters = []
		if (wsFilter) {
			filters.push({
				controlId: EMPLOYEE_FIELD_MAP.workshop,
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [wsFilter]
			})
		}
		// 接口无法按日期筛选，逐页获取并在前端按日期过滤（与 loadWorkshopEmployees 相同策略）
		const pageSize = 100
		let pageNum = 1
		let foundData = false
		let hasMore = true
		const MAX_PAGES = 500
		while (hasMore && pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: EMPLOYEE_WORKSHEET_ID,
				filters,
				silent: true
			}, pageSize, pageNum)
			const rows = Array.isArray(res?.data) ? res.data : []
			if (rows.length === 0) break
			const filtered = rows.filter((item) => formatFieldValue(item[EMPLOYEE_FIELD_MAP.dispatchDate]) === currentDate)
			filtered.forEach((item) => {
				const name = formatFieldValue(item[EMPLOYEE_FIELD_MAP.employeeName])
				if (!name || infoMap.has(name)) return
				const isNewEmployeeRaw = formatFieldValue(item[EMPLOYEE_FIELD_MAP.isNewEmployee])
				// 临时工判断：员工表临时工字段（6a744cdb4239d5290f2f6e4a），1=临时工，0=正式工
				// 宽松比较兼容数字 1 与字符串 '1'（与 dispatchWork.vue 一致）
				const isTempEmployeeRaw = item[EMPLOYEE_FIELD_MAP.isTempEmployee]
				infoMap.set(name, {
					attendance: formatFieldValue(item[EMPLOYEE_FIELD_MAP.attendance]) || '',
					isNewEmployee: String(isNewEmployeeRaw).trim() === '1',
					isTempEmployee: isTempEmployeeRaw == 1
				})
			})
			if (filtered.length > 0) foundData = true
			if (foundData && filtered.length === 0) {
				hasMore = false
			} else if (rows.length < pageSize) {
				hasMore = false
			} else {
				pageNum++
			}
		}
	} catch (e) {
		console.error('加载员工信息失败:', e)
	}
	return infoMap
}

// 加载当日工资表扩展信息（员工姓名 -> { 是否有预派工, 工资阀值 }）
// 依据当日工资表的 preDispatch 关联字段（6a1e47d727514927ff33cc4f）非空判断是否有预派工；
// 工资阀值字段（6a7f1a7f533d90c2eae04627）用于判断员工是否派满
const loadEmployeeDailyWageExtraMap = async () => {
	const preDispatchMap = new Map()
	const wageThresholdMap = new Map()
	try {
		const currentDate = filterDate.value
		const wsFilter = employeeWorkshopFilter.value
		const filters = []
		if (wsFilter) {
			filters.push({
				controlId: DAILY_WAGE_FIELD_MAP.workshop,
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [wsFilter]
			})
		}
		// 与 loadEmployeeInfoMap 相同策略：接口无法按日期筛选，逐页获取并在前端按日期过滤
		const pageSize = 100
		let pageNum = 1
		let foundData = false
		let hasMore = true
		const MAX_PAGES = 500
		while (hasMore && pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: DAILY_WAGE_WORKSHEET_ID,
				filters,
				silent: true
			}, pageSize, pageNum)
			const rows = Array.isArray(res?.data) ? res.data : []
			if (rows.length === 0) break
			const filtered = rows.filter((item) => formatFieldValue(item[DAILY_WAGE_FIELD_MAP.dispatchDate]) === currentDate)
			filtered.forEach((item) => {
				const name = formatFieldValue(item[DAILY_WAGE_FIELD_MAP.employeeName])
				if (!name) return
				const has = extractRelationSids(item[DAILY_WAGE_FIELD_MAP.preDispatch]).length > 0
				preDispatchMap.set(name, preDispatchMap.get(name) || has)
				// 工资阀值：取第一个有效值即可（理论上同一员工当日只有一条记录）
				if (!wageThresholdMap.has(name)) {
					const threshold = Number(formatFieldValue(item[DAILY_WAGE_FIELD_MAP.wageThreshold]) || 0)
					if (threshold > 0) {
						wageThresholdMap.set(name, threshold)
					}
				}
			})
			if (filtered.length > 0) foundData = true
			if (foundData && filtered.length === 0) {
				hasMore = false
			} else if (rows.length < pageSize) {
				hasMore = false
			} else {
				pageNum++
			}
		}
	} catch (e) {
		console.error('加载员工当日工资扩展信息失败:', e)
	}
	return { preDispatchMap, wageThresholdMap }
}

const buildEmployeeTaskProcessName = (pd) => {
	const workshop = pd.workshop || ''
	// 拉伸车间和抛光车间只显示工序名称
	if (workshop === '拉伸车间' || workshop === '抛光车间') {
		return pd.processName || '-'
	}
	// 喷涂车间和组装车间：岗位工序 -> 工序归类 -> 工序名称
	if (workshop === '喷涂车间' || workshop === '组装车间') {
		const positionProcessNames = (pd.positionProcessRowids || [])
			.map((sid) => positionProcessDictMap.value.get(sid))
			.filter(Boolean)
			.join('、')
		if (positionProcessNames) return positionProcessNames
		const craftPositionName = pd.craftPosition ? (craftPositionDictMap.value.get(pd.craftPosition) || '') : ''
		if (craftPositionName) return craftPositionName
		return pd.processName || '-'
	}
	// 其他车间：工序归类 -> 工序名称
	const craftPositionName = pd.craftPosition ? (craftPositionDictMap.value.get(pd.craftPosition) || '') : ''
	return craftPositionName || pd.processName || '-'
}

const loadEmployeeDispatchSummary = async () => {
	try {
		const currentDate = filterDate.value
		const wsFilter = employeeWorkshopFilter.value
		const filters = []
		if (wsFilter) {
			filters.push({
				controlId: DAILY_WAGE_FIELD_MAP.workshop,
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [wsFilter]
			})
		}
		const res = await callWorkflowListAPIPaged({
			worksheetId: DAILY_WAGE_WORKSHEET_ID,
			filters,
			pageSize: 100,
			pageNum: 1,
			silent: true
		})
		let rows = Array.isArray(res?.data) ? res.data : []
		rows = rows.filter((item) => formatFieldValue(item[DAILY_WAGE_FIELD_MAP.dispatchDate]) === currentDate)

		const dailyWageList = rows.map((item) => ({
			rowid: item.rowid,
			employeeName: formatFieldValue(item[DAILY_WAGE_FIELD_MAP.employeeName]) || '-',
			dispatchDate: formatFieldValue(item[DAILY_WAGE_FIELD_MAP.dispatchDate]),
			workshop: formatFieldValue(item[DAILY_WAGE_FIELD_MAP.workshop]),
			totalHours: Number(formatFieldValue(item[DAILY_WAGE_FIELD_MAP.totalHours]) || 0),
			totalWage: Number(formatFieldValue(item[DAILY_WAGE_FIELD_MAP.totalWage]) || 0),
			preDispatchSids: extractRelationSids(item[DAILY_WAGE_FIELD_MAP.preDispatch])
		}))

		// 员工信息映射（员工姓名 -> { 出勤状态, 是否新手 }），用于标记请假/新手员工
		const employeeInfoMap = await loadEmployeeInfoMap()

		const preDispatchRowids = new Set()
		dailyWageList.forEach((dw) => dw.preDispatchSids.forEach((sid) => preDispatchRowids.add(sid)))

		const preDispatchMap = {}
		if (preDispatchRowids.size > 0) {
			const pdRes = await callWorkflowListAPIPaged({
				worksheetId: PRE_DISPATCH_WORKSHEET_ID,
				filters: [{
					controlId: 'rowid',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: [...preDispatchRowids]
				}],
				silent: true
			}, 100)
			const pdRows = Array.isArray(pdRes?.data) ? pdRes.data.map(mapPreDispatchRow) : []
			// 员工任务汇总/任务栏只显示已派工的预派工记录
			const dispatchedPdRows = pdRows.filter(pd => pd.status === '已派工')
			dispatchedPdRows.forEach((pd) => {
				preDispatchMap[pd.rowid] = pd
			})
		}

		const map = new Map()
		dailyWageList.forEach((dw) => {
			const employeeName = dw.employeeName
			const info = employeeInfoMap.get(employeeName) || {}
			// 临时工不显示在员工任务汇总表中
			if (info.isTempEmployee) return
			if (!map.has(employeeName)) {
				map.set(employeeName, {
					employeeName,
					totalWage: 0,
					totalWorktime: 0,
					attendance: info.attendance || '',
					isNewEmployee: info.isNewEmployee || false,
					records: []
				})
			}
			const group = map.get(employeeName)
			group.totalWage += dw.totalWage
			group.totalWorktime = Number((group.totalWorktime + dw.totalHours).toFixed(2))
			dw.preDispatchSids.forEach((sid) => {
				const pd = preDispatchMap[sid]
				if (pd) {
					group.records.push({
						orderNo: pd.orderNo || '-',
						productName: pd.productNameNew || pd.productName || '-',
						processName: buildEmployeeTaskProcessName(pd),
						dispatchCount: pd.dispatchCount || 0,
						worktime: pd.worktime || 0,
						wage: pd.wage || 0,
						preDispatchRowid: pd.rowid || '',
						dailyWageRowid: dw.rowid || ''
					})
				}
			})
		})
		employeeDispatchSummary.value = [...map.values()]
			.map((emp) => ({
				// 行背景样式：请假红色优先，其次新手黄色
				...emp,
				rowClass: emp.attendance === '请假' ? 'cell-attendance-leave' : (emp.isNewEmployee ? 'cell-is-new' : '')
			}))
			.sort((a, b) => {
				// 排序：普通员工在前，新手员工集中置底（请假员工之上），请假员工最后，同组按记录数降序
				const aLeave = a.attendance === '请假' ? 1 : 0
				const bLeave = b.attendance === '请假' ? 1 : 0
				if (aLeave !== bLeave) return aLeave - bLeave
				const aNew = a.isNewEmployee ? 1 : 0
				const bNew = b.isNewEmployee ? 1 : 0
				if (aNew !== bNew) return aNew - bNew
				return b.records.length - a.records.length
			})
	} catch (e) {
		console.error('加载员工当日工资汇总失败:', e)
		employeeDispatchSummary.value = []
	}
}

const toggleEmployeeSection = () => {
	isEmployeeExpanded.value = !isEmployeeExpanded.value
	if (isEmployeeExpanded.value) {
		loadEmployeeDispatchSummary()
		loadWorkshopEmployees()
	}
}

const preDispatchRowidEqual = (a, b) => {
	if (!a || !b) return false
	return String(a) === String(b)
}

const getEmployeeGroupStart = (processes, idx) => {
	let start = idx
	while (start > 0 && preDispatchRowidEqual(processes[start - 1].preDispatchRowid, processes[start].preDispatchRowid)) {
		start--
	}
	return start
}

const isEmployeeGroupStart = (processes, idx) => {
	return getEmployeeGroupStart(processes, idx) === idx
}

const getEmployeeGroupSpan = (processes, idx) => {
	if (!isEmployeeGroupStart(processes, idx)) return 0
	let span = 1
	while (idx + span < processes.length && preDispatchRowidEqual(processes[idx].preDispatchRowid, processes[idx + span].preDispatchRowid)) {
		span++
	}
	return span
}

const getEmployeeCellStyle = (processes, idx) => {
	const span = getEmployeeGroupSpan(processes, idx)
	if (span <= 1) return { gridRow: 10, gridColumn: 4 + idx }
	return { gridRow: 10, gridColumn: (4 + idx) + ' / span ' + span }
}

const getEmployeeCellText = (processes, idx) => {
	const span = getEmployeeGroupSpan(processes, idx)
	const names = processes[idx].employeeNames || []
	if (names.length === 0) return '-'
	// 单个工序、两个员工、且一老一新时，显示为「老员工（带 新员工）」
	if (span === 1 && names.length === 2) {
		const emp0 = employeeList.value.find(e => e.name === names[0])
		const emp1 = employeeList.value.find(e => e.name === names[1])
		if (emp0 && emp1 && emp0.isNewEmployee !== emp1.isNewEmployee) {
			const oldEmp = emp0.isNewEmployee ? emp1 : emp0
			const newEmp = emp0.isNewEmployee ? emp0 : emp1
			return `${oldEmp.name}（带 ${newEmp.name}）`
		}
	}
	// 超过 3 个员工显示「多人」，否则显示具体姓名
	if (span === 1 && names.length > 3) return '多人'
	return names.join('、')
}

const getEmployeeGroupPreDispatchRowid = (processes, idx) => {
	const startIdx = getEmployeeGroupStart(processes, idx)
	return processes[startIdx]?.preDispatchRowid || ''
}

// 按订单编号分组，并按订单交货日期升序排列
const groupedProductList = computed(() => {
	const groups = {}
	productList.value.forEach((product) => {
		const key = product.orderNo || '未分类'
		if (!groups[key]) {
			groups[key] = { orderNo: key, productDeliveryDate: product.productDeliveryDate || '', products: [] }
		}
		groups[key].products.push(product)
	})
	return Object.values(groups).sort((a, b) => {
		// 优先按交货日期排序
		if (!a.productDeliveryDate) return 1
		if (!b.productDeliveryDate) return -1
		const dateCompare = a.productDeliveryDate.localeCompare(b.productDeliveryDate)
		if (dateCompare !== 0) return dateCompare
		// 交货日期相同时，按第一个产品的 rowid 字典序排序
		const aId = a.products[0]?.rowid || ''
		const bId = b.products[0]?.rowid || ''
		return aId.localeCompare(bId)
	})
})

// 产品列表统计
const productListStats = computed(() => ({
	selected: selectedProductIds.value.length,
	total: productList.value.length
}))

const groupedProcessList = computed(() => {
	const groups = []
	// 按 productOrderMap 记录的顺序遍历，保证工序列表顺序与产品列表一致（不受点击顺序影响）
	// 使用 uniqueKey 作为产品唯一标识
	const sortedProducts = [...productList.value].sort((a, b) => {
		const orderA = productOrderMap.value.get(a.uniqueKey) ?? Infinity
		const orderB = productOrderMap.value.get(b.uniqueKey) ?? Infinity
		return orderA - orderB
	})
	sortedProducts.forEach((product) => {
		// 使用 uniqueKey 判断是否选中
		if (!selectedProductIds.value.includes(product.uniqueKey)) return
		const processes = processList.value.filter(p => p.productRowid === product.uniqueKey)
		if (processes.length === 0) return
		groups.push({
			productRowid: product.uniqueKey,
			productName: product.productNameNew || product.productName || '-',
			orderNo: product.orderNo || '-',
			processes
		})
	})
	return groups
})

const openEmployeeTaskPopover = async (emp, index) => {
	if (employeeDispatchSummary.value.length === 0) {
		await loadEmployeeDispatchSummary()
	}
	const group = employeeDispatchSummary.value.find((g) => g.employeeName === emp.name)
	const tasks = group
		? group.records.map((r) => ({
				orderNo: r.orderNo,
				productName: r.productName,
				processName: r.processName,
				dispatchCount: r.dispatchCount,
				preDispatchRowid: r.preDispatchRowid || '',
				dailyWageRowid: r.dailyWageRowid || ''
		  }))
		: []
	selectedEmployeeForPopover.value = { ...emp, tasks }
	const query = uni.createSelectorQuery().in(instance)
	query.select('#emp-column-' + index).boundingClientRect((rect) => {
		if (rect) {
			const systemInfo = uni.getSystemInfoSync()
			const windowWidth = systemInfo.windowWidth
			const windowHeight = systemInfo.windowHeight
			const popoverWidth = 320
			const arrowSize = 16
			const arrowGap = 20
			let left = rect.left + rect.width / 2 - popoverWidth / 2
			if (left < 10) left = 10
			if (left + popoverWidth > windowWidth - 10) left = windowWidth - popoverWidth - 10
			const bottom = windowHeight - rect.top + arrowGap
			const tipGap = arrowGap - arrowSize
			employeeTaskPopoverStyle.value = { left: left + 'px', bottom: bottom + 'px' }
			// 箭头使用 fixed 定位，直接以视口为基准，避免受 content padding 影响
			employeeTaskArrowStyle.value = {
				position: 'fixed',
				left: (rect.left + rect.width / 2 - arrowSize) + 'px',
				bottom: (windowHeight - rect.top + tipGap) + 'px'
			}
		}
		showEmployeeTaskPopover.value = true
	}).exec()
}

const closeEmployeeTaskPopover = () => {
	showEmployeeTaskPopover.value = false
	selectedEmployeeForPopover.value = null
	employeeTaskPopoverStyle.value = {}
	employeeTaskArrowStyle.value = {}
}

const TASK_DELETE_URL = getApiRequestBase() + '/api/workflow/hooks/NmE4MmE1NGFjYjg1NjNiMzlkMTViZDZh'

const handleDeleteTask = (task, index) => {
	if (!task.preDispatchRowid) {
		uni.showToast({ title: '缺少预派工标识', icon: 'none' })
		return
	}
	// 先关闭任务框，确保确认框层级高于任务框
	closeEmployeeTaskPopover()
	uni.showModal({
		title: '确认删除',
		content: '确定删除该任务吗？',
		success: async (res) => {
			if (!res.confirm) return
			try {
				uni.showLoading({ title: '删除中...', mask: true })
				const result = await http.post(TASK_DELETE_URL, {
					rowid: task.preDispatchRowid
				})
				uni.hideLoading()
				console.log('删除任务接口返回:', result)
				// 后端 webhook 可能异步处理，先等一会再刷新
				await new Promise((resolve) => setTimeout(resolve, 1500))
				console.log('开始刷新产品列表和员工列表')
				await loadProducts(true)
				await loadWorkshopEmployees()
				console.log('刷新完成')
				if (result && result.status === 1) {
					uni.showToast({ title: result.msg || '删除成功', icon: 'success' })
				} else {
					const msg = result?.message || result?.msg || '删除失败'
					uni.showToast({ title: msg, icon: 'none' })
				}
			} catch (e) {
				uni.hideLoading()
				console.error('删除任务失败:', e)
				uni.showToast({ title: e.message || '删除失败', icon: 'none' })
			}
		}
	})
}

const openProcessActionModal = (product) => {
	closeAllPanels()
	processActionProduct.value = product
	processActionSearch.value = ''
	processActionSelected.value = null
	processActionModeIndex.value = 0
	processActionList.value = []
	showProcessActionModal.value = true
	loadProcessActionList()
}

// 判断当前产品下是否只选中了一道有效的工序
const isProcessActionEnabled = (productRowid) => {
	const currentProcessIds = processList.value
		.filter(p => p.productRowid === productRowid)
		.map(p => p.rowid)
	const selectedCount = selectedProcessIds.value.filter(rowid => currentProcessIds.includes(rowid)).length
	return selectedCount === 1
}

// 判断当前产品下是否至少选中了一道工序
const isDispatchEnabled = (productRowid) => {
	const currentProcessIds = processList.value
		.filter(p => p.productRowid === productRowid)
		.map(p => p.rowid)
	return selectedProcessIds.value.some(rowid => currentProcessIds.includes(rowid))
}

const openProcessActionModalByRowid = (productRowid) => {
	// 获取当前产品下的所有工序 ID
	const currentProcessIds = processList.value
		.filter(p => p.productRowid === productRowid)
		.map(p => p.rowid)
	// 检查当前产品是否只选中了一道工序
	const selectedInCurrentProduct = selectedProcessIds.value.filter(rowid => currentProcessIds.includes(rowid))
	if (selectedInCurrentProduct.length !== 1) {
		uni.showToast({ title: '请先勾选一道工序', icon: 'none' })
		return
	}
	const selectedProcessId = selectedInCurrentProduct[0]
	const selectedProcess = processList.value.find((p) => p.rowid === selectedProcessId)
	// 校验选中的工序是否属于当前产品（双重保险）
	if (!selectedProcess || selectedProcess.productRowid !== productRowid) {
		uni.showToast({ title: '请勾选当前产品下的工序', icon: 'none' })
		return
	}
	// 获取选中工序的顺序
	const selectedSeq = selectedProcess ? parseFloat(selectedProcess.sequence) || 0 : 0
	// 生产顺序默认为选中工序顺序 + 0.01
	processActionSequence.value = (selectedSeq + 0.01).toFixed(2)
	const product = productList.value.find((p) => p.uniqueKey === productRowid)
	openProcessActionModal(product || { uniqueKey: productRowid, productName: '' })
}

const closeProcessActionModal = () => {
	showProcessActionModal.value = false
	processActionProduct.value = null
	processActionSearch.value = ''
	processActionSelected.value = null
	processActionModeIndex.value = 0
	processActionList.value = []
	processActionSequence.value = ''
}

/**
 * 轮询等待工序数据更新
 * @param {Object} product - 产品对象
 * @param {Object} options - 轮询配置
 * @param {number} options.expectedCount - 期望的工序数量变化（添加+1，删除-1，替换不变）
 * @param {Function} options.checkFunc - 自定义检查函数，返回 true 表示检测到变化
 */
const waitForProcessUpdate = async (product, options = {}) => {
	const { expectedCount, checkFunc } = options
	const maxAttempts = 30 // 最多轮询30次
	const intervalMs = 500 // 每500ms轮询一次
	const productRowid = product?.uniqueKey || ''

	// 获取当前工序快照
	const getSnapshot = () => {
		return processList.value
			.filter(p => p.productRowid === productRowid)
			.map(p => ({ rowid: p.rowid, processName: p.processName }))
	}

	const initialSnapshot = getSnapshot()
	const initialCount = initialSnapshot.length

	// 开始轮询
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		await new Promise(resolve => setTimeout(resolve, intervalMs))

		// 重新获取工序数据（先清除缓存再加载）
		loadedProductIds.value = loadedProductIds.value.filter(id => id !== productRowid)
		processList.value = processList.value.filter(p => p.productRowid !== productRowid)
		await loadProductProcesses(product)

		const currentSnapshot = getSnapshot()
		const currentCount = currentSnapshot.length

		// 检查数量变化
		const countChanged = expectedCount !== undefined && (currentCount - initialCount) === expectedCount

		// 自定义检查函数
		const customChanged = checkFunc ? checkFunc(currentSnapshot, initialSnapshot) : false

		if (countChanged || customChanged) {
			return true
		}
	}

	return false
}

const handleProcessActionSearch = () => {
	loadProcessActionList()
}

const loadProcessActionList = async () => {
	try {
		processActionLoading.value = true
		const ws = loginWorkshop.value
		const filters = [
			{ controlId: '6614d7ed1f7f1264f3a332c3', dataType: 30, spliceType: 1, filterType: 2, values: ['工序'] },
			{ controlId: '66b07c4a965ba588586ec783', dataType: 30, spliceType: 1, filterType: 2, values: ['三级'] },
			{ controlId: '6a324e7d6d70ffabc66cbe5f', dataType: 30, spliceType: 1, filterType: 2, values: ['1'] },
			{ controlId: '691e8522d50c894e2e798d03', dataType: 30, spliceType: 1, filterType: 2, values: [ws] }
		]
		const nameSearch = processActionSearch.value.trim()
		if (nameSearch) {
			filters.push({
				controlId: '6614b6721103c1d5d3a08122',
				dataType: 30,
				spliceType: 1,
				filterType: 1,
				values: [nameSearch]
			})
		}
		let allRows = []
		let pageNum = 1
		const pageSize = 100
		const MAX_PAGES = 5
		while (pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: 'shujuzidian',
				filters,
				silent: true
			}, pageSize, pageNum)
			const rows = Array.isArray(res?.data) ? res.data : []
			allRows.push(...rows)
			if (rows.length < pageSize) break
			pageNum++
		}
		processActionList.value = allRows.reverse().map((item) => ({
			rowid: item.rowid || '',
			processName: item['Name'] || '-'
		}))
	} catch (e) {
		console.error('加载工序列表失败:', e)
		processActionList.value = []
	} finally {
		processActionLoading.value = false
	}
}

const selectProcessActionItem = (item) => {
	processActionSelected.value = item
}

const onProcessActionModeChange = (mode) => {
	const index = processActionModeOptions.indexOf(mode)
	if (index > -1) {
		processActionModeIndex.value = index
	}
}

// 获取工序排产明细不为空的预派工 rowids
const getPreDispatchRowidsWithProcessDetail = async (productRowid) => {
	const rawRowids = [...new Set(
		processList.value
			.filter(p => p.productRowid === productRowid && p.preDispatchRowid)
			.map(p => p.preDispatchRowid)
	)]
	if (rawRowids.length === 0) return []

	// 查询预派工数据，过滤工序排产明细不为空的
	const pdRes = await callWorkflowListAPIPaged({
		worksheetId: PRE_DISPATCH_WORKSHEET_ID,
		filters: [{
			controlId: 'rowid',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: rawRowids
		}],
		silent: true
	}, 100)
	const pdRows = Array.isArray(pdRes?.data) ? pdRes.data : []
	// 工序排产明细字段
	const processDetailField = PRE_DISPATCH_FIELD_MAP.processDetail
	return pdRows
		.filter(item => {
			const sids = extractRelationSids(item[processDetailField])
			return sids && sids.length > 0
		})
		.map(item => item.rowid)
}

const confirmProcessAction = async () => {
	const mode = processActionModeOptions[processActionModeIndex.value]
	const selected = processActionSelected.value
	const product = processActionProduct.value

	// 添加和替换模式需要选择工序
	if (mode !== '删除' && !selected) {
		uni.showToast({ title: '请选择工序', icon: 'none' })
		return
	}

	if (mode === '删除') {
		// 调用删除工序接口，删除勾选的那道工序
		const processRowid = selectedProcessIds.value[0] || ''
		if (!processRowid) {
			uni.showToast({ title: '工序ID不存在', icon: 'none' })
			return
		}
		const productRowid = product?.uniqueKey || ''
		try {
			uni.showLoading({ title: '删除中...' })
			await http.post(DELETE_PROCESS_URL, { rowid: processRowid })
			uni.hideLoading()
			closeProcessActionModal()
			uni.showToast({ title: '删除成功', icon: 'success' })
			// 轮询等待工序数量减少
			const updated = await waitForProcessUpdate(product, { expectedCount: -1 })
			if (!updated) {
				// 超时后强制刷新一次
				loadedProductIds.value = loadedProductIds.value.filter(id => id !== productRowid)
				processList.value = processList.value.filter(p => p.productRowid !== productRowid)
				await loadProductProcesses(product)
			}
			// 同步预派工关联工序
			const preDispatchRowids = await getPreDispatchRowidsWithProcessDetail(productRowid)
			if (preDispatchRowids.length > 0) {
				try {
					await http.post(OPERATE_PROCESS_SYNC_URL, { rowids: preDispatchRowids })
				} catch (e) {
					console.error('同步预派工失败:', e)
				}
			}
		} catch (e) {
			uni.hideLoading()
			console.error('删除工序失败:', e)
			uni.showToast({ title: '删除失败', icon: 'none' })
		}
	} else {
		// 添加或替换模式：调用 OPERATE_PROCESS_URL
		const productionCode = product?.productionCode || ''
		if (!productionCode) {
			uni.showToast({ title: '缺少产品编号', icon: 'none' })
			return
		}
		const productRowid = product?.uniqueKey || ''
		const params = {
			processName: selected.processName || '',
			processRowid: selected.rowid || '',
			sequence: parseFloat(processActionSequence.value) || 0,
			modifyMode: mode,
			selectedProcessId: selectedProcessIds.value[0] || '',
			productionCode: productionCode,
			workshop: loginWorkshop.value || ''
		}
		try {
			uni.showLoading({ title: '提交中...', mask: true })
			await http.post(OPERATE_PROCESS_URL, params)
			uni.hideLoading()
			closeProcessActionModal()
			uni.showToast({ title: '操作成功', icon: 'success' })

			// 轮询等待工序数据更新
			const replaceMode = mode === '替换'
			// 替换模式：数量不变；添加模式：数量+1
			const expectedCount = replaceMode ? 0 : 1

			const updated = await waitForProcessUpdate(product, {
				expectedCount,
				checkFunc: replaceMode ? (current) => {
					// 替换时检查：当前选中工序的 processName 是否已经在列表中
					const selectedProcessRowid = selectedProcessIds.value[0] || ''
					const selectedProcess = processList.value.find(p => p.rowid === selectedProcessRowid)
					if (selectedProcess) {
						return current.some(p => p.processName === selectedProcess.processName)
					}
					return false
				} : undefined
			})

			if (!updated) {
				// 超时后强制刷新一次
				loadedProductIds.value = loadedProductIds.value.filter(id => id !== productRowid)
				processList.value = processList.value.filter(p => p.productRowid !== productRowid)
				await loadProductProcesses(product)
			}

			// 替换时同步预派工关联工序
			if (mode === '替换') {
				const preDispatchRowids = await getPreDispatchRowidsWithProcessDetail(productRowid)
				if (preDispatchRowids.length > 0) {
					try {
						await http.post(OPERATE_PROCESS_SYNC_URL, { rowids: preDispatchRowids })
					} catch (e) {
						console.error('同步预派工失败:', e)
					}
				}
			}
		} catch (e) {
			uni.hideLoading()
			console.error('操作工序失败:', e)
			uni.showToast({ title: '操作失败', icon: 'none' })
		}
	}
}

const loadWorkshopEmployees = async () => {
	try {
		const currentDate = filterDate.value
		const wsFilter = employeeWorkshopFilter.value
		const filters = []
		if (wsFilter) {
			filters.push({
				controlId: EMPLOYEE_FIELD_MAP.workshop,
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [wsFilter]
			})
		}

		// 由于接口无法按日期筛选，逐页获取并在前端按日期过滤：
		// 阶段1：找到第一条符合日期的数据前，持续获取；
		// 阶段2：找到数据后，继续获取后续页，直到某一页筛选后为空或返回不足一页。
		const pageSize = 100
		let pageNum = 1
		let foundData = false
		let allRows = []
		let hasMore = true
		const MAX_PAGES = 500

		while (hasMore && pageNum <= MAX_PAGES) {
			const res = await callWorkflowListAPIPaged({
				worksheetId: EMPLOYEE_WORKSHEET_ID,
				filters,
				silent: true
			}, pageSize, pageNum)
			const rows = Array.isArray(res?.data) ? res.data : []
			if (rows.length === 0) break

			const filtered = rows.filter((item) => {
				if (formatFieldValue(item[EMPLOYEE_FIELD_MAP.dispatchDate]) !== currentDate) return false
				// 过滤掉临时工
				const isTemp = String(formatFieldValue(item[EMPLOYEE_FIELD_MAP.isTempEmployee]) || '').trim() === '1'
				return !isTemp
			})
			allRows.push(...filtered)

			if (filtered.length > 0) foundData = true
			if (foundData && filtered.length === 0) {
				hasMore = false
			} else if (rows.length < pageSize) {
				hasMore = false
			} else {
				pageNum++
			}
		}

		// 加载当日工资表扩展信息（预派工关联 + 工资阀值），用于未派判断、派满判断及柱子状态显示
		const { preDispatchMap, wageThresholdMap } = await loadEmployeeDailyWageExtraMap()
		const mapped = allRows.map((item) => {
			const totalHours = parseFloat(formatFieldValue(item[EMPLOYEE_FIELD_MAP.totalHours]) || '0') || 0
			const wage = parseFloat(formatFieldValue(item[EMPLOYEE_FIELD_MAP.wage]) || '0') || 0
			const attendance = formatFieldValue(item[EMPLOYEE_FIELD_MAP.attendance]) || ''
			const position = formatFieldValue(item[EMPLOYEE_FIELD_MAP.position]) || ''
			const isNewEmployeeRaw = formatFieldValue(item[EMPLOYEE_FIELD_MAP.isNewEmployee])
			const isNewEmployee = String(isNewEmployeeRaw).trim() === '1'
			const isTempEmployeeRaw = formatFieldValue(item[EMPLOYEE_FIELD_MAP.isTempEmployee])
			const isTempEmployee = String(isTempEmployeeRaw).trim() === '1'
			const name = formatFieldValue(item[EMPLOYEE_FIELD_MAP.employeeName]) || '-'
			const wageThreshold = wageThresholdMap.get(name) || 0
			const isFull = wageThreshold > 0 && wage >= wageThreshold
			return {
				id: item.rowid || '',
				name,
				totalHours,
				wage,
				attendance,
				position,
				isNewEmployee,
				isTempEmployee,
				hasPreDispatch: preDispatchMap.get(name) || false,
				wageThreshold,
				isFull
			}
		})
		employeeList.value = mapped.map((e) => {
			const barHeight = Math.min(100, (e.totalHours / MAX_EMPLOYEE_HOURS) * 100) + '%'
			const attendance = String(e.attendance).trim()
			const barColor = attendance === '上班' ? '#27ae60' : '#e74c3c'
			return { ...e, barHeight, barColor }
		})
	} catch (e) {
		console.error('加载员工数据失败:', e)
		employeeList.value = []
	}
}

// 员工选择框专用：喷涂车间时同时查喷涂+组装
const loadWorkshopEmployeesForSelector = async () => {
	try {
		const t0 = Date.now()
		const currentDate = filterDate.value
		const workshopList = selectedSelectorWorkshop.value ? [selectedSelectorWorkshop.value] : []
		const allRows = []

		for (const ws of workshopList) {
			if (!ws) continue
			const filters = [
				{ controlId: EMPLOYEE_FIELD_MAP.workshop, dataType: 30, spliceType: 1, filterType: 2, values: [ws] }
			]

			const pageSize = 100
			let pageNum = 1
			let foundData = false
			let hasMore = true
			const MAX_PAGES = 500
			let totalPages = 0

			while (hasMore && pageNum <= MAX_PAGES) {
				totalPages++
				const res = await callWorkflowListAPIPaged({
					worksheetId: EMPLOYEE_WORKSHEET_ID,
					filters,
					silent: true
				}, pageSize, pageNum)
				const rows = Array.isArray(res?.data) ? res.data : []
				if (rows.length === 0) break

				const filtered = rows.filter((item) => {
				if (formatFieldValue(item[EMPLOYEE_FIELD_MAP.dispatchDate]) !== currentDate) return false
				return true
			})
				allRows.push(...filtered)

				if (filtered.length > 0) foundData = true
				if (foundData && filtered.length === 0) {
					hasMore = false
				} else if (rows.length < pageSize) {
					hasMore = false
				} else {
					pageNum++
				}
			}
			console.log(`loadWorkshopEmployeesForSelector [${ws}] pages=${totalPages} filtered=${allRows.length} cost=${Date.now() - t0}ms`)
		}

		const mapped = allRows.map((item) => {
			const totalHours = parseFloat(formatFieldValue(item[EMPLOYEE_FIELD_MAP.totalHours]) || '0') || 0
			const wage = parseFloat(formatFieldValue(item[EMPLOYEE_FIELD_MAP.wage]) || '0') || 0
			const attendance = formatFieldValue(item[EMPLOYEE_FIELD_MAP.attendance]) || ''
			const position = formatFieldValue(item[EMPLOYEE_FIELD_MAP.position]) || ''
			const isNewEmployeeRaw = formatFieldValue(item[EMPLOYEE_FIELD_MAP.isNewEmployee])
			const isNewEmployee = String(isNewEmployeeRaw).trim() === '1'
			const isTempEmployeeRaw = formatFieldValue(item[EMPLOYEE_FIELD_MAP.isTempEmployee])
			const isTempEmployee = String(isTempEmployeeRaw).trim() === '1'
			return {
				id: item.rowid || '',
				name: formatFieldValue(item[EMPLOYEE_FIELD_MAP.employeeName]) || '-',
				totalHours,
				wage,
				attendance,
				position,
				isNewEmployee,
				isTempEmployee
			}
		})
		return mapped.map((e) => {
			const barHeight = Math.min(100, (e.totalHours / MAX_EMPLOYEE_HOURS) * 100) + '%'
			const attendance = String(e.attendance).trim()
			const barColor = attendance === '上班' ? '#27ae60' : '#e74c3c'
			return { ...e, barHeight, barColor }
		})
	} catch (e) {
		console.error('加载员工数据失败:', e)
		return []
	}
}

const loadPositionProcessEmployees = async () => {
	try {
		const wsFilter = employeeWorkshopFilter.value
		const filters = [
			{ controlId: '66bc55673f78a8b841f28f1b', dataType: 2, spliceType: 1, filterType: 2, values: ['在职'] },
			{ controlId: '66bc55b83f78a8b841f28f3c', dataType: 2, spliceType: 1, filterType: 2, values: ['是'] }
		]
		if (wsFilter) {
			filters.push({
				controlId: '6960707f9223cfe3a0c16678',
				dataType: 2,
				spliceType: 1,
				filterType: 2,
				values: [wsFilter]
			})
		}

		const res = await callWorkflowListAll({
			worksheetId: '68f6f149c729de3f57a0a358',
			filters,
			silent: true
		}, 100)
		const rows = Array.isArray(res?.data) ? res.data : []
		// 拉伸车间获取工序，其他车间（喷涂、抛光、组装）获取岗位
		const processFieldIds = wsFilter === '拉伸车间'
			? POSITION_PROCESS_FIELD_MAP.stretchAndPolish
			: POSITION_PROCESS_FIELD_MAP.assembly
		const mapped = rows.filter((item) => {
			// 过滤掉临时工：临时工字段（6a744a494239d5290f2f6be3）为 1 是临时工，为 0 是正式工
			return item['6a744a494239d5290f2f6be3'] != 1
		}).map((item) => {
			const isNewEmployee = item['6a7154c54239d5290f2ca6d4'] == '1'
			return {
				id: item.rowid || '',
				rowid: item.rowid || '',
				name: formatFieldValue(item['6695dc2a2503723eec1aa766']) || '-',
				totalHours: 0,
				wage: 0,
				barHeight: '0%',
				barColor: isNewEmployee ? '#4caf50' : '#5884f1',
				processNames: processFieldIds.map((fieldId) => formatFieldValue(item[fieldId]) || '-')
			}
		})
		positionProcessEmployeeList.value = mapped
	} catch (e) {
		console.error('加载岗位工序员工数据失败:', e)
		positionProcessEmployeeList.value = []
	}
}

const loadSprayProcessList = async () => {
	try {
		const res = await callWorkflowListAll({
			worksheetId: SPRAY_PROCESS_WORKSHEET_ID,
			filters: [],
			silent: true
		}, 100)
		const rows = Array.isArray(res?.data) ? res.data : []
		sprayProcessList.value = rows.map((item) => ({
			id: item.rowid || '',
			processName: formatFieldValue(item[SPRAY_PROCESS_FIELD_MAP.processName]) || '-',
			employeeName: formatFieldValue(item[SPRAY_PROCESS_FIELD_MAP.employeeName]) || '-'
		}))
	} catch (e) {
		console.error('加载喷涂员工工序表失败:', e)
		sprayProcessList.value = []
	}
}

// 组装岗位合并配置：主岗位记录作为按钮主记录（按钮名、添加产品 rowid 取自它），
// 合并组内其余岗位与主岗位合并为一个按钮，点击筛选全部内部岗位的预派工数据
const ASSEMBLY_POSITION_MERGE_GROUPS = [
	{ btnName: '组装包装', mainName: '组装包装', memberNames: ['组装包装', '点焊', '打手柄标'] },
	{ btnName: '喷砂', mainName: '喷砂', memberNames: ['喷砂', '喷砂叠锅'] }
]

// 加载岗位工序表中车间为组装车间的岗位名称，作为导航栏筛选按钮（仅组装车间权限时使用）
const loadAssemblyPositionButtons = async () => {
	if (loginWorkshop.value !== '组装车间') {
		assemblyPositionButtons.value = []
		return
	}
	try {
		const res = await callWorkflowListAll({
			worksheetId: ASSEMBLY_POSITION_WORKSHEET_ID,
			filters: [{
				controlId: '6a3124a86d70ffabc66c8515',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: ['组装车间']
			}],
			silent: true
		}, 100)
		const rows = Array.isArray(res?.data) ? res.data : []
		// 岗位名称解析顺序与 loadPositionProcessDict 保持一致，确保筛选时能匹配上
		const parseName = (item) => item[ASSEMBLY_POSITION_FIELD_ID] || item['Name'] || '-'

		const buttons = []
		// 每个合并组：记录主岗位 rowid 与内部岗位集合（主岗位记录业务上固定存在）
		const mergeStates = ASSEMBLY_POSITION_MERGE_GROUPS.map(g => ({
			...g,
			rowid: '',
			positionRowids: [],
			positionNames: []
		}))

		rows.forEach((item) => {
			const name = parseName(item)
			const group = mergeStates.find(g => g.memberNames.includes(name))
			if (group) {
				if (name === group.mainName) {
					group.rowid = item.rowid || ''
				}
				group.positionRowids.push(item.rowid || '')
				group.positionNames.push(name)
			} else {
				// 其他岗位独立成按钮
				buttons.push({
					name,
					rowid: item.rowid || '',
					positionRowids: [item.rowid || ''],
					positionNames: [name]
				})
			}
		})

		// 存在主岗位记录的合并组作为一个按钮放在最前面（保持配置顺序：组装包装、喷砂）
		const mergedButtons = mergeStates
			.filter(group => group.rowid)
			.map(group => ({
				name: group.btnName,
				rowid: group.rowid,
				positionRowids: group.positionRowids,
				positionNames: group.positionNames
			}))
		assemblyPositionButtons.value = [...mergedButtons, ...buttons]
	} catch (e) {
		console.error('加载组装车间岗位筛选按钮失败:', e)
		assemblyPositionButtons.value = []
	}
}

// 获取当前选中岗位按钮对应的岗位工序 rowid（未选中返回空；其他车间无按钮同样返回空）
const getSelectedPositionProcessRowid = () => {
	if (!activeAssemblyPosition.value) return ''
	const btn = assemblyPositionButtons.value.find(b => b.name === activeAssemblyPosition.value)
	return btn?.rowid || ''
}

// 点击组装岗位筛选按钮：单选切换选中/取消，并重新加载产品列表
const handleAssemblyPositionClick = async (position) => {
	activeAssemblyPosition.value = activeAssemblyPosition.value === position.name ? '' : position.name
	// 确保岗位工序字典已加载，用于将预派工的岗位工序 ID 解析为名称后匹配筛选
	if (activeAssemblyPosition.value && positionProcessDictMap.value.size === 0) {
		await loadPositionProcessDict()
	}
	await loadProducts(true)
}

const loadSprayEmployees = async () => {
	try {
		const wsFilter = employeeWorkshopFilter.value
		const filters = [
			{ controlId: '66bc55673f78a8b841f28f1b', dataType: 2, spliceType: 1, filterType: 2, values: ['在职'] },
			{ controlId: '66bc55b83f78a8b841f28f3c', dataType: 2, spliceType: 1, filterType: 2, values: ['是'] }
		]
		if (wsFilter) {
			filters.push({
				controlId: '6960707f9223cfe3a0c16678',
				dataType: 2,
				spliceType: 1,
				filterType: 2,
				values: [wsFilter]
			})
		}

		const res = await callWorkflowListAll({
			worksheetId: '68f6f149c729de3f57a0a358',
			filters,
			silent: true
		}, 100)
		const rows = Array.isArray(res?.data) ? res.data : []
		sprayEmployeeList.value = rows.map((item) => ({
			id: item.rowid || '',
			name: formatFieldValue(item['6695dc2a2503723eec1aa766']) || '-',
			totalHours: 0,
			wage: 0,
			barHeight: '0%',
			barColor: '#5884f1'
		}))
	} catch (e) {
		console.error('加载喷涂人事档案数据失败:', e)
		sprayEmployeeList.value = []
	}
}

const handleItemClick = (item) => {
	const processDetailSids = Array.isArray(item.processDetail) ? item.processDetail : []
	const dailyWageSids = Array.isArray(item.dailyWage) ? item.dailyWage : []
	const params = {
		orderCode: item.orderNo || '',
		productionCode: item.productionCode || '',
		workshop: item.workshop || '',
		productName: item.productName || '',
		processDetailSids: processDetailSids.length > 0 ? JSON.stringify(processDetailSids) : '',
		dailyWageSids: dailyWageSids.length > 0 ? JSON.stringify(dailyWageSids) : '',
		dispatchDate: item.dispatchDate || '',
		dispatchCount: item.dispatchCount || '',
		fromPreDispatch: '1',
		prerowid: item.rowid || '',
	}
	const query = Object.entries(params)
		.filter(([_, v]) => v !== '')
		.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
		.join('&')
	uni.navigateTo({
		url: `/pages/dispatchWork/dispatchWork?${query}`
	})
}

const handleVoidClick = async (item) => {
	uni.showModal({
		title: '作废确认',
		placeholderText: '请输入作废原因',
		editable: true,
		success: async (res) => {
			if (res.confirm && res.content) {
				try {
					await http.post(PRE_DISPATCH_VOID_URL, {
						rowid: item.rowid,
						reason: res.content
					})
					uni.showToast({ title: '作废成功', icon: 'success' })
					loadProducts(true)
					loadEmployeeDispatchSummary()
				} catch (e) {
					console.error('作废失败:', e)
					uni.showToast({ title: '作废失败', icon: 'none' })
				}
			}
		}
	})
}

const closeConfirmDispatchModal = () => {
	showConfirmDispatchModal.value = false
	confirmDispatchCount.value = 0
	confirmDispatchRowids.value = []
}

const handleCircleClick = async (item) => {
	// 选择框依附于预派工调整弹窗
	employeeSelectorMode.value = 'edit'
	editData.value = {
		rowid: item.rowid || '',
		orderNo: item.orderNo || '',
		productNameNew: item.productNameNew || '',
		processDisplay: item.processDisplay || '',
		dispatchDate: item.dispatchDate || '',
		dispatchCount: item.dispatchCount || '',
		employeeName: item.employeeName || '',
		employeeId: item.employeeId || '',
		employeeNames: [],
		selectedEmployeeIds: [],
		selectedEmployeeNames: [],
		worktime: item.worktime || '',
		wage: item.wage || ''
	}
	// 查询当日工资情况，获取员工姓名列表
	const dailyWageSids = Array.isArray(item.dailyWage) ? item.dailyWage : []
	if (dailyWageSids.length > 0) {
		try {
			const res = await callWorkflowListAPIPaged({
				worksheetId: DAILY_WAGE_WORKSHEET_ID,
				filters: [{
					controlId: 'rowid',
					dataType: 30,
					filterType: 2,
					values: dailyWageSids
				}],
				pageSize: 100,
				pageNum: 1,
				silent: true
			})
			const dataList = Array.isArray(res?.data) ? res.data : []
			const names = dataList.map(record => formatFieldValue(record[DAILY_WAGE_EMPLOYEE_NAME_FIELD])).filter(Boolean)
			editData.value.employeeNames = names
		} catch (e) {
			console.error('加载当日工资员工姓名失败:', e)
		}
	}
	showEditModal.value = true
	// 加载员工列表并匹配当日工资员工进行预选
	await loadEmployeeOptions()
	// 临时工按姓名末尾数字排序等，保证选择员工框顺序正确
	sortEmployeeOptionsByPosition(editData.value.processDisplay)
	const dailyNames = editData.value.employeeNames
	if (dailyNames.length > 0 && allEmployeeOptions.value.length > 0) {
		const matchedIds = []
		const matchedNames = []
		allEmployeeOptions.value.forEach(emp => {
			if (dailyNames.includes(emp.name)) {
				matchedIds.push(emp.id)
				matchedNames.push(emp.name)
			}
		})
		editData.value.selectedEmployeeIds = matchedIds
		editData.value.selectedEmployeeNames = matchedNames
	}
	// 自动打开员工列表
	showEmployeeSelector.value = true
}

const onDispatchDateChange = (e) => {
	editData.value.dispatchDate = e.detail.value
}

const closeEditModal = () => {
	showEditModal.value = false
	showEmployeeSelector.value = false
	editData.value = {
		rowid: '',
		orderNo: '',
		productNameNew: '',
		processDisplay: '',
		dispatchDate: '',
		dispatchCount: '',
		employeeName: '',
		employeeId: '',
		employeeNames: [],
		selectedEmployeeIds: [],
		selectedEmployeeNames: [],
		worktime: '',
		wage: ''
	}
}

const confirmEdit = async () => {
	if (!editData.value.rowid) {
		uni.showToast({ title: '缺少记录ID', icon: 'none' })
		return
	}
	if (!editData.value.selectedEmployeeIds || editData.value.selectedEmployeeIds.length === 0) {
		uni.showToast({ title: '请选择员工', icon: 'none' })
		return
	}
	try {
		await http.post(PRE_DISPATCH_UPDATE_URL, {
			rowid: editData.value.rowid,
			dispatchDate: editData.value.dispatchDate,
			dispatchCount: editData.value.dispatchCount,
			employees: editData.value.selectedEmployeeIds
		})
		uni.showToast({ title: '更新成功', icon: 'success' })
		closeEditModal()
		loadProducts(true)
		loadEmployeeDispatchSummary()
	} catch (e) {
		console.error('更新预派工失败:', e)
		uni.showToast({ title: '更新失败', icon: 'none' })
	}
}

// 从工序员工栏直接打开员工选择框
const openEmployeeSelectorFromProcess = async (processes, idx) => {
	const process = processes[idx]
	if (!process) return

	// 限制：工序未勾选时无法打开
	if (!selectedProcessIds.value.includes(process.rowid)) {
		uni.showToast({ title: '请先勾选该工序', icon: 'none' })
		return
	}

	// 限制：勾选工序未绑定预派工时无法打开
	if (!process.preDispatchRowid) {
		uni.showToast({ title: '请先点击确定绑定', icon: 'none' })
		return
	}

	// 获取该员工组起始位置的工序信息
	const groupStartIdx = getEmployeeGroupStart(processes, idx)
	const groupStartProcess = processes[groupStartIdx]

	// 判断显示工序名称还是岗位工序：岗位工序不为空时优先显示岗位工序
	const positionProcessName = process.positionProcess || groupStartProcess.positionProcess || ''
	const craftPositionName = process.craftPosition || groupStartProcess.craftPosition || ''
	const processDisplay = (positionProcessName || craftPositionName || groupStartProcess.processName || '')

	// 设置选择框为独立打开模式
	employeeSelectorMode.value = 'process'

	// 初始化 editData 用于选择框状态
	editData.value = {
		rowid: process.preDispatchRowid || '',
		orderNo: '',
		productNameNew: '',
		processDisplay: processDisplay,
		dispatchDate: '',
		dispatchCount: '',
		employeeName: '',
		employeeId: '',
		employeeNames: [],
		selectedEmployeeIds: [],
		selectedEmployeeNames: [],
		worktime: '',
		wage: ''
	}

	// 立即显示选择框
	showEmployeeSelector.value = true

	// 异步加载员工数据并匹配当前已选员工
	loadSelectorEmployeeData(groupStartProcess)
}

// 加载员工选择框数据：优先使用缓存，只在缓存无效时请求接口
const loadSelectorEmployeeData = async (groupStartProcess) => {
	if (allEmployeeOptions.value.length === 0) {
		employeeListLoading.value = true
	}
	try {
		await loadEmployeeOptions()
		sortEmployeeOptionsByPosition()

		// 匹配当前员工：工序关联预派工的员工名，在缓存的员工列表中按姓名匹配
		const currentNames = groupStartProcess.employeeNames || []
		if (currentNames.length > 0 && allEmployeeOptions.value.length > 0) {
			const matchedIds = []
			const matchedNames = []
			allEmployeeOptions.value.forEach(emp => {
				if (currentNames.includes(emp.name)) {
					matchedIds.push(emp.id)
					matchedNames.push(emp.name)
				}
			})
			editData.value.selectedEmployeeIds = matchedIds
			editData.value.selectedEmployeeNames = matchedNames
		}
	} catch (e) {
		console.error('加载员工数据失败:', e)
	} finally {
		employeeListLoading.value = false
	}
}

// 切换车间下拉框显示
const toggleWorkshopDropdown = () => {
	showWorkshopDropdown.value = !showWorkshopDropdown.value
}

// 选择车间
const selectWorkshop = async (ws) => {
	selectedSelectorWorkshop.value = ws
	showWorkshopDropdown.value = false
	uni.showLoading({ title: '加载中...' })
	await loadEmployeeOptions()
	uni.hideLoading()
	sortEmployeeOptionsByPosition()
}

// 切换员工类型（普/临）：数据已合并，只需要切换筛选条件
const switchEmployeeType = async (type) => {
	if (employeeTypeFilter.value === type) return
	employeeTypeFilter.value = type
}

// 确认员工编辑：从员工选择框独立打开时保存员工变更
const confirmEmployeeEdit = async () => {
	const preDispatchRowid = editData.value.rowid
	const selectedEmployeeIds = editData.value.selectedEmployeeIds || []
	if (!preDispatchRowid) {
		uni.showToast({ title: '缺少预派工记录', icon: 'none' })
		return
	}

	// 构建请求数据：员工始终传递，没选择员工时传空数组
	const requestData = {
		rowid: preDispatchRowid,
		employees: selectedEmployeeIds
	}

	try {
		uni.showLoading({ title: '保存中...' })
		await http.post(PRE_DISPATCH_UPDATE_URL, requestData)
		uni.hideLoading()
		uni.showToast({ title: '保存成功', icon: 'success' })

		// 关闭选择框
		closeEmployeeSelector()

		// 轮询等待预派工记录的员工信息更新完成后再刷新
		const updateSuccess = await waitForPreDispatchEmployeeUpdate(preDispatchRowid, selectedEmployeeIds)
		if (!updateSuccess) {
			console.warn('员工信息更新超时，但仍继续刷新')
		}

		// 刷新工序列表的员工数据：清除缓存并重新加载当前选中产品的工序
		const targetProduct = productList.value.find(p =>
			p.preDispatchRowids && p.preDispatchRowids.includes(preDispatchRowid)
		)
		if (targetProduct) {
			// 清除该产品的工序缓存
			const idx = loadedProductIds.value.indexOf(targetProduct.uniqueKey)
			if (idx > -1) loadedProductIds.value.splice(idx, 1)
			// 从 processList 中移除该产品的旧工序
			processList.value = processList.value.filter(p => p.productRowid !== targetProduct.uniqueKey)
			// 重新加载工序
			await loadProductProcesses(targetProduct)
		}

		// 刷新底部员工列表
		loadWorkshopEmployees()

		// 刷新汇总
		loadEmployeeDispatchSummary()
	} catch (e) {
		uni.hideLoading()
		console.error('保存员工编辑失败:', e)
		uni.showToast({ title: '保存失败', icon: 'none' })
	}
}

function getCurrentDate() {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function getTodayDate() {
	const today = new Date()
	const year = today.getFullYear()
	const month = String(today.getMonth() + 1).padStart(2, '0')
	const day = String(today.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function getTomorrowDate() {
	const tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	const year = tomorrow.getFullYear()
	const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
	const day = String(tomorrow.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function getYesterdayDate() {
	const yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 1)
	const year = yesterday.getFullYear()
	const month = String(yesterday.getMonth() + 1).padStart(2, '0')
	const day = String(yesterday.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const loadEmployeeOptions = async () => {
	try {
		const currentDate = filterDate.value
		// 缓存有效时直接复用，避免重复请求
		if (
			allEmployeeOptions.value.length > 0 &&
			lastEmployeeOptionsParams.value.workshop === selectedSelectorWorkshop.value &&
			lastEmployeeOptionsParams.value.date === currentDate &&
			lastEmployeeOptionsParams.value.type === employeeTypeFilter.value
		) {
			return
		}
		// 员工选择框按当前选中车间查询
		const empList = await loadWorkshopEmployeesForSelector()
		allEmployeeOptions.value = empList.map(item => ({
			id: item.id || '',
			name: item.name || '-',
			position: item.position || '',
			totalHours: item.totalHours || 0,
			wage: item.wage || 0,
			isNewEmployee: item.isNewEmployee || false,
			isTempEmployee: item.isTempEmployee || false,
			dispatchWorkDate: currentDate
		}))
		// 记录当前筛选条件
		lastEmployeeOptionsParams.value = {
			workshop: selectedSelectorWorkshop.value,
			date: currentDate,
			type: employeeTypeFilter.value
		}
	} catch (error) {
		console.error('加载员工列表失败:', error)
		allEmployeeOptions.value = []
	}
}

const getPositionMatchIndex = (positionText, targetName) => {
	if (!positionText || !targetName) return Infinity
	const positions = positionText.split(/[,，]/).map(p => p.trim()).filter(Boolean)
	const index = positions.findIndex(p => p.includes(targetName))
	return index >= 0 ? index : Infinity
}

// 提取临时工姓名末尾的数字：临时工2 → 2；非"临时工N"格式返回 null
const getTempEmployeeNumber = (name) => {
	const match = /^临时工(\d+)$/.exec(String(name || '').trim())
	return match ? parseInt(match[1], 10) : null
}

const sortEmployeeOptionsByPosition = (target = '') => {
	// 优先使用调用方传入的目标工序名，未传时回退到当前编辑上下文
	const targetName = target || editData.value.processDisplay || ''

	const sorted = [...allEmployeeOptions.value].sort((a, b) => {
		// 两个都是临时工时，按姓名末尾数字升序（临时工1、临时工2、...）
		const aNum = getTempEmployeeNumber(a.name)
		const bNum = getTempEmployeeNumber(b.name)
		if (aNum !== null && bNum !== null) {
			return aNum - bNum
		}
		// 有目标工序名时，岗位匹配度优先
		if (targetName) {
			const aIndex = getPositionMatchIndex(a.position, targetName)
			const bIndex = getPositionMatchIndex(b.position, targetName)
			if (aIndex !== bIndex) {
				return aIndex - bIndex
			}
		}
		return String(a.name || '').localeCompare(String(b.name || ''))
	})
	allEmployeeOptions.value = sorted
}

const closeEmployeeSelector = () => {
	showEmployeeSelector.value = false
}

const toggleEmployee = (emp) => {
	const ids = editData.value.selectedEmployeeIds
	const names = editData.value.selectedEmployeeNames
	const idx = ids.indexOf(emp.id)
	if (idx >= 0) {
		ids.splice(idx, 1)
		names.splice(idx, 1)
	} else {
		ids.push(emp.id)
		names.push(emp.name)
	}
	// sync single employee field (first selected)
	if (ids.length > 0) {
		editData.value.employeeId = ids[0]
		editData.value.employeeName = names[0]
	} else {
		editData.value.employeeId = ''
		editData.value.employeeName = ''
	}
}

// 从已选员工ID中筛选出新员工ID
const getSelectedNewEmployeeIds = (selectedIds) => {
	return (selectedIds || [])
		.filter(id => {
			const emp = allEmployeeOptions.value.find(e => e.id === id)
			return emp && emp.isNewEmployee
		})
}

// 页面首次挂载时加载全部数据（含字典）
const refreshPage = async () => {
	uni.showLoading({ title: '加载中...', mask: true })
	// 读取本地保存的同步勾选开关状态
	loadSyncSelectEnabled()
	// 字典与产品列表并行加载：左侧产品列表不依赖字典，优先让用户看到内容
	const dictLoad = loadProcessDictMap().then(() => Promise.all([
		loadCraftPositionList(),
		loadPositionProcessDict(),
		loadCraftPositionMap(),    // 获取工序归类表（用于同类别同步勾选）
		loadAssemblyPositionButtons()  // 组装车间岗位筛选按钮
	]))
	const productLoad = loadProducts(true)
	await Promise.all([dictLoad, productLoad])
	// 加载圈消失后再后台拉员工数据，减少进入页面等待时间
	uni.hideLoading()
	loadWorkshopEmployees()
	loadEmployeeDispatchSummary()
}

// 从其他页面返回时，若字典已加载则只刷新产品和员工，避免重复拉字典
const refreshPageOnShow = async () => {
	if (processDictMap.value.size > 0 && productList.value.length > 0) {
		await handleSearch()
	} else {
		await refreshPage()
	}
}

onMounted(refreshPage)
onShow(refreshPageOnShow)
</script>

<style scoped lang="scss">
@keyframes panel-slide-in {
	0% { opacity: 0; transform: translateX(-10px); }
	100% { opacity: 1; transform: translateX(0); }
}

.pre-dispatched-container {
	height: 100vh;
	width: 100vw;
	background-color: #f5f7fa;
	display: flex;
	flex-direction: column;

	.header {
		height: px2vw(70px);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #5884f1;
		flex-shrink: 0;
		position: relative;
		z-index: 200;
		padding: 0 px2vw(20px);
		box-sizing: border-box;

		image {
			margin-right: px2vw(16px);
			height: px2vw(40px);
			width: px2vw(40px);
			flex-shrink: 0;
		}

		.header-date-picker {
			margin-right: px2vw(16px);
			flex-shrink: 0;

			.header-date-display {
				display: flex;
				align-items: center;
				gap: px2vw(8px);
				padding: px2vw(8px) px2vw(16px);
				background-color: rgba(255, 255, 255, 0.2);
				border: 1px solid rgba(255, 255, 255, 0.3);
				border-radius: px2vw(8px);
			}

			.header-date-text {
				font-size: px2vw(26px);
				color: #fff;
				font-weight: 500;
			}

			.header-date-icon {
				font-size: px2vw(20px);
				color: #fff;
			}
		}

		.header-btn-bar {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			gap: px2vw(16px);
			overflow: visible;
		}

		.header-btn {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 px2vw(32px);
			height: px2vw(48px);
			line-height: px2vw(48px);
			border-radius: px2vw(24px);
			font-size: px2vw(24px);
			color: #fff;
			background-color: rgba(255, 255, 255, 0.2);
			border: 1px solid rgba(255, 255, 255, 0.3);
			text-align: center;
			transition: all 0.2s ease;

			&.active {
				background-color: #fff;
				color: #5884f1;
				border-color: #fff;
				font-weight: bold;
			}
		}

		.header-btn-position {
			background-color: rgba(255, 255, 255, 0.12);
			border: 1px dashed rgba(255, 255, 255, 0.65);
			color: #fff;

			&.active {
				background-color: #2ecc71;
				color: #fff;
				border: 1px solid #2ecc71;
				font-weight: bold;
				box-shadow: 0 0 8px rgba(46, 204, 113, 0.5);
			}
		}

		.header-config-btn {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 px2vw(24px);
			height: px2vw(48px);
			line-height: px2vw(48px);
			border-radius: px2vw(24px);
			font-size: px2vw(24px);
			color: #5884f1;
			background-color: #fff;
			border: 1px solid #fff;
			text-align: center;
			transition: all 0.2s ease;

			&:active {
				background-color: rgba(255, 255, 255, 0.8);
			}
		}

		.header-refresh-btn {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 px2vw(24px);
			height: px2vw(48px);
			line-height: px2vw(48px);
			border-radius: px2vw(24px);
			font-size: px2vw(24px);
			color: #fff;
			background-color: rgba(255, 255, 255, 0.2);
			border: 1px solid rgba(255, 255, 255, 0.3);
			text-align: center;
			transition: all 0.2s ease;
			margin-right: px2vw(16px);

			&:active {
				background-color: rgba(255, 255, 255, 0.35);
			}
		}
	}

	.search-box {
			background-color: #fff;
			padding: px2vw(8px) px2vw(10px);
			border-bottom: 1px solid #eee;
			flex-shrink: 0;

			.search-row {
				display: flex;
				gap: px2vw(10px);
				margin-bottom: px2vw(10px);

				&.search-row:first-of-type,
				&.search-row--spec {
					display: none;
				}

				&.search-row--date {
					margin-bottom: 0;
				}

				.search-input {
					flex: 1;
					height: px2vw(70px);
					background-color: #f5f7fa;
					border-radius: px2vw(8px);
					padding: 0 px2vw(16px);
					font-size: px2vw(24px);

					&.search-input--spec {
						height: px2vw(60px);
						font-size: px2vw(22px);
					}
				}

				.btn-reset,
				.btn-search {
					flex-shrink: 0;
					padding: 0 px2vw(24px);
					height: px2vw(70px);
					line-height: px2vw(70px);
					border-radius: px2vw(8px);
					font-size: px2vw(26px);
					text-align: center;
				}

				.btn-reset {
					background-color: #f5f7fa;
					color: #666;
				}

				.date-picker-wrapper {
					flex-shrink: 0;
				}

				.btn-group-right {
					flex: 1;
					display: flex;
					justify-content: flex-end;
					align-items: center;
					gap: px2vw(12px);
				}

				.date-picker {
					width: auto;
					min-width: px2vw(280px);
					height: px2vw(70px);
					background-color: #f5f7fa;
					border-radius: px2vw(8px);
					padding: 0 px2vw(16px);
					display: flex;
					align-items: center;
					font-size: px2vw(28px);

					.date-label {
						color: #666;
						font-size: px2vw(28px);
					}

					.date-value {
						color: #333;
						font-size: px2vw(28px);
					}
				}

				.btn-add-pre {
					flex-shrink: 0;
					height: px2vw(70px);
					padding: 0 px2vw(24px);
					background-color: #27ae60;
					color: #fff;
					border-radius: px2vw(8px);
					font-size: px2vw(26px);
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.btn-confirm-dispatch {
					flex-shrink: 0;
					height: px2vw(70px);
					padding: 0 px2vw(24px);
					background-color: #3498db;
					color: #fff;
					border-radius: px2vw(8px);
					font-size: px2vw(26px);
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.btn-refresh {
					flex-shrink: 0;
					height: px2vw(70px);
					padding: 0 px2vw(24px);
					background-color: #f39c12;
					color: #fff;
					border-radius: px2vw(8px);
					font-size: px2vw(26px);
					display: flex;
					align-items: center;
					justify-content: center;
				}
			}
		}

	.dropdown-panel-overlay {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.2);
		z-index: 100;
	}

	.dropdown-panel-wrapper {
		position: absolute;
		left: 0;
		right: 0;
		top: px2vw(70px);
		height: 33vh;
		transform: translateY(calc(-33vh));
		transition: transform 0.3s ease;
		z-index: 103;
		pointer-events: none;

		&.open {
			transform: translateY(0);
			pointer-events: auto;
		}

		&.spray-panel {
			height: 25vh;
			transform: translateY(calc(-25vh));

			&.open {
				transform: translateY(0);
			}

			.dropdown-panel {
				height: 25vh;

				.dropdown-panel-content {
					display: flex;
					flex-direction: column;
				}
			}
		}

		.dropdown-panel {
			width: 100%;
			height: 33vh;
			flex: 0 0 auto;
			min-height: 0;
			background-color: #fff;
			border-bottom: 1px solid #eee;
			overflow: hidden;
			display: flex;
			flex-direction: column;
			pointer-events: auto;

			.dropdown-panel-content {
				width: 100%;
				flex: 1;
				padding: px2vw(20px);
				overflow: hidden;
				background-color: #fff;
			}

			.spray-grid {
				width: 100%;
				flex: 1;
				display: flex;
				flex-wrap: wrap;
				align-content: flex-start;
				gap: px2vw(16px);
				overflow-y: auto;
				padding: px2vw(60px) px2vw(10px) px2vw(10px);

				.spray-item {
					width: px2vw(140px);
					height: px2vw(140px);
					display: flex;
					flex-direction: row;
					border: 1px solid #ddd;
					border-radius: px2vw(8px);
					overflow: hidden;
					background-color: #fff;

					&.expanded {
						border-color: #5884f1;
						box-shadow: 0 0 px2vw(8px) rgba(88, 132, 241, 0.3);
					}

					.spray-half {
						flex: 1;
						display: flex;
						align-items: center;
						justify-content: center;
						padding: px2vw(8px);
						font-size: px2vw(20px);
						color: #333;
						writing-mode: vertical-rl;
						text-orientation: upright;
						letter-spacing: px2vw(4px);
						word-break: break-all;
					}

					.spray-left {
						background-color: #e8f4f8;
						border-right: 1px solid #ddd;
					}

					.spray-right {
						background-color: #fff;
					}
				}
			}

			.spray-expand-panel {
				width: 100%;
				height: px2vw(220px);
				margin-top: px2vw(16px);
				padding: px2vw(10px);
				background-color: #f9f9f9;
				border-radius: px2vw(8px);
				overflow: hidden;

				.spray-expand-title {
					font-size: px2vw(22px);
					color: #333;
					font-weight: bold;
					margin-bottom: px2vw(10px);
				}

				.employee-chart-scroll {
					height: calc(100% - #{px2vw(40px)});
				}
			}

			.employee-chart-scroll {
				width: 100%;
				height: 100%;
				overflow-x: auto;
				overflow-y: hidden;
				white-space: nowrap;
			}

			.employee-chart {
				height: 100%;
				display: inline-flex;
				align-items: flex-end;
				gap: px2vw(24px);
				padding: px2vw(10px);
				min-width: 100%;
				box-sizing: content-box;

				.employee-chart-column {
					flex: 0 0 auto;
					width: px2vw(52px);
					height: 87%;
					display: inline-flex;
					flex-direction: column;
					align-items: center;
					justify-content: flex-end;

					.employee-chart-bar {
						width: 100%;
						min-height: px2vw(40px);
						height: 100%;
						display: flex;
						align-items: center;
						justify-content: center;
						border-radius: px2vw(8px);
						writing-mode: vertical-rl;
						overflow: hidden;

						&.process-bar {
							background-color: #5884f1;
						}

						&.attendance-bar {
							writing-mode: horizontal-tb;
							flex-direction: column;
							justify-content: space-between;
							padding: px2vw(8px) 0;
						}

						.employee-chart-name {
							font-size: px2vw(20px);
							color: #fff;
							writing-mode: vertical-rl;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
							max-height: 100%;
							padding: px2vw(8px) 0;
							flex: 1;
							min-height: 0;
							display: flex;
							align-items: center;
							justify-content: center;
						}

						.attendance-btn {
							flex-shrink: 0;
							width: px2vw(36px);
							height: px2vw(36px);
							display: flex;
							align-items: center;
							justify-content: center;
							border-radius: 50%;
							font-size: px2vw(18px);
							font-weight: bold;
							color: #fff;
							margin: px2vw(8px) 0;

							&.attendance-btn-up {
								background-color: rgba(0, 0, 0, 0.3);
							}

							&.attendance-btn-down {
								background-color: rgba(0, 0, 0, 0.3);
							}
						}
					}
				}

				.employee-expand-panel {
					animation: panel-slide-in 0.25s ease;
					margin-left: px2vw(12px);
					margin-right: px2vw(12px);
					flex: 0 0 auto;
					width: px2vw(220px);
					height: 87%;
					display: flex;
					flex-direction: column;
					align-items: stretch;
					overflow-y: auto;
					gap: px2vw(8px);
					box-sizing: border-box;

					.expand-process-item {
						flex: 0 0 auto;
						width: 100%;
						min-height: px2vw(50px);
						display: flex;
						align-items: center;
						gap: px2vw(8px);
						padding: px2vw(8px) px2vw(12px);
						background-color: #f5f7fa;
						border-radius: px2vw(4px);
						font-size: px2vw(20px);
						color: #333;
						white-space: nowrap;

						&.selected {
							background-color: #5884f1;
							color: #fff;

							.expand-process-seq {
								color: #fff;
							}
						}

						.expand-process-seq {
							font-weight: bold;
							color: #5884f1;
							min-width: px2vw(28px);
							text-align: center;
							font-size: px2vw(22px);
						}

						.expand-process-name {
							flex: 1;
							white-space: nowrap;
							font-size: px2vw(20px);
						}

						.expand-process-delete {
							width: px2vw(36px);
							height: px2vw(36px);
							display: flex;
							align-items: center;
							justify-content: center;
							font-size: px2vw(24px);
							color: #e74c3c;
							margin-left: px2vw(8px);
						}
					}
				}

				.employee-chart-empty {
					padding: px2vw(40px) 0;
					text-align: center;
					width: 100%;

					text {
						font-size: px2vw(22px);
						color: #999;
					}
				}
			}
		}
	}

	.process-dropdown-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: transparent;
		z-index: 100;
		pointer-events: none;
	}

	.process-dropdown-wrapper {
		position: absolute;
		left: 0;
		right: 0;
		top: px2vw(70px);
		height: calc(33vh + #{px2vw(40px)});
		transform: translateY(calc(-33vh));
		transition: transform 0.3s ease;
		z-index: 102;
		display: flex;
		flex-direction: column;
		align-items: center;
		pointer-events: none;

		&.open {
			transform: translateY(33vh);
			pointer-events: auto;
		}

		.dropdown-panel {
			width: 100%;
			height: 33vh;
			flex: 0 0 auto;
			min-height: 0;
			background-color: #fff;
			border-bottom: 1px solid #eee;
			overflow: hidden;
			display: flex;
			flex-direction: column;
			pointer-events: auto;

			.dropdown-panel-content {
				width: 100%;
				flex: 1;
				padding: px2vw(20px);
				overflow: hidden;
				background-color: #fff;
			}

			.employee-chart-scroll {
				width: 100%;
				height: 100%;
				overflow-x: auto;
				overflow-y: hidden;
				white-space: nowrap;
			}

			.employee-chart {
				height: calc(100% - #{px2vw(30px)});
				display: inline-flex;
				align-items: flex-end;
				gap: px2vw(24px);
				padding: px2vw(30px) px2vw(10px) px2vw(10px);
				min-width: 100%;
				box-sizing: content-box;

				.employee-chart-column {
					flex: 0 0 auto;
					width: px2vw(52px);
					height: 100%;
					display: inline-flex;
					flex-direction: column;
					align-items: center;
					justify-content: flex-end;

					.employee-chart-bar {
							width: 100%;
							min-height: px2vw(40px);
							display: flex;
							align-items: center;
							justify-content: center;
							border-radius: px2vw(8px) px2vw(8px) 0 0;
							writing-mode: vertical-rl;
							overflow: hidden;

							&.process-bar {
								background-color: #f5f5f5;
								border: 1px solid #333;

								.employee-chart-name {
									color: #333;
								}
							}

							.employee-chart-name {
							font-size: px2vw(18px);
							color: #fff;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
							max-height: 100%;
							padding: px2vw(8px) 0;
						}
					}
				}

				.employee-chart-empty {
					padding: px2vw(40px) 0;
					text-align: center;
					width: 100%;

					text {
						font-size: px2vw(22px);
						color: #999;
					}
				}
			}
		}
	}

	.spray-process-dropdown-wrapper {
		position: absolute;
		left: 0;
		right: 0;
		top: px2vw(70px);
		height: calc(25vh + #{px2vw(40px)});
		transform: translateY(calc(-25vh));
		transition: transform 0.3s ease;
		z-index: 102;
		display: flex;
		flex-direction: column;
		align-items: center;
		pointer-events: none;

		&.open {
			transform: translateY(25vh);
			pointer-events: auto;
		}

		.dropdown-panel {
			width: 100%;
			height: 25vh;
			flex: 0 0 auto;
			min-height: 0;
			background-color: #fff;
			border-bottom: 1px solid #eee;
			overflow: hidden;
			display: flex;
			flex-direction: column;
			pointer-events: auto;

			.dropdown-panel-content {
				width: 100%;
				flex: 1;
				padding: px2vw(20px);
				overflow: hidden;
				background-color: #fff;
			}

			.employee-chart-scroll {
				width: 100%;
				height: 100%;
				overflow-x: auto;
				overflow-y: hidden;
				white-space: nowrap;
			}

			.employee-chart {
				height: calc(100% - #{px2vw(30px)});
				display: inline-flex;
				align-items: flex-end;
				gap: px2vw(24px);
				padding: px2vw(30px) px2vw(10px) px2vw(10px);
				min-width: 100%;
				box-sizing: content-box;

				.employee-chart-column {
					flex: 0 0 auto;
					width: px2vw(52px);
					height: 100%;
					display: inline-flex;
					flex-direction: column;
					align-items: center;
					justify-content: flex-end;

					.employee-chart-bar {
						width: 100%;
						min-height: px2vw(40px);
						display: flex;
						align-items: center;
						justify-content: center;
						border-radius: px2vw(8px) px2vw(8px) 0 0;
						writing-mode: vertical-rl;
						overflow: hidden;

						&.process-bar {
							background-color: #5884f1;
						}

						.employee-chart-name {
							font-size: px2vw(20px);
							color: #fff;
							writing-mode: vertical-rl;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
							max-height: 100%;
							padding: px2vw(8px) 0;
						}
					}
				}

				.employee-chart-empty {
					padding: px2vw(40px) 0;
					text-align: center;
					width: 100%;

					text {
						font-size: px2vw(22px);
						color: #999;
					}
				}
			}
		}
	}

	.main-content {
		flex: 1;
		display: flex;
		overflow: hidden;
		height: 0;

		.left-panel {
			width: px2vw(460px);
			background-color: #fff;
			border-right: 1px solid #eee;
			display: flex;
			flex-direction: column;
			flex-shrink: 0;
			position: relative;

			.panel-title {
				height: px2vw(60px);
				line-height: px2vw(60px);
				text-align: center;
				font-size: px2vw(30px);
				font-weight: bold;
				color: #333;
				background-color: #f5f7fa;
				border-bottom: 1px solid #eee;
				flex-shrink: 0;
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 0 px2vw(16px);

				.panel-refresh-btn {
					height: px2vw(40px);
					line-height: px2vw(40px);
					padding: 0 px2vw(18px);
					font-size: px2vw(24px);
					font-weight: normal;
					color: #333;
					background-color: #fff;
					border: px2vw(2px) solid #d9d9d9;
					border-radius: px2vw(10px);
					cursor: pointer;

					&:active {
						background-color: #5884f1;
						color: #fff;
						border-color: #5884f1;
					}
				}
			}

			.sync-select-switch {
				.switch-btn {
					height: px2vw(40px);
					line-height: px2vw(40px);
					padding: 0 px2vw(18px);
					font-size: px2vw(24px);
					font-weight: normal;
					color: #333;
					background-color: #fff;
					border: px2vw(2px) solid #d9d9d9;
					border-radius: px2vw(10px);
					transition: all 0.2s;
					white-space: nowrap;
				}

				.switch-on {
					background-color: #5884f1;
					color: #fff;
					border-color: #5884f1;
				}
			}

			.left-bottom-btns {
				height: px2vw(60px);
				flex-shrink: 0;
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: space-around;
				padding: 0 px2vw(10px);
				border-top: 1px solid #eee;
				background-color: #f5f7fa;

				.left-btn {
					margin: 0 px2vw(8px);
					height: px2vw(44px);
					line-height: px2vw(44px);
					border-radius: px2vw(6px);
					text-align: center;
					font-size: px2vw(22px);
					color: #fff;

					// 两个字按钮收窄，四个字按钮加宽
					&.left-btn-add,
					&.left-btn-confirm {
						width: px2vw(150px);
					}

					&.left-btn-delay,
					&.left-btn-remove {
						width: px2vw(90px);
					}

					&.left-btn-add {
						background-color: #3498db;
					}

					&.left-btn-delay {
						background-color: #f39c12;
					}

					&.left-btn-remove {
						background-color: #e74c3c;
					}

					&.left-btn-confirm {
						background-color: #27ae60;
					}
				}
			}

			.product-list {
				flex: 1;
				overflow: hidden;
				background-color: #f8f9fa;

				.order-group {
					margin: px2vw(6px) px2vw(12px);
					background-color: #fff;
					border-radius: px2vw(12px);
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
					overflow: hidden;

					.order-header {
						display: flex;
						flex-direction: row;
						align-items: center;
						padding: px2vw(10px) px2vw(16px);
						background-color: #fff;
						cursor: pointer;

						&:active {
							background-color: #f8f9fa;
						}

						.order-index {
							padding: px2vw(4px) px2vw(10px);
							background-color: #e9ecef;
							border-radius: px2vw(6px);
							font-size: px2vw(18px);
							color: #333;
							font-weight: bold;
							margin-right: px2vw(12px);
							flex-shrink: 0;
						}

						.order-header-main {
							flex: 1;
							display: flex;
							flex-direction: row;
							align-items: center;
							min-width: 0;
							overflow: hidden;
						}

						.order-no {
							font-size: px2vw(22px);
							color: #333;
							font-weight: bold;
							min-width: 0;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
						}

						.order-delivery-date {
							font-size: px2vw(20px);
							color: #888;
							margin-left: px2vw(12px);
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
							flex-shrink: 0;
						}

						.order-count {
							margin-left: px2vw(8px);
							font-size: px2vw(20px);
							color: #888;
							font-weight: normal;
							flex-shrink: 0;
						}
					}

					.order-products {
						border-top: 1px solid #f1f3f5;
						padding: px2vw(2px) 0;
					}
				}

				.product-item {
					padding: px2vw(8px) px2vw(16px);
					display: flex;
					flex-direction: row;
					align-items: center;
					flex-wrap: wrap;
					transition: background-color 0.15s ease;

					&:active {
						background-color: #f8f9fa;
					}

					&.product-active {
						background-color: #e7f5ff;
						border-left: px2vw(4px) solid #339af0;
					}

					.product-index {
						width: px2vw(32px);
						height: px2vw(32px);
						line-height: px2vw(32px);
						text-align: center;
						background-color: #e9ecef;
						color: #333;
						border-radius: 50%;
						font-size: px2vw(16px);
						font-weight: bold;
						flex-shrink: 0;
						margin: 0 px2vw(4px);
					}

					.product-info {
						flex: 1;
						display: flex;
						flex-direction: row;
						align-items: center;
						margin-left: px2vw(12px);
						min-width: 0;
					}

					.product-name {
						font-size: px2vw(24px);
						color: #333;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						min-width: 0;
					}

					.product-delivery-date {
						font-size: px2vw(24px);
						color: #888;
						margin-left: px2vw(12px);
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						flex-shrink: 0;
					}

					.product-btns {
						display: flex;
						flex-direction: row;
						align-items: center;
						flex-shrink: 0;
						gap: px2vw(8px);
					}

					.expand-btn {
						width: px2vw(40px);
						height: px2vw(40px);
						line-height: px2vw(40px);
						text-align: center;
						border-radius: 50%;
						font-size: px2vw(22px);
						color: #666;
						background-color: #f1f3f5;
						flex-shrink: 0;
						transition: all 0.15s ease;

						&:active {
							background-color: #dee2e6;
						}
					}

					.dispatch-icon {
						width: px2vw(32px);
						height: px2vw(32px);
						border-radius: 50%;
						background-color: #5884f1;
						display: flex;
						flex-direction: column;
						justify-content: center;
						align-items: center;
						gap: px2vw(3px);
						flex-shrink: 0;
						transition: all 0.15s ease;

						&:active {
							background-color: #4a73d8;
						}

						.dispatch-icon-line {
							width: px2vw(14px);
							height: px2vw(3px);
							background-color: #fff;
							border-radius: px2vw(2px);
						}
					}

					.product-spec {
						width: 100%;
						background-color: #f1f3f5;
						border-radius: px2vw(8px);
						padding: px2vw(8px) px2vw(12px);
						font-size: px2vw(16px);
						color: #666;
						margin-top: px2vw(8px);
						margin-left: px2vw(50px);

						.spec-row {
							display: flex;
							flex-direction: row;
							padding: px2vw(3px) 0;
							border-bottom: 1px solid #e0e0e0;

							&:last-child {
								border-bottom: none;
							}

							.spec-value {
								flex: 1;
								min-width: 0;
								word-break: break-all;
								color: #333;
								font-size: px2vw(22px);
							}
						}
					}
				}
			}
			.empty-wrap {
				position: absolute;
				top: px2vw(60px);
				left: 0;
				right: 0;
				bottom: px2vw(60px);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				padding: px2vw(40px);
				background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
				z-index: 1;

				.empty-text {
					font-size: px2vw(28px);
					color: #4a4a4a;
					font-weight: 600;
					margin-bottom: px2vw(12px);
					display: block;
				}

				.empty-tip {
					font-size: px2vw(20px);
					color: #8c8c8c;
					display: block;
				}
			}
		}

		.right-panel {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;

			&.employee-expanded {
				.right-panel-top {
					flex: 0 0 0;
					border-bottom: none;
				}

				.right-panel-bottom {
					flex: 1;
					height: auto;
				}
			}

			.right-panel-top {
				flex: 1;
				overflow: hidden;
				border-bottom: 1px solid #eee;
			}

			.right-panel-bottom {
				height: px2vw(210px);
				overflow: hidden;
				display: flex;
				flex-direction: row;
				transition: height 0.3s ease;

				.employee-expand-bar {
					width: px2vw(40px);
					height: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
					background-color: #f0f0f0;
					border-right: 1px solid #eee;
					flex-shrink: 0;

					.employee-expand-icon {
						font-size: px2vw(24px);
						color: #666;
					}
				}

				.employee-summary {
					width: px2vw(140px);
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: center;
					padding: px2vw(10px);
					border-right: 1px solid #eee;
					background-color: #f9f9f9;
					position: relative;

					.summary-item {
						display: flex;
						flex-direction: row;
						align-items: center;
						justify-content: space-between;
						margin-bottom: px2vw(8px);

						.summary-label {
							font-size: px2vw(20px);
							color: #666;
							white-space: nowrap;
						}

						.summary-value {
							font-size: px2vw(22px);
							color: #333;
							font-weight: bold;
							white-space: nowrap;
						}
					}
				}

				.employee-chart-scroll {
				flex: 1;
				height: 100%;
				overflow-x: auto;
				overflow-y: hidden;
				white-space: nowrap;
			}
			}

			.process-list {
				height: 100%;

				.process-table-grid {
					display: grid;
					width: fit-content;
					grid-template-rows: repeat(10, auto);
					margin: px2vw(10px);
					border: 1px solid #999;

					// 第一栏：订单编号 + 产品名称
					.grid-order-info {
						grid-row: 1 / span 10;
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: flex-start;
						background-color: #f5f5f5;
						padding: px2vw(10px) px2vw(4px);
						border-right: 1px solid #999;
						position: sticky;
						left: 0;
						z-index: 11;

						.grid-orderno {
							writing-mode: vertical-rl;
							text-orientation: upright;
							font-size: px2vw(24px);
							color: #333;
							margin-bottom: px2vw(10px);
							letter-spacing: px2vw(-2px);
						}

						.grid-product-name-v {
							writing-mode: vertical-rl;
							text-orientation: upright;
							font-size: px2vw(24px);
							color: #333;
							letter-spacing: px2vw(-2px);
							word-break: break-all;
							white-space: normal;
						}
					}

					// 第二栏：按钮
					.grid-product-name {
						grid-row: 1 / span 10;
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						align-items: center;
						background-color: #f0f0f0;
						padding: px2vw(8px) px2vw(4px);
						border-right: 1px solid #999;
						position: sticky;
						left: px2vw(50px);
						z-index: 10;

						.grid-product-action {
							padding: px2vw(8px) px2vw(4px);
							background-color: #999;
							color: #fff;
							border-radius: px2vw(6px);
							font-size: px2vw(24px);
							writing-mode: vertical-rl;
							text-orientation: upright;
							letter-spacing: px2vw(2px);
							display: flex;
							align-items: center;
							justify-content: center;
						}

						.grid-product-refresh {
							padding: px2vw(8px) px2vw(4px);
							background-color: #f39c12;
							color: #fff;
							border-radius: px2vw(6px);
							font-size: px2vw(24px);
							writing-mode: vertical-rl;
							text-orientation: upright;
							letter-spacing: px2vw(2px);
							display: flex;
							align-items: center;
							justify-content: center;
						}

						.grid-product-confirm {
							padding: px2vw(8px) px2vw(4px);
							background-color: #27ae60;
							color: #fff;
							border-radius: px2vw(6px);
							font-size: px2vw(24px);
							writing-mode: vertical-rl;
							text-orientation: upright;
							letter-spacing: px2vw(2px);
							display: flex;
							align-items: center;
							justify-content: center;
						}

						.grid-product-dispatch {
							padding: px2vw(8px) px2vw(4px);
							background-color: #5884f1;
							color: #fff;
							border-radius: px2vw(6px);
							font-size: px2vw(24px);
							writing-mode: vertical-rl;
							text-orientation: upright;
							letter-spacing: px2vw(2px);
							display: flex;
							align-items: center;
							justify-content: center;
						}
					}

				.grid-label-cell {
					background-color: #f0f0f0;
						padding: px2vw(9px) px2vw(5px);
						text-align: center;
						font-size: px2vw(22px);
						color: #333;
						border-bottom: 1px solid #999;
						border-right: 1px solid #999;
						white-space: nowrap;

						&:nth-last-child(-n+10) {
							border-right: none;
						}
					}

					.grid-cell {
						padding: px2vw(9px) px2vw(5px);
						text-align: center;
						font-size: px2vw(22px);
						color: #333;
						border-bottom: 1px solid #999;
						border-right: 1px solid #999;
						display: flex;
						align-items: center;
						justify-content: center;
						white-space: nowrap;

						&.selected-column {
							background-color: #d4edda;
						}

						&.associated-column {
							background-color: #fff;
						}

						&.disabled-column {
							background-color: #fafafa;
							color: #999;
						}

						&.employee-cell {
							white-space: normal;
							word-break: break-all;
							min-width: px2vw(80px);
						}

						// 工序勾选框：自定义实现，完全受 selectedProcessIds 控制
						.grid-checkbox {
							width: px2vw(26px);
							height: px2vw(26px);
							border: px2vw(2px) solid #ccc;
							border-radius: px2vw(4px);
							background-color: #fff;
							display: flex;
							align-items: center;
							justify-content: center;
							box-sizing: border-box;
							cursor: pointer;

							&.checked {
								background-color: #3498db;
								border-color: #3498db;
							}

							.grid-checkbox-icon {
								font-size: px2vw(16px);
								color: #fff;
								line-height: 1;
							}
						}

						&:nth-last-child(-n+10) {
							border-right: none;
						}
					}
				}

			}

			.employee-dispatch-table {
				display: grid;
				width: fit-content;
				margin: px2vw(10px);
				border: 1px solid #999;
				background-color: #fff;

				.table-header {
					padding: px2vw(10px) px2vw(12px);
					background-color: #f0f0f0;
					border-bottom: 1px solid #999;
					border-right: 1px solid #999;
					font-size: px2vw(22px);
					color: #333;
					text-align: center;
					display: flex;
					align-items: center;
					justify-content: center;
					white-space: nowrap;
				}

				.table-cell {
						padding: px2vw(10px) px2vw(12px);
						border-bottom: 1px solid #999;
						border-right: 1px solid #999;
						font-size: px2vw(20px);
						color: #333;
						text-align: center;
						display: flex;
						align-items: center;
						justify-content: center;
						white-space: nowrap;

						&.record-group-0 { background-color: #e8f4f8; }
						&.record-group-1 { background-color: #f2f0e6; }
						&.record-group-2 { background-color: #f9f0f4; }
						&.record-group-3 { background-color: #eaf6ea; }
						&.record-group-4 { background-color: #fff6e6; }

						// 请假员工整行红色背景
						&.cell-attendance-leave {
							background-color: #f44336 !important;
							color: #fff;
						}

						// 新手员工整行黄色背景（请假红色优先级更高，rowClass 计算时已优先输出请假类）
						&.cell-is-new {
							background-color: #fff9c4 !important;
						}
					}
			}

			.employee-chart {
				height: 100%;
				display: inline-flex;
				flex-direction: row;
				align-items: flex-end;
				justify-content: flex-start;
				padding: px2vw(10px) px2vw(20px);

				.employee-column {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: flex-end;
					height: 100%;
					flex: 1;
					min-width: px2vw(85px);

					.emp-wage {
						font-size: px2vw(24px);
						color: #333;
						margin-bottom: px2vw(8px);
					}

					.emp-bar-container {
						width: px2vw(45px);
						flex: 1;
						background-color: #e0e0e0;
						border-radius: px2vw(4px);
						position: relative;
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: flex-end;
						overflow: hidden;

						.emp-bar {
							width: 100%;
							display: flex;
							align-items: center;
							justify-content: center;
							border-radius: px2vw(4px);

							.emp-hours {
								font-size: px2vw(20px);
								color: #333;
							}
						}

						.emp-status {
							writing-mode: vertical-rl;
							text-orientation: upright;
							letter-spacing: px2vw(6px);
							font-size: px2vw(32px);
							font-weight: bold;
						}

						.emp-status-leave {
							color: #e74c3c;
						}

						.emp-status-new {
							color: #27ae60;
						}
					}

					.emp-name {
						font-size: px2vw(22px);
						color: #333;
						margin-top: px2vw(8px);
						text-align: center;
						white-space: nowrap;
					}
				}
			}

			.empty-wrap {
				padding: px2vw(85px) 0;
				text-align: center;

				.empty-text {
					font-size: px2vw(24px);
					color: #aaa;
				}
			}
		}

	}
}

.employee-task-popover {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1000;

	.employee-task-content {
		position: absolute;
		width: 320px;
		min-height: 120px;
		background-color: #fff;
		border-radius: px2vw(12px);
		padding: px2vw(20px);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

		.employee-task-arrow {
			position: absolute;
			bottom: -16px;
			width: 0;
			height: 0;
			border-left: 16px solid transparent;
			border-right: 16px solid transparent;
			border-top: 16px solid #fff;
			filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.2));
		}

		.employee-task-list {
			.employee-task-header {
				display: flex;
				flex-direction: row;
				padding: px2vw(10px) 0;
				border-bottom: 1px solid #eee;

				.task-header-cell {
					flex: 1;
					font-size: px2vw(20px);
					color: #666;
					text-align: center;

					&.task-header-cell-op {
						flex: 0.6;
					}
				}
			}

			.employee-task-item {
				display: flex;
				flex-direction: row;
				padding: px2vw(12px) 0;
				border-bottom: 1px solid #f0f0f0;

				.task-cell {
					flex: 1;
					font-size: px2vw(20px);
					color: #333;
					text-align: center;

					&.task-cell-op {
						flex: 0.6;
						display: flex;
						align-items: center;
						justify-content: center;
					}

					.task-delete-btn {
						font-size: px2vw(18px);
						color: #ff4d4f;
						padding: px2vw(4px) px2vw(12px);
						border: 1px solid #ff4d4f;
						border-radius: px2vw(6px);
					}
				}
			}

			.employee-task-empty {
				padding: px2vw(30px) 0;
				text-align: center;
				font-size: px2vw(22px);
				color: #999;
			}
		}
	}
}

.dispatch-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;

	.dispatch-modal-content {
		width: px2vw(600px);
		background-color: #fff;
		border-radius: px2vw(16px);
		padding: px2vw(40px);
		transform: scale(1.15);
	}

	.dispatch-modal-title {
		font-size: px2vw(32px);
		font-weight: bold;
		text-align: center;
		margin-bottom: px2vw(30px);
		color: #333;
	}

	.dispatch-modal-product-info {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: px2vw(16px);
		margin-bottom: px2vw(24px);
		padding: px2vw(16px);
		background-color: #f8f9ff;
		border-radius: px2vw(12px);

		.product-info-order {
			font-size: px2vw(24px);
			color: #5884f1;
			font-weight: bold;
		}

		.product-info-name {
			font-size: px2vw(24px);
			color: #333;
		}
	}

	.dispatch-modal-body {
		margin-bottom: px2vw(30px);

		.dispatch-grid {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr;
			grid-template-rows: 1fr 1fr;
			border: 1px solid #ddd;
			border-radius: px2vw(8px);
			overflow: hidden;

			.dispatch-grid-cell {
				padding: px2vw(20px);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				border-right: 1px solid #eee;
				border-bottom: 1px solid #eee;

				&:nth-child(3n) {
					border-right: none;
				}

				&:nth-child(4),
				&:nth-child(5),
				&:nth-child(6) {
					border-bottom: none;
				}

				.grid-cell-label {
					font-size: px2vw(22px);
					color: #666;
					margin-bottom: px2vw(8px);
				}

				.grid-cell-value {
					font-size: px2vw(28px);
					color: #333;
					font-weight: bold;
				}

				.dispatch-input {
					width: 100%;
					height: px2vw(50px);
					border: 1px solid #ddd;
					border-radius: px2vw(8px);
					padding: 0 px2vw(10px);
					font-size: px2vw(24px);
					box-sizing: border-box;
					text-align: center;
				}
			}
		}
	}

	.dispatch-modal-buttons {
		display: flex;
		gap: px2vw(20px);

		.dispatch-btn-cancel,
		.dispatch-btn-confirm {
			flex: 1;
			height: px2vw(80px);
			line-height: px2vw(80px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(28px);
		}

		.dispatch-btn-cancel {
			background-color: #f5f7fa;
			color: #666;
		}

		.dispatch-btn-confirm {
			background-color: #3498db;
			color: #fff;
		}
	}
}

.confirm-dispatch-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;

	.confirm-dispatch-content {
		width: px2vw(600px);
		background-color: #fff;
		border-radius: px2vw(16px);
		padding: px2vw(40px);
	}

	.confirm-dispatch-title {
		font-size: px2vw(32px);
		font-weight: bold;
		text-align: center;
		margin-bottom: px2vw(30px);
	}

	.confirm-dispatch-body {
		margin-bottom: px2vw(30px);

		.confirm-dispatch-tip {
			font-size: px2vw(28px);
			color: #333;
			line-height: px2vw(40px);
		}
	}

	.confirm-dispatch-buttons {
		display: flex;
		gap: px2vw(20px);

		.confirm-dispatch-btn-cancel,
		.confirm-dispatch-btn-confirm {
			flex: 1;
			height: px2vw(80px);
			line-height: px2vw(80px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(28px);
		}

		.confirm-dispatch-btn-cancel {
			background-color: #f5f7fa;
			color: #666;
		}

		.confirm-dispatch-btn-confirm {
			background-color: #3498db;
			color: #fff;
		}
	}
}

// 选择订单模态框
// 添加产品模态框
.add-product-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;

	.add-product-container {
		display: flex;
		gap: px2vw(20px);
	}

	.add-product-content {
		width: px2vw(800px);
		height: px2vw(800px);
		background-color: #fff;
		border-radius: px2vw(16px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	// 右侧选中清单
	.selected-product-list {
		width: px2vw(400px);
		height: px2vw(800px);
		background-color: #fff;
		border-radius: px2vw(16px);
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.selected-list-header {
			height: px2vw(88px);
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 px2vw(24px);
			background-color: #5884f1;
			flex-shrink: 0;

			.selected-list-title {
				font-size: px2vw(28px);
				color: #fff;
				font-weight: bold;
			}

			.selected-list-count {
				font-size: px2vw(22px);
				color: rgba(255, 255, 255, 0.8);
			}
		}

		.selected-list-content {
			flex: 1;
			min-height: 0;
			padding: px2vw(12px);

			.selected-list-item {
				display: flex;
				flex-direction: row;
				align-items: center;
				padding: px2vw(12px);
				background-color: #f5f7fa;
				border-radius: px2vw(8px);
				margin-bottom: px2vw(8px);

				&:last-child {
					margin-bottom: 0;
				}

				.selected-order-code {
					font-size: px2vw(26px);
					color: #666;
					margin-right: px2vw(8px);
					flex-shrink: 0;
				}

				.selected-product-name {
					font-size: px2vw(24px);
					color: #333;
					font-weight: bold;
					flex: 1;
					min-width: 0;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
			}

			.selected-list-empty {
				text-align: center;
				color: #999;
				font-size: px2vw(22px);
				padding: px2vw(40px) 0;
			}
		}
	}

	.add-product-header {
		height: px2vw(88px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 px2vw(24px);
		background-color: #5884f1;
		flex-shrink: 0;

		.add-product-title {
			font-size: px2vw(30px);
			color: #fff;
			font-weight: bold;
		}

		.add-product-close {
			font-size: px2vw(44px);
			color: #fff;
			line-height: 1;
		}
	}

	.add-product-search {
		padding: px2vw(12px) px2vw(16px);
		flex-shrink: 0;
		display: flex;
		gap: px2vw(12px);

		.add-product-input {
			flex: 1;
			height: px2vw(60px);
			background-color: #f5f7fa;
			border-radius: px2vw(8px);
			padding: 0 px2vw(16px);
			font-size: px2vw(24px);
		}
	}

	.add-product-list {
		flex: 1;
		min-height: 0;
		padding: 0 px2vw(16px);

		.add-product-loading,
		.add-product-empty {
			text-align: center;
			color: #999;
			font-size: px2vw(24px);
			padding: px2vw(40px) 0;
		}
	}

	// 订单分组
	.order-group {
		margin-bottom: px2vw(8px);
	}

	// 订单头部（可点击展开）
	.order-group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: px2vw(14px) px2vw(16px);
		background-color: #e8f4fc;
		border-radius: px2vw(10px);
		border-left: px2vw(4px) solid #5884f1;

		&.expanded {
			background-color: #d4e9fc;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}

		.order-header-left {
			display: flex;
			align-items: center;
			gap: px2vw(8px);

			.order-expand-icon {
				font-size: px2vw(20px);
				color: #5884f1;
			}

			.order-code {
				font-size: px2vw(26px);
				color: #333;
				font-weight: bold;
			}
		}

		.order-header-right {
			.order-product-count {
				font-size: px2vw(22px);
				color: #2755f1;
			}
		}
	}

	// 产品列表
	.order-products {
		background-color: #f9f9f9;
		border-bottom-left-radius: px2vw(10px);
		border-bottom-right-radius: px2vw(10px);
		padding: px2vw(8px);
	}

	// 产品选择项
	.product-select-item {
		background-color: #fff;
		border-radius: px2vw(8px);
		margin-bottom: px2vw(6px);

		&:last-child {
			margin-bottom: 0;
		}

		&.selected {
			background-color: #e8f4fc;
			box-shadow: inset 0 0 0 px2vw(2px) rgba(88, 132, 241, 0.5);
		}

		.product-main {
			display: flex;
			align-items: center;
			padding: px2vw(14px) px2vw(16px);
		}

		.product-checkbox {
			width: px2vw(32px);
			height: px2vw(32px);
			border: px2vw(2px) solid #ccc;
			border-radius: px2vw(6px);
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: px2vw(12px);
			flex-shrink: 0;

			.checkbox-icon {
				font-size: px2vw(20px);
				color: #5884f1;
			}
		}

		&.selected .product-checkbox {
			background-color: #e8f4fc;
			border-color: #5884f1;
		}

		.product-info {
			flex: 1;
			min-width: 0;
			display: flex;
			align-items: center;
			justify-content: space-between;

			.product-name {
				font-size: px2vw(26px);
				color: #333;
				font-weight: bold;
				flex-shrink: 0;
			}

			.product-order-count {
				font-size: px2vw(26px);
				color: #666;
				flex: 1;
				text-align: center;
				white-space: nowrap;
			}

			.product-delivery {
				font-size: px2vw(26px);
				color: #e67e22;
				flex: 1;
				text-align: center;
			}

			.product-spec-btn {
				padding: px2vw(4px) px2vw(12px);
				background-color: #e8eefc;
				border: px2vw(1px) solid #b8c8f5;
				border-radius: px2vw(4px);
				font-size: px2vw(20px);
				color: #2755f1;
				flex-shrink: 0;
			}
		}

		.product-spec-container {
			padding: px2vw(8px) px2vw(12px);
			margin: 0 px2vw(16px) px2vw(12px) px2vw(68px);
			background-color: #f5f5f5;
			border-radius: px2vw(8px);

			.spec-row {
				display: flex;
				flex-direction: row;
				padding: px2vw(3px) 0;
				border-bottom: 1px solid #e0e0e0;

				&:last-child {
					border-bottom: none;
				}

				.spec-value {
					flex: 1;
					min-width: 0;
					word-break: break-all;
					color: #333;
					font-size: px2vw(22px);
				}
			}
		}
	}

	.add-product-footer {
		height: px2vw(80px);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0 px2vw(24px);
		border-top: 1px solid #eee;
		flex-shrink: 0;
		gap: px2vw(16px);

		.selected-count {
			flex: 1;
			font-size: px2vw(24px);
			color: #666;
		}

		.add-product-btn-cancel,
		.add-product-btn-confirm {
			min-width: px2vw(160px);
			height: px2vw(56px);
			line-height: px2vw(56px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(26px);
			background-color: #ccc;
			color: #fff;
			transition: all 0.2s;

			&.btn-active {
				background-color: #28a745;
			}

			&.btn-active:active {
				opacity: 0.8;
				transform: scale(0.98);
			}
		}

		.add-product-btn-cancel {
			background-color: #f5f7fa;
			color: #666;
		}
	}
}

.edit-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;

	.edit-modal-content {
		width: px2vw(1000px);
		max-height: px2vw(900px);
		background-color: #fff;
		border-radius: px2vw(16px);
		padding: px2vw(40px);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.edit-modal-title {
		font-size: px2vw(32px);
		font-weight: bold;
		text-align: center;
		margin-bottom: px2vw(30px);
		flex-shrink: 0;
	}

	.edit-modal-body {
		flex: 1;
		display: flex;
		gap: px2vw(30px);
		overflow: hidden;
	}

	.edit-form {
		flex: 1;
		overflow-y: auto;
	}

	.edit-row {
		display: flex;
		align-items: center;
		margin-bottom: px2vw(20px);

		.edit-label {
			width: px2vw(160px);
			font-size: px2vw(26px);
			color: #666;
			flex-shrink: 0;
			text-align: right;
			padding-right: px2vw(20px);
			box-sizing: border-box;
		}

		.edit-value {
			flex: 1;
			font-size: px2vw(26px);
			color: #333;
		}

		.edit-date-picker {
			flex: 1;
			height: px2vw(60px);
			border: 1px solid #ddd;
			border-radius: px2vw(8px);
			padding: 0 px2vw(16px);
			box-sizing: border-box;
			display: flex;
			align-items: center;
			justify-content: space-between;
			background-color: #fafafa;

			.edit-date-text {
				font-size: px2vw(26px);
				color: #333;
			}

			.edit-date-arrow {
				font-size: px2vw(20px);
				color: #999;
			}
		}

		.edit-input {
					flex: 1;
					height: px2vw(60px);
					border: 1px solid #ddd;
					border-radius: px2vw(8px);
					padding: 0 px2vw(16px);
					font-size: px2vw(26px);
					box-sizing: border-box;
				}

				.edit-employee-input {
					flex: 1;
					height: px2vw(60px);
					border: 1px solid #ddd;
					border-radius: px2vw(8px);
					padding: 0 px2vw(16px);
					font-size: px2vw(26px);
					box-sizing: border-box;
					display: flex;
					align-items: center;
					justify-content: space-between;
					background-color: #fafafa;

					.edit-input-text {
						color: #333;
					}

					.edit-input-arrow {
						font-size: px2vw(20px);
						color: #999;
					}
				}

				.edit-employee-tags {
					flex: 1;
					display: flex;
					flex-wrap: wrap;
					gap: px2vw(10px);
					align-items: center;
				}

				.employee-tag {
					display: inline-flex;
					align-items: center;
					height: px2vw(48px);
					padding: 0 px2vw(18px);
					background-color: #e8f4ff;
					border: 1px solid #3498db;
					border-radius: px2vw(24px);
					font-size: px2vw(22px);
					color: #3498db;
					font-weight: 500;
				}

				.edit-employee-add-btn {
					flex-shrink: 0;
					width: px2vw(80px);
					height: px2vw(48px);
					margin-left: px2vw(12px);
					background-color: #3498db;
					border-radius: px2vw(8px);
					display: flex;
					align-items: center;
					justify-content: center;

					.add-btn-text {
						font-size: px2vw(22px);
						color: #fff;
						font-weight: 600;
					}
				}
			}

			.edit-modal-buttons {
		display: flex;
		gap: px2vw(20px);
		margin-top: px2vw(30px);
		flex-shrink: 0;

		.edit-btn-cancel,
		.edit-btn-confirm {
			flex: 1;
			height: px2vw(80px);
			line-height: px2vw(80px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(28px);
		}

		.edit-btn-cancel {
			background-color: #f5f7fa;
			color: #666;
		}

		.edit-btn-confirm {
			background-color: #3498db;
			color: #fff;
		}
	}

	.edit-employee-list {
		width: px2vw(350px);
		flex-shrink: 0;
		border: 1px solid #eee;
		border-radius: px2vw(8px);
		display: flex;
		flex-direction: column;
		overflow: hidden;

		.edit-employee-header {
			height: px2vw(60px);
			line-height: px2vw(60px);
			text-align: center;
			background-color: #f5f7fa;
			border-bottom: 1px solid #eee;
			flex-shrink: 0;

			.edit-employee-title {
				font-size: px2vw(26px);
				font-weight: bold;
				color: #333;
			}
		}

		.edit-employee-scroll {
			flex: 1;
			overflow-y: auto;
			max-height: px2vw(600px);

			.edit-employee-item {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				padding: px2vw(20px);
				border-bottom: 1px solid #f0f0f0;

				&.active {
					background-color: #e8f4ff;
				}

				.edit-employee-name {
					font-size: px2vw(26px);
					color: #333;
					font-weight: 600;
					margin-bottom: px2vw(8px);
				}

				.edit-employee-position {
					font-size: px2vw(22px);
					color: #666;
					margin-bottom: px2vw(4px);
				}

				.edit-employee-hours {
					font-size: px2vw(22px);
					color: #999;
				}
			}

			.edit-employee-empty {
				padding: px2vw(60px) 0;
				text-align: center;

				text {
					font-size: px2vw(24px);
					color: #999;
				}
			}
		}
	}
}

.employee-modal {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	width: px2vw(440px);
	background-color: #fff;
	box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
	z-index: 1003;
	transform: translateX(100%);
	transition: transform 0.3s ease;

	&.show {
		transform: translateX(0);
	}

	.employee-modal-content {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.employee-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: px2vw(20px);
		border-bottom: 1px solid #eee;
		flex-shrink: 0;

		.employee-modal-title {
			font-size: px2vw(22px);
			font-weight: bold;
			color: #333;
		}

		.header-controls {
			display: flex;
			align-items: center;
			gap: px2vw(16px);
		}

		.employee-type-switch {
			display: flex;
			background-color: #f0f0f0;
			border-radius: px2vw(8px);
			overflow: hidden;
			gap: px2vw(4px);
			padding: px2vw(4px);

			.switch-btn {
				padding: px2vw(5px) px2vw(13px);
				font-size: px2vw(24px);
				color: #666;
				background-color: transparent;
				border-radius: px2vw(6px);

				&.active {
					color: #fff;
					background-color: #1890ff;
				}
			}
		}

		.employee-modal-close {
			font-size: px2vw(40px);
			color: #999;
			line-height: 1;
		}

		.workshop-picker-wrap {
			position: relative;
		}

		.workshop-picker {
			display: flex;
			align-items: center;
			padding: px2vw(8px) px2vw(16px);
			background-color: #f5f5f5;
			border-radius: px2vw(8px);
			font-size: px2vw(24px);
			color: #666;

			.picker-arrow {
				margin-left: px2vw(8px);
				font-size: px2vw(20px);
				color: #999;
			}
		}

		.workshop-dropdown {
			position: absolute;
			top: 100%;
			left: 0;
			margin-top: px2vw(8px);
			background-color: #fff;
			border: 1px solid #eee;
			border-radius: px2vw(8px);
			box-shadow: 0 px2vw(8px) px2vw(16px) rgba(0, 0, 0, 0.1);
			z-index: 1010;

			.workshop-dropdown-item {
				padding: px2vw(16px) px2vw(24px);
				font-size: px2vw(24px);
				color: #666;
				white-space: nowrap;

				&.active {
					color: #007aff;
					background-color: #f0f8ff;
				}

				&:active {
					background-color: #f5f5f5;
				}
			}
		}
	}

	.employee-modal-list {
		flex: 1;
		overflow-y: auto;
		padding: px2vw(16px);

		.employee-modal-item {
			display: flex;
			flex-direction: row;
			align-items: flex-start;
			flex-wrap: wrap;
			padding: px2vw(16px) px2vw(16px);
			border-bottom: 1px solid #d9d9d9;
			cursor: pointer;

			&.active {
				background-color: #e8f4ff;
			}
		}

		.employee-modal-check {
			width: px2vw(34px);
			height: px2vw(34px);
			border: 2px solid #ddd;
			border-radius: px2vw(6px);
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			margin-right: px2vw(12px);
			margin-top: px2vw(2px);

			.check-icon {
				font-size: px2vw(22px);
				color: #3498db;
				font-weight: bold;
			}
		}

		&.active .employee-modal-check {
			border-color: #3498db;
			background-color: #3498db;

			.check-icon {
				color: #fff;
			}
		}

		.employee-modal-info {
			flex: 1;
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			overflow: hidden;
			min-width: 0;
		}

		.employee-modal-info-main {
			display: flex;
			flex-direction: row;
			align-items: center;
			flex: 1;
			min-width: 0;
			margin-right: px2vw(16px);
		}

		.employee-modal-info-extra {
			display: flex;
			flex-direction: row;
			align-items: center;
			flex-shrink: 0;
		}

		.employee-modal-name {
			font-size: px2vw(38px);
			line-height: 1.2;
			color: #333;
			margin-right: px2vw(12px);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			flex-shrink: 0;
		}

		.employee-type-tag {
			font-size: px2vw(16px);
			padding: px2vw(2px) px2vw(8px);
			border-radius: px2vw(4px);
			flex-shrink: 0;
			margin-right: px2vw(10px);

			&.is-new {
				color: #fff;
				background-color: #52c41a;
			}

			&.is-old {
				color: #fff;
				background-color: #1890ff;
			}

			&.is-temp {
				color: #fff;
				background-color: #fa8c16;
			}
		}

		.employee-section-title {
			font-size: px2vw(24px);
			font-weight: bold;
			color: #333;
			padding: px2vw(16px) px2vw(16px) px2vw(8px);
			background-color: #fafafa;
		}

		.employee-modal-item-temp {
			background-color: #fffbf0;
		}

		.employee-modal-hours {
			font-size: px2vw(28px);
			color: #f1c40f;
			margin-right: px2vw(16px);
		}

		.employee-modal-wage {
			font-size: px2vw(28px);
			color: #27ae60;
		}

		.employee-modal-empty {
			padding: px2vw(80px) 0;
			text-align: center;

			text {
				font-size: px2vw(24px);
				color: #999;
			}

			// 加载中：旋转加载圈 + 文案
			.empty-loading-text {
				display: inline-flex;
				align-items: center;

				.empty-spinner {
					width: px2vw(28px);
					height: px2vw(28px);
					border: px2vw(3px) solid #e6e6e6;
					border-top-color: #3498db;
					border-radius: 50%;
					margin-right: px2vw(12px);
					animation: empty-spin 0.8s linear infinite;
				}
			}
		}

		@keyframes empty-spin {
			to {
				transform: rotate(360deg);
			}
		}
	}

	.employee-modal-footer {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: px2vw(20px);
		padding: px2vw(20px);
		border-top: 1px solid #eee;
		flex-shrink: 0;

		.employee-modal-btn-cancel,
		.employee-modal-btn-confirm {
			flex: 1;
			height: px2vw(70px);
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: px2vw(8px);
			font-size: px2vw(28px);
		}

		.employee-modal-btn-cancel {
			background-color: #f5f5f5;
			color: #666;
		}

		.employee-modal-btn-confirm {
			background-color: #5884f1;
			color: #fff;
		}
	}
}

.process-action-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 300;
	padding: px2vw(30px);

	.process-action-content {
		width: 90%;
		max-width: px2vw(1000px);
		max-height: 70vh;
		background-color: #fff;
		border-radius: px2vw(16px);
		box-shadow: 0 px2vw(8px) px2vw(32px) rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.process-action-header {
		height: px2vw(84px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 px2vw(24px);
		background-color: #5884f1;
		flex-shrink: 0;

		.process-action-title {
			font-size: px2vw(30px);
			color: #fff;
			font-weight: bold;
		}

		.process-action-close {
			font-size: px2vw(40px);
			color: #fff;
			line-height: 1;
			padding: px2vw(8px);
		}
	}

	.process-action-body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: px2vw(16px);

		.process-action-filter {
			display: flex;
			align-items: center;
			gap: px2vw(12px);
			margin-bottom: px2vw(12px);
			flex-shrink: 0;

			.process-action-search {
				flex: 1;
				display: flex;
				align-items: center;
				background-color: #fff;
				border: 1px solid #e0e0e0;
				border-radius: px2vw(10px);
				padding: 0 px2vw(16px);
				height: px2vw(64px);
				min-width: 0;

				input {
					width: 100%;
					height: px2vw(64px);
					border: none;
					outline: none;
					font-size: px2vw(26px);
					background: transparent;
				}
			}
		}

		.process-action-main {
			display: flex;
			flex: 1;
			overflow: hidden;
			gap: px2vw(15px);

			.process-action-list-section {
				flex: 1;
				min-width: 0;
				overflow: hidden;
				display: flex;
				flex-direction: column;
				border: 1px solid #e0e0e0;
				border-radius: px2vw(12px);

				.process-action-list {
					height: 100%;

					.process-action-list-header {
						display: flex;
						align-items: center;
						justify-content: center;
						min-height: px2vw(64px);
						background-color: #5884f1;
						font-weight: bold;
						font-size: px2vw(24px);
						color: #fff;
					}

					.process-action-list-item {
						display: flex;
						align-items: center;
						justify-content: center;
						min-height: px2vw(64px);
						font-size: px2vw(24px);
						border-bottom: 1px solid #e8e8e8;
						transition: background-color 0.15s ease;

						&:nth-of-type(odd) {
							background-color: #f8f9ff;
						}

						&:nth-of-type(even) {
							background-color: #fff;
						}

						&:active {
							background-color: #e3e9fb;
						}

						&.selected {
							background-color: #5884f1 !important;
							color: #fff !important;
						}
					}

					.process-action-empty {
						padding: px2vw(48px) 0;
						text-align: center;
						font-size: px2vw(22px);
						color: #999;
					}
				}
			}

			.process-action-form {
				flex: 0 0 px2vw(350px);
				display: flex;
				flex-direction: column;
				gap: px2vw(12px);
				padding: px2vw(16px);
				background-color: #f8f9ff;
				border: 1px solid #e3e9fb;
				border-radius: px2vw(12px);

				.process-action-form-group {
					display: flex;
					flex-direction: column;
					gap: px2vw(8px);

					.process-action-form-label {
						font-size: px2vw(24px);
						font-weight: bold;
						color: #333;
					}

					.process-action-mode-buttons {
						display: flex;
						gap: px2vw(12px);
					}

					.process-action-mode-btn {
						flex: 1;
						height: px2vw(64px);
						display: flex;
						align-items: center;
						justify-content: center;
						border: 1px solid #d0d8f0;
						border-radius: px2vw(10px);
						font-size: px2vw(24px);
						background-color: #fff;
						color: #333;
						transition: all 0.2s;

						&.active {
							background-color: #5884f1;
							color: #fff;
							border-color: #5884f1;
						}
					}

					.process-action-input {
						height: px2vw(64px);
						padding: 0 px2vw(16px);
						border: 1px solid #d0d8f0;
						border-radius: px2vw(10px);
						font-size: px2vw(24px);
						background-color: #fff;
						color: #333;
						box-shadow: 0 1px 3px rgba(88, 132, 241, 0.08);
					}
				}
			}
		}
	}

	.process-action-footer {
		height: px2vw(96px);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: px2vw(16px);
		padding: 0 px2vw(24px);
		border-top: 1px solid #e8e8e8;
		flex-shrink: 0;

		.process-action-btn-cancel,
		.process-action-btn-confirm {
			height: px2vw(64px);
			padding: 0 px2vw(40px);
			border-radius: px2vw(10px);
			font-size: px2vw(26px);
			display: flex;
			align-items: center;
			justify-content: center;
			border: none;
			box-shadow: 0 px2vw(3px) px2vw(8px) rgba(0, 0, 0, 0.1);
			transition: all 0.15s ease;

			&:active {
				opacity: 0.9;
				transform: translateY(px2vw(2px));
				box-shadow: 0 px2vw(1px) px2vw(4px) rgba(0, 0, 0, 0.1);
			}
		}

		.process-action-btn-cancel {
			background-color: #f1f3f5;
			color: #555;
		}

		.process-action-btn-confirm {
			background-color: #5884f1;
			color: #fff;
		}
	}
}
</style>
