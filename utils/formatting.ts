export const cashFormat = (amount: number | undefined): string => {
  if (!amount) {
    return '$ 0'
  }

  const formatted = Intl.NumberFormat('es-Mx', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)

  return formatted || ''
}