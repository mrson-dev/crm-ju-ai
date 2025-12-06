/**
 * Hook para cálculo de idade a partir de data de nascimento
 */

import { useState, useEffect, useCallback } from 'react'

export function useAgeCalculation(birthDate) {
  const [age, setAge] = useState(null)
  const [isMinor, setIsMinor] = useState(false)

  const calculateAge = useCallback((dateString) => {
    if (!dateString || dateString.length !== 10) {
      return null
    }

    // Assume formato DD/MM/YYYY
    const parts = dateString.split('/')
    if (parts.length !== 3) {
      return null
    }

    const [day, month, year] = parts.map(Number)
    const birthDate = new Date(year, month - 1, day)

    if (isNaN(birthDate.getTime())) {
      return null
    }

    const today = new Date()
    let calculatedAge = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--
    }

    return calculatedAge
  }, [])

  useEffect(() => {
    const calculatedAge = calculateAge(birthDate)
    setAge(calculatedAge)
    setIsMinor(calculatedAge !== null && calculatedAge < 18)
  }, [birthDate, calculateAge])

  return {
    age,
    isMinor,
    calculateAge
  }
}

export default useAgeCalculation
