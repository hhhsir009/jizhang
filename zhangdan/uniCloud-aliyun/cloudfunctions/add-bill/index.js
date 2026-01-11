'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  console.log('add-bill 被调用', event);

  try {
    const {
      type, // 'income' | 'expense'
      amount, // 数字
      category, // 分类名称
      date, // YYYY-MM-DD
      note // 备注 (前端参数名)
    } = event;

    // 1. 参数校验
    if (!type || !amount || !category || !date) {
      return {
        code: 400,
        msg: '参数不完整'
      };
    }

    // 2. 构造数据库记录
    // 严格按照用户指定的数据结构
    const now = new Date();
    const record = {
      userId: 'user_7890', // 固定使用示例中的 ID
      category: category,
      amount: Number(amount),
      type: type,
      date: date,
      remark: note || '', // 数据库字段为 remark
      createdAt: now.toISOString() // ISO 时间格式
    };

    // 3. 插入数据库
    const res = await db.collection('transactions').add(record);
    
    console.log('添加成功:', res);

    return {
      code: 0,
      msg: '记账成功',
      data: {
        id: res.id
      }
    };

  } catch (e) {
    console.error('记账失败:', e);
    return {
      code: 500,
      msg: '记账失败: ' + e.message
    };
  }
};
