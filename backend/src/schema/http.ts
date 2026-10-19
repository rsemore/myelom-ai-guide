import Type from 'typebox'

export const HttpErrorSchema = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.Optional(Type.String()),
})
