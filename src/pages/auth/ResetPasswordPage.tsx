import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../components/ui/Toaster';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const resetSchema = z.object({
  password: z.string().min(6, 'A senha deve ter no minimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas nao coincidem',
  path: ['confirmPassword'],
});

type ResetFormData = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hasToken = searchParams.get('access_token') || searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsSubmitting(true);
    try {
      await updatePassword(data.password);
      setSuccess(true);
      showToast('success', 'Senha alterada', 'Sua senha foi alterada com sucesso');
    } catch (error: any) {
      const message = error?.message || 'Erro ao alterar senha';
      showToast('error', 'Erro', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-netvision-600 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">ChamadosTiRaitz</h1>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {success ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-100 mb-2">Senha Alterada</h2>
              <p className="text-sm text-gray-500 mb-6">
                Sua senha foi alterada com sucesso. Faca login com a nova senha.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                Ir para o Login
              </button>
            </div>
          ) : !hasToken ? (
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-100 mb-2">Link Invalido</h2>
              <p className="text-sm text-gray-500 mb-6">
                O link de recuperacao de senha e invalido ou expirou.
                Solicite um novo link.
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="btn-primary"
              >
                Solicitar Novo Link
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-100 mb-2">Nova Senha</h2>
              <p className="text-sm text-gray-500 mb-6">
                Informe sua nova senha abaixo.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="input pr-10"
                      placeholder="Minimo 6 caracteres"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className="input pr-10"
                      placeholder="Repita a senha"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Alterar Senha'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
