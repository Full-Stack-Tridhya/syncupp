exports.paginationObject = (paginationObject) => {
  const page = paginationObject.page || 1;
  const resultPerPage = paginationObject.itemsPerPage || 10;
  const skip = resultPerPage * (page - 1);
  const sortOrder = paginationObject.sortOrder === "asc" ? 1 : -1;

  const sortField =
    paginationObject.sortField !== "permission"
      ? paginationObject.sortField !== ""
        ? paginationObject.sortField
        : "createdAt"
      : "createdAt";
  const sort = {};
  sort[sortField] = sortOrder;
  return { page, skip, resultPerPage, sort };
};

exports.getKeywordType = (keyword) => {
  if (!isNaN(keyword)) {
    return "number";
  } else if (Date.parse(keyword)) {
    return "date";
  } else {
    return "string";
  }
};

exports.calculateInvoice = (invoice_content) => {
  let total = 0;
  const totalData = invoice_content.map((item) => {
    return item.qty * item.rate * (1 + item.tax / 100);
  });
  totalData.forEach((item) => (total += item));

  let sub_total = 0;
  const subTotalData = invoice_content.map((item) => {
    return item.qty * item.rate;
  });
  subTotalData.forEach((item) => (sub_total += item));

  // Round off to 0 digits after the decimal point
  total = total.toFixed(2).replace(/\.(\d)$/, ".$10");
  sub_total = sub_total.toFixed(2).replace(/\.(\d)$/, ".$10");
  return { total, sub_total };
};

exports.calculateAmount = (items) => {
  items.forEach((item) => {
    const amount = item.qty * item.rate * (1 + item.tax / 100);
    item.amount = parseFloat(amount.toFixed(2)); // Round to 0 decimal places
  });

  return items;
};
