const spec = {
  openapi: '3.0.0',
  info: {
    title: 'APMS API',
    version: '1.0.0',
    description: 'APMS backend API documentation for Sprint 4.'
  },
  servers: [
    { url: 'https://apms.datacodesolution.com' },
    { url: 'https://apmsstaging.datacodesolution.com' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/v1/auth/login': {
      post: {
        summary: 'Login and issue access/refresh tokens',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Login success' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/v1/auth/refresh': {
      post: {
        summary: 'Rotate refresh token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' }
                },
                required: ['refreshToken']
              }
            }
          }
        },
        responses: {
          200: { description: 'Token refreshed' },
          401: { description: 'Invalid/expired refresh token' }
        }
      }
    },
    '/api/v1/auth/logout': {
      post: {
        summary: 'Logout and revoke refresh token',
        tags: ['Auth'],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Logged out' } }
      }
    },
    '/api/v1/auth/me': {
      get: {
        summary: 'Get current user profile',
        tags: ['Auth'],
        responses: { 200: { description: 'User profile' }, 401: { description: 'Unauthorized' } }
      }
    },
    '/api/v1/user/context': {
      get: {
        summary: 'Get workspace context for current user',
        tags: ['Workspace'],
        responses: { 200: { description: 'Workspace context' }, 404: { description: 'No membership' } }
      }
    },
    '/api/v1/workspaces': {
      get: { summary: 'List workspaces', tags: ['Workspace'], responses: { 200: { description: 'OK' } } },
      post: { summary: 'Create workspace', tags: ['Workspace'], responses: { 201: { description: 'Created' } } }
    },
    '/api/v1/workspaces/{workspaceId}': {
      put: {
        summary: 'Update workspace',
        tags: ['Workspace'],
        parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } }
      }
    },
    '/api/v1/workspaces/{workspaceId}/members': {
      get: { summary: 'List workspace members', tags: ['Workspace'], responses: { 200: { description: 'OK' } } },
      post: { summary: 'Add workspace member', tags: ['Workspace'], responses: { 201: { description: 'Created' } } }
    },
    '/api/v1/workspaces/{workspaceId}/members/{userId}': {
      put: { summary: 'Update workspace member', tags: ['Workspace'], responses: { 200: { description: 'Updated' } } },
      delete: { summary: 'Remove workspace member', tags: ['Workspace'], responses: { 200: { description: 'Removed' } } }
    },
    '/api/v1/users': {
      get: { summary: 'List users', tags: ['Users'], responses: { 200: { description: 'OK' } } }
    },
    '/api/v1/users/create': {
      post: { summary: 'Create user', tags: ['Users'], responses: { 200: { description: 'Created' } } }
    },
    '/api/v1/users/update/{id}': {
      put: { summary: 'Update user', tags: ['Users'], responses: { 200: { description: 'Updated' } } }
    },
    '/api/v1/users/delete/{id}': {
      delete: { summary: 'Delete user', tags: ['Users'], responses: { 200: { description: 'Deleted' } } }
    },
    '/api/v1/users/permissions': {
      get: { summary: 'Get permission mappings', tags: ['Users'], responses: { 200: { description: 'OK' } } },
      post: { summary: 'Update permission mappings', tags: ['Users'], responses: { 200: { description: 'Updated' } } }
    },
    '/api/v1/users/{id}/role': {
      put: { summary: 'Update user role', tags: ['Users'], responses: { 200: { description: 'Updated' } } }
    },
    '/api/v1/tasks': {
      get: { summary: 'List tasks', tags: ['Tasks'], responses: { 200: { description: 'OK' } } },
      post: { summary: 'Create task', tags: ['Tasks'], responses: { 201: { description: 'Created' } } }
    },
    '/api/v1/tasks/{id}': {
      put: { summary: 'Update task', tags: ['Tasks'], responses: { 200: { description: 'Updated' } } },
      delete: { summary: 'Delete task', tags: ['Tasks'], responses: { 200: { description: 'Deleted' } } }
    },
    '/api/v1/sites': {
      get: { summary: 'List sites', tags: ['Sites'], responses: { 200: { description: 'OK' } } },
      post: { summary: 'Bulk create sites', tags: ['Sites'], responses: { 200: { description: 'Created' } } }
    },
    '/api/v1/sites/check-duplicates': {
      post: { summary: 'Check duplicate sites', tags: ['Sites'], responses: { 200: { description: 'OK' } } }
    },
    '/api/v1/site-registration/register': {
      post: { summary: 'Register site with ATP tasks', tags: ['Site Registration'], responses: { 200: { description: 'Registered' } } }
    },
    '/api/v1/site-registration/validate': {
      post: { summary: 'Validate site registration payload', tags: ['Site Registration'], responses: { 200: { description: 'Validation result' } } }
    },
    '/api/v1/site-registration/atp-requirements': {
      post: { summary: 'Resolve ATP requirements', tags: ['Site Registration'], responses: { 200: { description: 'OK' } } }
    },
    '/api/v1/audit/logs': {
      get: { summary: 'List audit logs', tags: ['Audit'], responses: { 200: { description: 'OK' } } }
    },
    '/api/v1/atp/submit': {
      post: { summary: 'Submit ATP', tags: ['ATP'], responses: { 200: { description: 'Submitted' } } }
    },
    '/api/v1/atp/{atpId}/review': {
      post: { summary: 'Submit ATP review', tags: ['ATP'], responses: { 200: { description: 'Reviewed' } } }
    },
    '/api/v1/atp/{atpId}/quick-approve': {
      post: { summary: 'Quick approve ATP', tags: ['ATP'], responses: { 200: { description: 'Approved' } } }
    },
    '/api/v1/atp-workflow/reviews/{reviewStageId}/decision': {
      post: { summary: 'Submit workflow review decision', tags: ['ATP Workflow'], responses: { 200: { description: 'OK' } } }
    },
    '/api/v1/atp-workflow/punchlist/{punchlistId}/complete': {
      post: { summary: 'Complete punchlist rectification', tags: ['ATP Workflow'], responses: { 200: { description: 'OK' } } }
    },
    '/api/v1/atp-workflow/assign-reviewer': {
      post: { summary: 'Assign reviewer in bulk', tags: ['ATP Workflow'], responses: { 200: { description: 'OK' } } }
    },
    '/api/v1/atp-templates': {
      get: { summary: 'List ATP templates', tags: ['ATP Templates'], responses: { 200: { description: 'OK' } } },
      post: { summary: 'Create ATP template', tags: ['ATP Templates'], responses: { 200: { description: 'Created' } } }
    },
    '/api/v1/atp-templates/{id}': {
      get: { summary: 'Get ATP template detail', tags: ['ATP Templates'], responses: { 200: { description: 'OK' } } },
      put: { summary: 'Update ATP template', tags: ['ATP Templates'], responses: { 200: { description: 'Updated' } } },
      delete: { summary: 'Delete ATP template', tags: ['ATP Templates'], responses: { 200: { description: 'Deleted' } } }
    },
    '/api/v1/workgroups/create': {
      post: { summary: 'Create workgroup', tags: ['Workgroups'], responses: { 200: { description: 'Created' } } }
    },
    '/api/v1/workgroups/update/{id}': {
      put: { summary: 'Update workgroup', tags: ['Workgroups'], responses: { 200: { description: 'Updated' } } }
    },
    '/api/v1/workgroups/{id}/members': {
      post: { summary: 'Add workgroup member', tags: ['Workgroups'], responses: { 200: { description: 'Added' } } }
    },
    '/api/v1/organizations/create': {
      post: { summary: 'Create organization', tags: ['Organizations'], responses: { 200: { description: 'Created' } } }
    },
    '/api/v1/organizations/update/{id}': {
      put: { summary: 'Update organization', tags: ['Organizations'], responses: { 200: { description: 'Updated' } } }
    },
    '/api/v1/scopes': {
      get: { summary: 'List ATP scopes', tags: ['Scopes'], responses: { 200: { description: 'OK' } } },
      post: { summary: 'Create ATP scope', tags: ['Scopes'], responses: { 200: { description: 'Created' } } }
    },
    '/api/v1/task-history/log-event': {
      post: { summary: 'Log task history event', tags: ['Task History'], responses: { 201: { description: 'Created' } } }
    }
  }
};

module.exports = spec;
