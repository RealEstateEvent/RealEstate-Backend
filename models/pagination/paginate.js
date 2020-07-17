
var findAllAndPaginate = async (model, condition, page, limit, sort, projection) => {
  try {
    var condition = condition || {};
    var page = parseInt(page);
    var limit = parseInt(limit);
    var sort = sort || {};
    var projection = projection || {};

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {};

    const total = await model.countDocuments(condition).exec();

    results.total = total;
    results.docs = await model.find(condition, projection).limit(limit).skip(startIndex).sort(sort).exec();
    return results;
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

module.exports = { findAllAndPaginate };