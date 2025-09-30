export const cashFormat = (amount: number): string => {
  const formatted = Intl.NumberFormat('es-Mx', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)

  return formatted || ''
}