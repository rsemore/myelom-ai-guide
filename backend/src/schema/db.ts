import Type from 'typebox'

export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  createdAt: Type.String({ format: 'date-time' })
})

export const MessageSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  role: Type.Enum(['system', 'user', 'assistant', 'tool']),
  content: Type.String(),
  order: Type.Integer(),
  createdAt: Type.String({ format: 'date-time' }),
  toolCallId: Type.Union([Type.String(), Type.Null()])
})

export const SessionSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  title: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
})
