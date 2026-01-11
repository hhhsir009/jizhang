'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  console.log('delete-bill invoked', event);

  const { id } = event;

  if (!id) {
    return {
      code: 400,
      msg: 'Missing id parameter',
      data: null
    };
  }

  try {
    const res = await db.collection('transactions').doc(id).remove();

    if (res.deleted === 1) {
      return {
        code: 0,
        msg: 'success',
        data: { deleted: 1 }
      };
    } else {
      return {
        code: 404,
        msg: 'Record not found or already deleted',
        data: null
      };
    }

  } catch (e) {
    console.error('Delete operation failed:', e);
    return {
      code: 500,
      msg: 'Delete failed: ' + e.message,
      data: null
    };
  }
};
