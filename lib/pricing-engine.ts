// Types for the pricing matrix data
export interface MatrixRow {
  sd: number // start day
  ed: number // end day
  v: number // value
}

export interface MatrixData {
  groups: string[]
  data: Record<string, Record<string, MatrixRow[]>>
}

export interface PricingResult {
  // Original values
  ld: number | null
  bf: number | null
  bq: number | null
  be: number | null
  tg: number | null
  ip: number | null
  bc: number | null

  // New values
  ld_new: number | null
  bf_new: number | null
  bq_new: number | null
  be_new: number | null
  tg_new: number | null

  // Percentage changes
  be_increase_pct: number | null
  bf_increase_pct: number | null
  bq_increase_pct: number | null
  tg_increase_pct: number | null
  smart_increase_pct: number | null
  ai_increase_pct: number | null
  easy_increase_pct: number | null

  // SMART+ values
  smart_base: number | null
  smart_base_new: number | null
  smart_rack_target: number | null
  smart_rack_new: number | null
  smart_counter: number | null
  smart_counter_target: number | null
  smart_online: number | null
  smart_counter_vat: number | null
  smart_online_vat: number | null
  smart_implicit_discount: number | null

  // BF+BQ gap
  bf_bq_current: number | null
  bf_bq_target: number | null
  bf_bq_gap: number | null

  // AI values
  ai_base: number | null
  ai_rack_target: number | null
  ai_without_tg_new: number | null
  ai_rack_new: number | null
  ai_counter: number | null
  ai_online: number | null
  ai_counter_vat: number | null
  ai_online_vat: number | null
  ai_implicit_discount: number | null

  // Easy values
  easy_base: number | null
  easy_rack_new: number | null
  easy_counter: number | null
  easy_online: number | null
  easy_counter_vat: number | null
  easy_online_vat: number | null
  easy_margin_counter: number | null
  easy_margin_online: number | null

  // TG min values
  tg_min_iva: number
  tg_min_rack: number
  tg_raised_to_min: boolean
  tg_below_min: boolean

  // Discount solver values
  ai_counter_discount_max_rule2: number | null
  ai_online_discount_max_rule2: number | null
  ai_counter_discount_min_ruleB: number | null
  ai_counter_discount_min_ruleC: number | null
  ai_counter_discount_valid_low: number | null
  ai_counter_discount_valid_high: number | null
  ai_counter_discount_solved: number | null
  ai_online_discount_solved: number | null
  online_extra_discount: number

  // Used discounts
  easy_counter_discount_used: number
  easy_online_discount_used: number | null
  ai_counter_discount_used: number
  ai_online_discount_used: number

  // Margin settings
  easy_margin_min: number
  easy_margin_max: number

  // Rule checks
  ok_smart: boolean
  ok_ai: boolean
  ok_easy_constraint: boolean
  ok_ai_gt_smart_counter: boolean
  ok_ai_gt_smart_online: boolean
  ok_smart_easy_gt_ai_counter: boolean
  ok_smart_tg_gt_ai_counter: boolean
  ok_easy_margin_counter: boolean
  ok_easy_margin_online: boolean

  // Fixed values
  ai_fixed: number | null

  // Issues
  issues: string[]
}

export interface OptimizeResult {
  ai_counter_discount: number
  ai_online_discount: number
  valid_low: number
  valid_high: number
  feasible: boolean
  conflicts: Array<{
    grupo: string
    lor: string
    valid_low: number
    valid_high: number
  }>
  coverage: Record<string, { valid_low: number | null; valid_high: number | null; ok: boolean | null }>
}

export const LOR_INTERVALS = [
  { lor_start: 1, lor_end: 3, days_reference: 1 },
  { lor_start: 4, lor_end: 6, days_reference: 4 },
  { lor_start: 7, lor_end: 10, days_reference: 7 },
  { lor_start: 11, lor_end: 29, days_reference: 11 },
  { lor_start: 30, lor_end: 30, days_reference: 30 },
  { lor_start: 31, lor_end: 999, days_reference: 31 },
]

export function getPrice(
  matrixData: MatrixData,
  group: string,
  product: string,
  days: number
): number | null {
  const rows = matrixData.data?.[group]?.[product]
  if (!rows) return null
  
  for (const row of rows) {
    if (row.sd <= days && days <= row.ed) {
      if (row.v >= 9000) return null
      return row.v
    }
  }
  return null
}

export function computeGlobalTgScale(matrixData: MatrixData, tgMinRack: number): number {
  const dailyRefs: [number, number, number][] = [
    [1, 3, 1],
    [4, 6, 4],
    [7, 10, 7],
    [11, 29, 11],
    [31, 999, 31],
  ]
  
  let globalMin: number | null = null
  
  for (const group of matrixData.groups) {
    for (const [, , ref] of dailyRefs) {
      const v = getPrice(matrixData, group, "TG", ref)
      if (v !== null && v > 0) {
        globalMin = globalMin === null ? v : Math.min(globalMin, v)
      }
    }
  }
  
  if (globalMin === null || globalMin <= 0 || tgMinRack <= 0) {
    return 1.0
  }
  
  return Math.max(1.0, tgMinRack / globalMin)
}

export function computeTgLorProgression(
  matrixData: MatrixData,
  group: string,
  tgMinRack: number,
  globalScale: number | null = null
): Map<string, number> {
  const lorIntervals: [number, number, number][] = [
    [1, 3, 1],
    [4, 6, 4],
    [7, 10, 7],
    [11, 29, 11],
    [30, 30, 30],
    [31, 999, 31],
  ]
  
  if (globalScale === null) {
    globalScale = computeGlobalTgScale(matrixData, tgMinRack)
  }
  
  const scale = typeof globalScale === "number" ? globalScale : 1.0
  const result = new Map<string, number>()
  
  for (const [ls, le, ref] of lorIntervals) {
    const v = getPrice(matrixData, group, "TG", ref)
    if (v !== null) {
      result.set(`${ls}-${le}-${ref}`, v * scale)
    }
  }
  
  // Ensure strictly decreasing progression for daily LORs
  const dailyOrder: [number, number, number][] = [
    [1, 3, 1],
    [4, 6, 4],
    [7, 10, 7],
    [11, 29, 11],
    [31, 999, 31],
  ]
  
  let prevTg: number | null = null
  let prevBf: number | null = null
  
  for (const [ls, le, ref] of dailyOrder) {
    const key = `${ls}-${le}-${ref}`
    if (!result.has(key)) {
      prevTg = null
      prevBf = null
      continue
    }
    
    let v = result.get(key)!
    const bf = getPrice(matrixData, group, "BF", ref)
    
    if (prevTg !== null && v >= prevTg) {
      let step: number
      if (prevBf && bf && prevBf > 0) {
        step = prevTg * (bf / prevBf)
      } else {
        step = prevTg * 0.99
      }
      step = tgMinRack > 0 ? Math.max(step, tgMinRack) : Math.max(step, 0)
      result.set(key, Math.round(step * 10000) / 10000)
    }
    
    prevTg = result.get(key)!
    prevBf = bf
  }
  
  return result
}

function safeSum(values: (number | null)[]): number | null {
  if (values.some((v) => v === null || v === undefined || isNaN(v))) {
    return null
  }
  return values.reduce((acc, v) => acc! + v!, 0)
}

export function calculatePricing(params: {
  matrixData: MatrixData
  group: string
  days: number
  counterDiscount: number
  onlineDiscount: number
  bfWeight: number
  vat: number
  easyCounterDiscount?: number
  aiCounterDiscount?: number | null
  aiOnlineDiscount?: number | null
  easyMarginMin?: number
  easyMarginMax?: number
  onlineExtraDiscount?: number
  tgMinIva?: number
  tgOverride?: number | null
}): PricingResult {
  const {
    matrixData,
    group,
    days,
    counterDiscount,
    onlineDiscount,
    bfWeight,
    vat,
    easyCounterDiscount = 0,
    aiCounterDiscount = null,
    aiOnlineDiscount = null,
    easyMarginMin = 3.5,
    easyMarginMax = 7.0,
    onlineExtraDiscount = 0.1,
    tgMinIva = 8.0,
    tgOverride = null,
  } = params

  const bqWeight = 1 - bfWeight
  const effectiveAiCounterDiscount = aiCounterDiscount ?? counterDiscount
  const effectiveAiOnlineDiscount = aiOnlineDiscount ?? onlineDiscount

  const tgMinRack = tgMinIva && tgMinIva > 0 ? tgMinIva / (1 + vat) : 0

  // Get original prices
  const ld = getPrice(matrixData, group, "LD", days)
  const bf = getPrice(matrixData, group, "BF", days)
  const bq = getPrice(matrixData, group, "BQ", days)
  const be = getPrice(matrixData, group, "BE", days)
  const tgOrig = getPrice(matrixData, group, "TG", days)
  const tg = tgOverride !== null && tgOrig !== null ? tgOverride : tgOrig
  const ip = getPrice(matrixData, group, "I", days)
  let bc = getPrice(matrixData, group, "BC", days)
  if (bc === null) bc = 5.0

  const divCounter = 1 - counterDiscount
  const divOnline = 1 - onlineDiscount
  const divEasyCounter = 1 - easyCounterDiscount

  const issues: string[] = []
  if (ld === null) issues.push("LD indisponivel para este grupo/duracao.")
  if (bf === null) issues.push("BF indisponivel para este grupo/duracao.")
  if (bq === null) issues.push("BQ indisponivel para este grupo/duracao.")
  if (tgOrig === null) issues.push("TG indisponivel para este grupo/duracao.")
  if (ip === null) issues.push("I indisponivel para este grupo/duracao.")
  if (bc === null) issues.push("BC indisponivel para este grupo/duracao.")

  // SMART+ target based on original TG
  const smartBaseOld = safeSum([ld, bf, bq, tgOrig])
  const smartBase = safeSum([ld, bf, bq])
  const smartRackTarget = smartBaseOld

  const bfBqCurrent = safeSum([bf, bq])
  const bfBqTarget = smartRackTarget !== null && ld !== null ? smartRackTarget - ld : null
  const bfBqGap = bfBqTarget !== null && bfBqCurrent !== null ? bfBqTarget - bfBqCurrent : null

  const ldNew = ld
  const bfNew = bf !== null && bfBqGap !== null && bfBqGap > 0 ? bf + bfBqGap * bfWeight : bf
  const bqNew = bq !== null && bfBqGap !== null && bfBqGap > 0 ? bq + bfBqGap * bqWeight : bq
  const beNew = bfNew !== null ? bfNew * 0.8 : null

  const smartRackNew = safeSum([ldNew, bfNew, bqNew])
  const smartCounter = smartRackNew !== null ? smartRackNew * divCounter : null
  const smartOnline = smartRackNew !== null ? smartRackNew * divOnline : null
  const smartCounterVat = smartCounter !== null ? smartCounter * (1 + vat) : null
  const smartOnlineVat = smartOnline !== null ? smartOnline * (1 + vat) : null

  const aiBase = safeSum([bc, ld, bf, bq, ip, tgOrig])
  const aiWithoutTgNew = safeSum([bc, ldNew, bfNew, bqNew, ip])
  const easyBase = safeSum([tgOrig, bc])

  let okAiGtSmartCounter = false
  let okAiGtSmartOnline = false
  let okSmartEasyGtAiCounter = false
  let okSmartTgGtAiCounter = false
  let okEasyMarginCounter = false
  let okEasyMarginOnline = false

  let aiCounterDiscountMaxRule2: number | null = null
  let aiOnlineDiscountMaxRule2: number | null = null
  let aiCounterDiscountMinRuleB: number | null = null
  let aiCounterDiscountMinRuleC: number | null = null
  let aiCounterDiscountValidLow: number | null = null
  let aiCounterDiscountValidHigh: number | null = null
  let aiCounterDiscountSolved: number | null = null
  let aiOnlineDiscountSolved: number | null = null
  let easyMarginCounter: number | null = null
  let easyMarginOnline: number | null = null

  let tgNew = tg
  let aiRackNew: number | null = null
  let easyRackNew: number | null = null
  let aiCounter: number | null = null
  let aiOnline: number | null = null
  let aiCounterVat: number | null = null
  let aiOnlineVat: number | null = null

  if (
    ldNew !== null &&
    bfNew !== null &&
    bqNew !== null &&
    tgOrig !== null &&
    ip !== null &&
    smartRackNew !== null &&
    smartRackNew > 0 &&
    aiWithoutTgNew !== null
  ) {
    for (let pass = 0; pass < 2; pass++) {
      const tgCandidate = Math.max(tg ?? 0, tgNew ?? 0, tgMinRack)
      const aiRackCandidate = aiWithoutTgNew + tgCandidate
      const easyRackCandidate = tgCandidate + bc

      if (aiRackCandidate <= 0) break

      const smartCntC = smartRackNew * divCounter
      const easyCntC = easyRackCandidate * divEasyCounter
      const smartCntO = smartRackNew * divOnline

      const maxDaC = Math.max(0, 1 - smartCntC / aiRackCandidate - 0.0001)
      const maxDaO = Math.max(0, 1 - smartCntO / aiRackCandidate - 0.0001)

      const minDaCB = Math.max(0, 1 - (smartCntC + easyCntC) / aiRackCandidate + 0.0001)
      const minDaCC = Math.max(0, 1 - (smartCntC + tgCandidate) / aiRackCandidate + 0.0001)

      const minDaCD = 1 - (smartCntC + easyCntC - easyMarginMin) / aiRackCandidate
      const maxDaCD = 1 - (smartCntC + easyCntC - easyMarginMax) / aiRackCandidate

      const validLow = Math.max(minDaCB, minDaCC, minDaCD, 0)
      const validHigh = Math.min(maxDaC, maxDaCD)

      if (validLow <= validHigh || pass === 1) {
        tgNew = tgCandidate
        aiRackNew = aiRackCandidate
        easyRackNew = easyRackCandidate
        aiCounterDiscountMaxRule2 = maxDaC
        aiOnlineDiscountMaxRule2 = maxDaO
        aiCounterDiscountMinRuleB = minDaCB
        aiCounterDiscountMinRuleC = minDaCC
        aiCounterDiscountValidLow = validLow
        aiCounterDiscountValidHigh = validHigh
        break
      } else {
        let tgNeededB: number | null = null
        if (divEasyCounter > 0 && easyCntC < aiRackCandidate - smartCntC) {
          const numerator = aiWithoutTgNew - smartCntC - bc * divEasyCounter + 0.01
          if (easyCounterDiscount > 0) {
            tgNeededB = numerator / easyCounterDiscount
          } else {
            tgNeededB = tg
          }
        }
        tgNew = Math.max(tg ?? 0, tgNeededB ?? tg ?? 0)
      }
    }

    if (aiRackNew !== null && aiCounterDiscountValidLow !== null && aiCounterDiscountValidHigh !== null) {
      let daCOpt: number
      if (aiCounterDiscountValidLow <= aiCounterDiscountValidHigh) {
        daCOpt = (aiCounterDiscountValidLow + aiCounterDiscountValidHigh) / 2
      } else {
        daCOpt = Math.min(
          Math.max(aiCounterDiscountMinRuleB ?? 0, aiCounterDiscountMinRuleC ?? 0),
          aiCounterDiscountMaxRule2 ?? 1
        )
      }
      daCOpt = Math.max(0, Math.min(daCOpt, 0.9999))

      aiCounterDiscountSolved = daCOpt
      aiCounter = aiRackNew * (1 - daCOpt)
      aiCounterVat = aiCounter * (1 + vat)

      let daOOpt = Math.max(daCOpt + onlineExtraDiscount, onlineDiscount)
      daOOpt = Math.min(daOOpt, aiOnlineDiscountMaxRule2 ?? 1)
      aiOnlineDiscountSolved = daOOpt
      aiOnline = aiRackNew * (1 - daOOpt)
      aiOnlineVat = aiOnline * (1 + vat)

      const smartCntC = smartRackNew * divCounter
      const smartCntO = smartRackNew * divOnline
      const easyCntC = (easyRackNew ?? 0) * divEasyCounter

      okAiGtSmartCounter = aiCounter > smartCntC
      okAiGtSmartOnline = aiOnline > smartCntO
      okSmartEasyGtAiCounter = smartCntC + easyCntC > aiCounter
      okSmartTgGtAiCounter = smartCntC + (tgNew ?? 0) > aiCounter
      easyMarginCounter = smartCntC + easyCntC - aiCounter
      okEasyMarginCounter = easyMarginMin <= easyMarginCounter && easyMarginCounter <= easyMarginMax
    }
  } else {
    tgNew = tg !== null ? Math.max(tg, tgMinRack) : tgOrig
  }

  easyRackNew = tgNew !== null ? tgNew + bc : null
  const easyCounter = easyRackNew !== null ? easyRackNew * divEasyCounter : null
  const easyOnline: number | null = null
  const easyCounterVat = easyCounter !== null ? easyCounter * (1 + vat) : null
  const easyOnlineVat: number | null = null

  if (aiRackNew === null && aiWithoutTgNew !== null && tgNew !== null) {
    aiRackNew = aiWithoutTgNew + tgNew
  }

  const okEasyConstraint =
    smartRackNew !== null &&
    easyRackNew !== null &&
    aiRackNew !== null &&
    smartRackNew + easyRackNew > aiRackNew

  const easyIncreasePct =
    easyBase && easyRackNew && easyBase > 0 ? easyRackNew / easyBase - 1 : null
  const smartIncreasePct =
    smartBaseOld && smartRackNew && smartBaseOld > 0 ? smartRackNew / smartBaseOld - 1 : null
  const bfIncreasePct = bf && bfNew && bf > 0 ? bfNew / bf - 1 : null
  const bqIncreasePct = bq && bqNew && bq > 0 ? bqNew / bq - 1 : null
  const tgIncreasePct = tgOrig && tgNew && tgOrig > 0 ? tgNew / tgOrig - 1 : null
  const aiIncreasePct = aiBase && aiRackNew && aiBase > 0 ? aiRackNew / aiBase - 1 : null

  const smartImplicitDiscount =
    smartRackNew && smartCounter && smartRackNew > 0 ? 1 - smartCounter / smartRackNew : null
  const aiImplicitDiscount =
    aiRackNew && aiCounter && aiRackNew > 0 ? 1 - aiCounter / aiRackNew : null

  const smartCounterTarget = smartBaseOld !== null ? smartBaseOld * divCounter : null
  const okSmart =
    smartCounter !== null &&
    smartCounterTarget !== null &&
    Math.abs(smartCounter - smartCounterTarget) < 0.02
  const okAi = aiCounter !== null && aiBase !== null && Math.abs(aiCounter - aiBase) < 0.02

  const beIncreasePct = be && beNew && be > 0 ? beNew / be - 1 : null

  return {
    ld,
    bf,
    bq,
    be,
    tg: tgOrig,
    ip,
    bc,
    ld_new: ldNew,
    bf_new: bfNew,
    bq_new: bqNew,
    be_new: beNew,
    tg_new: tgNew,
    be_increase_pct: beIncreasePct,
    smart_base: smartBaseOld,
    smart_base_new: smartBase,
    smart_rack_target: smartRackTarget,
    smart_rack_new: smartRackNew,
    smart_counter: smartCounter,
    smart_counter_target: smartCounterTarget,
    smart_online: smartOnline,
    smart_counter_vat: smartCounterVat,
    smart_online_vat: smartOnlineVat,
    bf_bq_current: bfBqCurrent,
    bf_bq_target: bfBqTarget,
    bf_bq_gap: bfBqGap,
    ai_base: aiBase,
    ai_rack_target: null,
    ai_without_tg_new: aiWithoutTgNew,
    ai_rack_new: aiRackNew,
    ai_counter: aiCounter,
    ai_online: aiOnline,
    ai_counter_vat: aiCounterVat,
    ai_online_vat: aiOnlineVat,
    smart_increase_pct: smartIncreasePct,
    bf_increase_pct: bfIncreasePct,
    bq_increase_pct: bqIncreasePct,
    tg_increase_pct: tgIncreasePct,
    ai_increase_pct: aiIncreasePct,
    tg_min_iva: tgMinIva,
    tg_min_rack: tgMinRack,
    tg_raised_to_min:
      tgOrig !== null &&
      tgNew !== null &&
      tgMinRack > 0 &&
      tgNew > tgOrig &&
      Math.abs(tgNew - tgMinRack) < 0.01,
    tg_below_min: tgOrig !== null && tgMinRack > 0 && tgOrig < tgMinRack,
    smart_implicit_discount: smartImplicitDiscount,
    ai_implicit_discount: aiImplicitDiscount,
    ok_smart: okSmart,
    ok_ai: okAi,
    ok_easy_constraint: okEasyConstraint,
    ok_ai_gt_smart_counter: okAiGtSmartCounter,
    ok_ai_gt_smart_online: okAiGtSmartOnline,
    ok_smart_easy_gt_ai_counter: okSmartEasyGtAiCounter,
    ok_smart_tg_gt_ai_counter: okSmartTgGtAiCounter,
    ai_counter_discount_max_rule2: aiCounterDiscountMaxRule2,
    ai_online_discount_max_rule2: aiOnlineDiscountMaxRule2,
    ai_counter_discount_min_ruleB: aiCounterDiscountMinRuleB,
    ai_counter_discount_min_ruleC: aiCounterDiscountMinRuleC,
    ai_counter_discount_valid_low: aiCounterDiscountValidLow,
    ai_counter_discount_valid_high: aiCounterDiscountValidHigh,
    online_extra_discount: onlineExtraDiscount,
    ai_fixed: aiWithoutTgNew,
    easy_base: easyBase,
    easy_rack_new: easyRackNew,
    easy_counter: easyCounter,
    easy_online: easyOnline,
    easy_counter_vat: easyCounterVat,
    easy_online_vat: easyOnlineVat,
    easy_increase_pct: easyIncreasePct,
    easy_margin_counter: easyMarginCounter,
    easy_margin_online: easyMarginOnline,
    ai_counter_discount_solved: aiCounterDiscountSolved,
    ai_online_discount_solved: aiOnlineDiscountSolved,
    ok_easy_margin_counter: okEasyMarginCounter,
    ok_easy_margin_online: okEasyMarginOnline,
    easy_margin_min: easyMarginMin,
    easy_margin_max: easyMarginMax,
    easy_counter_discount_used: easyCounterDiscount,
    easy_online_discount_used: null,
    ai_counter_discount_used: effectiveAiCounterDiscount,
    ai_online_discount_used: effectiveAiOnlineDiscount,
    issues,
  }
}

export function optimizeGlobalDiscounts(params: {
  matrixData: MatrixData
  counterDiscount: number
  onlineDiscount: number
  bfWeight: number
  vat: number
  easyCounterDiscount?: number
  easyMarginMin?: number
  easyMarginMax?: number
  onlineExtraDiscount?: number
  tgMinIva?: number
}): OptimizeResult {
  const {
    matrixData,
    counterDiscount,
    onlineDiscount,
    bfWeight,
    vat,
    easyCounterDiscount = 0,
    easyMarginMin = 3.5,
    easyMarginMax = 7.0,
    onlineExtraDiscount = 0.1,
    tgMinIva = 8.0,
  } = params

  let globalLow = 0.0
  let globalHigh = 1.0
  const conflicts: OptimizeResult["conflicts"] = []
  const coverage: OptimizeResult["coverage"] = {}

  const tgMinRack = tgMinIva && tgMinIva > 0 ? tgMinIva / (1 + vat) : 0
  const globalScale = computeGlobalTgScale(matrixData, tgMinRack)

  for (const group of matrixData.groups) {
    const tgProgOpt = computeTgLorProgression(matrixData, group, tgMinRack, globalScale)

    for (const lor of LOR_INTERVALS) {
      const tgOv = tgProgOpt.get(`${lor.lor_start}-${lor.lor_end}-${lor.days_reference}`)
      const r = calculatePricing({
        matrixData,
        group,
        days: lor.days_reference,
        counterDiscount,
        onlineDiscount,
        bfWeight,
        vat,
        easyCounterDiscount,
        aiCounterDiscount: null,
        aiOnlineDiscount: null,
        easyMarginMin,
        easyMarginMax,
        onlineExtraDiscount,
        tgMinIva,
        tgOverride: tgOv ?? null,
      })

      const vl = r.ai_counter_discount_valid_low
      const vh = r.ai_counter_discount_valid_high
      const key = `${group} | LOR ${lor.lor_start}-${lor.lor_end}`

      if (vl === null || vh === null) {
        coverage[key] = { valid_low: null, valid_high: null, ok: null }
        continue
      }

      coverage[key] = { valid_low: vl, valid_high: vh, ok: vl <= vh }

      if (vl > vh) {
        conflicts.push({
          grupo: group,
          lor: `${lor.lor_start}-${lor.lor_end}`,
          valid_low: vl,
          valid_high: vh,
        })
        continue
      }

      globalLow = Math.max(globalLow, vl)
      globalHigh = Math.min(globalHigh, vh)
    }
  }

  const feasible = globalLow <= globalHigh
  const aiCounterOpt = feasible ? (globalLow + globalHigh) / 2 : globalLow
  const aiOnlineOpt = aiCounterOpt + onlineExtraDiscount

  return {
    ai_counter_discount: aiCounterOpt,
    ai_online_discount: aiOnlineOpt,
    valid_low: globalLow,
    valid_high: globalHigh,
    feasible,
    conflicts,
    coverage,
  }
}

export function findLorKey(days: number): { lor_start: number; lor_end: number; days_reference: number } | null {
  for (const lor of LOR_INTERVALS) {
    if (lor.lor_start <= days && days <= lor.lor_end) {
      return lor
    }
  }
  return null
}
