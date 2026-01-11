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

    // 验证日期格式 YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return {
        code: 400,
        msg: '日期格式无效，应为 YYYY-MM-DD'
      };
    }

    // 验证日期有效性 (例如 2026-02-30 是无效的)
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return {
        code: 400,
        msg: '日期无效'
      };
    }
    
    // 再次确认转换回字符串是否一致（处理 2026-02-31 自动变为 03-03 的情况）
    // 注意：new Date('2026-02-31') 在 UTC 下可能表现正常，但这里我们只关心年月日
    // 简单的拆分校验
    const [y, m, d] = date.split('-').map(Number);
    const checkDate = new Date(y, m - 1, d);
    if (checkDate.getFullYear() !== y || checkDate.getMonth() + 1 !== m || checkDate.getDate() !== d) {
       return {
        code: 400,
        msg: '日期不存在'
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
      date: date, // 确保写入的是验证过的 YYYY-MM-DD 字符串
      remark: note || '', // 数据库字段为 remark
      createdAt: now.toISOString() // ISO 时间格式，记录创建时间
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
