import bcrypt from 'bcrypt';

const saltRound = 15;

export const hashGenerator = async (password: string): Promise<string> => {
  try {
    const hash = await bcrypt.hash(password, saltRound);
    return hash;
  } catch (error) {
    console.error('Error al generar el hash:', error);
    throw new Error('No se pudo generar la contraseña segura');
  }
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error al comparar la contraseña:', error);
    throw new Error('No se pudo verificar la contraseña');
  }
};
