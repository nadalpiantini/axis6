/**
 * OpenAPI Specification for AXIS6 API
 * Auto-generated documentation for all API endpoints
 */

export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'AXIS6 API',
    version: '2.0.0',
    description: 'API for AXIS6 wellness tracking application',
    contact: {
      email: 'support@axis6.app'
    }
  },
  servers: [
    {
      url: 'https://axis6.app/api',
      description: 'Production server'
    },
    {
      url: 'http://localhost:6789/api',
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication endpoints'
    },
    {
      name: 'Dashboard',
      description: 'Dashboard data endpoints'
    },
    {
      name: 'Check-ins',
      description: 'Daily check-in management'
    },
    {
      name: 'Chat',
      description: 'Real-time chat functionality'
    },
    {
      name: 'Analytics',
      description: 'User analytics and insights'
    }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    minLength: 8
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful authentication',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse'
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '429': {
            description: 'Too many requests',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RateLimitError'
                }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'User registration',
        description: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    minLength: 8
                  },
                  name: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 100
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid input data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError'
                }
              }
            }
          }
        }
      }
    },
    '/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard data',
        description: 'Retrieve comprehensive dashboard data for authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DashboardData'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/checkins': {
      get: {
        tags: ['Check-ins'],
        summary: 'List check-ins',
        description: 'Get user check-ins with optional filtering',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'date',
            in: 'query',
            description: 'Filter by date (YYYY-MM-DD)',
            schema: {
              type: 'string',
              format: 'date'
            }
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by category ID',
            schema: {
              type: 'string',
              format: 'uuid'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results to return',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of check-ins',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/CheckIn'
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Check-ins'],
        summary: 'Create check-in',
        description: 'Record a new daily check-in',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CheckInInput'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Check-in created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CheckIn'
                }
              }
            }
          }
        }
      }
    },
    '/chat/rooms': {
      get: {
        tags: ['Chat'],
        summary: 'List chat rooms',
        description: 'Get all accessible chat rooms for user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of chat rooms',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ChatRoom'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/chat/messages/{roomId}': {
      get: {
        tags: ['Chat'],
        summary: 'Get room messages',
        description: 'Retrieve messages for a specific chat room',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'roomId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid'
            }
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              default: 50
            }
          },
          {
            name: 'before',
            in: 'query',
            description: 'Get messages before this timestamp',
            schema: {
              type: 'string',
              format: 'date-time'
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of messages',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ChatMessage'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/analytics/heatmap': {
      get: {
        tags: ['Analytics'],
        summary: 'Activity heatmap',
        description: 'Get activity heatmap data for visualization',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'weeks',
            in: 'query',
            description: 'Number of weeks to include',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 52,
              default: 12
            }
          }
        ],
        responses: {
          '200': {
            description: 'Heatmap data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HeatmapData'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User'
          },
          session: {
            type: 'object',
            properties: {
              access_token: {
                type: 'string'
              },
              refresh_token: {
                type: 'string'
              },
              expires_at: {
                type: 'integer'
              }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          name: {
            type: 'string'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      DashboardData: {
        type: 'object',
        properties: {
          checkins: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/CheckIn'
            }
          },
          streaks: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Streak'
            }
          },
          weekly_stats: {
            type: 'object',
            properties: {
              days_active: {
                type: 'integer'
              },
              total_checkins: {
                type: 'integer'
              },
              avg_mood: {
                type: 'number'
              }
            }
          }
        }
      },
      CheckIn: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          category_id: {
            type: 'string',
            format: 'uuid'
          },
          mood: {
            type: 'integer',
            minimum: 1,
            maximum: 10
          },
          notes: {
            type: 'string'
          },
          completed_at: {
            type: 'string',
            format: 'date'
          }
        }
      },
      CheckInInput: {
        type: 'object',
        required: ['category_id', 'mood'],
        properties: {
          category_id: {
            type: 'string',
            format: 'uuid'
          },
          mood: {
            type: 'integer',
            minimum: 1,
            maximum: 10
          },
          notes: {
            type: 'string',
            maxLength: 500
          }
        }
      },
      Streak: {
        type: 'object',
        properties: {
          category_id: {
            type: 'string',
            format: 'uuid'
          },
          current_streak: {
            type: 'integer'
          },
          longest_streak: {
            type: 'integer'
          },
          last_checkin: {
            type: 'string',
            format: 'date'
          }
        }
      },
      ChatRoom: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string'
          },
          type: {
            type: 'string',
            enum: ['direct', 'group', 'category', 'support']
          },
          participant_count: {
            type: 'integer'
          },
          last_message: {
            $ref: '#/components/schemas/ChatMessage'
          }
        }
      },
      ChatMessage: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          content: {
            type: 'string'
          },
          sender: {
            $ref: '#/components/schemas/User'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      HeatmapData: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              format: 'date'
            },
            count: {
              type: 'integer'
            },
            categories: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid'
              }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string'
          },
          message: {
            type: 'string'
          },
          statusCode: {
            type: 'integer'
          }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: {
            type: 'string'
          },
          fields: {
            type: 'object',
            additionalProperties: {
              type: 'string'
            }
          }
        }
      },
      RateLimitError: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            default: 'Too many requests'
          },
          retryAfter: {
            type: 'integer',
            description: 'Seconds until retry'
          }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
}