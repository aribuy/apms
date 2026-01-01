require('../helpers/test-env');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { createTestServer, closeTestServer } = require('../helpers/test-server');

const makeAuthHeader = (token) => `Bearer ${token}`;

describe('Workspace Management Flow', () => {
  let app;
  let server;
  let prisma;
  let workspaceId;
  const adminId = `test-admin-${Date.now()}`;
  const memberId = `test-member-${Date.now()}`;
  const adminEmail = `admin.workspace.${Date.now()}@apms.com`;
  const memberEmail = `member.workspace.${Date.now()}@apms.com`;
  const adminToken = jwt.sign(
    { id: adminId, email: adminEmail, role: 'SUPERADMIN' },
    process.env.JWT_SECRET
  );

  beforeAll(async () => {
    app = require('../../server');
    server = await createTestServer(app);
    prisma = new PrismaClient();

    const tableCheck = await prisma.$queryRaw`
      SELECT to_regclass('public.workspace_members')::text as name
    `;
    const tableName = Array.isArray(tableCheck) ? tableCheck[0]?.name : null;
    if (!tableName) {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS workspace_members (
          id text PRIMARY KEY,
          workspace_id uuid NOT NULL,
          user_id text NOT NULL,
          role text NOT NULL,
          is_default boolean DEFAULT false,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          UNIQUE (workspace_id, user_id)
        )
      `;
    }

    await prisma.users.create({
      data: {
        id: adminId,
        email: adminEmail,
        username: `admin_${Date.now()}`,
        role: 'SUPERADMIN',
        updated_at: new Date(),
        status: 'ACTIVE'
      }
    });

    await prisma.users.create({
      data: {
        id: memberId,
        email: memberEmail,
        username: `member_${Date.now()}`,
        role: 'MEMBER',
        updated_at: new Date(),
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    if (workspaceId) {
      await prisma.$executeRaw`
        DELETE FROM workspace_members
        WHERE workspace_id = ${workspaceId}::UUID
      `;
      await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    }
    await prisma.users.deleteMany({ where: { id: { in: [adminId, memberId] } } });
    await closeTestServer(server);
    await prisma.$disconnect();
  });

  test('creates workspace and manages members', async () => {
    const codeSuffix = `${Date.now()}`.slice(-6);
    const workspacePayload = {
      code: `WS${codeSuffix}`,
      name: 'Workspace Integration Test',
      customerGroupId: 'CG-TEST',
      vendorOwnerId: 'VO-TEST'
    };

    const createRes = await request(server)
      .post('/api/v1/workspaces')
      .set('Authorization', makeAuthHeader(adminToken))
      .send(workspacePayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    workspaceId = createRes.body.data.id;

    const addMemberRes = await request(server)
      .post(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', makeAuthHeader(adminToken))
      .send({ userId: memberId, role: 'ADMIN', isDefault: true });

    expect(addMemberRes.status).toBe(201);

    const listMembersRes = await request(server)
      .get(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', makeAuthHeader(adminToken));

    expect(listMembersRes.status).toBe(200);
    expect(listMembersRes.body.data.find((member) => member.userId === memberId)).toBeTruthy();

    const listUserWorkspacesRes = await request(server)
      .get(`/api/v1/users/${memberId}/workspaces`)
      .set('Authorization', makeAuthHeader(adminToken));

    expect(listUserWorkspacesRes.status).toBe(200);
    expect(listUserWorkspacesRes.body.data[0].workspaceId).toBe(workspaceId);

    const updateMemberRes = await request(server)
      .put(`/api/v1/users/${memberId}/workspaces/${workspaceId}`)
      .set('Authorization', makeAuthHeader(adminToken))
      .send({ role: 'MEMBER' });

    expect(updateMemberRes.status).toBe(200);
    expect(updateMemberRes.body.data.role).toBe('MEMBER');

    const deleteMemberRes = await request(server)
      .delete(`/api/v1/users/${memberId}/workspaces/${workspaceId}`)
      .set('Authorization', makeAuthHeader(adminToken));

    expect(deleteMemberRes.status).toBe(200);

    const listAfterDeleteRes = await request(server)
      .get(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', makeAuthHeader(adminToken));

    expect(listAfterDeleteRes.status).toBe(200);
    expect(listAfterDeleteRes.body.data.find((member) => member.userId === memberId)).toBeFalsy();
  });
});
