import { post } from '@/utils/request'

export const reportCdnError = data => post('/edu/cdn/error/report', data, { skipErrorMessage: true })
