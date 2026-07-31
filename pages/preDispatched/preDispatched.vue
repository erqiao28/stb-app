<template>
	<view class="pre-dispatched-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="header">
			<image src="/static/left-arrow.svg" @click="goBack"></image>
			<view class="header-btn-bar">
			<view class="header-btn" :class="{ active: showProcessPanel }" @click="toggleProcessPanel">岗位工序</view>
			<view class="header-btn" :class="{ active: showAttendancePanel }" @click="toggleAttendancePanel">员工出勤</view>
			<view class="header-btn" v-if="loginWorkshop === '喷涂车间'" :class="{ active: showSprayPanel }" @click="toggleSprayPanel">喷涂工序</view>
		</view>
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
								<view class="employee-chart-bar process-bar" :style="{ height: '100%', backgroundColor: '#5884f1' }" @click="toggleEmployeeExpand(emp)">
									<text class="employee-chart-name">{{ emp.name }}</text>
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
					<text>产品列表({{ selectedProductIds.length }}/{{ productList.length }})</text>
					<view class="sync-select-switch" @click.stop="syncSelectEnabled = !syncSelectEnabled">
						<view class="switch" :class="{ 'switch-on': syncSelectEnabled }"></view>
					</view>
				</view>
				<scroll-view class="product-list" scroll-y>
					<view class="order-group" v-for="(group, gIdx) in groupedProductList" :key="group.orderNo">
						<view class="order-header" @click="toggleOrderCollapse(group.orderNo)">
						<text class="order-index">{{ chineseNumberMap[gIdx + 1] || (gIdx + 1) }}</text>
						<view class="order-header-main">
							<text class="order-no">{{ group.orderNo || '-' }}</text>
							<text class="order-delivery-date" v-if="group.orderDeliveryDate">{{ group.orderDeliveryDate }}</text>
						</view>
						<text class="order-count">({{ group.products.length }})</text>
					</view>
						<view class="order-products" v-show="!isOrderCollapsed(group.orderNo)">
							<view
								v-for="(product, idx) in group.products"
								:key="product.rowid || ('product-' + idx)"
								class="product-item"
								:class="{ 'product-active': selectedProductIds.includes(product.rowid) }"
								@click="handleProductClick(product)"
								@longpress="handleLongPress(product)"
								@mousedown="onMouseDown(product)"
								@mouseup="onMouseUp"
								@mouseleave="onMouseUp"
							>
								<text class="product-index">{{ idx + 1 }}</text>
								<view class="product-info">
									<text class="product-name">{{ product.productNameNew || '-' }}</text>
									<text class="product-delivery-date" v-if="product.productDeliveryDate">{{ product.productDeliveryDate }}</text>
								</view>
								<view class="product-btns">
									<text class="expand-btn" @click.stop="toggleExpand(product.rowid)">{{ expandedIds.includes(product.rowid) ? '▼' : '▲' }}</text>
									<view class="dispatch-icon" @click.stop="openDispatchModal(product)">
										<view class="dispatch-icon-line"></view>
										<view class="dispatch-icon-line"></view>
										<view class="dispatch-icon-line"></view>
									</view>
								</view>
								<view class="product-spec" v-if="expandedIds.includes(product.rowid)">
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
							:style="{ gridTemplateColumns: 'min-content min-content repeat(' + group.processes.length + ', min-content)' }"
						>
							<view class="grid-product-name" style="grid-row: 1 / span 7; grid-column: 1">
				<view
					class="grid-product-action"
					:style="{ backgroundColor: isProcessActionEnabled(group.productRowid) ? '#5884f1' : '#999' }"
					@click.stop="openProcessActionModalByRowid(group.productRowid)"
				>操作</view>
						<view class="grid-product-name-text">{{ group.productName }}</view>
						<view class="grid-product-confirm" @click.stop="handleProcessListConfirm(group.productRowid)">确定</view>
					</view>
							<view class="grid-label-cell" style="grid-row: 1; grid-column: 2">选中</view>
							<view class="grid-label-cell" style="grid-row: 2; grid-column: 2">顺序</view>
							<view class="grid-label-cell" style="grid-row: 3; grid-column: 2">工序</view>
							<view class="grid-label-cell" style="grid-row: 4; grid-column: 2">订单数</view>
							<view class="grid-label-cell" style="grid-row: 5; grid-column: 2">日产量</view>
							<view class="grid-label-cell" style="grid-row: 6; grid-column: 2">派工数量</view>
						<view class="grid-label-cell" style="grid-row: 7; grid-column: 2">员工</view>
							<template v-for="(p, idx) in group.processes" :key="p.rowid">
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 1, gridColumn: 3 + idx }">
								<checkbox :checked="selectedProcessIds.includes(p.rowid)" @click="toggleProcessSelection(p)" />
							</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 2, gridColumn: 3 + idx }">{{ p.sequence || '-' }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 3, gridColumn: 3 + idx }">{{ p.processName || '-' }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 4, gridColumn: 3 + idx }">{{ p.orderCount || 0 }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 5, gridColumn: 3 + idx }">{{ p.dailyOutput || 0 }}</view>
							<view class="grid-cell" :class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }" :style="{ gridRow: 6, gridColumn: 3 + idx }">{{ selectedProcessIds.includes(p.rowid) ? (productDispatchCounts[p.productRowid] || 0) : '' }}</view>
							<view
							v-if="isEmployeeGroupStart(group.processes, idx)"
							class="grid-cell employee-cell"
							:class="{ 'selected-column': selectedProcessIds.includes(p.rowid), 'associated-column': p.isAssociated && !selectedProcessIds.includes(p.rowid), 'disabled-column': !selectedProcessIds.includes(p.rowid) && !p.isAssociated }"
							:style="getEmployeeCellStyle(group.processes, idx)"
							@click="openEmployeeEditModal(group.processes, idx)"
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
						<text class="summary-label">未满人员</text>
						<text class="summary-value">{{ employeeSummary.incomplete }}</text>
					</view>
				</view>
				<scroll-view class="employee-chart-scroll" scroll-x scroll-y>
					<view
						class="employee-dispatch-table"
						:style="{ gridTemplateColumns: 'min-content min-content min-content' + (maxEmployeeRecordCount > 0 ? ' repeat(' + maxEmployeeRecordCount + ', min-content min-content min-content min-content min-content)' : '') + ' min-content' }"
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
							<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 1 }">{{ emp.employeeName }}</view>
							<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 2 }">{{ emp.totalWage.toFixed(2) }}</view>
							<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 3 }">{{ emp.totalWorktime.toFixed(2) }}</view>
							<template v-for="(rec, recIdx) in emp.records" :key="recIdx">
								<view
									class="table-cell"
									:class="'record-group-' + (recIdx % RECORD_BG_COLORS.length)"
									:style="{ gridRow: 2 + empIdx, gridColumn: 4 + recIdx * 5 }"
								>{{ rec.orderNo }}</view>
								<view
									class="table-cell"
									:class="'record-group-' + (recIdx % RECORD_BG_COLORS.length)"
									:style="{ gridRow: 2 + empIdx, gridColumn: 5 + recIdx * 5 }"
								>{{ rec.productName }}</view>
								<view
									class="table-cell"
									:class="'record-group-' + (recIdx % RECORD_BG_COLORS.length)"
									:style="{ gridRow: 2 + empIdx, gridColumn: 6 + recIdx * 5 }"
								>{{ rec.dispatchCount }}</view>
								<view
									class="table-cell"
									:class="'record-group-' + (recIdx % RECORD_BG_COLORS.length)"
									:style="{ gridRow: 2 + empIdx, gridColumn: 7 + recIdx * 5 }"
								>{{ rec.worktime }}</view>
								<view
									class="table-cell"
									:class="'record-group-' + (recIdx % RECORD_BG_COLORS.length)"
									:style="{ gridRow: 2 + empIdx, gridColumn: 8 + recIdx * 5 }"
								>{{ rec.wage }}</view>
							</template>
							<template v-for="padIdx in maxEmployeeRecordCount - emp.records.length" :key="'pad-' + padIdx">
								<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 4 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
								<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 5 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
								<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 6 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
								<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 7 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
								<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 8 + emp.records.length * 5 + (padIdx - 1) * 5 }">-</view>
							</template>
							<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 4 + maxEmployeeRecordCount * 5 }"></view>
							<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 5 + maxEmployeeRecordCount * 5 }"></view>
							<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 6 + maxEmployeeRecordCount * 5 }"></view>
							<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 7 + maxEmployeeRecordCount * 5 }"></view>
							<view class="table-cell" :style="{ gridRow: 2 + empIdx, gridColumn: 8 + maxEmployeeRecordCount * 5 }"></view>
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
								<view
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

	<view class="void-modal" v-if="showVoidModal" @click.self="closeVoidModal">
		<view class="void-modal-content">
			<view class="void-modal-title">作废确认</view>
			<input
				v-model="voidReason"
				type="text"
				placeholder="请输入作废原因"
				class="void-input"
			/>
			<view class="void-modal-buttons">
				<view class="void-btn-cancel" @click="closeVoidModal">取消</view>
				<view class="void-btn-confirm" @click="confirmVoid">确认</view>
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

	<!-- 选择订单模态框 -->
	<view class="select-order-modal" v-if="showSelectOrderModal" @click.self="closeSelectOrderModal">
		<view class="select-order-content">
			<view class="select-order-header">
				<text class="select-order-title">选择订单</text>
				<view class="select-order-close" @click="closeSelectOrderModal">×</view>
			</view>
			<view class="select-order-search">
				<input
					v-model="orderSearchKeyword"
					type="text"
					placeholder="搜索订单编号"
					class="select-order-input"
					@input="filterOrderList"
				/>
			</view>
			<scroll-view
				class="select-order-list"
				scroll-y
				:refresher-enabled="true"
				:refresher-triggered="orderRefresherTriggered"
				@refresherrefresh="onOrderRefresh"
				@scrolltolower="onOrderLoadMore"
				lower-threshold="100"
			>
				<view
					class="select-order-item"
					v-for="order in filteredOrderList"
					:key="order.orderCode"
					:class="{ 'selected': selectedOrder?.orderCode === order.orderCode }"
					@click="selectOrder(order)"
				>
					<view class="order-item-row">
						<text class="order-item-code">{{ order.orderCode }}</text>
						<text class="order-item-customer">{{ order.customerName || '-' }}</text>
						<text class="order-item-count">产品: {{ order.productCount }}</text>
					</view>
				</view>
				<view v-if="orderLoadingMore" class="select-order-loading">加载中...</view>
				<view v-else-if="!filteredOrderList.length" class="select-order-empty">暂无订单</view>
				<view v-else-if="!orderHasMore && filteredOrderList.length" class="select-order-empty">没有更多了</view>
			</scroll-view>
			<view class="select-order-footer">
				<view class="select-order-btn-cancel" @click="closeSelectOrderModal">取消</view>
				<view 
					class="select-order-btn-next" 
					:class="{ 'btn-active': selectedOrder }"
					@click="goToSelectProduct"
				>下一步</view>
			</view>
		</view>
	</view>

	<!-- 选择产品模态框 -->
	<view class="select-product-modal" v-if="showSelectProductModal" @click.self="closeSelectProductModal">
		<view class="select-product-content">
			<view class="select-product-header">
				<text class="select-product-title">选择产品 - {{ selectedOrder?.orderCode || '' }}</text>
				<view class="select-product-close" @click="closeSelectProductModal">×</view>
			</view>
			<view class="select-product-search">
				<input
					v-model="productSearchKeyword"
					type="text"
					placeholder="搜索产品名称"
					class="select-product-input"
					@input="filterProductList"
				/>
			</view>
			<scroll-view
				class="select-product-list"
				scroll-y
				:refresher-enabled="true"
				:refresher-triggered="productRefresherTriggered"
				@refresherrefresh="onProductRefresh"
				@scrolltolower="onProductLoadMore"
				lower-threshold="100"
			>
				<view
					class="select-product-item"
					v-for="product in filteredSelectProductList"
					:key="product.productionCode || product.productCode"
					:class="{ 'selected': selectedProductKeys.includes(getProductKey(product)) }"
					@click="toggleProductSelection(product)"
				>
					<view class="product-item-info">
						<view class="product-item-row">
							<text class="product-item-name">{{ product.name || '-' }}</text>
						</view>
						<view class="product-item-row">
							<text class="product-item-code">生产单号: {{ product.productionCode || '-' }}</text>
						</view>
					</view>
					<view class="product-item-actions">
						<view class="expand-btn" @click.stop="toggleProductExpand(product)">
							<text>{{ expandedProductKeys.includes(getProductKey(product)) ? '收起' : '规格' }}</text>
						</view>
					</view>
					<view class="product-spec-row" v-if="expandedProductKeys.includes(getProductKey(product))">
						<text class="product-spec-text">{{ product.models || '-' }}</text>
					</view>
				</view>
				<view v-if="productLoadingMore" class="select-product-loading">加载中...</view>
				<view v-else-if="!filteredSelectProductList.length" class="select-product-empty">暂无产品</view>
				<view v-else-if="!productHasMore && filteredSelectProductList.length" class="select-product-empty">没有更多了</view>
			</scroll-view>
			<view class="select-product-footer">
				<view class="select-product-btn-cancel" @click="backToSelectOrder">上一步</view>
				<view 
					class="select-product-btn-confirm" 
					:class="{ 'btn-active': selectedProductKeys.length > 0 }"
					@click="confirmSelectedProducts"
				>确定</view>
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
							<view v-if="!editData.selectedEmployeeNames || editData.selectedEmployeeNames.length === 0" class="edit-employee-input" @click="openEmployeeSelector">
								<text class="edit-input-text">请选择员工</text>
								<text class="edit-input-arrow">▼</text>
							</view>
						</view>
						<view class="edit-employee-add-btn" @click="openEmployeeSelector">
							<text class="add-btn-text">+选择</text>
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
		<view class="employee-modal-content" @click.stop>
			<view class="employee-modal-header">
				<text class="employee-modal-title">选择员工</text>
				<view class="employee-modal-close" @click="closeEmployeeSelector">×</view>
			</view>
			<scroll-view scroll-y class="employee-modal-list">
				<view
					v-for="emp in allEmployeeOptions"
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
							<view class="employee-modal-position-wrap" @click.stop="toggleEmployeePositionExpand(emp.id)">
								<text class="employee-modal-position-label">岗位</text>
								<text class="employee-modal-expand-icon">
									{{ expandedEmployeeIds.includes(emp.id) ? '▼' : '▶' }}
								</text>
							</view>
						</view>
						<view class="employee-modal-info-extra">
							<text class="employee-modal-hours">{{ emp.totalHours || 0 }}</text>
							<text class="employee-modal-wage">{{ emp.wage || 0 }}</text>
						</view>
					</view>
					<view class="employee-modal-position-detail" v-if="expandedEmployeeIds.includes(emp.id) && emp.position" @click.stop>
						<text
							class="employee-modal-position-tag"
							v-for="(pos, pIdx) in emp.position.split(/[,，]/).filter(Boolean)"
							:key="pIdx"
						>
							{{ pos.trim() }}
						</text>
					</view>
				</view>
				<view class="employee-modal-empty" v-if="allEmployeeOptions.length === 0">
					<text>暂无员工</text>
				</view>
			</scroll-view>
		</view>
	</view>

	<!-- 员工编辑弹窗 -->
	<view class="employee-edit-modal" v-if="showEmployeeEditModal" @click.self="closeEmployeeEditModal">
		<view class="employee-edit-modal-content" @click.stop>
			<view class="employee-edit-modal-header">
				<text class="employee-edit-modal-title">编辑员工</text>
				<view class="employee-edit-modal-close" @click="closeEmployeeEditModal">×</view>
			</view>
			<view class="employee-edit-modal-body">
				<view class="edit-info-row">
					<view class="info-item">
						<text class="info-label">工序：</text>
						<text class="info-value">{{ employeeEditData.processName || '-' }}</text>
					</view>
				</view>
				<view class="employee-tags-section">
					<view class="section-title">
						<text>已选员工</text>
						<text class="section-count">{{ employeeEditData.selectedEmployeeNames.length }}人</text>
					</view>
					<view class="employee-tags-container">
						<view
							v-for="(name, idx) in employeeEditData.selectedEmployeeNames"
							:key="idx"
							class="employee-tag-item"
						>
							<text class="tag-name">{{ name }}</text>
							<view class="tag-delete" @click="removeEmployeeFromEdit(idx)">×</view>
						</view>
						<view v-if="employeeEditData.selectedEmployeeNames.length === 0" class="no-employee-tip">
							<text>暂无选择员工</text>
						</view>
						<view class="add-employee-btn" @click="openEmployeeSelectorForEdit">
							<text class="add-btn-icon">+</text>
						</view>
					</view>
				</view>
			</view>
			<view class="employee-edit-modal-footer">
				<view class="edit-btn-cancel" @click="closeEmployeeEditModal">取消</view>
				<view class="edit-btn-confirm" @click="confirmEmployeeEdit">确认</view>
			</view>
		</view>
	</view>

	<view class="dispatch-modal" v-if="showDispatchModal" @click.self="closeDispatchModal">
		<view class="dispatch-modal-content" @click.stop>
			<view class="dispatch-modal-title">派工设置</view>
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
						<text class="grid-cell-label">派工数量</text>
						<input
							v-model="dispatchModalInput"
							type="number"
							class="dispatch-input"
							placeholder="请输入"
						/>
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
				<text class="process-action-title">操作工序</text>
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
						<view class="process-action-form-group" v-if="processActionModeOptions[processActionModeIndex] !== '删除'">
							<text class="process-action-form-label">生产顺序</text>
							<input type="number" class="process-action-input" placeholder="请输入顺序" v-model="processActionSequence" step="0.01" />
						</view>
						<view class="process-action-form-group">
							<text class="process-action-form-label">操作方式</text>
							<picker mode="selector" :range="processActionModeOptions" :value="processActionModeIndex" @change="onProcessActionModeChange" class="process-action-picker">
								<view class="process-action-picker-value">{{ processActionModeOptions[processActionModeIndex] }}</view>
							</picker>
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
import { PRE_DISPATCH_VOID_URL, PRE_DISPATCH_UPDATE_URL, PRE_DISPATCH_CONFIRM_URL, PRE_DISPATCH_PROCESS_CONFIRM_URL, PRE_DISPATCH_PRODUCT_ADD_URL, ATTENDANCE_SUBMIT_URL, DELETE_PROCESS_URL, OPERATE_PROCESS_URL, OPERATE_PROCESS_SYNC_URL, POSITION_PROCESS_SELECT_URL, POSITION_PROCESS_DELETE_URL, SPRAY_PROCESS_EMPLOYEE_URL } from '../../utils/api'

const { statusBarHeight } = useStatusBar()
const userStore = useUserStore()

const workshopOptions = ['拉伸车间', '喷涂车间', '抛光车间', '组装车间']

const loginWorkshop = computed(() => {
	const lim = (userStore.loginLimits || '').trim()
	return workshopOptions.includes(lim) ? lim : ''
})

// 员工相关数据查询车间：喷涂车间员工合并到组装车间
const employeeWorkshopFilter = computed(() => {
	const ws = loginWorkshop.value
	return ws === '喷涂车间' ? '组装车间' : ws
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
	worktime: '6a1e489127514927ff33ccb7',
	wage: '6a3a17c56d70ffabc66e5e01',
	specification: '6a1e4a2327514927ff33cd1a',
	processName: '6a1e48b627514927ff33ccc0',
	employeeName: '6a1e48b627514927ff33ccc1',
	processDetail: '6a1e47d727514927ff33cc4c',
	craftPosition: '6a3a1e6b6d70ffabc66e6757',
	dailyWage: '6a1e47d727514927ff33cc4e',
	productionCode: '6a1fee4638176d619e00db16',
	thickness: '6a3deb356d70ffabc6702cfd',
	guokouSpec: '6a3deb356d70ffabc6702cfe',
	guokouSizeSpec: '6a3deb356d70ffabc6702cff',
	craftSpec: '6a3deb356d70ffabc6702d00',
	paintSpec: '6a3deb356d70ffabc6702d01',
	polishSpec: '6a3deb356d70ffabc6702d02',
	materialSizeSpec: '6a3debe76d70ffabc6702dbb',
	orderDeliveryDate: '6a587a166d70ffabc67c7982',
	productDeliveryDate: '6a1e7d2c27514927ff33e56b'
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
}

const CRAFT_POSITION_WORKSHEET_ID = '6a276f516d70ffabc66285e7'
const CRAFT_POSITION_FIELD_ID = '6a276ffc6d70ffabc66285f8'
const CRAFT_POSITION_NAME_FIELD = '6a276ffc6d70ffabc66285f8'  // 工序归类名称
const CRAFT_POSITION_RELATED_PROCESS_FIELD = '6a276ffc6d70ffabc66285f9'  // 关联工序字段

// 工序归类表数据
const craftPositionList = ref([])
const craftPositionMap = ref(new Map())  // 工序归类名称 -> 关联工序列表

const filterOrderCode = ref('')
const filterProductName = ref('')
const filterCraft = ref('')
const filterInnerPaint = ref('')
const filterPolish = ref('')
const filterGuokou = ref('')
const filterDate = ref(getTomorrowDate())

const productList = ref([])
const loadingProducts = ref(false)

const selectedProductIds = ref([])
const syncSelectEnabled = ref(false) // 同组产品同步勾选开关
const expandedIds = ref([])
const expandedEmployeeIds = ref([])
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
const isEmployeeExpanded = ref(false)

const showEmployeeTaskPopover = ref(false)
const selectedEmployeeForPopover = ref(null)
const employeeTaskPopoverStyle = ref({})
const employeeTaskArrowStyle = ref({})

const instance = getCurrentInstance()

const employeeSummary = computed(() => {
	const total = employeeList.value.length
	const unassigned = employeeList.value.filter((e) => e.totalHours === 0).length
	const incomplete = employeeList.value.filter((e) => e.totalHours > 0 && e.totalHours < MAX_EMPLOYEE_HOURS).length
	return { total, unassigned, incomplete }
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
	dailyOutput: '69a96d623b5e707f84d380b6',
}

const EMPLOYEE_WORKSHEET_ID = 'yggs'
const EMPLOYEE_FIELD_MAP = {
	workshop: '696075d19223cfe3a0c169dc',
	dispatchDate: '69524e7b7a59e0522d855df6',
	totalHours: '6a4f304c6d70ffabc67913b8',
	wage: '6a4f304c6d70ffabc67913b9',
	employeeName: '6938db8bda0981f67b352af3',
	attendance: '6959e1077a59e0522d877f8b',
	position: '6943bf332161a0fc58bad7a4'
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

const showVoidModal = ref(false)
const voidReason = ref('')
const voidRowid = ref('')

const showConfirmDispatchModal = ref(false)
const confirmDispatchCount = ref(0)
const confirmDispatchRowids = ref([])

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

// 员工编辑弹窗
const showEmployeeEditModal = ref(false)
const employeeEditData = ref({
	processName: '',
	processRowid: '',
	preDispatchRowid: '',
	selectedEmployeeIds: [],
	selectedEmployeeNames: []
})

const showEmployeeSelector = ref(false)
const allEmployeeOptions = ref([])

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
		const workshopFilter = (ws === '喷涂车间' || ws === '组装车间') ? '组装车间' : '抛光车间'
		filters.push({
			controlId: '6a3124a86d70ffabc66c8515',
			dataType: 30,
			spliceType: 1,
			filterType: 2,
			values: [workshopFilter]
		})
		const res = await callWorkflowListAll({
			worksheetId: ASSEMBLY_POSITION_WORKSHEET_ID,
			filters,
			silent: true
		}, 100)
		const rows = Array.isArray(res?.data) ? res.data : []
		processDropdownList.value = rows.map((item) => ({
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
		return []
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
	orderDeliveryDate: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.orderDeliveryDate]) || '',
	productDeliveryDate: formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.productDeliveryDate]) || ''
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

/** 获取工序归类表数据 */
const loadCraftPositionList = async () => {
	try {
		// 获取工序数据字典映射
		const processDictMap = await loadProcessDictionaryMap()
		
		// 获取工序归类表数据
		const res = await callWorkflowListAll({
			worksheetId: CRAFT_POSITION_WORKSHEET_ID,
			filters: []
		}, 100)
		const rows = Array.isArray(res?.data) ? res.data : []
		
		// 构建 Map：工序归类名称 -> 工序名称列表
		const newMap = new Map()
		const craftPositions = rows.map(item => {
			const name = formatFieldValue(item[CRAFT_POSITION_NAME_FIELD]) || ''
			let sids = item[CRAFT_POSITION_RELATED_PROCESS_FIELD]
			if (typeof sids === 'string') {
				try {
					sids = JSON.parse(sids)
				} catch {
					sids = []
				}
			}
			const sidsArray = Array.isArray(sids) ? sids : []
			const processNames = sidsArray.map(sid => processDictMap.get(sid) || sid).filter(Boolean)
			newMap.set(name, processNames)
			return {
				rowid: item.rowid || '',
				name: name,
				sids: sidsArray,
				processNames: processNames
			}
		})
		
		craftPositionList.value = craftPositions
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

// 添加产品：打开选择订单弹窗
const handleAddProduct = () => {
	orderSearchKeyword.value = ''
	selectedOrder.value = null
	loadOrderList()
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
		// 按订单编号汇总
		const orderMap = {}
		rows.forEach(item => {
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
		const targetOrderCode = selectedOrder.value?.orderCode || ''
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
				},
				// 按选中的订单编号筛选，避免目标产品落在后续页导致前端过滤为空
				{
					controlId: '655e1cbbbd2094b316347f92',
					dataType: 30,
					spliceType: 1,
					filterType: 2,
					values: [targetOrderCode]
				}
			],
			pageSize: 100,
			pageNum
		})
		uni.hideLoading()
		
		const rows = res?.data || []
		const newProducts = rows.map(item => ({
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
			rowid: rowid  // 选中产品的 rowid
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

const handleConfirmDispatch = () => {
	// 只获取选中产品的预派工 rowid
	const rowids = productList.value
		.filter(item => selectedProductIds.value.includes(item.rowid))
		.flatMap(item => item.preDispatchRowids || [item.rowid])
		.filter(Boolean)
	if (rowids.length === 0) {
		uni.showToast({ title: '没有可确认的预派工', icon: 'none' })
		return
	}
	confirmDispatchCount.value = rowids.length
	confirmDispatchRowids.value = rowids
	showConfirmDispatchModal.value = true
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
	const product = productList.value.find(item => item.rowid === productRowid)
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
		console.log('[工序列表确定] 获取预派工数据:', {
			productRowid,
			allProductPreDispatchRowids,
			noPreDispatchRowids,
			count: pdRows.length,
			rows: pdRows
		})

		// 按工序排产明细是否为空分类预派工
		pdRows.forEach(item => {
			const sids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail])
			if (sids && sids.length > 0) {
				hasPreDispatchRowids.push(item.rowid)
			} else {
				noProcessPreDispatchRowid = item.rowid
			}
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
		// 用户输入为空或0，传可派数量（needCount）
		const processNeedVals = checkedProcesses.map(p => parseFloat(p.needCount) || 0)
		if (processNeedVals.length > 0) {
			dispatchCount = Math.round(processNeedVals.reduce((a, b) => a + b, 0) / processNeedVals.length)
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

	console.log('[工序列表确定] 提交参数:', {
		productRowid,
		userInput: rawUserInput,
		hasUserInput,
		hasPreDispatchRowids,
		noPreDispatchRowids,
		noProcessPreDispatchRowid,
		dispatchDate,
		dispatchCount,
		finishCount
	})

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
		
		// 轮询等待后端工作流完成并把当日工资写入预派工记录
		const checkedProcessRowids = checkedProcesses.map(p => p.rowid)
		const product = productList.value.find(item => item.rowid === productRowid)
		if (product) {
			uni.showLoading({ title: '正在匹配员工中...', mask: true })
			await waitForPreDispatchDailyWage(product, checkedProcessRowids)
			uni.hideLoading()
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
	showConfirmDispatchModal.value = false
	try {
		uni.showLoading({ title: '确认中...' })
		await http.post(PRE_DISPATCH_CONFIRM_URL, {
			rowids: confirmDispatchRowids.value
		})
		uni.hideLoading()
		uni.showToast({ title: '确认派工成功', icon: 'success' })
		handleSearch()
	} catch (e) {
		uni.hideLoading()
		console.error('确认派工失败:', e)
		uni.showToast({ title: '确认派工失败', icon: 'none' })
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

		// 分页循环拉取全部"未派工"记录，避免只取第一页时目标日期数据落在后续页而丢失
		let raw = []
		let pageNum = 1
		const pageSize = 100
		let hasMore = true
		while (hasMore) {
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

		const groupedMap = {}
		mapped.forEach((item) => {
			const key = `${item.orderNo || ''}|${item.productNameNew || ''}|${item.productionCode || ''}`
			if (!groupedMap[key]) {
				groupedMap[key] = { ...item, rowid: key, preDispatchRowids: [] }
			}
			groupedMap[key].preDispatchRowids.push(item.rowid)
		})
		productList.value = Object.values(groupedMap)
	} catch (e) {
		console.error('加载产品失败:', e)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		loadingProducts.value = false
	}
}



const handleProductClick = (product) => {
	if (!product || !product.rowid) return
	const idx = selectedProductIds.value.indexOf(product.rowid)
	if (idx >= 0) {
		selectedProductIds.value.splice(idx, 1)
	} else {
		selectedProductIds.value.push(product.rowid)
		loadProductProcesses(product)
	}
}

const openDispatchModal = async (product) => {
	if (!product || !product.rowid) return

	// 如果该产品的工序还没加载，先加载工序数据
	const existingProcesses = processList.value.filter(p => p.productRowid === product.rowid)
	if (existingProcesses.length === 0 && !loadedProductIds.value.includes(product.rowid)) {
		await loadProductProcesses(product)
	}

	dispatchModalProduct.value = product
	dispatchModalInput.value = productDispatchCounts.value[product.rowid] || '0'

	// 计算可派数量和完成数量
	let dispatchCount = 0
	let finishCount = 0

	// 获取该产品下的所有工序
	const productProcesses = processList.value.filter(p => p.productRowid === product.rowid)
	console.log('[openDispatchModal] productProcesses:', productProcesses.length, productProcesses.map(p => ({ rowid: p.rowid, needCount: p.needCount, finishCount: p.finishCount, preDispatchRowid: p.preDispatchRowid })))
	// 有预派工关联的工序
	const associatedProcesses = productProcesses.filter(p => p.preDispatchRowid)
	// 有预派工rowids
	const pdRowids = [...new Set(associatedProcesses.map(p => p.preDispatchRowid).filter(Boolean))]

	// 计算完成数量（与可派数量逻辑独立）
	if (pdRowids.length > 0 && associatedProcesses.length > 0) {
		const finishVals = associatedProcesses.map(p => parseFloat(p.finishCount) || 0)
		if (finishVals.length > 0) finishCount = Math.round(finishVals.reduce((a, b) => a + b, 0) / finishVals.length)
	} else {
		const checkedProcesses = productProcesses.filter(p => selectedProcessIds.value.includes(p.rowid))
		if (checkedProcesses.length > 0) {
			const finishVals = checkedProcesses.map(p => parseFloat(p.finishCount) || 0)
			if (finishVals.length > 0) finishCount = Math.round(finishVals.reduce((a, b) => a + b, 0) / finishVals.length)
		}
	}

	// 优先级1：如果产品行的派工数量字段有值且不为0，直接作为可派数量
	const productDispatchCount = parseFloat(product.dispatchCount)
	console.log('[openDispatchModal] product:', product.rowid, 'dispatchCount:', product.dispatchCount, 'productDispatchCount:', productDispatchCount)
	if (Number.isFinite(productDispatchCount) && productDispatchCount > 0) {
		dispatchCount = Math.round(productDispatchCount)
	} else if (pdRowids.length > 0 && associatedProcesses.length > 0) {
		// 有预派工：获取预派工数据
		const needVals = associatedProcesses.map(p => parseFloat(p.needCount) || 0)
		if (needVals.length > 0) dispatchCount = Math.round(needVals.reduce((a, b) => a + b, 0) / needVals.length)
	} else {
		// 无预派工：用勾选的工序
		const checkedProcesses = productProcesses.filter(p => selectedProcessIds.value.includes(p.rowid))
		if (checkedProcesses.length > 0) {
			const needVals = checkedProcesses.map(p => parseFloat(p.needCount) || 0)
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

	productDispatchCounts.value[dispatchModalProduct.value.rowid] = String(num)
	closeDispatchModal()
}

const loadAssociatedProcessDetails = async (product) => {
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
		const nameSetMap = new Map()
		const preDispatchRowidMap = new Map()
		preDispatchRows.forEach((item) => {
			const pdRowid = item.rowid
			const processSids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.processDetail])
			const dailyWageSids = extractRelationSids(item[PRE_DISPATCH_FIELD_MAP.dailyWage])
			const names = dailyWageSids
				.map((sid) => dailyWageMap.get(sid))
				.filter((name) => name && name !== '-')
			processSids.forEach((sid) => {
				if (!nameSetMap.has(sid)) {
					nameSetMap.set(sid, new Set())
				}
				names.forEach((name) => nameSetMap.get(sid).add(name))
				// 每道工序只关联一条预派工
				if (!preDispatchRowidMap.has(sid)) {
					preDispatchRowidMap.set(sid, pdRowid)
				}
			})
		})
		const resultMap = new Map()
		// 获取预派工的 craftPosition
		const craftPositionMap = new Map()
		preDispatchRows.forEach((item) => {
			const pdRowid = item.rowid
			const craftPosition = formatFieldValue(item[PRE_DISPATCH_FIELD_MAP.craftPosition]) || '工序归类表'
			craftPositionMap.set(pdRowid, craftPosition)
		})
		nameSetMap.forEach((names, sid) => {
			const pdRowid = preDispatchRowidMap.get(sid) || ''
			resultMap.set(sid, {
				employeeNames: names.size > 0 ? [...names] : [],
				preDispatchRowid: pdRowid,
				craftPosition: craftPositionMap.get(pdRowid) || '工序归类表'
			})
		})
		return resultMap
	} catch (e) {
		console.error('加载关联工序失败:', e)
		return new Map()
	}
}

/**
 * 轮询等待已勾选的工序都关联上预派工及当日工资记录。
 * 当所有 checkedProcessRowids 都能查到 employeeNames 时返回 true，否则超时后返回 false。
 */
const waitForPreDispatchDailyWage = async (product, checkedProcessRowids, maxRetries = 15, interval = 1000) => {
	if (!checkedProcessRowids || checkedProcessRowids.length === 0) return true
	for (let i = 0; i < maxRetries; i++) {
		await new Promise(resolve => setTimeout(resolve, interval))
		const associatedMap = await loadAssociatedProcessDetails(product)
		const allReady = checkedProcessRowids.every(rowid => {
			const info = associatedMap.get(rowid)
			return info && info.employeeNames && info.employeeNames.length > 0
		})
		if (allReady) {
			console.log('[轮询预派工] 已就绪，轮询次数:', i + 1)
			return true
		}
	}
	console.warn('[轮询预派工] 超时，未全部检测到当日工资:', checkedProcessRowids)
	return false
}

const loadProductProcesses = async (product) => {
	if (!product || !product.rowid || loadedProductIds.value.includes(product.rowid)) return
	const productionCode = product.productionCode
	if (!productionCode) return
	
	// 记录当前产品的旧工序 rowid，刷新后只清理该产品的选中状态，不影响其他产品
	const oldProductProcessRowids = new Set(
		processList.value.filter(p => p.productRowid === product.rowid).map(p => p.rowid)
	)
	
	loadedProductIds.value.push(product.rowid)
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
			const associatedInfo = associatedMap.get(item.rowid) || { employeeNames: [], preDispatchRowid: '', craftPosition: '工序归类表' }
			return {
				rowid: item.rowid || '',
				productRowid: product.rowid,
				productName: product.productNameNew || product.productName || '-',
				sequence: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.sequence]),
				processName: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.processName]),
				orderCount: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.allcount]) || 0,
				dailyOutput: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.dailyOutput]) || 0,
				needCount: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.needCount]) || 0,
				finishCount: formatFieldValue(item[PROCESS_DETAIL_FIELD_MAP.finishCount]) || 0,
				isAssociated,
				isBeforeAssociated: !isAssociated && seq <= maxAssociatedSequence,
				isAfterAssociated: !isAssociated && seq > maxAssociatedSequence,
				employeeNames: associatedInfo.employeeNames,
				preDispatchRowid: associatedInfo.preDispatchRowid,
				craftPosition: associatedInfo.craftPosition
			}
		}).sort((a, b) => (parseFloat(a.sequence) || 0) - (parseFloat(b.sequence) || 0))
		processList.value.push(...newProcesses)
		// 只清理当前产品中已不存在的工序选中状态，不影响其他产品的勾选
		const currentProcessRowids = new Set(newProcesses.map(p => p.rowid))
		selectedProcessIds.value = selectedProcessIds.value.filter(rowid => {
			return !oldProductProcessRowids.has(rowid) || currentProcessRowids.has(rowid)
		})
		// 自动勾选关联预派工的工序（排除用户手动取消勾选的）
		newProcesses.forEach(p => {
			if (p.isAssociated && !selectedProcessIds.value.includes(p.rowid) && !manuallyDeselectedProcessIds.value.has(p.rowid)) {
				selectedProcessIds.value.push(p.rowid)
			}
		})
		console.log('[加载工序] productRowid:', product.rowid, '工序数据:', newProcesses.map(p => ({ rowid: p.rowid, processName: p.processName, preDispatchRowid: p.preDispatchRowid, employeeNames: p.employeeNames })))
	} catch (e) {
		console.error('加载工序失败:', e)
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
		if (process.isAfterAssociated) {
			uni.showToast({ title: '产品未流转到该工序', icon: 'none' })
		} else if (process.isBeforeAssociated) {
			uni.showToast({ title: '产品已完成该工序', icon: 'none' })
		}
		selectedProcessIds.value.push(process.rowid)

		// 归类联动：开关开启时才联动
		if (syncSelectEnabled.value) {
			autoSelectRelatedProcesses(process)
		}
	}
}

// 根据工序归类自动取消勾选同类别工序
const autoDeselectRelatedProcesses = (process) => {
	if (!process.processName || !craftPositionMap.value || craftPositionMap.value.size === 0) return

	// 查找该工序所属的归类名称
	let craftPositionName = ''
	craftPositionMap.value.forEach((processNames, name) => {
		if (processNames.includes(process.processName)) {
			craftPositionName = name
		}
	})

	if (!craftPositionName) return

	// 获取该归类下的所有工序名称
	const relatedProcessNames = craftPositionMap.value.get(craftPositionName) || []

	// 在当前已加载的产品工序中，找出同归类的工序并取消勾选
	processList.value.forEach(p => {
		if (p.rowid && p.productRowid === process.productRowid && relatedProcessNames.includes(p.processName)) {
			const idx = selectedProcessIds.value.indexOf(p.rowid)
			if (idx > -1) {
				selectedProcessIds.value.splice(idx, 1)
			}
		}
	})
}

// 根据工序归类自动勾选同类别工序
const autoSelectRelatedProcesses = (process) => {
	if (!process.processName || !craftPositionMap.value || craftPositionMap.value.size === 0) return
	
	// 查找该工序所属的归类名称
	let craftPositionName = ''
	craftPositionMap.value.forEach((processNames, name) => {
		if (processNames.includes(process.processName)) {
			craftPositionName = name
		}
	})
	
	if (!craftPositionName) return
	
	// 获取该归类下的所有工序名称
	const relatedProcessNames = craftPositionMap.value.get(craftPositionName) || []
	
	// 在当前已加载的产品工序中，找出同归类的工序并勾选
	processList.value.forEach(p => {
		if (p.rowid && p.productRowid === process.productRowid && relatedProcessNames.includes(p.processName)) {
			if (!selectedProcessIds.value.includes(p.rowid)) {
				selectedProcessIds.value.push(p.rowid)
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
			pdRows.forEach((pd) => {
				preDispatchMap[pd.rowid] = pd
			})
		}

		const map = new Map()
		dailyWageList.forEach((dw) => {
			const employeeName = dw.employeeName
			if (!map.has(employeeName)) {
				map.set(employeeName, {
					employeeName,
					totalWage: 0,
					totalWorktime: 0,
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
						processName: pd.craftPosition || pd.processName || '-',
						dispatchCount: pd.dispatchCount || 0,
						worktime: pd.worktime || 0,
						wage: pd.wage || 0
					})
				}
			})
		})
		employeeDispatchSummary.value = [...map.values()].sort((a, b) => b.records.length - a.records.length)
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
	if (span <= 1) return { gridRow: 7, gridColumn: 3 + idx }
	return { gridRow: 7, gridColumn: (3 + idx) + ' / span ' + span }
}

const getEmployeeCellText = (processes, idx) => {
	const span = getEmployeeGroupSpan(processes, idx)
	const names = processes[idx].employeeNames || []
	if (names.length === 0) return '-'
	if (span === 1 && names.length > 1) return '多人'
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
			groups[key] = { orderNo: key, orderDeliveryDate: product.orderDeliveryDate || '', products: [] }
		}
		groups[key].products.push(product)
	})
	return Object.values(groups).sort((a, b) => {
		if (!a.orderDeliveryDate) return 1
		if (!b.orderDeliveryDate) return -1
		return a.orderDeliveryDate.localeCompare(b.orderDeliveryDate)
	})
})

const groupedProcessList = computed(() => {
	const groups = []
	// 按左侧产品列表顺序遍历，保证工序列表顺序与产品列表一致
	selectedProductIds.value.forEach((productRowid) => {
		const processes = processList.value.filter(p => p.productRowid === productRowid)
		if (processes.length === 0) return
		groups.push({
			productRowid,
			productName: processes[0].productName,
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
				dispatchCount: r.dispatchCount
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

const openProcessActionModalByRowid = (productRowid) => {
	// 检查是否只选中了一道工序
	if (selectedProcessIds.value.length !== 1) {
		uni.showToast({ title: '请先勾选一道工序', icon: 'none' })
		return
	}
	const selectedProcessId = selectedProcessIds.value[0]
	const selectedProcess = processList.value.find((p) => p.rowid === selectedProcessId)
	// 校验选中的工序是否属于当前产品
	if (!selectedProcess || selectedProcess.productRowid !== productRowid) {
		uni.showToast({ title: '请勾选当前产品下的工序', icon: 'none' })
		return
	}
	// 获取选中工序的顺序
	const selectedSeq = selectedProcess ? parseFloat(selectedProcess.sequence) || 0 : 0
	// 生产顺序默认为选中工序顺序 + 0.01
	processActionSequence.value = (selectedSeq + 0.01).toFixed(2)
	const product = productList.value.find((p) => p.rowid === productRowid)
	openProcessActionModal(product || { rowid: productRowid, productName: '' })
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

const handleProcessActionSearch = () => {
	loadProcessActionList()
}

const loadProcessActionList = async () => {
	try {
		processActionLoading.value = true
		const ws = loginWorkshop.value
		console.log('[工序列表] 当前车间:', ws)
		let rows = []
		
		if (ws === '拉伸车间') {
			// 拉伸车间：从 shujuzidian 获取工序
			const filters = [
				{ controlId: '6614d7ed1f7f1264f3a332c3', dataType: 30, spliceType: 1, filterType: 2, values: ['工序'] },
				{ controlId: '66b07c4a965ba588586ec783', dataType: 30, spliceType: 1, filterType: 2, values: ['三级'] },
				{ controlId: '6a324e7d6d70ffabc66cbe5f', dataType: 30, spliceType: 1, filterType: 2, values: ['1'] }
			]
			filters.push({
				controlId: '691e8522d50c894e2e798d03',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [ws]
			})
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
			const res = await callWorkflowListAll({
				worksheetId: 'shujuzidian',
				filters,
				silent: true
			}, 100)
			rows = Array.isArray(res?.data) ? res.data : []
		} else {
			// 喷涂、抛光、组装车间：从岗位表获取岗位
			const filters = []
			// 根据车间筛选：喷涂车间和组装车间筛选"组装车间"，抛光车间筛选"抛光车间"
			const workshopFilter = (ws === '喷涂车间' || ws === '组装车间') ? '组装车间' : '抛光车间'
			console.log('[工序列表] 岗位表筛选车间:', ws, '筛选值:', workshopFilter)
			filters.push({
				controlId: '6a3124a86d70ffabc66c8515',
				dataType: 30,
				spliceType: 1,
				filterType: 2,
				values: [workshopFilter]
			})
			const nameSearch = processActionSearch.value.trim()
			if (nameSearch) {
				filters.push({
					controlId: '6a276ffc6d70ffabc66285f8',
					dataType: 30,
					spliceType: 1,
					filterType: 1,
					values: [nameSearch]
				})
			}
			const res = await callWorkflowListAll({
				worksheetId: ASSEMBLY_POSITION_WORKSHEET_ID,
				filters,
				silent: true
			}, 100)
			rows = Array.isArray(res?.data) ? res.data : []
		}
		processActionList.value = rows.reverse().map((item) => ({
			rowid: item.rowid || '',
			processName: item['Name'] || item[ASSEMBLY_POSITION_FIELD_ID] || '-'
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

const onProcessActionModeChange = (e) => {
	processActionModeIndex.value = Number(e.detail.value) || 0
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
	console.log('[同步预派工] 获取预派工数据:', {
		productRowid,
		rawRowids,
		count: pdRows.length,
		rows: pdRows
	})
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
		const productRowid = product?.rowid || ''
		try {
			uni.showLoading({ title: '删除中...' })
			await http.post(DELETE_PROCESS_URL, { rowid: processRowid })
			uni.hideLoading()
			// 删除成功后先关闭弹窗，再显示刷新动画并刷新工序列表
			closeProcessActionModal()
			uni.showLoading({ title: '刷新中...', mask: true })
			loadedProductIds.value = loadedProductIds.value.filter(id => id !== productRowid)
			processList.value = processList.value.filter(p => p.productRowid !== productRowid)
			await loadProductProcesses(product)
			uni.hideLoading()
			uni.showToast({ title: '删除成功', icon: 'success' })
			// 同步预派工关联工序（异步执行，不影响主流程）
			const preDispatchRowids = await getPreDispatchRowidsWithProcessDetail(productRowid)
			if (preDispatchRowids.length > 0) {
				try {
					await http.post(OPERATE_PROCESS_SYNC_URL, { rowids: preDispatchRowids })
					// 同步成功后再刷新一次
					uni.showLoading({ title: '刷新中...', mask: true })
					loadedProductIds.value = loadedProductIds.value.filter(id => id !== productRowid)
					processList.value = processList.value.filter(p => p.productRowid !== productRowid)
					await loadProductProcesses(product)
					uni.hideLoading()
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
		const productRowid = product?.rowid || ''
		const params = {
			processName: selected.processName || '',
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
			// 操作成功后先关闭弹窗，再显示刷新动画并刷新工序列表
			closeProcessActionModal()
			uni.showLoading({ title: '刷新中...', mask: true })
			loadedProductIds.value = loadedProductIds.value.filter(id => id !== productRowid)
			processList.value = processList.value.filter(p => p.productRowid !== productRowid)
			await loadProductProcesses(product)
			uni.hideLoading()
			uni.showToast({ title: '操作成功', icon: 'success' })
			// 替换时才同步预派工关联工序（异步执行，不影响主流程）
			if (mode === '替换') {
				const preDispatchRowids = await getPreDispatchRowidsWithProcessDetail(productRowid)
				if (preDispatchRowids.length > 0) {
					try {
						await http.post(OPERATE_PROCESS_SYNC_URL, { rowids: preDispatchRowids })
						// 同步成功后再刷新一次
						uni.showLoading({ title: '刷新中...', mask: true })
						loadedProductIds.value = loadedProductIds.value.filter(id => id !== productRowid)
						processList.value = processList.value.filter(p => p.productRowid !== productRowid)
						await loadProductProcesses(product)
						uni.hideLoading()
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

			const filtered = rows.filter((item) => formatFieldValue(item[EMPLOYEE_FIELD_MAP.dispatchDate]) === currentDate)
			allRows.push(...filtered)

			if (filtered.length > 0) {
				foundData = true
			}

			// 已找到数据且当前页筛选后为空，说明后续不再有该日期数据，停止
			if (foundData && filtered.length === 0) {
				hasMore = false
			} else if (rows.length < pageSize) {
				hasMore = false
			} else {
				pageNum++
			}
		}

		const mapped = allRows.map((item) => {
			const totalHours = parseFloat(formatFieldValue(item[EMPLOYEE_FIELD_MAP.totalHours]) || '0') || 0
			const wage = parseFloat(formatFieldValue(item[EMPLOYEE_FIELD_MAP.wage]) || '0') || 0
			const attendance = formatFieldValue(item[EMPLOYEE_FIELD_MAP.attendance]) || ''
			const position = formatFieldValue(item[EMPLOYEE_FIELD_MAP.position]) || ''
			return {
				id: item.rowid || '',
				name: formatFieldValue(item[EMPLOYEE_FIELD_MAP.employeeName]) || '-',
				totalHours,
				wage,
				attendance,
				position
			}
		})
		employeeList.value = mapped.map((e) => {
			const barHeight = Math.min(100, (e.totalHours / MAX_EMPLOYEE_HOURS) * 100) + '%'
			const attendance = String(e.attendance).trim()
			const barColor = attendance === '上班' ? '#27ae60' : '#e74c3c'
			return {
				...e,
				barHeight,
				barColor
			}
		})
	} catch (e) {
		console.error('加载员工数据失败:', e)
		employeeList.value = []
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
		const mapped = rows.map((item) => ({
			id: item.rowid || '',
			name: formatFieldValue(item['6695dc2a2503723eec1aa766']) || '-',
			totalHours: 0,
			wage: 0,
			barHeight: '0%',
			barColor: '#5884f1',
			processNames: processFieldIds.map((fieldId) => formatFieldValue(item[fieldId]) || '-')
		}))
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

const handleLongPress = (product) => {
	showVoidModal.value = true
	voidReason.value = ''
	const rowids = product.preDispatchRowids || [product.rowid]
	voidRowid.value = rowids.filter(Boolean).join(',')
}

let longPressTimer = null

const onMouseDown = (item) => {
	longPressTimer = setTimeout(() => {
		handleLongPress(item)
	}, 500)
}

const onMouseUp = () => {
	if (longPressTimer) {
		clearTimeout(longPressTimer)
		longPressTimer = null
	}
}

const closeVoidModal = () => {
	showVoidModal.value = false
	voidReason.value = ''
	voidRowid.value = ''
}

const closeConfirmDispatchModal = () => {
	showConfirmDispatchModal.value = false
	confirmDispatchCount.value = 0
	confirmDispatchRowids.value = []
}

const confirmVoid = async () => {
	if (!voidReason.value.trim()) {
		uni.showToast({ title: '请输入作废原因', icon: 'none' })
		return
	}
	if (!voidRowid.value) {
		uni.showToast({ title: '缺少记录ID', icon: 'none' })
		return
	}

	const rowids = voidRowid.value.split(',').filter(Boolean)
	if (rowids.length === 0) {
		uni.showToast({ title: '缺少记录ID', icon: 'none' })
		return
	}

	uni.showLoading({ title: '作废中...', mask: true })
	let successCount = 0
	let failCount = 0
	try {
		for (const rowid of rowids) {
			try {
				await http.post(PRE_DISPATCH_VOID_URL, {
					rowid,
					reason: voidReason.value.trim()
				})
				successCount++
			} catch (e) {
				console.error(`作废失败 rowid=${rowid}:`, e)
				failCount++
			}
		}
		closeVoidModal()
		if (failCount === 0) {
			uni.showToast({ title: '作废成功', icon: 'success' })
		} else if (successCount === 0) {
			uni.showToast({ title: '作废失败', icon: 'none' })
		} else {
			uni.showToast({ title: `作废完成，成功 ${successCount} 条，失败 ${failCount} 条`, icon: 'none' })
		}
		loadProducts(true)
		loadEmployeeDispatchSummary()
	} catch (e) {
		console.error('作废失败:', e)
		uni.showToast({ title: '作废失败', icon: 'none' })
	} finally {
		uni.hideLoading()
	}
}

const handleCircleClick = async (item) => {
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
			employeeIds: editData.value.selectedEmployeeIds,
			employeeNames: editData.value.selectedEmployeeNames
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

// 打开员工编辑弹窗
const openEmployeeEditModal = async (processes, idx) => {
	const process = processes[idx]
	if (!process) return

	// 获取该员工组起始位置的工序信息
	const groupStartIdx = getEmployeeGroupStart(processes, idx)
	const groupStartProcess = processes[groupStartIdx]
	const groupSpan = getEmployeeGroupSpan(processes, groupStartIdx)

	// 判断显示工序名称还是岗位工序：岗位工序不为空时优先显示岗位工序
	const processDisplay = (process.craftPosition || groupStartProcess.processName || '')

	// 设置编辑数据
	employeeEditData.value = {
		processName: processDisplay,
		processRowid: process.rowid || '',
		preDispatchRowid: process.preDispatchRowid || '',
		selectedEmployeeIds: [],
		selectedEmployeeNames: []
	}

	// 加载员工列表
	await loadEmployeeOptions()

	// 匹配当前员工
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
		employeeEditData.value.selectedEmployeeIds = matchedIds
		employeeEditData.value.selectedEmployeeNames = matchedNames
	}

	showEmployeeEditModal.value = true
}

// 关闭员工编辑弹窗
const closeEmployeeEditModal = () => {
	showEmployeeEditModal.value = false
	showEmployeeSelector.value = false  // 关闭编辑框时同时关闭选择器
	employeeEditData.value = {
		processName: '',
		processRowid: '',
		preDispatchRowid: '',
		selectedEmployeeIds: [],
		selectedEmployeeNames: []
	}
}

// 为员工编辑弹窗打开员工选择器
const openEmployeeSelectorForEdit = async () => {
	// 同步已选员工到 editData
	editData.value.selectedEmployeeIds = [...employeeEditData.value.selectedEmployeeIds]
	editData.value.selectedEmployeeNames = [...employeeEditData.value.selectedEmployeeNames]
	await loadWorkshopEmployees()
	await loadEmployeeOptions()
	expandedEmployeeIds.value = []
	sortEmployeeOptionsByPosition()
	autoSelectFirstMatchingEmployee()
	showEmployeeSelector.value = true
}

// 从员工编辑中移除员工
const removeEmployeeFromEdit = (idx) => {
	employeeEditData.value.selectedEmployeeIds.splice(idx, 1)
	employeeEditData.value.selectedEmployeeNames.splice(idx, 1)
}

// 确认员工编辑
const confirmEmployeeEdit = async () => {
	const preDispatchRowid = employeeEditData.value.preDispatchRowid
	const selectedEmployeeIds = employeeEditData.value.selectedEmployeeIds
	if (!preDispatchRowid) {
		uni.showToast({ title: '缺少预派工记录', icon: 'none' })
		return
	}

	const requestData = {
		rowid: preDispatchRowid,
		employees: selectedEmployeeIds
	}
	console.log('员工编辑请求参数:', requestData)

	try {
		uni.showLoading({ title: '保存中...' })
		await http.post('/api/workflow/hooks/NmEzYjc5NzIzN2MwOTg0NTBhOTIzMjYw', requestData)
		uni.hideLoading()
		uni.showToast({ title: '保存成功', icon: 'success' })

		// 先关闭编辑弹窗
		closeEmployeeEditModal()

		// 延迟刷新，等待后端数据更新完成
		setTimeout(async () => {
			// 刷新工序列表的员工数据：清除缓存并重新加载当前选中产品的工序
			const targetProduct = productList.value.find(p =>
				p.preDispatchRowids && p.preDispatchRowids.includes(preDispatchRowid)
			)
			if (targetProduct) {
				// 清除该产品的工序缓存
				const idx = loadedProductIds.value.indexOf(targetProduct.rowid)
				if (idx > -1) loadedProductIds.value.splice(idx, 1)
				// 从 processList 中移除该产品的旧工序
				processList.value = processList.value.filter(p => p.productRowid !== targetProduct.rowid)
				// 重新加载工序
				await loadProductProcesses(targetProduct)
			}

			// 刷新底部员工列表
			loadWorkshopEmployees()

			// 刷新汇总
			loadEmployeeDispatchSummary()
		}, 500)
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
		// 优先复用员工出勤已加载的数据，避免重复查询且保证数据一致
		if (employeeList.value.length === 0) {
			await loadWorkshopEmployees()
		}
		const currentDate = filterDate.value
		const mappedEmployees = employeeList.value.map(item => ({
			id: item.id || '',
			name: item.name || '-',
			position: item.position || '',
			totalHours: item.totalHours || 0,
			wage: item.wage || 0,
			dispatchWorkDate: currentDate
		}))
		console.log('[选择员工] 复用员工出勤数据:', {
			currentDate,
			count: mappedEmployees.length,
			employees: mappedEmployees
		})
		allEmployeeOptions.value = mappedEmployees
	} catch (error) {
		console.error('加载员工列表失败:', error)
		allEmployeeOptions.value = []
	}
}

const openEmployeeSelector = async () => {
	await loadWorkshopEmployees()
	await loadEmployeeOptions()
	expandedEmployeeIds.value = []
	sortEmployeeOptionsByPosition()
	autoSelectFirstMatchingEmployee()
	showEmployeeSelector.value = true
}

const getPositionMatchIndex = (positionText, targetName) => {
	if (!positionText || !targetName) return Infinity
	const positions = positionText.split(/[,，]/).map(p => p.trim()).filter(Boolean)
	const index = positions.findIndex(p => p.includes(targetName))
	return index >= 0 ? index : Infinity
}

const sortEmployeeOptionsByPosition = () => {
	const targetName = employeeEditData.value.processName || editData.value.processDisplay || ''
	console.log('[选择员工排序] 目标工序:', targetName, 'options数量:', allEmployeeOptions.value.length)
	if (!targetName) return

	const sorted = [...allEmployeeOptions.value].sort((a, b) => {
		const aIndex = getPositionMatchIndex(a.position, targetName)
		const bIndex = getPositionMatchIndex(b.position, targetName)
		console.log('[选择员工排序]', a.name, '岗位:', a.position, 'index:', aIndex, '|', b.name, '岗位:', b.position, 'index:', bIndex)
		if (aIndex !== bIndex) {
			return aIndex - bIndex
		}
		return String(a.name || '').localeCompare(String(b.name || ''))
	})
	allEmployeeOptions.value = sorted
}

const AUTO_SELECT_PROCESS_NAMES = ['点焊', '喷涂', '去油', '超声波', '喷砂', '喷砂叠锅']

const autoSelectFirstMatchingEmployee = () => {
	const targetName = employeeEditData.value.processName || editData.value.processDisplay || ''
	const selectedIds = editData.value.selectedEmployeeIds || []
	if (!targetName || !AUTO_SELECT_PROCESS_NAMES.includes(targetName) || selectedIds.length > 0) return

	const matchedEmp = allEmployeeOptions.value.find(emp => {
		if (!emp.position) return false
		const positions = emp.position.split(/[,，]/).map(p => p.trim()).filter(Boolean)
		return positions.length > 0 && positions[0].includes(targetName)
	})
	if (matchedEmp) {
		toggleEmployee(matchedEmp)
	}
}

const closeEmployeeSelector = () => {
	showEmployeeSelector.value = false
}

const toggleEmployeePositionExpand = (empId) => {
	const index = expandedEmployeeIds.value.indexOf(empId)
	if (index >= 0) {
		expandedEmployeeIds.value.splice(index, 1)
	} else {
		expandedEmployeeIds.value.push(empId)
	}
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
	// 同步到员工编辑数据
	employeeEditData.value.selectedEmployeeIds = [...ids]
	employeeEditData.value.selectedEmployeeNames = [...names]
	// sync single employee field (first selected)
	if (ids.length > 0) {
		editData.value.employeeId = ids[0]
		editData.value.employeeName = names[0]
	} else {
		editData.value.employeeId = ''
		editData.value.employeeName = ''
	}
}

// 页面首次挂载与从其他页面返回时均刷新数据
const refreshPage = async () => {
	loadCraftPositionList()  // 获取工序归类表数据
	await loadProducts(true)
	loadWorkshopEmployees()
	loadEmployeeDispatchSummary()
}

onMounted(refreshPage)
onShow(refreshPage)
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
			margin-right: px2vw(20px);
			height: px2vw(40px);
			width: px2vw(40px);
			flex-shrink: 0;
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
				font-size: px2vw(26px);
				font-weight: bold;
				color: #333;
				background-color: #f5f7fa;
				border-bottom: 1px solid #eee;
				flex-shrink: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: px2vw(16px);
			}

			.sync-select-switch {
				.switch {
					width: px2vw(36px);
					height: px2vw(20px);
					border-radius: px2vw(10px);
					background-color: #ccc;
					position: relative;
					transition: background-color 0.2s;

					&::after {
						content: '';
						position: absolute;
						width: px2vw(16px);
						height: px2vw(16px);
						border-radius: 50%;
						background-color: #fff;
						top: px2vw(2px);
						left: px2vw(2px);
						transition: left 0.2s;
					}
				}

				.switch-on {
					background-color: #1890ff;

					&::after {
						left: px2vw(18px);
					}
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
					flex: 1;
					margin: 0 px2vw(8px);
					height: px2vw(44px);
					line-height: px2vw(44px);
					border-radius: px2vw(6px);
					text-align: center;
					font-size: px2vw(22px);
					color: #fff;

					&.left-btn-add {
						background-color: #3498db;
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
							font-size: px2vw(18px);
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
						font-size: px2vw(22px);
						color: #333;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						min-width: 0;
					}

					.product-delivery-date {
						font-size: px2vw(18px);
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
						width: px2vw(32px);
						height: px2vw(32px);
						line-height: px2vw(32px);
						text-align: center;
						border-radius: 50%;
						font-size: px2vw(18px);
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
						flex-direction: column;
						align-items: center;
						margin-bottom: px2vw(10px);

						.summary-label {
							font-size: px2vw(16px);
							color: #666;
							margin-bottom: px2vw(4px);
							white-space: nowrap;
						}

						.summary-value {
							font-size: px2vw(22px);
							color: #333;
							font-weight: bold;
							word-break: break-all;
							white-space: normal;
							text-align: center;
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
					grid-template-rows: repeat(7, auto);
					margin: px2vw(10px);
					border: 1px solid #999;

					.grid-product-name {
						grid-row: 1 / span 7;
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: flex-start;
						background-color: #f0f0f0;
						padding: px2vw(10px);
						border-right: 1px solid #999;
						font-size: px2vw(20px);
						color: #333;
						white-space: nowrap;
						position: sticky;
						left: 0;
						z-index: 10;

						.grid-product-action {
							margin-bottom: px2vw(16px);
							padding: px2vw(6px) px2vw(10px);
							background-color: #999;
							color: #fff;
							border-radius: px2vw(6px);
							font-size: px2vw(18px);
							writing-mode: vertical-rl;
							text-orientation: upright;
							letter-spacing: px2vw(4px);
							display: flex;
							align-items: center;
							justify-content: center;
							min-height: px2vw(80px);
						}

						.grid-product-name-text {
							writing-mode: vertical-rl;
							text-orientation: upright;
							flex: 1;
							display: flex;
							align-items: center;
							justify-content: center;
						}

						.grid-product-confirm {
							margin-top: px2vw(16px);
							padding: px2vw(6px) px2vw(10px);
							background-color: #27ae60;
							color: #fff;
							border-radius: px2vw(6px);
							font-size: px2vw(18px);
							writing-mode: vertical-rl;
							text-orientation: upright;
							letter-spacing: px2vw(4px);
							display: flex;
							align-items: center;
							justify-content: center;
							min-height: px2vw(80px);
						}
					}

					.grid-label-cell {
						background-color: #f0f0f0;
						padding: px2vw(9px) px2vw(5px);
						text-align: center;
						font-size: px2vw(17px);
						color: #333;
						border-bottom: 1px solid #999;
						border-right: 1px solid #999;
						white-space: nowrap;
					}

					.grid-cell {
						padding: px2vw(9px) px2vw(5px);
						text-align: center;
						font-size: px2vw(17px);
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

						&:nth-last-child(-n+7) {
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
					font-size: px2vw(18px);
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
						font-size: px2vw(16px);
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
					}
			}

			.employee-chart {
				height: 100%;
				display: inline-flex;
				flex-direction: row;
				align-items: flex-end;
				justify-content: flex-start;
				padding: px2vw(20px);

				.employee-column {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: flex-end;
					height: 100%;
					flex: 1;
					min-width: px2vw(80px);

					.emp-wage {
						font-size: px2vw(20px);
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
								font-size: px2vw(16px);
								color: #333;
							}
						}
					}

					.emp-name {
						font-size: px2vw(18px);
						color: #333;
						margin-top: px2vw(8px);
						text-align: center;
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

.void-modal {
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

	.void-modal-content {
		width: px2vw(600px);
		background-color: #fff;
		border-radius: px2vw(16px);
		padding: px2vw(40px);
	}

	.void-modal-title {
		font-size: px2vw(32px);
		font-weight: bold;
		text-align: center;
		margin-bottom: px2vw(30px);
	}

	.void-input {
		width: 100%;
		height: px2vw(80px);
		border: 1px solid #ddd;
		border-radius: px2vw(8px);
		padding: 0 px2vw(20px);
		font-size: px2vw(28px);
		box-sizing: border-box;
		margin-bottom: px2vw(30px);
	}

	.void-modal-buttons {
		display: flex;
		gap: px2vw(20px);

		.void-btn-cancel,
		.void-btn-confirm {
			flex: 1;
			height: px2vw(80px);
			line-height: px2vw(80px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(28px);
		}

		.void-btn-cancel {
			background-color: #f5f7fa;
			color: #666;
		}

		.void-btn-confirm {
			background-color: #ff4d4f;
			color: #fff;
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
	}

	.dispatch-modal-title {
		font-size: px2vw(32px);
		font-weight: bold;
		text-align: center;
		margin-bottom: px2vw(30px);
		color: #333;
	}

	.dispatch-modal-body {
		margin-bottom: px2vw(30px);

		.dispatch-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
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

				&:nth-child(2n) {
					border-right: none;
				}

				&:nth-child(3),
				&:nth-child(4) {
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
.select-order-modal {
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

	.select-order-content {
		width: px2vw(750px);
		height: px2vw(680px);
		background-color: #fff;
		border-radius: px2vw(16px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.select-order-header {
		height: px2vw(88px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 px2vw(24px);
		background-color: #5884f1;
		flex-shrink: 0;

		.select-order-title {
			font-size: px2vw(30px);
			color: #fff;
			font-weight: bold;
		}

		.select-order-close {
			font-size: px2vw(44px);
			color: #fff;
			line-height: 1;
		}
	}

	.select-order-search {
		padding: px2vw(12px) px2vw(16px);
		flex-shrink: 0;

		.select-order-input {
			height: px2vw(60px);
			background-color: #f5f7fa;
			border-radius: px2vw(8px);
			padding: 0 px2vw(16px);
			font-size: px2vw(24px);
		}
	}

	.select-order-list {
		flex: 1;
		min-height: 0;
		padding: 0 px2vw(16px);

		.select-order-loading,
		.select-order-empty {
			text-align: center;
			color: #999;
			font-size: px2vw(24px);
			padding: px2vw(40px) 0;
		}
	}

	.select-order-item {
		padding: px2vw(14px) px2vw(16px);
		background-color: #f9f9f9;
		border-radius: px2vw(10px);
		margin-bottom: px2vw(10px);

		&.selected {
			background-color: #e8f4fc;
			box-shadow: inset 0 0 0 px2vw(2px) rgba(88, 132, 241, 0.5);
		}

		.order-item-row {
			display: flex;
			align-items: center;
			gap: px2vw(16px);
			margin-bottom: px2vw(4px);

			&:last-child {
				margin-bottom: 0;
			}
		}

		.order-item-code {
			font-size: px2vw(26px);
			color: #333;
			font-weight: bold;
		}

		.order-item-count {
			font-size: px2vw(22px);
			color: #2755f1;
		}

		.order-item-customer {
			font-size: px2vw(22px);
			color: #666;
		}
	}

	.select-order-footer {
		height: px2vw(80px);
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding: 0 px2vw(24px);
		border-top: 1px solid #eee;
		flex-shrink: 0;

		.select-order-btn-cancel,
		.select-order-btn-next {
			flex: 1;
			height: px2vw(56px);
			line-height: px2vw(56px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(26px);
		}

		.select-order-btn-cancel {
			margin-right: px2vw(16px);
			background-color: #f5f7fa;
			color: #666;
		}

		.select-order-btn-next {
			margin-left: px2vw(16px);
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
	}
}

// 选择产品模态框
.select-product-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1001;

	.select-product-content {
		width: px2vw(750px);
		height: px2vw(680px);
		background-color: #fff;
		border-radius: px2vw(16px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.select-product-header {
		height: px2vw(88px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 px2vw(24px);
		background-color: #5884f1;
		flex-shrink: 0;

		.select-product-title {
			font-size: px2vw(30px);
			color: #fff;
			font-weight: bold;
		}

		.select-product-close {
			font-size: px2vw(44px);
			color: #fff;
			line-height: 1;
		}
	}

	.select-product-search {
		padding: px2vw(12px) px2vw(16px);
		flex-shrink: 0;

		.select-product-input {
			height: px2vw(60px);
			background-color: #f5f7fa;
			border-radius: px2vw(8px);
			padding: 0 px2vw(16px);
			font-size: px2vw(24px);
		}
	}

	.select-product-list {
		flex: 1;
		min-height: 0;
		padding: 0 px2vw(16px);

		.select-product-loading,
		.select-product-empty {
			text-align: center;
			color: #999;
			font-size: px2vw(24px);
			padding: px2vw(40px) 0;
		}
	}

	.select-product-item {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		padding: px2vw(14px) px2vw(16px);
		background-color: #f9f9f9;
		border-radius: px2vw(10px);
		margin-bottom: px2vw(10px);

		&.selected {
			background-color: #e8f4fc;
			box-shadow: inset 0 0 0 px2vw(2px) rgba(88, 132, 241, 0.5);
		}

		.product-item-info {
			flex: 1;
			min-width: 0;

			.product-item-row {
				margin-bottom: px2vw(6px);

				&:last-child {
					margin-bottom: 0;
				}
			}

			.product-item-name {
				font-size: px2vw(26px);
				color: #333;
				font-weight: bold;
			}

			.product-item-code {
				font-size: px2vw(22px);
				color: #666;
			}
		}

		.product-item-actions {
			flex-shrink: 0;
			margin-left: px2vw(10px);

			.expand-btn {
				padding: px2vw(6px) px2vw(16px);
				background-color: #e8eefc;
				border: px2vw(2px) solid #b8c8f5;
				border-radius: px2vw(6px);
				font-size: px2vw(22px);
				color: #2755f1;
			}
		}

		.product-spec-row {
			width: 100%;
			margin-top: px2vw(10px);
			padding: px2vw(10px);
			background-color: #fff;
			border-radius: px2vw(8px);

			.product-spec-text {
				font-size: px2vw(22px);
				color: #666;
				line-height: px2vw(36px);
			}
		}
	}

	.select-product-footer {
		height: px2vw(80px);
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding: 0 px2vw(24px);
		border-top: 1px solid #eee;
		flex-shrink: 0;

		.select-product-btn-cancel,
		.select-product-btn-confirm {
			flex: 1;
			height: px2vw(56px);
			line-height: px2vw(56px);
			text-align: center;
			border-radius: px2vw(8px);
			font-size: px2vw(26px);
			background-color: #ccc;
			color: #fff;
			margin-left: px2vw(16px);
			transition: all 0.2s;

			&.btn-active {
				background-color: #28a745;
			}

			&.btn-active:active {
				opacity: 0.8;
				transform: scale(0.98);
			}
		}

		.select-product-btn-cancel {
			margin-right: px2vw(16px);
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
		padding: px2vw(30px);
		border-bottom: 1px solid #eee;
		flex-shrink: 0;

		.employee-modal-title {
			font-size: px2vw(28px);
			font-weight: bold;
			color: #333;
		}

		.employee-modal-close {
			font-size: px2vw(40px);
			color: #999;
			line-height: 1;
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
			padding: px2vw(12px) px2vw(16px);
			border-bottom: 1px solid #f0f0f0;
			cursor: pointer;

			&.active {
				background-color: #e8f4ff;
			}
		}

		.employee-modal-check {
			width: px2vw(28px);
			height: px2vw(28px);
			border: 2px solid #ddd;
			border-radius: px2vw(6px);
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			margin-right: px2vw(12px);
			margin-top: px2vw(2px);

			.check-icon {
				font-size: px2vw(18px);
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
			font-size: px2vw(22px);
			color: #333;
			margin-right: px2vw(12px);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			flex-shrink: 0;
		}

		.employee-modal-position-wrap {
			display: flex;
			flex-direction: row;
			align-items: center;
			flex-shrink: 0;
			gap: px2vw(6px);
			padding: px2vw(4px) px2vw(10px);
			background-color: #f0f2f5;
			border-radius: px2vw(6px);
		}

		.employee-modal-position-label {
			font-size: px2vw(18px);
			color: #666;
		}

		.employee-modal-expand-icon {
			font-size: px2vw(16px);
			color: #999;
			flex-shrink: 0;
		}

		.employee-modal-hours {
			font-size: px2vw(22px);
			color: #f1c40f;
			margin-right: px2vw(16px);
		}

		.employee-modal-wage {
			font-size: px2vw(22px);
			color: #27ae60;
		}

		.employee-modal-position-detail {
			width: 100%;
			border-top: 1px dashed #e0e0e0;
			background-color: #fafbfc;
			padding: px2vw(8px) px2vw(16px) px2vw(12px);
			margin-top: px2vw(8px);
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: px2vw(8px);

			.employee-modal-position-tag {
				font-size: px2vw(18px);
				color: #666;
				background-color: #e8eefc;
				border: 1px solid #d0d7de;
				border-radius: px2vw(6px);
				padding: px2vw(4px) px2vw(10px);
				white-space: nowrap;
				max-width: 100%;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.employee-modal-empty {
			padding: px2vw(60px) 0;
			text-align: center;

			text {
				font-size: px2vw(24px);
				color: #999;
			}
		}
	}
}

// 员工编辑弹窗样式
.employee-edit-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1002;
	display: flex;
	align-items: center;
	justify-content: center;

	.employee-edit-modal-content {
		width: px2vw(800px);
		max-height: 85vh;
		background-color: #fff;
		border-radius: px2vw(20px);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.employee-edit-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: px2vw(20px) px2vw(30px);
		border-bottom: 1px solid #eee;
		flex-shrink: 0;

		.employee-edit-modal-title {
			font-size: px2vw(28px);
			font-weight: bold;
			color: #333;
		}

		.employee-edit-modal-close {
			font-size: px2vw(36px);
			color: #999;
			line-height: 1;
		}
	}

	.employee-edit-modal-body {
		flex: 1;
		overflow-y: auto;
		padding: px2vw(24px);

		.edit-info-row {
			display: flex;
			gap: px2vw(24px);
			margin-bottom: px2vw(24px);

			.info-item {
				flex: 1;
				background-color: #f8f9fa;
				border-radius: px2vw(12px);
				padding: px2vw(12px) px2vw(16px);
				display: flex;
				flex-direction: row;
				align-items: center;
				gap: px2vw(8px);

				.info-label {
					font-size: px2vw(22px);
					color: #999;
				}

				.info-value {
					font-size: px2vw(24px);
					color: #333;
					font-weight: 600;
				}
			}
		}

		.employee-tags-section {
			background-color: #f8f9fa;
			border-radius: px2vw(16px);
			padding: px2vw(20px);

			.section-title {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: px2vw(16px);

				text {
					font-size: px2vw(26px);
					color: #333;
					font-weight: 500;
				}

				.section-count {
					color: #3498db;
					font-size: px2vw(24px);
				}
			}

			.employee-tags-container {
				display: flex;
				flex-wrap: wrap;
				gap: px2vw(12px);
				min-height: px2vw(60px);
				margin-bottom: px2vw(16px);

				.employee-tag-item {
					display: flex;
					align-items: center;
					justify-content: space-between;
					width: calc((100% - px2vw(48px)) / 5);
					background: linear-gradient(135deg, #e8f6f3, #d5efe9);
					border: 1px solid #a3d9c9;
					border-radius: px2vw(8px);
					padding: px2vw(12px) px2vw(10px);
					gap: px2vw(8px);

					.tag-name {
						font-size: px2vw(22px);
						color: #2e8b7a;
						font-weight: 500;
						flex: 1;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}

					.tag-delete {
						width: px2vw(28px);
						height: px2vw(28px);
						border-radius: px2vw(4px);
						background-color: rgba(46, 139, 122, 0.15);
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: px2vw(18px);
						color: #2e8b7a;
						font-weight: bold;
						transition: all 0.2s;

						&:active {
							background-color: rgba(46, 139, 122, 0.3);
							transform: scale(0.95);
						}
					}
				}

				.no-employee-tip {
					display: flex;
					align-items: center;
					justify-content: center;
					width: 100%;
					height: px2vw(60px);

					text {
						font-size: px2vw(24px);
						color: #bbb;
					}
				}
			}

			.add-employee-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				width: calc((100% - px2vw(48px)) / 5);
				background: #f0f0f0;
				border: 1px dashed #ccc;
				border-radius: px2vw(8px);
				padding: px2vw(12px) px2vw(10px);

				.add-btn-icon {
					font-size: px2vw(28px);
					color: #3498db;
					font-weight: bold;
				}
			}
		}
	}

	.employee-edit-modal-footer {
		display: flex;
		border-top: 1px solid #eee;
		flex-shrink: 0;

		.edit-btn-cancel,
		.edit-btn-confirm {
			flex: 1;
			text-align: center;
			padding: px2vw(20px);
			font-size: px2vw(28px);
			transition: background-color 0.15s;

			&:active {
				background-color: #f0f0f0;
				opacity: 0.7;
			}
		}

		.edit-btn-cancel {
			color: #666;
			border-right: 1px solid #eee;
		}

		.edit-btn-confirm {
			color: #3498db;
			font-weight: bold;
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
		max-width: px2vw(800px);
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
				flex: 0 0 px2vw(280px);
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

					.process-action-picker {
						width: 100%;
					}

					.process-action-picker-value {
						height: px2vw(64px);
						padding: 0 px2vw(16px);
						border: 1px solid #d0d8f0;
						border-radius: px2vw(10px);
						font-size: px2vw(24px);
						background-color: #fff;
						display: flex;
						align-items: center;
						color: #333;
						box-shadow: 0 1px 3px rgba(88, 132, 241, 0.08);
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
