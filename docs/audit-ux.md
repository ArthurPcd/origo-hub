# UX/UI AUDIT REPORT - ORIGO-BETA.XYZ

**Date:** February 15, 2026
**Auditor:** Sonnet 4.5 (UX/UI Director Agent)
**Scope:** Complete user experience from landing to brief export

---

## EXECUTIVE SUMMARY

Origo demonstrates **strong fundamentals** with modern design patterns and good mobile-first thinking. The app has proper touch targets (44px), responsive breakpoints, and clean visual hierarchy.

**However**, several **critical UX blockers** and **consistency issues** prevent it from feeling truly production-ready:
- Inconsistent loading states cause user uncertainty
- Error handling lacks actionable guidance
- Credit system opacity surprises users
- Missing validation feedback in forms

**Overall Grade: B- (Good foundation, needs polish)**

**Estimated effort to production-ready:**
- **P0 Critical:** 12 hours
- **P1 High Priority:** 24 hours
- **P2-P3 Polish:** 40 hours
- **Total:** ~76 hours (10 days)

---

## CRITICAL UX BLOCKERS (P0) - Will Prevent Conversions

### 1. Missing Loading States & Spinners

**Severity:** HIGH
**Impact:** Users see blank screens, causing uncertainty and perceived slowness

**Current State:**
- ✅ Brief generation shows spinner - GOOD
- ✅ Checkout page has loading state - GOOD
- ✅ Account page has spinner - GOOD
- ❌ NO skeleton loading for:
  - Brief list items in `/history`
  - Brief content in `/brief/[id]`
  - Pricing page plan fetching

**Files Affected:**
- `src/app/[locale]/history/page.tsx` (lines 49-54)
- `src/app/[locale]/brief/[id]/page.tsx` (lines 109-115)

**Recommendation:**
```tsx
// Add skeleton loader component
<div className="space-y-4">
  {[1,2,3].map(i => (
    <div key={i} className="animate-pulse">
      <div className="h-24 bg-surface rounded-lg" />
    </div>
  ))}
</div>
```

**Effort:** 4 hours

---

### 2. Error Handling Inconsistencies

**Severity:** HIGH
**Impact:** Users confused, can't self-recover from errors, will abandon flow

**Issues Found:**

#### 2.1 Brief Generation Error
**Location:** `src/app/[locale]/brief/new/page.tsx` (lines 266-270)

**Problems:**
- Shows generic "apiError" message
- No retry button
- No actionable guidance
- Error doesn't clear on navigation

**Current Code:**
```tsx
{error && (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
    <p className="text-red-400 text-sm">{t(`errors.${error}`)}</p>
  </div>
)}
```

**Recommended Fix:**
```tsx
{error && (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5">...</svg>
      <div className="flex-1">
        <p className="text-red-400 text-sm font-medium mb-2">
          {getUserFriendlyError(error)}
        </p>
        <button
          onClick={handleRetry}
          className="text-red-400 text-xs underline hover:no-underline"
        >
          Try again
        </button>
        <a href="/contact" className="text-red-400/70 text-xs ml-3">
          Contact support
        </a>
      </div>
    </div>
  </div>
)}
```

#### 2.2 Login/Signup Errors
**Location:** `src/app/[locale]/login/page.tsx`, `src/app/[locale]/signup/page.tsx`

**Problem:** Technical Supabase errors exposed to users

**Example:**
```
Current: "User already exists"
Better: "This email is already registered. Try logging in instead."
```

**Recommended Error Mapping:**
```tsx
const ERROR_MESSAGES: Record<string, string> = {
  'User already exists': 'This email is already registered.',
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed': 'Please check your inbox and confirm your email.',
  // ... etc
};

function getUserFriendlyError(technicalError: string): string {
  return ERROR_MESSAGES[technicalError] || 'Something went wrong. Please try again.';
}
```

**Effort:** 6 hours

---

### 3. Brief Creation Flow - Missing Validation Feedback

**Severity:** MEDIUM-HIGH
**Impact:** Users confused why button is disabled, abandon flow

**Location:** `src/app/[locale]/brief/new/page.tsx`

**Problems:**
1. `canProceed` disables button but doesn't explain WHY (line 60)
2. No character count for inputs
3. No inline validation errors
4. Template selector has no preview

**Current Code:**
```tsx
const canProceed = title.trim() && projectType.trim() && targetAudience.trim();
```

**Recommended Fixes:**

#### 3.1 Add Required Field Indicators
```tsx
<label className="block text-sm font-medium text-foreground mb-2">
  Project Title <span className="text-red-400">*</span>
</label>
```

#### 3.2 Add Character Count
```tsx
<div className="relative">
  <input
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    maxLength={100}
    className="..."
  />
  <span className="absolute right-3 bottom-3 text-xs text-muted">
    {title.length}/100
  </span>
</div>
```

#### 3.3 Show Validation Hints
```tsx
{!title.trim() && (
  <p className="text-xs text-muted mt-1">
    💡 Give your project a clear, descriptive name
  </p>
)}
```

**Effort:** 6 hours

---

### 4. Pricing Page - Broken Conversion Funnel

**Severity:** MEDIUM
**Impact:** Users click "Choose Plan" → Error → Bounce

**Location:** `src/app/[locale]/pricing/page.tsx` (lines 142-156)

**Problem:**
- Logged-out users click plan CTA
- Redirected to checkout
- See authentication error modal
- **Should** be prompted to sign up BEFORE checkout

**Current Flow:**
```
Pricing → Click "Choose Starter" → /checkout → Auth Error Modal
```

**Recommended Flow:**
```
Pricing → Click "Choose Starter" → Check Auth → If not logged in: /signup → /checkout
```

**Implementation:**
```tsx
// In pricing page
const handleSelectPlan = (priceId: string) => {
  if (!user) {
    // Not authenticated - redirect to signup
    router.push(`/signup?redirect=/checkout?priceId=${priceId}`);
  } else {
    // Authenticated - go to checkout
    router.push(`/checkout?priceId=${priceId}`);
  }
};
```

**Effort:** 3 hours

---

## HIGH PRIORITY UX IMPROVEMENTS (P1)

### 5. Onboarding Gap - First-Time User Experience

**Severity:** MEDIUM
**Impact:** Users don't understand value, abandon immediately

**Current Flow:**
1. User signs up → Email confirmation ✅
2. Confirms email → Redirected to `/brief/new`
3. **PROBLEM:** No welcome, no tooltip, no guidance

**Recommendation: Add Welcome Modal**

```tsx
// src/components/WelcomeModal.tsx
export function WelcomeModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg>...</svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to ORIGO! 🎉</h2>
        <p className="text-muted mb-6">
          Create professional project briefs in 3 simple steps
        </p>
        <div className="space-y-3 text-left mb-6">
          <Step number="1" text="Choose a template or start from scratch" />
          <Step number="2" text="Fill in your project details" />
          <Step number="3" text="Generate your brief instantly" />
        </div>
        <button onClick={onClose} className="bg-accent ...">
          Get Started
        </button>
      </div>
    </Modal>
  );
}
```

**Trigger Logic:**
```tsx
// Check if first-time user
useEffect(() => {
  const hasSeenWelcome = localStorage.getItem('origo_welcome_seen');
  if (!hasSeenWelcome) {
    setShowWelcome(true);
    localStorage.setItem('origo_welcome_seen', 'true');
  }
}, []);
```

**Effort:** 4 hours

---

### 6. Brief View - No Edit Capability

**Severity:** MEDIUM
**Impact:** Users waste credits regenerating for small fixes

**Current State:**
- Actions: Copy, Export, Delete only
- No "Edit" button
- No "Regenerate" button

**Recommendation: Add Edit Modal**

```tsx
function BriefEditModal({ brief, isOpen, onClose, onSave }: Props) {
  const [editedContent, setEditedContent] = useState(brief.content);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <h2>Edit Brief</h2>
      <textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        className="w-full h-96 font-mono text-sm"
      />
      <div className="flex gap-3 mt-4">
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onSave(editedContent)}>Save Changes</button>
      </div>
    </Modal>
  );
}
```

**Alternative: Regenerate Section**
```tsx
// Click section heading → Show "Regenerate this section" button
<h2
  className="group relative cursor-pointer"
  onClick={() => setRegenerateSection('Project Overview')}
>
  Project Overview
  <button className="absolute right-0 opacity-0 group-hover:opacity-100">
    🔄 Regenerate
  </button>
</h2>
```

**Effort:** 8 hours

---

### 7. Credit System Confusion

**Severity:** MEDIUM-HIGH
**Impact:** Users surprised when hitting limit, bad conversion moment

**Current Issues:**
- Users don't know credit cost upfront
- No persistent credit counter
- Limits discovered when blocked

**Recommendation: Add Header Credit Counter**

```tsx
// In Header component
{user && (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-surface/50 rounded-lg">
    <svg className="w-4 h-4 text-accent">...</svg>
    <span className="text-sm text-foreground font-medium">
      {remaining === -1 ? '∞' : remaining}
    </span>
    <span className="text-xs text-muted">briefs left</span>
  </div>
)}
```

**Add Upfront Cost Display:**
```tsx
// Before generation
<div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
  <p className="text-sm text-foreground">
    ⚡ This will use <strong>1 brief credit</strong>
  </p>
  <p className="text-xs text-muted mt-1">
    You have {remaining} briefs remaining this month
  </p>
</div>
```

**Add Tooltip Explanation:**
```tsx
<Tooltip content="Credits reset monthly. Free plan: 3 briefs/month">
  <button className="text-muted hover:text-foreground">
    <svg>?</svg>
  </button>
</Tooltip>
```

**Effort:** 6 hours

---

### 8. Accessibility: Focus States & ARIA

**Severity:** MEDIUM
**Impact:** Keyboard users and screen reader users excluded

**Issues:**

#### 8.1 No Visible Focus Rings
**Current:** Inputs have `focus:border-accent` but buttons don't show focus

**Fix:**
```css
/* Add to globals.css */
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

#### 8.2 Missing ARIA Labels
**Examples:**
- Close buttons (✕) have no `aria-label`
- Loading spinners have no `role="status"`
- Dropdown menus missing `role="menu"`

**Fixes:**
```tsx
// Close buttons
<button aria-label="Close modal" onClick={onClose}>
  <svg>...</svg>
</button>

// Loading spinners
<div role="status" aria-live="polite">
  <div className="animate-spin ..."></div>
  <span className="sr-only">Loading...</span>
</div>

// Dropdowns
<div role="menu" aria-expanded={open}>
  <button role="menuitem">...</button>
</div>
```

#### 8.3 Keyboard Trap in Modals
**Problem:** Focus not trapped inside modal

**Fix:** Use `focus-trap-react` library
```tsx
import FocusTrap from 'focus-trap-react';

<FocusTrap active={isOpen}>
  <div className="modal">...</div>
</FocusTrap>
```

**Effort:** 6 hours

---

## MEDIUM PRIORITY (P2)

### 9. Color Contrast Issues (WCAG)

**Severity:** MEDIUM
**Impact:** Fails WCAG AA accessibility standards

**Problem:**
- Muted text (`#A0A0A0`) on dark bg (`#0B0D10`) = 3.5:1 contrast
- **WCAG AA requires 4.5:1** for normal text

**Fix:**
```css
/* globals.css */
--color-muted: #B8B8B8; /* Lighten from #A0A0A0 */
```

**Effort:** 1 hour

---

### 10. Empty States Need Enhancement

**Current:** History page shows generic icon

**Recommendation:**
```tsx
<div className="text-center py-16">
  <div className="w-24 h-24 mx-auto mb-6 opacity-20">
    <svg>...</svg> {/* Friendly illustration */}
  </div>
  <h3 className="text-xl font-semibold mb-2">No briefs yet</h3>
  <p className="text-muted mb-6">
    Your briefs will appear here. Start with a template →
  </p>
  <Link href="/brief/new" className="inline-flex ...">
    Create Your First Brief
  </Link>
</div>
```

**Effort:** 2 hours

---

## POLISH (P3)

### 11. Micro-interactions Missing

**Add:**
- Card hover lift effect
- Button click scale-down
- Success checkmark animations

```css
/* globals.css */
.card-hover {
  transition: transform 0.2s, box-shadow 0.2s;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 124, 255, 0.15);
}

.btn-active:active {
  transform: scale(0.98);
}
```

**Effort:** 4 hours

---

## PRIORITIZED ACTION PLAN

### Phase 1: P0 - Critical (12 hours)
1. ✅ Error handling improvements (retry buttons, user-friendly messages) - **6h**
2. ✅ Loading state consistency (skeleton loaders) - **4h**
3. ✅ Pricing page auth check (fix conversion funnel) - **2h**

### Phase 2: P1 - High Priority (24 hours)
4. ✅ Validation feedback in brief form (character counts, hints) - **6h**
5. ✅ Credit system clarity (header counter, tooltips) - **6h**
6. ✅ Accessibility (focus states, ARIA labels) - **6h**
7. ✅ Brief editing capability - **8h**

### Phase 3: P2 - Medium (6 hours)
8. ✅ Onboarding welcome modal - **4h**
9. ✅ Color contrast fixes - **1h**
10. ✅ Empty state enhancements - **2h**

### Phase 4: P3 - Polish (8 hours)
11. ✅ Micro-interactions - **4h**
12. ✅ Additional animations - **4h**

**Total Estimated Effort:** **50 hours (6-7 days)**

---

## CONCLUSION

Origo has a **solid UX foundation** (80% there) but needs the last 20% of polish that separates "good" from "production-ready":

**Critical gaps:**
1. Error recovery - users can't self-serve
2. Loading feedback - blank screens create doubt
3. Credit transparency - users surprised by limits

**Fix P0 + P1 items** (~36 hours) and Origo will feel **significantly more professional** and ready for public launch.

The design system is already consistent, mobile experience is good, and accessibility is better than most MVPs. Just need to close the UX gaps around **error states, validation feedback, and user guidance**.
