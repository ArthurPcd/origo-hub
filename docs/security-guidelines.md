# Security Guidelines - ORIGO

**Last Updated:** February 15, 2026
**Auditor:** Security Team

---

## SQL Injection Audit - COMPLETE ✅

**Status:** **NO VULNERABILITIES FOUND**

### Audit Scope

Audited all Supabase database queries across 16 files:
- API routes (generate, buy-credits, webhooks, checkout, etc.)
- Storage library (`src/lib/storage.ts`)
- Subscription library (`src/lib/subscription.ts`)
- Client components (pricing, brief pages)

### Findings

**All queries use safe, parameterized inputs** via Supabase client library:

#### ✅ Safe Patterns (Used Throughout Codebase)

```typescript
// Safe: .eq() with variable binding
await supabase
  .from('briefs')
  .select('*')
  .eq('user_id', user.id)  // ✅ Parameterized
  .eq('id', briefId);       // ✅ Parameterized

// Safe: .insert() with object
await supabase
  .from('briefs')
  .insert({
    title: userTitle,        // ✅ Parameterized
    user_id: user.id,        // ✅ Parameterized
  });

// Safe: .update() with object + .eq()
await supabase
  .from('user_subscriptions')
  .update({ brief_count: newCount })  // ✅ Parameterized
  .eq('user_id', user.id);            // ✅ Parameterized

// Safe: .rpc() with named parameters
await supabase
  .rpc('get_brief_count', {
    p_user_id: user.id  // ✅ Parameterized
  });
```

#### ❌ Unsafe Patterns (NONE FOUND)

```typescript
// DANGEROUS - String concatenation (NOT USED IN ORIGO)
await supabase.rpc('custom_query', {
  sql: `SELECT * FROM briefs WHERE title = '${userInput}'`
  // ❌ SQL injection vulnerability
});

// DANGEROUS - Template literals in filter (NOT USED IN ORIGO)
await supabase
  .from('briefs')
  .filter('title', 'eq', `'${userInput}'`)
  // ❌ Potential injection if improperly escaped
```

### Verification Checklist

- [x] **Checked all `.select()` calls** - All use parameterized .eq()
- [x] **Checked all `.eq()`, `.neq()`, `.filter()` calls** - All pass values as parameters
- [x] **Checked all `.rpc()` calls** - Both instances use named parameters
- [x] **Verified no raw SQL queries exist** - No string concatenation found
- [x] **Checked `.insert()` and `.update()` calls** - All use object notation

### Conclusion

**Supabase client library automatically escapes all parameters**, making SQL injection nearly impossible when using standard methods like `.eq()`, `.filter()`, `.insert()`, and `.update()`.

**The only risk** would be if raw SQL was used in `.rpc()` calls with string concatenation, which is **not present in the codebase**.

---

## Security Best Practices for ORIGO Developers

### 1. Database Queries

**DO:**
```typescript
// Always use Supabase's built-in methods
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('column', userInput);  // ✅ Safe
```

**DON'T:**
```typescript
// Never concatenate user input into SQL strings
const { data } = await supabase
  .rpc('query', {
    sql: `SELECT * FROM table WHERE column = '${userInput}'`
  });  // ❌ DANGEROUS
```

### 2. Input Validation

Always validate and sanitize user input **before** database operations:

```typescript
import { validateBriefPrompt } from '@/lib/validation';

// Validate with Zod schema
const sanitizedInput = validateBriefPrompt(userInput);

// Then use in query
await supabase.from('briefs').insert({ content: sanitizedInput });
```

### 3. Authentication

Always verify user authentication before database operations:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Only query user's own data
await supabase.from('briefs').select('*').eq('user_id', user.id);
```

### 4. Rate Limiting

Protect expensive operations:

```typescript
import { checkRateLimit } from '@/lib/rate-limit';

const rateLimitResult = checkRateLimit(user.id, 5, 60000);
if (!rateLimitResult.success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

### 5. CSRF Protection

Protect critical actions (delete, cancel, etc.):

```typescript
import { validateCSRFToken } from '@/lib/csrf';

const { csrfToken } = await request.json();
if (!await validateCSRFToken(csrfToken)) {
  return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
}
```

### 6. Error Messages

Never leak sensitive information:

```typescript
// BAD
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
  // ❌ Leaks stack traces, database schema
}

// GOOD
catch (error) {
  console.error('[RequestID]', error);  // Log internally
  return NextResponse.json(
    { error: 'An error occurred', requestId },
    { status: 500 }
  );  // ✅ Generic message to client
}
```

---

## Security Checklist for New Code

Before deploying new features, verify:

- [ ] User input is validated with Zod schemas
- [ ] Database queries use parameterized methods (`.eq()`, `.insert()`, etc.)
- [ ] Authentication is checked before data access
- [ ] Rate limiting is applied to expensive operations
- [ ] CSRF tokens are validated on critical actions
- [ ] Error messages don't leak sensitive data
- [ ] Sensitive operations are logged with request IDs

---

## Incident Response

If a security issue is discovered:

1. **Immediately** notify the team
2. Document the vulnerability
3. Create a hotfix branch
4. Deploy the fix to production ASAP
5. Notify affected users if data was compromised (GDPR requirement)
6. Update this document with lessons learned

---

## References

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [CSRF Protection Guide](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
