<template>
	<view class="container">
		<view class="header" v-if="record">
			<view class="category-icon">
				{{ record.category ? record.category.substring(0, 1) : '?' }}
			</view>
			<text class="category-name">{{ record.category }}</text>
		</view>

		<view class="amount-card" v-if="record">
			<text class="amount" :class="record.type">
				{{ record.type === 'income' ? '+' : '-' }}{{ Number(record.amount).toFixed(2) }}
			</text>
		</view>

		<view class="info-list" v-if="record">
			<view class="info-item">
				<text class="label">类型</text>
				<text class="value">{{ record.type === 'income' ? '收入' : '支出' }}</text>
			</view>
			<view class="info-item">
				<text class="label">日期</text>
				<text class="value">{{ record.date }} {{ record.time }}</text>
			</view>
			<view class="info-item">
				<text class="label">备注</text>
				<text class="value">{{ record.note || '无备注' }}</text>
			</view>
		</view>
		
		<view class="footer-actions" v-if="record">
			<button class="btn delete-btn" @click="handleDelete">删除</button>
			<button class="btn edit-btn" @click="handleEdit">编辑</button>
		</view>
		
		<view class="loading-state" v-if="loading">
			<text>加载中...</text>
		</view>
		
		<view class="error-state" v-if="error">
			<text>{{ error }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				id: '',
				record: null,
				loading: true,
				error: ''
			}
		},
		onLoad(options) {
			if (options.id) {
				this.id = options.id;
				this.fetchDetail();
			} else {
				this.error = '参数错误';
				this.loading = false;
			}
		},
		methods: {
			async fetchDetail() {
				this.loading = true;
				try {
					const { result } = await uniCloud.callFunction({
						name: 'get-bill-detail',
						data: {
							id: this.id
						}
					});

					if (result.code === 0) {
						this.record = result.data;
					} else {
						this.error = result.msg || '获取详情失败';
					}
				} catch (e) {
					console.error('Fetch detail failed:', e);
					this.error = '网络请求失败';
				} finally {
					this.loading = false;
				}
			},
			handleDelete() {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这条记录吗？',
					success: async (res) => {
						if (res.confirm) {
							this.deleteRecord();
						}
					}
				});
			},
			async deleteRecord() {
				uni.showLoading({ title: '删除中...' });
				try {
					const { result } = await uniCloud.callFunction({
						name: 'delete-bill',
						data: { id: this.id }
					});
					
					if (result.code === 0) {
						uni.showToast({ title: '删除成功' });
						setTimeout(() => {
							// 返回上一页并刷新
							const pages = getCurrentPages();
							const prevPage = pages[pages.length - 2];
							if (prevPage && prevPage.$vm && prevPage.$vm.fetchRecords) {
								prevPage.$vm.fetchRecords();
							}
							uni.navigateBack();
						}, 1500);
					} else {
						uni.showToast({ title: result.msg || '删除失败', icon: 'none' });
					}
				} catch (e) {
					console.error('Delete failed:', e);
					uni.showToast({ title: '删除失败', icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			},
			handleEdit() {
				uni.showToast({ title: '编辑功能开发中...', icon: 'none' });
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 40rpx;
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 40rpx;
		margin-bottom: 30rpx;

		.category-icon {
			width: 120rpx;
			height: 120rpx;
			background-color: #fff;
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 60rpx;
			color: #42b983;
			margin-bottom: 20rpx;
			box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
		}

		.category-name {
			font-size: 32rpx;
			color: #333;
			font-weight: bold;
		}
	}

	.amount-card {
		display: flex;
		justify-content: center;
		margin-bottom: 60rpx;

		.amount {
			font-size: 72rpx;
			font-weight: bold;

			&.income {
				color: #42b983;
			}

			&.expense {
				color: #333;
			}
		}
	}

	.info-list {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 0 30rpx;

		.info-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx 0;
			border-bottom: 1rpx solid #f0f0f0;

			&:last-child {
				border-bottom: none;
			}

			.label {
				font-size: 28rpx;
				color: #999;
			}

			.value {
				font-size: 28rpx;
				color: #333;
			}
		}
	}
	
	.loading-state, .error-state {
		text-align: center;
		margin-top: 100rpx;
		color: #999;
		font-size: 28rpx;
	}
	
	.footer-actions {
		margin-top: 60rpx;
		display: flex;
		gap: 30rpx;
		padding: 0 30rpx;
		
		.btn {
			flex: 1;
			height: 88rpx;
			line-height: 88rpx;
			border-radius: 44rpx;
			font-size: 32rpx;
			font-weight: bold;
			
			&.delete-btn {
				background-color: #fff;
				color: #ff5a5f;
				border: 1rpx solid #ff5a5f;
			}
			
			&.edit-btn {
				background-color: #42b983;
				color: #fff;
			}
			
			&:active {
				opacity: 0.8;
			}
		}
	}
</style>
