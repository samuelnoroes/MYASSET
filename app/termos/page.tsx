import Link from "next/link";

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-surface">

      {/* Header */}
      <header style={{ backgroundColor: "#1B3564" }} className="text-white py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display text-2xl italic font-bold">
            My<span style={{ color: "#6BA68A" }}>Asset</span>
          </Link>
          <span className="text-xs text-white/50 uppercase tracking-widest">Documentos Legais</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Introdução */}
        <div className="card mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink mb-2">Documentos Legais — MyAsset</h1>
          <p className="text-sm text-ink-3 mb-1">Versão 1.0 — Vigência a partir de <span className="font-semibold">[A PREENCHER]</span></p>
          <p className="text-sm text-ink-2 mt-4">
            Ao realizar o cadastro na plataforma MyAsset, o Usuário declara ter lido e concordado com todos os documentos abaixo.
          </p>

          {/* Navegação interna */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <a href="#termos-de-uso" className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-border hover:bg-surface transition-colors text-ink-2">
              1. Termos de Uso
            </a>
            <a href="#privacidade" className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-border hover:bg-surface transition-colors text-ink-2">
              2. Política de Privacidade
            </a>
            <a href="#adesao" className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-border hover:bg-surface transition-colors text-ink-2">
              3. Termo de Adesão
            </a>
          </div>
        </div>

        {/* ── PARTE 1 — TERMOS DE USO ── */}
        <section id="termos-de-uso" className="card mb-8">
          <div className="border-b border-border pb-4 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-3">Parte 1 de 3</span>
            <h2 className="text-xl font-bold text-ink mt-1">Termos de Uso</h2>
          </div>

          <div className="space-y-6 text-sm text-ink-2 leading-relaxed">

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">1. Identificação da Plataforma</h3>
              <p>MyAsset é uma plataforma digital de gestão patrimonial imobiliária desenvolvida e operada por A5 Asset, <span className="font-semibold">[A PREENCHER — RAZÃO SOCIAL]</span>, inscrita no CNPJ sob o nº <span className="font-semibold">[A PREENCHER — CNPJ]</span>, com sede em Fortaleza/CE.</p>
              <p className="mt-2">Contato: <span className="font-semibold">[A PREENCHER — EMAIL]</span></p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">2. Aceite dos Termos</h3>
              <p>Ao acessar ou utilizar a plataforma MyAsset, o Usuário declara ter lido, compreendido e concordado integralmente com os presentes Termos de Uso. Caso não concorde com qualquer disposição, o Usuário deverá cessar imediatamente o uso da plataforma.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">3. O que é o MyAsset</h3>
              <p>O MyAsset é uma ferramenta de organização e visualização de portfólio imobiliário. A plataforma permite ao Usuário:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Cadastrar e gerenciar informações sobre seus imóveis</li>
                <li>Visualizar dados patrimoniais consolidados</li>
                <li>Receber alertas e avisos informativos sobre oportunidades de empreendimentos e melhorias aplicáveis ao seu patrimônio</li>
                <li>Comunicar-se com a equipe da A5 Asset via canal integrado</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-bold text-yellow-800 uppercase tracking-wider text-xs mb-2">⚠️ 4. Aviso Importante — Caráter Informativo</h3>
              <p className="text-yellow-800">As informações, alertas, análises e conteúdos disponibilizados na plataforma MyAsset têm caráter <strong>exclusivamente informativo</strong> e <strong>não constituem</strong>:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-800">
                <li>Oferta, recomendação ou sugestão de investimento</li>
                <li>Consultoria financeira regulada</li>
                <li>Assessoria de investimentos nos termos da regulação da CVM</li>
                <li>Promessa, garantia ou projeção de rentabilidade ou valorização</li>
              </ul>
              <p className="mt-2 text-yellow-800">A A5 Asset não é responsável por decisões de compra, venda, locação ou qualquer movimentação patrimonial tomada pelo Usuário com base nas informações disponibilizadas na plataforma.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">5. Cadastro e Acesso</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>O acesso à plataforma é restrito a usuários previamente autorizados pela A5 Asset, mediante convite e aceite deste instrumento.</li>
                <li>O Usuário é responsável pela confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.</li>
                <li>É vedado compartilhar credenciais de acesso com terceiros.</li>
                <li>Em caso de suspeita de uso não autorizado, o Usuário deve notificar imediatamente a A5 Asset pelo canal de suporte.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">6. Responsabilidades do Usuário</h3>
              <p>O Usuário compromete-se a:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Fornecer informações verdadeiras, precisas e atualizadas sobre seus imóveis</li>
                <li>Utilizar a plataforma apenas para fins lícitos e compatíveis com estes Termos</li>
                <li>Não realizar engenharia reversa, cópia ou reprodução não autorizada da plataforma ou de seus componentes</li>
                <li>Não utilizar a plataforma para fins que violem a legislação brasileira vigente</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">7. Responsabilidades da A5 Asset</h3>
              <p>A A5 Asset compromete-se a manter a plataforma disponível com razoável continuidade, proteger os dados do Usuário conforme a Política de Privacidade, e comunicar interrupções relevantes com antecedência razoável.</p>
              <p className="mt-2">A A5 Asset <strong>não se responsabiliza</strong> por decisões patrimoniais ou financeiras tomadas pelo Usuário, indisponibilidade temporária por fatores externos, ou danos decorrentes do uso indevido das credenciais pelo Usuário.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">8. Propriedade Intelectual</h3>
              <p>Todo o conteúdo da plataforma MyAsset, incluindo design, código, textos, logotipos e funcionalidades, é de propriedade exclusiva da A5 Asset e protegido pela legislação brasileira de propriedade intelectual (Lei 9.610/98). É vedada qualquer reprodução ou uso não autorizado.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">9. Vigência e Rescisão</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Estes Termos vigoram por prazo indeterminado a partir do primeiro acesso do Usuário à plataforma.</li>
                <li>A A5 Asset poderá suspender ou encerrar o acesso do Usuário a qualquer momento, em caso de violação destes Termos.</li>
                <li>O Usuário poderá solicitar o encerramento de sua conta a qualquer momento pelo canal de suporte.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">10. Alterações dos Termos</h3>
              <p>A A5 Asset reserva-se o direito de atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas ao Usuário com antecedência mínima de 15 dias. O uso continuado da plataforma após a notificação implica aceite das novas condições.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">11. Foro e Lei Aplicável</h3>
              <p>Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de Fortaleza/CE para dirimir quaisquer controvérsias decorrentes deste instrumento.</p>
            </div>

          </div>
        </section>

        {/* ── PARTE 2 — POLÍTICA DE PRIVACIDADE ── */}
        <section id="privacidade" className="card mb-8">
          <div className="border-b border-border pb-4 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-3">Parte 2 de 3</span>
            <h2 className="text-xl font-bold text-ink mt-1">Política de Privacidade (LGPD)</h2>
          </div>

          <div className="space-y-6 text-sm text-ink-2 leading-relaxed">

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">1. Controlador dos Dados</h3>
              <p>A5 Asset — <span className="font-semibold">[A PREENCHER — RAZÃO SOCIAL]</span></p>
              <p>CNPJ: <span className="font-semibold">[A PREENCHER]</span> | Fortaleza, CE</p>
              <p>Encarregado (DPO): <span className="font-semibold">[A PREENCHER — NOME E EMAIL]</span></p>
              <p className="mt-2">Esta Política foi elaborada em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">2. Dados Coletados</h3>
              <p className="font-semibold text-ink mb-1">Dados de identificação (fornecidos no cadastro):</p>
              <p>Nome completo, e-mail, telefone/WhatsApp, CPF</p>
              <p className="font-semibold text-ink mt-3 mb-1">Dados de patrimônio (fornecidos pelo Usuário):</p>
              <p>Endereço e localização dos imóveis, modalidade, valor estimado e valor de aluguel, e outras características informadas pelo Usuário.</p>
              <p className="font-semibold text-ink mt-3 mb-1">Dados de uso (coletados automaticamente):</p>
              <p>Login, data e hora de acesso, navegação e interações dentro da plataforma, endereço IP e tipo de dispositivo.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">3. Finalidade do Tratamento</h3>
              <p>Os dados são utilizados exclusivamente para:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Prestação dos serviços da plataforma MyAsset</li>
                <li>Personalização de alertas e avisos de oportunidades</li>
                <li>Comunicação entre o Usuário e a equipe da A5 Asset</li>
                <li>Melhoria contínua da plataforma</li>
                <li>Cumprimento de obrigações legais e regulatórias</li>
              </ul>
              <p className="mt-3 font-semibold text-ink">A A5 Asset não vende, comercializa ou cede dados do Usuário a terceiros para fins de marketing ou publicidade.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">4. Base Legal</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Art. 7º, V da LGPD — Execução de contrato</li>
                <li>Art. 7º, II da LGPD — Consentimento do Titular</li>
                <li>Art. 7º, VI da LGPD — Exercício regular de direitos</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">5. Compartilhamento de Dados</h3>
              <p>Os dados poderão ser compartilhados apenas com:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Fornecedores de infraestrutura tecnológica (Vercel, Supabase), sob obrigação de confidencialidade</li>
                <li>Autoridades públicas, quando exigido por lei ou ordem judicial</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">6. Armazenamento e Segurança</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Dados armazenados com criptografia em trânsito (HTTPS) e repouso</li>
                <li>Acesso restrito a colaboradores com necessidade operacional</li>
                <li>Em caso de incidente, a A5 Asset notificará a ANPD e o Usuário no prazo legal</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">7. Retenção dos Dados</h3>
              <p>Os dados serão mantidos pelo período de prestação dos serviços e obrigações legais. Após encerramento da conta, os dados serão eliminados em até 90 dias.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">8. Direitos do Titular</h3>
              <p>Nos termos da LGPD, o Usuário tem direito a:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Confirmar a existência e acessar seus dados</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar eliminação de dados desnecessários</li>
                <li>Revogar o consentimento e solicitar portabilidade</li>
                <li>Obter informações sobre compartilhamento com terceiros</li>
              </ul>
              <p className="mt-2">Para exercer qualquer direito: <span className="font-semibold">[A PREENCHER — EMAIL]</span></p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">9. Contato e Autoridade</h3>
              <p>Encarregado (DPO): <span className="font-semibold">[A PREENCHER — EMAIL]</span></p>
              <p>Autoridade Nacional de Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.gov.br/anpd</a></p>
            </div>

          </div>
        </section>

        {/* ── PARTE 3 — TERMO DE ADESÃO ── */}
        <section id="adesao" className="card mb-8">
          <div className="border-b border-border pb-4 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-3">Parte 3 de 3</span>
            <h2 className="text-xl font-bold text-ink mt-1">Termo de Adesão</h2>
          </div>

          <div className="space-y-6 text-sm text-ink-2 leading-relaxed">

            <div className="bg-surface rounded p-4">
              <p className="font-semibold text-ink mb-1">Contratada:</p>
              <p>A5 Asset — <span className="font-semibold">[A PREENCHER — RAZÃO SOCIAL]</span></p>
              <p>CNPJ: <span className="font-semibold">[A PREENCHER]</span> | Fortaleza, CE</p>
              <p>Representada por: Samuel Norões</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">1. Objeto</h3>
              <p>Este Termo formaliza o acesso do Aderente à plataforma MyAsset, para organização, visualização e gestão informacional do portfólio imobiliário do Aderente.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">2. O que está incluído</h3>
              <ul className="list-[lower-alpha] pl-5 space-y-1">
                <li>Cadastro e visualização de imóveis do portfólio</li>
                <li>Painel consolidado de gestão patrimonial</li>
                <li>Alertas e avisos informativos sobre oportunidades e otimizações</li>
                <li>Canal de comunicação direto com a A5 Asset via WhatsApp</li>
                <li>Atualizações e melhorias da plataforma durante a vigência</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-bold text-yellow-800 uppercase tracking-wider text-xs mb-2">3. Declaração de Limitação</h3>
              <p className="text-yellow-800">O Aderente declara expressamente compreender que a plataforma:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-800">
                <li>NÃO é assessoria de investimentos regulada pela CVM</li>
                <li>NÃO oferece recomendações de compra, venda ou locação</li>
                <li>NÃO garante rentabilidade, valorização ou qualquer resultado</li>
                <li>NÃO substitui avaliação de profissionais especializados</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">4. Condições de Acesso</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Acesso pessoal e intransferível</li>
                <li>O Aderente é responsável pela segurança de suas credenciais</li>
                <li>O cadastro inicial dos imóveis será realizado com apoio da equipe A5 Asset, conforme combinado individualmente</li>
                <li>O Aderente compromete-se a fornecer informações verídicas</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">5. Rescisão</h3>
              <p>Qualquer das partes pode rescindir com aviso prévio de 15 dias pelo canal de WhatsApp da A5 Asset. Após rescisão, os dados serão eliminados em até 90 dias conforme a Política de Privacidade.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink uppercase tracking-wider text-xs mb-2">6. Foro e Lei Aplicável</h3>
              <p>Legislação brasileira. Foro: comarca de Fortaleza/CE.</p>
            </div>

          </div>
        </section>

        {/* Aceite digital */}
        <div className="card bg-green-50 border border-green-200 text-center">
          <p className="text-sm font-bold text-green-800 mb-2">✅ Aceite Digital</p>
          <p className="text-sm text-green-700">
            Ao realizar o cadastro na plataforma MyAsset e marcar a caixa de aceite,
            o Usuário confirma que leu, compreendeu e concorda com todos os documentos acima.
          </p>
          <p className="text-xs text-green-600 mt-2">
            Nos termos do art. 10, §2º da MP 2.200-2/2001, o aceite digital equivale à assinatura para todos os fins legais.
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded text-white font-bold text-sm uppercase tracking-wider"
              style={{ backgroundColor: "#1B3564" }}
            >
              Voltar para o MyAsset
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-ink-3">
          <p>A5 Asset | <span className="font-semibold">[A PREENCHER — RAZÃO SOCIAL]</span> | CNPJ <span className="font-semibold">[A PREENCHER]</span></p>
          <p className="mt-1">Fortaleza, CE — Versão 1.0</p>
        </div>

      </div>
    </main>
  );
}
