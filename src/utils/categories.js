// Category lists shared by forms, filters and charts.
// The backend validates against the same lists (server/validators/common.js).
export const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Transport', 'Bills', 'Entertainment', 'Education', 'Healthcare', 'Other']
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Other']
export const CATEGORIES = [...new Set([...EXPENSE_CATEGORIES.slice(0, 7), ...INCOME_CATEGORIES.slice(0, 2), 'Other'])]

export const CATEGORY_COLORS = {
  Food: '#EA8C2E',
  Shopping: '#3E63DD',
  Transport: '#6182FA',
  Bills: '#E5484D',
  Entertainment: '#A855C9',
  Education: '#0F9D6D',
  Healthcare: '#F3A24B',
  Other: '#8695C2',
}
