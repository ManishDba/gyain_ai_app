 import { ENV } from "../env";
 const BASE_URL = ENV.BASE_URL

const endpoint = {
  login: () => BASE_URL + `mobauth/login/`,
  verifyOtp: () => BASE_URL + `mobauth/verify-otp/`,
  category: () =>
    BASE_URL + `categories/?page=1&page_size=10000&full_perms=true`,
  metadata: () => BASE_URL + `metadata/query/`,
  req_daily: () => BASE_URL + `req_daily/`,
  req_monthly: () => BASE_URL + `req_monthly/`,
  user_month_req: () => BASE_URL + `user_month_req/`,
  profile: () => BASE_URL + `profile/`,
  documents: (filter = {}) => {
    const base = `${BASE_URL}documents/`;
    const defaultParams = {
      page: 1,
      page_size: 1000,
      truncate_content: true,
    };
    const finalParams = { ...defaultParams, ...filter };
    const query = new URLSearchParams(finalParams).toString();
    return `${base}?${query}`;
  },
  documentsPreview: (documentId) =>
    BASE_URL + `documents/${documentId}/preview/`,
  documentsDownload: (documentId) =>
    BASE_URL + `documents/${documentId}/download/`,
  clearContext: () => BASE_URL + `clearcontext/`,
  sourcesContext: () => BASE_URL + `keyword/sources/`,
  docsourcesContext: () => BASE_URL + `keyword/docsources/`,
  uploadDocument: () => BASE_URL + `documents/post_document/`,
  searchAiDocument: () => BASE_URL + `searchai/docs/`, //
  serachExactDocument: () => BASE_URL + `search/docs/`,
  getThumbnailUrl: (id) => BASE_URL + `documents/${id}/thumb/`,
  users: () => BASE_URL + `users/`,
  dasbobards: () => BASE_URL + `dashboard/`,
  dasbobardsByid: () => BASE_URL + `dashboard/${id}`,
  savedquery: () => BASE_URL + `savedquery/`,
  sqindicators: () => BASE_URL + `exec/sq/`, //
  document_Apis: () => BASE_URL + `apis/`,
  datasets_xls: () => BASE_URL + `xls/`,
  datasets_savedquery: () => BASE_URL + `savedquery/`,
  savedquerybyid: (id) => BASE_URL + `savedquery/${id}/`,
  datasets_xlsquery: () => BASE_URL + `search/tabenglish/`, //
  datasets_Sql: () => BASE_URL + `sql/`,
  bulkSearch: () => BASE_URL + `searchdoc/complete/`,
  tag: () => BASE_URL + `tags/?page=1&page_size=10000&full_perms=true/`,
  document_type: () =>
    BASE_URL + `document_types/?page=1&page_size=10000&full_perms=true`,
  document_summaryaI: () => BASE_URL + `summaryai/docs/`,
  document_compareai: () => BASE_URL + `compareai/docs/`,
  document_bulkai: () => BASE_URL + `bulkai/docs/`,
  config: () => BASE_URL + `config/`,

  // Whisper API Endpoints
  whisperApiUrl: () => "wss://gyanhub.iffco.in/whisper", // Replace with your actual API URL
  whisperApiKey: () => "thisisanexamplesecretkey", // Replace with your actual API secret key
};
export default endpoint;
