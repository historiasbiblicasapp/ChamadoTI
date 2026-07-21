import { ThemeToggle } from '../../components/ui/ThemeToggle';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <ThemeToggle />
      <div className="max-w-3xl mx-auto p-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.jpeg" alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Politica de Privacidade</h1>
            <p className="text-sm text-gray-500">ChamadosTiRaitz - Lei Geral de Protecao de Dados (LGPD)</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">1. Controlador dos Dados</h2>
            <p>
              A empresa <strong className="text-gray-300">Galvanizacao Raitz</strong> e a controladora dos dados pessoais
              coletados por meio do sistema ChamadosTiRaitz, responsavel pelas decisoes sobre o tratamento de dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">2. Dados Coletados</h2>
            <p>O sistema coleta os seguintes dados pessoais para fins de abertura e acompanhamento de chamados de suporte tecnico:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong className="text-gray-300">Nome completo</strong> - identificacao do solicitante</li>
              <li><strong className="text-gray-300">E-mail</strong> - contato e notificacoes</li>
              <li><strong className="text-gray-300">Telefone</strong> - contato para retorno</li>
              <li><strong className="text-gray-300">Setor/Departamento</strong> - identificacao organizzacional</li>
              <li><strong className="text-gray-300">Descricao do problema</strong> - conteudo tecnico do chamado</li>
              <li><strong className="text-gray-300">Dados de navegacao</strong> - logs de acesso ao sistema</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">3. Finalidade do Tratamento</h2>
            <p>Os dados sao coletados e tratados para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Abertura, processamento e resolucao de chamados de suporte tecnico</li>
              <li>Comunicacao com o solicitante sobre o andamento do atendimento</li>
              <li>Geracao de relatorios e metricas de desempenho do servico de TI</li>
              <li>Cumprimento de obrigacoes legais e regulamentares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">4. Base Legal</h2>
            <p>
              O tratamento dos dados e realizado com base no <strong className="text-gray-300">consentimento do titular</strong> (Art. 7o, I da LGPD)
              e na <strong className="text-gray-300">execucao de politica publica</strong> (Art. 7o, III) e <strong className="text-gray-300">legitimo interesse</strong> (Art. 7o, IX)
              para prestacao de servicos de suporte tecnico.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">5. Compartilhamento de Dados</h2>
            <p>
              Os dados podem ser compartilhados apenas com:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Equipe de TI responsavel pelo atendimento dos chamados</li>
              <li>Prestadores de servicos de infraestrutura (Supabase - banco de dados)</li>
              <li>Autoridades competentes, quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">6. Retencao de Dados</h2>
            <p>
              Os dados serao mantidos pelo periodo necessario para cumprir as finalidades para as quais foram coletados,
              respeitados os prazos legais. Dados de chamados podem ser retidos por ate <strong className="text-gray-300">5 anos</strong>
              para fins de auditoria e historico de atendimento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">7. Direitos do Titular (Art. 18 da LGPD)</h2>
            <p>Voce tem direito a:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong className="text-gray-300">Confirmacao</strong> da existencia de tratamento</li>
              <li><strong className="text-gray-300">Acesso</strong> aos dados pessoais</li>
              <li><strong className="text-gray-300">Correcao</strong> de dados incompletos ou desatualizados</li>
              <li><strong className="text-gray-300">Anonimizacao, bloqueio ou eliminacao</strong> de dados desnecessarios</li>
              <li><strong className="text-gray-300">Portabilidade</strong> dos dados</li>
              <li><strong className="text-gray-300">Eliminacao</strong> dos dados tratados com consentimento</li>
              <li><strong className="text-gray-300">Informacao</strong> sobre compartilhamento de dados</li>
              <li><strong className="text-gray-300">Revogacao</strong> do consentimento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">8. Seguranca dos Dados</h2>
            <p>
              Adotamos medidas tecnicas e administrativas para proteger os dados pessoais contra acessos nao autorizados,
              situacoes acidentais ou ilicitas de destruicao, perda, alteracao ou divulgacao. Entre as medidas: criptografia
              em transito (HTTPS), controle de acesso por perfil e registro de auditoria.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">9. Cookies</h2>
            <p>
              O sistema utiliza cookies estritamente necessarios para o funcionamento (autenticacao de sessao).
              Nao utilizamos cookies de rastreamento ou marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">10. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer duvidas sobre esta politica, entre em contato com o
              Encarregado de Protecao de Dados (DPO) pelo e-mail: <strong className="text-gray-300">dpo@galvanizacaoraitz.com.br</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">11. Alteracoes</h2>
            <p>
              Esta politica pode ser atualizada periodicamente. A data da ultima atualizacao e:{' '}
              <strong className="text-gray-300">julho de 2026</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
