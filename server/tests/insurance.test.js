
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  startServer,
  registerUser,
} from './helpers.js'

test('insurance: CRUD, validation, filtering and user isolation', async (t) => {
  const server = await startServer()

  t.after(async () => {
    await server.close()
  })

  const userA = await registerUser(server, 'Insurance User A')
  const userB = await registerUser(server, 'Insurance User B')

  // Unauthenticated requests must be rejected.
  const anonymous = server.client()
  const anonymousList = await anonymous.get('/insurance')
  assert.equal(anonymousList.status, 401)

  // Create an insurance policy.
  const created = await userA.c.post('/insurance', {
    name: 'Family Health Insurance',
    type: 'HEALTH',
    provider: 'Test Insurance Company',
    policyNumber: 'POL-TEST-001',
    policyholder: 'Test Policyholder',
    coverageAmount: 1000000,
    premiumAmount: 12000,
    frequency: 'YEARLY',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    renewalDate: '2026-12-01',
    nominee: 'Test Nominee',
    notes: 'Insurance API test',
  })

  assert.equal(created.status, 201)
  assert.equal(created.data.name, 'Family Health Insurance')
  assert.equal(created.data.type, 'HEALTH')
  assert.equal(created.data.provider, 'Test Insurance Company')
  assert.equal(created.data.frequency, 'YEARLY')
  assert.equal(created.data.status, 'ACTIVE')
  assert.equal(Number(created.data.coverageAmount), 1000000)
  assert.equal(Number(created.data.premiumAmount), 12000)

  const insuranceId = created.data.id
  assert.ok(insuranceId)

  // List policies: the owner's policy must be present.
  const listed = await userA.c.get('/insurance')
  assert.equal(listed.status, 200)
  assert.equal(listed.data.length, 1)
  assert.equal(listed.data[0].id, insuranceId)

  // Filter policies by type.
  const filteredByType = await userA.c.get('/insurance?type=HEALTH')
  assert.equal(filteredByType.status, 200)
  assert.equal(filteredByType.data.length, 1)

  // Filter policies by status.
  const filteredByStatus = await userA.c.get('/insurance?status=ACTIVE')
  assert.equal(filteredByStatus.status, 200)
  assert.equal(filteredByStatus.data.length, 1)

  // Another user must not see the policy.
  const userBList = await userB.c.get('/insurance')
  assert.equal(userBList.status, 200)
  assert.equal(userBList.data.length, 0)

  // Another user must not read, edit or delete this policy.
  const userBRead = await userB.c.get(`/insurance/${insuranceId}`)
  assert.equal(userBRead.status, 404)

  const userBEdit = await userB.c.put(
    `/insurance/${insuranceId}`,
    { name: 'Unauthorized edit' },
  )
  assert.equal(userBEdit.status, 404)

  const userBDelete = await userB.c.del(
    `/insurance/${insuranceId}`,
  )
  assert.equal(userBDelete.status, 404)

  // Update the policy as its owner.
  const updated = await userA.c.put(
    `/insurance/${insuranceId}`,
    {
      name: 'Updated Health Insurance',
      premiumAmount: 15000,
    },
  )

  assert.equal(updated.status, 200)
  assert.equal(updated.data.name, 'Updated Health Insurance')
  assert.equal(Number(updated.data.premiumAmount), 15000)

  // Invalid insurance types must be rejected.
  const invalidType = await userA.c.post('/insurance', {
    name: 'Invalid Policy',
    type: 'INVALID_TYPE',
    provider: 'Test Provider',
    policyNumber: 'POL-INVALID-001',
    policyholder: 'Test Policyholder',
    coverageAmount: 100000,
    premiumAmount: 5000,
    frequency: 'YEARLY',
    startDate: '2026-01-01',
  })

  assert.equal(invalidType.status, 400)

  // Negative amounts must be rejected.
  const invalidAmount = await userA.c.post('/insurance', {
    name: 'Invalid Amount Policy',
    type: 'HEALTH',
    provider: 'Test Provider',
    policyNumber: 'POL-INVALID-002',
    policyholder: 'Test Policyholder',
    coverageAmount: -100,
    premiumAmount: 5000,
    frequency: 'YEARLY',
    startDate: '2026-01-01',
  })

  assert.equal(invalidAmount.status, 400)

  // Invalid premium frequencies must be rejected.
  const invalidFrequency = await userA.c.post('/insurance', {
    name: 'Invalid Frequency Policy',
    type: 'HEALTH',
    provider: 'Test Provider',
    policyNumber: 'POL-INVALID-003',
    policyholder: 'Test Policyholder',
    coverageAmount: 100000,
    premiumAmount: 5000,
    frequency: 'DAILY',
    startDate: '2026-01-01',
  })

  assert.equal(invalidFrequency.status, 400)

  // Invalid filter values must be rejected.
  const invalidTypeFilter = await userA.c.get(
    '/insurance?type=NOT_A_TYPE',
  )
  assert.equal(invalidTypeFilter.status, 400)

  const invalidStatusFilter = await userA.c.get(
    '/insurance?status=NOT_A_STATUS',
  )
  assert.equal(invalidStatusFilter.status, 400)

  // Delete the policy as its owner.
  const deleted = await userA.c.del(`/insurance/${insuranceId}`)
  assert.equal(deleted.status, 200)
  assert.equal(deleted.data.id, insuranceId)

  const afterDelete = await userA.c.get('/insurance')
  assert.equal(afterDelete.status, 200)
  assert.equal(afterDelete.data.length, 0)
})
