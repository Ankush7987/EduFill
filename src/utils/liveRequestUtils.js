export const toBackendRequestId = (request = {}) =>
  String(
    request?._id ||
    request?.id ||
    request?.requestId ||
    request?.backendRequestId ||
    request?.firebaseRequestId ||
    ''
  ).trim();

export const toLiveRequestId = (request = {}) =>
  String(
    request?.requestId ||
    request?._id ||
    request?.id ||
    request?.backendRequestId ||
    request?.firebaseRequestId ||
    ''
  ).trim();

export const getBackendStatus = (request = {}) =>
  String(request?.status || '').trim();

export const isSearchingStatus = (status = '') =>
  ['Searching', 'Offered', 'QUEUED', 'OFFERED'].includes(String(status).trim());

export const isAcceptedStatus = (status = '') =>
  ['Accepted', 'In Progress', 'ACCEPTED', 'IN_PROGRESS'].includes(String(status).trim());

export const isCompletedStatus = (status = '') =>
  ['Completed', 'COMPLETED', 'Success', 'Done'].includes(String(status).trim());

export const toPastFormDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};