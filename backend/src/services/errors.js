// #============# Errores publicos del contrato #============#
export class ApiError extends Error {
  constructor(status, codigo, mensaje, campo) {
    super(mensaje);
    Object.assign(this, { status, codigo, campo });
  }
}
export const invalid = (campo, mensaje = 'Valor invalido') => {
  throw new ApiError(400, 'VALIDACION', mensaje, campo);
};
export const missing = () => { throw new ApiError(404, 'NO_ENCONTRADO', 'Recurso no encontrado'); };
