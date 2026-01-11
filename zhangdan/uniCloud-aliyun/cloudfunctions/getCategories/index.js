'use strict';

const db = uniCloud.database()

exports.main = async (event, context) => {
  // event 可以传 userId 和 type
  const { userId = 'system', type } = event

  try {
    let collection = db.collection('categories')

    // 构建查询条件
    let whereClause = { userId }
    if (type) {
      whereClause.type = type
    }

    // 查询分类，并按创建时间排序
    const res = await collection
      .where(whereClause)
      .orderBy('createdAt', 'asc')
      .get()

    return {
      success: true,
      data: res.data
    }

  } catch (err) {
    console.error('查询分类失败:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
