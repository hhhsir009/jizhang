<template>
	<view class="container">
		<!-- 头部导航 -->
		<view class="header">
			<view class="menu-btn" @click="showSidebar">
				<text class="iconfont icon-menu"></text>
				<view class="menu-line"></view>
				<view class="menu-line"></view>
				<view class="menu-line"></view>
			</view>
			<text class="title">我的账单</text>
			<view class="placeholder"></view>
		</view>

		<!-- 财务摘要卡片 -->
		<view class="summary-card">
			<view class="card-header">
				<text class="month">{{ currentYearMonth }}</text>
			</view>
			<view class="card-content">
				<view class="summary-item">
					<text class="label">总收入</text>
					<text class="value income">+{{ totalIncome.toFixed(2) }}</text>
				</view>
				<view class="summary-item">
					<text class="label">总支出</text>
					<text class="value expense">-{{ totalExpense.toFixed(2) }}</text>
				</view>
				<view class="divider"></view>
				<view class="summary-item balance-item">
					<text class="label">结余</text>
					<text class="value balance">{{ balance.toFixed(2) }}</text>
				</view>
			</view>
		</view>

		<!-- 流水记录瀑布流 -->
		<view class="record-list">
			<view class="date-card" v-for="(group, date) in groupedRecords" :key="date">
				<view class="date-header">
					<text class="date-text">{{ date }}</text>
					<view class="day-summary">
						<text class="day-income" v-if="group.income > 0">入: {{ group.income.toFixed(2) }}</text>
						<text class="day-expense" v-if="group.expense > 0">支: {{ group.expense.toFixed(2) }}</text>
					</view>
				</view>
				<view class="record-items">
					<view class="record-item" v-for="(item, index) in group.list" :key="index">
						<view class="item-left">
							<view class="category-icon">{{ item.category.substring(0, 1) }}</view>
							<view class="item-info">
								<text class="category-name">{{ item.category }}</text>
								<text class="note" v-if="item.note">{{ item.note }}</text>
							</view>
						</view>
						<view class="item-right">
							<text class="amount" :class="item.type">{{ item.type === 'income' ? '+' : '-' }}{{ item.amount.toFixed(2) }}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="Object.keys(groupedRecords).length === 0">
				<text class="empty-text">最近还没有记账记录哦~</text>
			</view>
		</view>

		<!-- 记一笔按钮 -->
		<view class="action-bar">
			<button class="record-btn" @click="showRecordPopup">记一笔</button>
		</view>

		<!-- 记账弹出层 -->
		<view class="record-popup-mask" v-if="recordPopupVisible" @click="hideRecordPopup"></view>
		<view class="record-popup" :class="{ 'popup-show': recordPopupVisible }">
			<view class="popup-header">
				<text class="title">记一笔</text>
			</view>

			<view class="amount-section" @click="focusAmount">
				<text class="currency">¥</text>
				<view class="amount-display" :class="{ empty: !formData.amount }">
					{{ formData.amount || '0.00' }}
					<view class="cursor" v-if="recordPopupVisible"></view>
				</view>
			</view>

			<view class="form-section">
				<view class="type-switch">
					<view class="type-item" :class="{ active: formData.type === 'expense' }" @click="formData.type = 'expense'">支出</view>
					<view class="type-item" :class="{ active: formData.type === 'income' }" @click="formData.type = 'income'">收入</view>
				</view>

				<scroll-view class="category-scroll" scroll-x="true" show-scrollbar="false">
					<view class="category-row">
						<view class="category-item" 
							v-for="item in currentCategories" 
							:key="item"
							:class="{ active: formData.category === item }"
							@click="formData.category = item">
							<view class="cat-icon">{{ item.substring(0, 1) }}</view>
							<text class="cat-name">{{ item }}</text>
						</view>
					</view>
				</scroll-view>

				<view class="note-input-wrapper">
					<input class="note-input" type="text" v-model="formData.note" placeholder="添加备注..." />
				</view>
			</view>

			<!-- 自定义数字键盘 -->
			<view class="keypad">
				<view class="key" v-for="key in keys" :key="key" @click="handleKeyPress(key)" 
					:class="{ 
						'exit-key': key === '保存退出', 
						'continue-key': key === '保存继续',
						'op-key': key === '-' || key === '+'
					}">
					{{ key }}
				</view>
			</view>
		</view>

		<!-- 侧边栏菜单 -->
		<view class="sidebar-mask" v-if="sidebarVisible" @click="hideSidebar"></view>
		<view class="sidebar" :class="{ 'sidebar-show': sidebarVisible }">
			<view class="sidebar-header">
				<view class="user-info">
					<image class="avatar" src="/static/logo.png" mode="aspectFill"></image>
					<text class="nickname">微信用户</text>
				</view>
			</view>
			<view class="sidebar-list">
				<view class="sidebar-item" @click="navigateTo('/pages/settings/settings')">
					<text class="item-text">设置</text>
				</view>
			</view>
			<view class="sidebar-footer">
				<text class="version">V 1.0.0</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				sidebarVisible: false,
				currentYearMonth: '2024年01月',
				totalIncome: 0.00,
				totalExpense: 0.00,
				balance: 0.00,
				records: [], // 原始记录列表
				recordPopupVisible: false,
				formData: {
					type: 'expense',
					amount: '',
					category: '餐饮',
					note: ''
				},
				expression: '', // 用于实时计算的表达式
				categories: {
					expense: ['餐饮', '交通', '购物', '娱乐', '医疗', '其他'],
					income: ['工资', '兼职', '理财', '礼金', '其他']
				},
				keys: ['7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '保存继续', 'C', '0', '.', '保存退出']
			}
		},
		computed: {
			currentCategories() {
				return this.categories[this.formData.type];
			},
			groupedRecords() {
				const groups = {};
				this.records.forEach(record => {
					const date = record.date;
					if (!groups[date]) {
						groups[date] = {
							list: [],
							income: 0,
							expense: 0
						};
					}
					groups[date].list.push(record);
					if (record.type === 'income') {
						groups[date].income += record.amount;
					} else {
						groups[date].expense += record.amount;
					}
				});
				return groups;
			}
		},
		onLoad() {
			this.updateCurrentDate();
			this.fetchSummaryData();
			this.fetchRecords();
		},
		methods: {
			updateCurrentDate() {
				const now = new Date();
				const year = now.getFullYear();
				const month = (now.getMonth() + 1).toString().padStart(2, '0');
				this.currentYearMonth = `${year}年${month}月`;
			},
			fetchSummaryData() {
				// 模拟汇总数据
				this.totalIncome = 5000.00;
				this.totalExpense = 2350.00;
				this.balance = this.totalIncome - this.totalExpense;
			},
			fetchRecords() {
				// 模拟最近流水数据
				const now = new Date();
				const formatDate = (date) => {
					const m = (date.getMonth() + 1).toString().padStart(2, '0');
					const d = date.getDate().toString().padStart(2, '0');
					return `${m}月${d}日`;
				};

				const today = new Date();
				const yesterday = new Date(today);
				yesterday.setDate(today.getDate() - 1);

				this.records = [
					{ type: 'expense', amount: 25.50, category: '餐饮', note: '午饭-黄焖鸡', date: formatDate(today) },
					{ type: 'expense', amount: 12.00, category: '交通', note: '打车', date: formatDate(today) },
					{ type: 'income', amount: 5000.00, category: '工资', note: '1月工资', date: formatDate(yesterday) },
					{ type: 'expense', amount: 150.00, category: '购物', note: '超市买菜', date: formatDate(yesterday) }
				];
			},
			showSidebar() {
				this.sidebarVisible = true;
			},
			hideSidebar() {
				this.sidebarVisible = false;
			},
			showRecordPopup() {
				this.formData = {
					type: 'expense',
					amount: '',
					category: '餐饮',
					note: ''
				};
				this.expression = '';
				this.recordPopupVisible = true;
			},
			hideRecordPopup() {
				this.recordPopupVisible = false;
			},
			handleKeyPress(key) {
				if (key === '保存退出') {
					this.evaluateExpression();
					this.saveRecord(true);
					return;
				}
				if (key === '保存继续') {
					this.evaluateExpression();
					this.saveRecord(false);
					return;
				}
				if (key === 'C') {
					this.expression = '';
					this.formData.amount = '';
					return;
				}
				
				if (key === '+' || key === '-') {
					// 如果最后一位是操作符，则替换它
					if (['+', '-'].includes(this.expression.slice(-1))) {
						this.expression = this.expression.slice(0, -1) + key;
					} else if (this.expression) {
						// 先计算当前结果，再添加操作符实现连加连减
						this.evaluateExpression();
						this.expression = this.formData.amount + key;
					}
					return;
				}
				
				if (key === '.') {
					// 找到当前正在输入的数字部分
					const parts = this.expression.split(/[+-]/);
					const currentNum = parts[parts.length - 1];
					if (currentNum.includes('.')) return;
				}

				this.expression += key;
				this.updateRealtimeAmount();
			},
			updateRealtimeAmount() {
				// 实时更新显示金额，如果是表达式则尝试显示计算结果
				if (!this.expression) {
					this.formData.amount = '';
					return;
				}
				try {
					// 简单处理：如果是纯数字直接赋值，如果是表达式则实时计算预览
					const result = this.calculate(this.expression);
					if (!isNaN(result)) {
						this.formData.amount = result.toString();
					}
				} catch (e) {
					// 表达式不完整时保持原样
				}
			},
			evaluateExpression() {
				try {
					const result = this.calculate(this.expression);
					if (!isNaN(result)) {
						this.formData.amount = result.toFixed(2);
						this.expression = this.formData.amount;
					}
				} catch (e) {
					console.error('Calculation error', e);
				}
			},
			calculate(exp) {
				if (!exp) return 0;
				// 处理末尾的操作符
				let safeExp = exp;
				if (['+', '-'].includes(exp.slice(-1))) {
					safeExp = exp.slice(0, -1);
				}
				// 简单的加减计算逻辑
				const tokens = safeExp.match(/(\d+\.?\d*)|[+-]/g) || [];
				if (tokens.length === 0) return 0;
				
				let total = parseFloat(tokens[0]);
				for (let i = 1; i < tokens.length; i += 2) {
					const op = tokens[i];
					const val = parseFloat(tokens[i + 1]);
					if (op === '+') total += val;
					if (op === '-') total -= val;
				}
				return total;
			},
			saveRecord(shouldExit = true) {
				if (!this.formData.amount || parseFloat(this.formData.amount) <= 0) {
					uni.showToast({ title: '请输入有效金额', icon: 'none' });
					return;
				}
				
				const now = new Date();
				const m = (now.getMonth() + 1).toString().padStart(2, '0');
				const d = now.getDate().toString().padStart(2, '0');
				const dateStr = `${m}月${d}日`;

				const newRecord = {
					...this.formData,
					amount: parseFloat(this.formData.amount),
					date: dateStr
				};

				this.records.unshift(newRecord);
				
				// 更新汇总数据（简单模拟）
				if (newRecord.type === 'income') {
					this.totalIncome += newRecord.amount;
				} else {
					this.totalExpense += newRecord.amount;
				}
				this.balance = this.totalIncome - this.totalExpense;

				if (shouldExit) {
					this.hideRecordPopup();
					uni.showToast({ title: '记账成功', icon: 'success' });
				} else {
					// 再记一笔，重置金额和备注，保留类型和分类
					this.formData.amount = '';
					this.formData.note = '';
					uni.showToast({ title: '已保存，请继续', icon: 'none' });
				}
			},
			navigateTo(url) {
				this.hideSidebar();
				uni.navigateTo({
					url: url
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 0 30rpx;
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 100rpx;
		padding-top: var(--status-bar-height);
		
		.menu-btn {
			width: 60rpx;
			height: 60rpx;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: flex-start;
			
			.menu-line {
				width: 40rpx;
				height: 4rpx;
				background-color: #333;
				margin: 4rpx 0;
				border-radius: 2rpx;
			}
		}
		
		.title {
			font-size: 36rpx;
			font-weight: bold;
			color: #333;
		}
		
		.placeholder {
			width: 60rpx;
		}
	}

	.summary-card {
		background: linear-gradient(135deg, #42b983 0%, #35495e 100%);
		border-radius: 24rpx;
		padding: 40rpx;
		margin-top: 30rpx;
		color: #fff;
		box-shadow: 0 10rpx 30rpx rgba(66, 185, 131, 0.3);

		.card-header {
			margin-bottom: 30rpx;
			.month {
				font-size: 32rpx;
				opacity: 0.9;
			}
		}

		.card-content {
			display: flex;
			flex-direction: column;
			gap: 20rpx;

			.summary-item {
				display: flex;
				justify-content: space-between;
				align-items: center;

				.label {
					font-size: 28rpx;
					opacity: 0.8;
				}

				.value {
					font-size: 36rpx;
					font-weight: 500;
					
					&.income {
						color: #fff;
					}
					
					&.expense {
						color: #ffcfcf;
					}
				}
			}

			.divider {
				height: 1rpx;
				background-color: rgba(255, 255, 255, 0.2);
				margin: 10rpx 0;
			}

			.balance-item {
				.label {
					font-size: 32rpx;
					opacity: 1;
				}
				.balance {
					font-size: 48rpx;
					font-weight: bold;
				}
			}
		}
	}

	.record-list {
		margin-top: 40rpx;
		padding-bottom: 40rpx;

		.date-card {
			background-color: #fff;
			border-radius: 20rpx;
			padding: 24rpx;
			margin-bottom: 30rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

			.date-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding-bottom: 20rpx;
				border-bottom: 1rpx solid #f0f0f0;
				margin-bottom: 20rpx;

				.date-text {
					font-size: 28rpx;
					font-weight: bold;
					color: #666;
				}

				.day-summary {
					font-size: 24rpx;
					display: flex;
					gap: 20rpx;

					.day-income {
						color: #42b983;
					}

					.day-expense {
						color: #ff5a5f;
					}
				}
			}

			.record-items {
				.record-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 16rpx 0;

					.item-left {
						display: flex;
						align-items: center;

						.category-icon {
							width: 70rpx;
							height: 70rpx;
							background-color: #f0f9f4;
							color: #42b983;
							border-radius: 50%;
							display: flex;
							justify-content: center;
							align-items: center;
							font-size: 32rpx;
							font-weight: bold;
							margin-right: 20rpx;
						}

						.item-info {
							display: flex;
							flex-direction: column;

							.category-name {
								font-size: 30rpx;
								color: #333;
							}

							.note {
								font-size: 24rpx;
								color: #999;
								margin-top: 4rpx;
							}
						}
					}

					.item-right {
						.amount {
							font-size: 32rpx;
							font-weight: bold;

							&.income {
								color: #42b983;
							}

							&.expense {
								color: #333;
							}
						}
					}
				}
			}
		}

		.empty-state {
			padding: 100rpx 0;
			text-align: center;

			.empty-text {
				font-size: 28rpx;
				color: #999;
			}
		}
	}

	.action-bar {
		position: fixed;
		bottom: 40rpx;
		left: 30rpx;
		right: 30rpx;
		z-index: 90;
		
		.record-btn {
			width: 100%;
			height: 100rpx;
			line-height: 100rpx;
			background-color: #42b983;
			color: #fff;
			border-radius: 50rpx;
			font-size: 36rpx;
			font-weight: bold;
			box-shadow: 0 6rpx 20rpx rgba(66, 185, 131, 0.4);
			
			&:active {
				transform: scale(0.98);
				opacity: 0.9;
			}
		}
	}

	/* 记账弹出层样式 */
	.record-popup-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 1001;
	}

	.record-popup {
		position: fixed;
		left: 0;
		right: 0;
		bottom: -100%;
		background-color: #fff;
		border-radius: 40rpx 40rpx 0 0;
		z-index: 1002;
		transition: bottom 0.3s ease;
		padding-bottom: env(safe-area-inset-bottom);

		&.popup-show {
			bottom: 0;
		}

		.popup-header {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 30rpx 40rpx;
			border-bottom: 1rpx solid #f5f5f5;

			.title { font-size: 34rpx; font-weight: bold; color: #333; }
		}

		.amount-section {
			padding: 40rpx;
			display: flex;
			align-items: center;
			border-bottom: 1rpx solid #f5f5f5;

			.currency {
				font-size: 48rpx;
				font-weight: bold;
				margin-right: 20rpx;
				color: #333;
			}

			.amount-display {
				flex: 1;
				font-size: 60rpx;
				height: 80rpx;
				line-height: 80rpx;
				font-weight: bold;
				color: #333;
				display: flex;
				align-items: center;

				&.empty {
					color: #ccc;
				}

				.cursor {
					width: 4rpx;
					height: 60rpx;
					background-color: #42b983;
					margin-left: 4rpx;
					animation: blink 1s infinite;
				}
			}
		}

		@keyframes blink {
			0%, 100% { opacity: 1; }
			50% { opacity: 0; }
		}

		.form-section {
			padding: 30rpx 40rpx;

			.type-switch {
				display: flex;
				background-color: #f5f5f5;
				border-radius: 12rpx;
				padding: 6rpx;
				margin-bottom: 30rpx;

				.type-item {
					flex: 1;
					text-align: center;
					padding: 16rpx 0;
					font-size: 28rpx;
					color: #666;
					border-radius: 10rpx;
					transition: all 0.2s;

					&.active {
						background-color: #fff;
						color: #42b983;
						font-weight: bold;
						box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
					}
				}
			}

			.category-scroll {
				width: 100%;
				white-space: nowrap;
				margin-bottom: 40rpx;

				.category-row {
					display: inline-flex;
					padding: 10rpx 0;

					.category-item {
						width: 160rpx;
						display: flex;
						flex-direction: column;
						align-items: center;
						gap: 12rpx;

						.cat-icon {
							width: 90rpx;
							height: 90rpx;
							background-color: #f8f8f8;
							border-radius: 50%;
							display: flex;
							justify-content: center;
							align-items: center;
							font-size: 36rpx;
							color: #666;
							transition: all 0.2s;
						}

						.cat-name {
							font-size: 24rpx;
							color: #666;
						}

						&.active {
							.cat-icon {
								background-color: #e8f5ee;
								color: #42b983;
								transform: scale(1.1);
							}
							.cat-name {
								color: #42b983;
								font-weight: bold;
							}
						}
					}
				}
			}

			.note-input-wrapper {
				background-color: #f8f8f8;
				border-radius: 12rpx;
				padding: 20rpx;

				.note-input {
					font-size: 28rpx;
					width: 100%;
				}
			}
		}

		/* 键盘样式 */
		.keypad {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			background-color: #f5f5f5;
			gap: 1rpx;
			padding-bottom: env(safe-area-inset-bottom);

			.key {
				height: 120rpx;
				background-color: #fff;
				display: flex;
				justify-content: center;
				align-items: center;
				font-size: 36rpx;
				font-weight: 500;
				color: #333;

				&:active {
					background-color: #f0f0f0;
				}

				&.exit-key {
					background-color: #42b983;
					color: #fff;
					font-weight: bold;
					font-size: 26rpx;
					
					&:active {
						background-color: #3aa876;
					}
				}

				&.continue-key {
					background-color: #e8f5ee;
					color: #42b983;
					font-size: 26rpx;

					&:active {
						background-color: #d1eada;
					}
				}

				&.op-key {
					background-color: #fafafa;
					color: #666;
				}
			}
		}
	}

	/* 侧边栏样式 */
	.sidebar-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
	}

	.sidebar {
		position: fixed;
		top: 0;
		left: -80%;
		width: 80%; /* 4/5 宽度 */
		height: 100%;
		background-color: #fff;
		z-index: 1000;
		transition: left 0.3s ease;
		padding-top: var(--status-bar-height);
		box-shadow: 10rpx 0 30rpx rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;

		&.sidebar-show {
			left: 0;
		}

		.sidebar-header {
			padding: 40rpx;
			border-bottom: 1rpx solid #f5f5f5;
			
			.user-info {
				display: flex;
				align-items: center;
				
				.avatar {
					width: 100rpx;
					height: 100rpx;
					border-radius: 50%;
					background-color: #f0f0f0;
					margin-right: 24rpx;
					border: 4rpx solid #e8f5ee;
				}
				
				.nickname {
					font-size: 36rpx;
					font-weight: bold;
					color: #333;
				}
			}
		}

		.sidebar-list {
			padding: 20rpx 0;
			flex: 1;
			
			.sidebar-item {
				padding: 30rpx 40rpx;
				display: flex;
				align-items: center;
				
				&:active {
					background-color: #f5f5f5;
				}
				
				.item-text {
					font-size: 32rpx;
					color: #333;
				}
			}
		}

		.sidebar-footer {
			padding: 40rpx;
			padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
			text-align: center;
			border-top: 1rpx solid #f5f5f5;
			background-color: #fff;
			z-index: 1010;
			
			.version {
				font-size: 24rpx;
				color: #999;
			}
		}
	}
</style>
