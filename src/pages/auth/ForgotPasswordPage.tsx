import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../components/ui/Toaster';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const forgotSchema = z.object({
  email: z.string().email('Email invalido').min(1, 'Email e obrigatorio'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsSubmitting(true);
    try {
      await resetPassword(data.email);
      setEmailSent(true);
    } catch (error: any) {
      const message = error?.message || 'Erro ao enviar email';
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
          {emailSent ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-100 mb-2">Email Enviado</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enviamos um link de recuperacao para <strong className="text-gray-300">{getValues('email')}</strong>.
                Verifique sua caixa de entrada.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-100 mb-2">Esqueceu a Senha?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Informe seu email para receber um link de recuperacao de senha.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input"
                    placeholder="seu@email.com"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
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
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link de Recuperacao'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-netvision-400 hover:text-netvision-300 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar ao Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
