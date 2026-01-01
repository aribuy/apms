const DOC_CONTROLLER_ID = 'cmezu3img0000jiaj1w1jfcj1';
const DOC_CONTROLLER_EMAIL = 'admin@telecore.com';

const ensureDocControllerUser = async (prisma) => {
  if (!prisma?.users) {
    return;
  }

  await prisma.users.upsert({
    where: { id: DOC_CONTROLLER_ID },
    update: {},
    create: {
      id: DOC_CONTROLLER_ID,
      email: DOC_CONTROLLER_EMAIL,
      username: 'admin',
      name: 'Document Controller',
      role: 'DOC_CONTROL',
      status: 'ACTIVE',
      updated_at: new Date()
    }
  });
};

module.exports = {
  DOC_CONTROLLER_ID,
  ensureDocControllerUser
};
