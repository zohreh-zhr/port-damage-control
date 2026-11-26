import { defineStore } from 'pinia'
import { getReports, createReport, updateReportStatus, deleteReport, ReportsApiError } from 'src/services/reportsApi'

const STORAGE_KEY = 'port-damage-reports-v1'

const isBrowser = () => typeof window !== 'undefined'

//ساخت کد پیگیری
const createTrackingCode = () => {
  const timePart = Date.now().toString().slice(-6)
  const randomPart = Math.floor(10 + Math.random() * 90)
  return `PORT-${timePart}-${randomPart}`
}
//عتبارسنجی گزارش ذخیره‌شده
const isValidReport = (report) => {
  return (
    report &&
    typeof report === 'object' &&
    typeof report.id === 'string' &&
    typeof report.title === 'string' &&
    typeof report.description === 'string' &&
    typeof report.location === 'string' &&
    ['normal', 'warning', 'medium', 'critical'].includes(report.priority) &&
    ['در انتظار بررسی فنی', 'در حال تعمیر', 'رفع شده'].includes(report.status)
  )
}
 
const normalizeReport = (report) => {
  if (!report || typeof report !== 'object') return report
  return {
    ...report,
    priority: report.priority === 'medium' ? 'warning' : report.priority,
    imageName: report.imageName ?? null,
    imageDataUrl: report.imageDataUrl ?? null,
  }
}

export const useDamageStore = defineStore('damage', {
  state: () => ({
  reports: [],
  storageLoaded: false,
  lastCreatedReport: null,
  loading: false,
  loadError: null,
  _fetchReportsPromise: null,
  statusUpdatingIds: {},
  deletingIds: {},
}),
  //شمارش کل خرابی
  getters: {
    totalReports: (state) => state.reports.length,

    //خرابی های بحرانی حل نشده
    criticalReports: (state) =>
      state.reports.filter(
        (report) => report.priority === 'critical' && report.status !== 'رفع شده'
      ).length,
   //خرابی های حل شده
    resolvedReports: (state) =>
      state.reports.filter((report) => report.status === 'رفع شده').length
  },
  actions: {
    async fetchReports(params = {}) {
      if (this._fetchReportsPromise) return this._fetchReportsPromise

      this.loading = true
      this.loadError = null

      this._fetchReportsPromise = (async () => {
        try {
          const data = await getReports(params)
          const reports = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
          const normalized = reports.filter(isValidReport).map(normalizeReport)
          // API returns createdAt desc; store as oldest-first so existing reversedReports stays newest-first.
          this.reports = [...normalized].reverse()
          return this.reports
        } catch (error) {
          const message =
            error instanceof ReportsApiError
              ? error.message
              : error?.message || 'دریافت گزارش‌ها انجام نشد'
          this.loadError = message
          console.error('دریافت گزارش‌ها انجام نشد:', error)
          return null
        } finally {
          this.loading = false
          this.storageLoaded = true
          this._fetchReportsPromise = null
        }
      })()

      return this._fetchReportsPromise
    },

    async submitNewReport(formData) {
      const data = await createReport(formData)
      const report = normalizeReport(data)
      if (!isValidReport(report)) {
        throw new Error('پاسخ سرور برای گزارش ثبت‌شده معتبر نیست')
      }
      // Store keeps oldest-first; IndexPage shows reversed (newest-first).
      this.reports.push(report)
      this.lastCreatedReport = report
      // localStorage intentionally not used for new API-backed reports in this stage.
      return report
    },

    //ثبت گزارش جدید (محلی/قدیمی؛ برای ثبت جدید از submitNewReport استفاده می‌شود)
    addReport(report) {
      //ساخت شناسه گزارش
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`
     //ساخت شی گزارش جدید
      const newReport = {
        id,
        trackingCode: createTrackingCode(),
        title: report.title.trim(),
        description: report.description.trim(),
        location: report.location,
        priority: report.priority,
        status: 'در انتظار بررسی فنی',
        imageName: report.imageName || null,
        imageDataUrl: report.imageDataUrl || null,
        createdAt: new Date().toISOString()
      }
    //اضافه کردن گزارش به آرایه
      this.reports.push(newReport)

this.lastCreatedReport = newReport

this.saveToStorage()

return newReport
    },
    async updateReportStatus(id, status) {
      const allowedStatuses = ['در انتظار بررسی فنی', 'در حال تعمیر', 'رفع شده']
      if (!allowedStatuses.includes(status)) return false
      if (this.statusUpdatingIds?.[id]) return false

      const report = this.reports.find((item) => item.id === id)
      if (!report) return false
      if (report.status === status) return true

      this.statusUpdatingIds = { ...this.statusUpdatingIds, [id]: true }
      try {
        const data = await updateReportStatus(id, status)
        const updated = normalizeReport(data)
        const target = this.reports.find((item) => item.id === id)
        if (target) {
          Object.assign(target, updated)
        } else if (isValidReport(updated)) {
          this.reports.push(updated)
        }
        // localStorage intentionally not used for API-backed status updates in this stage.
        return true
      } catch (error) {
        console.error('تغییر وضعیت گزارش انجام نشد:', error)
        throw error
      } finally {
        const next = { ...this.statusUpdatingIds }
        delete next[id]
        this.statusUpdatingIds = next
      }
    },

    //تغییر وضعیت گزارش (محلی/قدیمی؛ اتصال API از updateReportStatus استفاده می‌شود)
    updateStatus(id, status) {
      const allowedStatuses = ['در انتظار بررسی فنی', 'در حال تعمیر', 'رفع شده']

      //بررسی معتبر بودن وضعیت
      if (!allowedStatuses.includes(status)) return false

   //پیدا کردن گزارش موردنظر
      const report = this.reports.find((item) => item.id === id)
      if (!report) return false
   //تغییر وضغیت
      report.status = status
      this.saveToStorage()
      return true
    },
    async deleteReportById(id) {
      if (this.deletingIds?.[id]) return false

      const report = this.reports.find((item) => item.id === id)
      if (!report) return false

      this.deletingIds = { ...this.deletingIds, [id]: true }
      try {
        await deleteReport(id)
        this.reports = this.reports.filter((item) => item.id !== id)
        // localStorage intentionally not used for API-backed deletes in this stage.
        return true
      } catch (error) {
        console.error('حذف گزارش انجام نشد:', error)
        throw error
      } finally {
        const next = { ...this.deletingIds }
        delete next[id]
        this.deletingIds = next
      }
    },

   //حدف گزارش (محلی/قدیمی؛ اتصال API از deleteReportById استفاده می‌شود)
    removeReport(id) {
      const initialLength = this.reports.length    //نگهداری تعداد اولیه
      this.reports = this.reports.filter((report) => report.id !== id)
      if (this.reports.length === initialLength) return false
      this.saveToStorage()
      return true
    },
    saveToStorage() {
      if (!isBrowser()) return      //اگر برنامه در مرورگر اجرا نشده باشد، تابع متوقف می‌شود.

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reports))
      } catch (error) {
        console.error('ذخیره گزارش‌ها در مرورگر انجام نشد:', error)
      }
    },

    loadFromStorage() {
      // Kept for compatibility; does not clear localStorage. Initial load is now API-backed via fetchReports().
      if (!isBrowser()) {
        this.storageLoaded = true
        return
      }

      try {
        const savedData = window.localStorage.getItem(STORAGE_KEY)//دریافت اظلاعات دخیره شده
        if (!savedData) return
        const parsed = JSON.parse(savedData)
        // پیدا کردن گزارش موردنظر
        if (Array.isArray(parsed)) {//بررسی می‌کند که داده‌ی خوانده‌شده واقعاً آرایه باشد
          this.reports = parsed
            .filter(isValidReport)
            .map(normalizeReport)
        }
        //گرفتن خطای داده‌های خراب
      } catch (error) {
        console.error('داده ذخیره‌شده معتبر نیست:', error)
        // localStorage intentionally preserved (no removal) in this stage.
      } finally {
        this.storageLoaded = true
      }
    }
  }
})
