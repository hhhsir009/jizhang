'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  console.log('get-bills 被调用', event);

  try {
    const { limit = 20 } = event;
    
    // 从 transactions 集合获取数据，按创建时间倒序
    const res = await db.collection('transactions')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
      
    console.log('transactions 查询结果:', res);

    // 格式化数据以适配前端展示
    // 前端要求：分类对应 category，日期对应 date
    const formattedData = res.data.map(item => {
      // 兼容多种日期字段: date, occurDate, record_date
      const dateStr = item.date || item.occurDate || item.record_date;
      let displayDate = '未知日期';
      
      if (dateStr) {
        // 如果是 YYYY-MM-DD 格式，转换为 MM月DD日
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          displayDate = `${parts[1]}月${parts[2]}日`;
        } else {
          displayDate = dateStr;
        }
      }

      // 提取时间 HH:mm
      let displayTime = '';
      if (item.createdAt) {
        const d = new Date(item.createdAt);
        // 简单补零
        const hh = d.getHours().toString().padStart(2, '0');
        const mm = d.getMinutes().toString().padStart(2, '0');
        displayTime = `${hh}:${mm}`;
      } else if (item.occurTime) {
        displayTime = item.occurTime;
      }

      return {
        _id: item._id,
        type: item.type,
        amount: item.amount,
        // 根据最新数据结构，直接使用 category 字段
        category: item.category || item.categoryKey || item.categoryName || '未分类',
        // 备注字段兼容 remark 和 note
        note: item.remark || item.note || '',
        date: displayDate, 
        time: displayTime, // 新增时间字段
        originalDate: dateStr // 保留原始日期以便调试
      };
    });

    return {
      code: 0,
      msg: 'success',
      data: formattedData
    };
    
  } catch (e) {
    console.error('查询数据库失败:', e);
    return {
      code: 500,
      msg: '查询失败: ' + e.message,
      data: []
    };
  }
};
