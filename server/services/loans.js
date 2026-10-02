import { toCents, fromCents, num } from '../utils/money.js'
import { dayString, todayString } from '../utils/dates.js'

export function serializeEmi(emi, loanName, config) {
  const day = dayString(emi.dueDate)
  // "Overdue" is worked out when reading, so nothing has to run in the background.
  const status = emi.status === 'PENDING' && day < todayString(config) ? 'OVERDUE' : emi.status
  return {
    id: emi.id,
    loanId: emi.loanId,
    loanName: loanName ?? null,
    amount: num(emi.amount),
    dueDate: day,
    status,
    paidDate: dayString(emi.paidDate),
    principalPaid: num(emi.principalPaid),
    createdAt: emi.createdAt,
    updatedAt: emi.updatedAt,
  }
}

export function serializeLoan(loan, emis = []) {
  const principal = toCents(loan.principalAmount)
  const outstanding = toCents(loan.outstandingAmount)
  const pending = emis.filter((e) => e.status === 'PENDING').sort((a, b) => dayString(a.dueDate).localeCompare(dayString(b.dueDate)))
  return {
    id: loan.id,
    name: loan.name,
    principalAmount: num(loan.principalAmount),
    outstandingAmount: num(loan.outstandingAmount),
    interestRate: num(loan.interestRate),
    emiAmount: num(loan.emiAmount),
    startDate: dayString(loan.startDate),
    endDate: dayString(loan.endDate),
    status: loan.status,
    nextEmiDate: pending.length ? dayString(pending[0].dueDate) : null,
    nextEmiId: pending.length ? pending[0].id : null,
    paidPercent: principal > 0 ? Math.max(0, Math.min(100, Math.round(((principal - outstanding) / principal) * 100))) : 0,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
  }
}

// Assumption (documented in the README): interest for one EMI period is
// outstanding * annualRate / 12. The rest of the EMI reduces the principal.
export function principalPortion(emiAmount, outstandingAmount, annualRate) {
  const outstanding = toCents(outstandingAmount)
  const interest = Math.round((outstanding * Number(annualRate)) / 1200)
  return Math.max(0, Math.min(toCents(emiAmount) - interest, outstanding))
}

// Marks an EMI paid/unpaid and keeps the loan's outstanding amount in step.
// `db` must be the transaction client so both updates succeed or fail together.
export async function setEmiPaid(db, emi, loan, paid, paidDate) {
  if (paid && emi.status !== 'PAID') {
    const principal = principalPortion(emi.amount, loan.outstandingAmount, loan.interestRate)
    const newOutstanding = toCents(loan.outstandingAmount) - principal
    await db.loan.update({
      where: { id: loan.id },
      data: { outstandingAmount: fromCents(newOutstanding), status: newOutstanding <= 0 ? 'CLOSED' : loan.status },
    })
    return db.emi.update({
      where: { id: emi.id },
      data: { status: 'PAID', paidDate, principalPaid: fromCents(principal) },
    })
  }
  if (!paid && emi.status === 'PAID') {
    const restored = toCents(loan.outstandingAmount) + toCents(emi.principalPaid ?? 0)
    await db.loan.update({
      where: { id: loan.id },
      data: { outstandingAmount: fromCents(restored), status: restored > 0 ? 'ACTIVE' : loan.status },
    })
    return db.emi.update({ where: { id: emi.id }, data: { status: 'PENDING', paidDate: null, principalPaid: null } })
  }
  return emi
}
