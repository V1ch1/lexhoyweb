// Smoke test básico para verificar que el setup de testing funciona
describe('Setup de Testing', () => {
  it('debería funcionar correctamente', () => {
    expect(true).toBe(true);
  });

  it('debería poder hacer operaciones básicas', () => {
    const sum = 1 + 1;
    expect(sum).toBe(2);
  });
});
