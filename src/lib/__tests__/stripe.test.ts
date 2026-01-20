import { PLANS } from '../stripe'

describe('PLANS config', () => {
  it('has all required plan keys', () => {
    expect(PLANS).toHaveProperty('free')
    expect(PLANS).toHaveProperty('starter')
    expect(PLANS).toHaveProperty('pro')
    expect(PLANS).toHaveProperty('premium')
    expect(PLANS).toHaveProperty('enterprise')
  })

  it('every paid plan has a name, price, briefs, folders and features array', () => {
    const paidPlans = ['starter', 'pro', 'premium'] as const
    for (const key of paidPlans) {
      const plan = PLANS[key]
      expect(typeof plan.name).toBe('string')
      expect(typeof plan.price).toBe('number')
      expect(typeof plan.briefs).toBe('number')
      expect(typeof plan.folders).toBe('number')
      expect(Array.isArray(plan.features)).toBe(true)
      expect(plan.features.length).toBeGreaterThan(0)
    }
  })

  describe('free plan', () => {
    it('has price 0', () => {
      expect(PLANS.free.price).toBe(0)
    })

    it('allows 3 briefs', () => {
      expect(PLANS.free.briefs).toBe(3)
    })

    it('has no folders (0)', () => {
      expect(PLANS.free.folders).toBe(0)
    })

    it('has at least one feature listed', () => {
      expect(PLANS.free.features.length).toBeGreaterThan(0)
    })
  })

  describe('starter plan', () => {
    it('costs $4.99', () => {
      expect(PLANS.starter.price).toBe(4.99)
    })

    it('allows 10 briefs', () => {
      expect(PLANS.starter.briefs).toBe(10)
    })

    it('includes 1 folder', () => {
      expect(PLANS.starter.folders).toBe(1)
    })
  })

  describe('pro plan', () => {
    it('costs $14.99', () => {
      expect(PLANS.pro.price).toBe(14.99)
    })

    it('allows 50 briefs', () => {
      expect(PLANS.pro.briefs).toBe(50)
    })

    it('includes 5 folders', () => {
      expect(PLANS.pro.folders).toBe(5)
    })
  })

  describe('premium plan', () => {
    it('costs $29.99', () => {
      expect(PLANS.premium.price).toBe(29.99)
    })

    it('allows 100 briefs', () => {
      expect(PLANS.premium.briefs).toBe(100)
    })

    it('includes 10 folders', () => {
      expect(PLANS.premium.folders).toBe(10)
    })
  })

  describe('enterprise plan', () => {
    it('has unlimited briefs (-1)', () => {
      expect(PLANS.enterprise.briefs).toBe(-1)
    })

    it('has unlimited folders (-1)', () => {
      expect(PLANS.enterprise.folders).toBe(-1)
    })

    it('has null price (custom pricing)', () => {
      expect(PLANS.enterprise.price).toBeNull()
    })

    it('has null priceId (custom pricing)', () => {
      expect(PLANS.enterprise.priceId).toBeNull()
    })
  })

  it('plans are ordered by price ascending (free < starter < pro < premium)', () => {
    expect(PLANS.free.price).toBeLessThan(PLANS.starter.price)
    expect(PLANS.starter.price).toBeLessThan(PLANS.pro.price)
    expect(PLANS.pro.price).toBeLessThan(PLANS.premium.price)
  })

  it('plans are ordered by brief count ascending (free < starter < pro < premium)', () => {
    expect(PLANS.free.briefs).toBeLessThan(PLANS.starter.briefs)
    expect(PLANS.starter.briefs).toBeLessThan(PLANS.pro.briefs)
    expect(PLANS.pro.briefs).toBeLessThan(PLANS.premium.briefs)
  })
})
