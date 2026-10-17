
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  startServer,
  registerUser,
} from './helpers.js'

test('investments: CRUD, validation and user isolation', async (t) => {
  const server = await startServer()

  t.after(async () => {
    await server.close()
  })

  const userA = await registerUser(server, 'Investor A')
  const userB = await registerUser(server, 'Investor B')

  // Unauthenticated requests must be rejected.
  const anonymous = server.client()
  const anonymousList = await anonymous.get('/investments')
  assert.equal(anonymousList.status, 401)

  // Create an investment.
  const created = await userA.c.post('/investments', {
    type: 'SHARES',
    name: 'Test Company',
    institution: 'Test Broker',
    symbol: 'TEST',
    investedAmount: 10000,
    currentValue: 12000,
    quantity: 10,
    purchasePrice: 1000,
    currentPrice: 1200,
    notes: 'Investment API test',
  })

  assert.equal(created.status, 201)
  assert.equal(created.data.type, 'SHARES')
  assert.equal(created.data.name, 'Test Company')
  assert.equal(Number(created.data.investedAmount), 10000)
  assert.equal(Number(created.data.currentValue), 12000)

  const investmentId = created.data.id
  assert.ok(investmentId)

  // List investments: the record must be present for its owner.
  const listed = await userA.c.get('/investments')
  assert.equal(listed.status, 200)
  assert.equal(listed.data.length, 1)
  assert.equal(listed.data[0].id, investmentId)

  // Filter investments by type.
  const filtered = await userA.c.get('/investments?type=SHARES')
  assert.equal(filtered.status, 200)
  assert.equal(filtered.data.length, 1)

  // Another user must not see the investment.
  const userBList = await userB.c.get('/investments')
  assert.equal(userBList.status, 200)
  assert.equal(userBList.data.length, 0)

  // Another user must not read, edit or delete it.
  const userBRead = await userB.c.get(`/investments/${investmentId}`)
  assert.equal(userBRead.status, 404)

  const userBEdit = await userB.c.put(
    `/investments/${investmentId}`,
    { name: 'Unauthorized edit' },
  )
  assert.equal(userBEdit.status, 404)

  const userBDelete = await userB.c.del(
    `/investments/${investmentId}`,
  )
  assert.equal(userBDelete.status, 404)

  // Update the investment as its owner.
  const updated = await userA.c.put(
    `/investments/${investmentId}`,
    {
      name: 'Updated Company',
      currentValue: 13500,
    },
  )

  assert.equal(updated.status, 200)
  assert.equal(updated.data.name, 'Updated Company')
  assert.equal(Number(updated.data.currentValue), 13500)

  // Invalid investment types must be rejected.
  const invalid = await userA.c.post('/investments', {
    type: 'INVALID_TYPE',
    name: 'Invalid Investment',
  })

  assert.equal(invalid.status, 400)

  // Invalid amounts must be rejected.
  const invalidAmount = await userA.c.post('/investments', {
    type: 'SHARES',
    name: 'Invalid Amount',
    investedAmount: -100,
  })

  assert.equal(invalidAmount.status, 400)

  // Invalid filter values must be rejected.
  const invalidFilter = await userA.c.get(
    '/investments?type=NOT_A_TYPE',
  )
  assert.equal(invalidFilter.status, 400)

  // Delete the record as its owner.
  const deleted = await userA.c.del(
    `/investments/${investmentId}`,
  )

  assert.equal(deleted.status, 200)
  assert.equal(deleted.data.id, investmentId)

  const afterDelete = await userA.c.get('/investments')
  assert.equal(afterDelete.status, 200)
  assert.equal(afterDelete.data.length, 0)
})
