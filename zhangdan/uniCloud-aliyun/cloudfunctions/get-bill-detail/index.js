'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  console.log('get-bill-detail invoked', event);

  const { id } = event;

  if (!id) {
    return {
      code: 400,
      msg: 'Missing id parameter',
      data: null
    };
  }

  try {
    const res = await db.collection('transactions').doc(id).get();

    if (res.data.length === 0) {
      return {
        code: 404,
        msg: 'Record not found',
        data: null
      };
    }

    const item = res.data[0];

    // Format date similar to get-bills but maybe more detailed if needed
    const dateStr = item.date || item.occurDate || item.record_date;
    let displayDate = '';
    
    if (dateStr) {
       displayDate = dateStr; // Keep original format YYYY-MM-DD or whatever it is for detail page
    }

    // Extract time
    let displayTime = '';
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      displayTime = `${hh}:${mm}`;
    } else if (item.occurTime) {
      displayTime = item.occurTime;
    }

    const formattedData = {
      _id: item._id,
      type: item.type,
      amount: item.amount,
      category: item.category || item.categoryKey || item.categoryName || '未分类',
      note: item.remark || item.note || '',
      date: displayDate,
      time: displayTime,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };

    return {
      code: 0,
      msg: 'success',
      data: formattedData
    };

  } catch (e) {
    console.error('Database query failed:', e);
    return {
      code: 500,
      msg: 'Query failed: ' + e.message,
      data: null
    };
  }
};
