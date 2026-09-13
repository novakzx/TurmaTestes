import { Link } from 'react-router-dom';
import { IconAlert } from '../components/Icons.jsx';

function Shell({ children }) {
  return (
    <div className="auth-wrap" style={{ alignItems: 'flex-start' }}>
      <div className="card static-page" style={{ maxWidth: 720 }}>
        <Link to="/" className="row mb-3" style={{ color: 'var(--brand-ink)', fontWeight: 700, fontSize: 14 }}>← Voltar ao Turma+</Link>
        {children}
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <Shell>
      <h1>Política de Privacidade</h1>
      <p className="updated">Última atualização: setembro de 2026 · Em conformidade com o RGPD (Regulamento (UE) 2016/679)</p>

      <div className="notice">
        <IconAlert size={16} />
        <span>Esta é uma <strong>versão de demonstração</strong> do Turma+. Os textos legais abaixo são um modelo de referência — em produção devem ser revistos por um encarregado de proteção de dados (DPO) e por assessoria jurídica.</span>
      </div>

      <h2>1. Responsável pelo tratamento</h2>
      <p>Turma+ (projeto demonstrativo). Contacto do encarregado de proteção de dados: <strong>privacidade@turmamais.pt</strong>.</p>

      <h2>2. Dados que tratamos (minimização)</h2>
      <ul>
        <li><strong>Conta:</strong> email, nome de utilizador, nome de apresentação, palavra-passe (guardada apenas como hash criptográfico bcrypt — nunca em texto).</li>
        <li><strong>Perfil (facultativo):</strong> escola, distrito, município, ano de escolaridade, curso, biografia.</li>
        <li><strong>Conteúdo:</strong> publicações, comentários, gostos, mensagens, fichas de estudo guardadas.</li>
        <li><strong>Técnico:</strong> registo de auditoria de acessos (IP, user-agent, ação, data) para segurança; subscrições de notificações push.</li>
      </ul>
      <p>Não recolhemos dados de categorias especiais, não fazemos seguimento publicitário e não vendemos dados a terceiros.</p>

      <h2>3. Finalidades e bases jurídicas (art. 6.º RGPD)</h2>
      <ul>
        <li><strong>Execução de contrato:</strong> fornecer as funcionalidades que pediste (feed, mensagens, calendário, apoio).</li>
        <li><strong>Consentimento:</strong> notificações push (revogável em Definições a qualquer momento) e dados de perfil facultativos.</li>
        <li><strong>Interesse legítimo:</strong> segurança da plataforma (prevenção de abuso, registos de auditoria) e melhoria do serviço.</li>
      </ul>

      <h2>4. Menores</h2>
      <p>O Turma+ destina-se a estudantes com <strong>13 anos ou mais</strong>. Entre os 13 e os 16 anos, o consentimento para tratamento de dados pessoais deve ser dado ou autorizado pelo encarregado de educação (art. 8.º RGPD e Lei n.º 58/2019). O registo inclui confirmação explícita deste requisito.</p>

      <h2>5. Conservação</h2>
      <p>Os dados são conservados enquanto a conta estiver ativa. Após eliminação da conta, todos os dados pessoais são apagados (em cascata na base de dados), exceto registos de auditoria de segurança, conservados por 12 meses por obrigação de interesse legítimo, e depois anonimizados.</p>

      <h2>6. Os teus direitos (arts. 15–22 RGPD)</h2>
      <ul>
        <li><strong>Acesso e portabilidade:</strong> Definições → "Exportar" devolve todos os teus dados em JSON.</li>
        <li><strong>Apagamento:</strong> Definições → "Eliminar conta" (imediato e irreversível).</li>
        <li><strong>Retificação:</strong> edita o teu perfil a qualquer momento.</li>
        <li><strong>Oposição/limitação:</strong> contacta o DPO; podes desativar push e tornar o perfil privado.</li>
        <li><strong>Reclamação:</strong> tens direito a reclamar junto da <strong>CNPD</strong> (Comissão Nacional de Proteção de Dados — www.cnpd.pt).</li>
      </ul>

      <h2>7. Partilha com terceiros</h2>
      <p>Não partilhamos dados pessoais com terceiros para fins comerciais. Subcontratantes técnicos (alojamento, envio de push) atuam apenas sob instruções e com acordo de subcontratação (art. 28.º).</p>

      <h2>8. Segurança</h2>
      <p>HTTPS obrigatório, passwords com bcrypt (custo 12), tokens de sessão JWT em cookies httpOnly + SameSite, proteção CSRF, limitação de tentativas de acesso, validação de todas as entradas, cabeçalhos de segurança (CSP, HSTS) e registos de auditoria. Detalhes técnicos em <code>docs/03-seguranca-gdpr.md</code>.</p>
    </Shell>
  );
}

export function TermsPage() {
  return (
    <Shell>
      <h1>Termos de Utilização</h1>
      <p className="updated">Última atualização: setembro de 2026 · Versão de demonstração (modelo de referência)</p>

      <h2>1. O serviço</h2>
      <p>O Turma+ é uma aplicação web progressiva (PWA) gratuita para estudantes em Portugal, com feed comunitário, calendário oficial (feriados, férias escolares e greves), mensagens diretas e de grupo, e ferramentas de apoio ao estudo ("Explicador").</p>

      <h2>2. Elegibilidade</h2>
      <p>Destina-se a estudantes residentes em Portugal com 13 anos ou mais (com autorização do encarregado de educação quando exigível). Uma conta por pessoa.</p>

      <h2>3. Regras da comunidade</h2>
      <ul>
        <li>Respeita todos os utilizadores — não é permitido assédio, discurso de ódio, bullying ou discriminação.</li>
        <li>Não publiques conteúdo sexual, violento, ilegal ou que viole direitos de terceiros.</li>
        <li>Não partilhes dados pessoais de terceiros (incluindo professores e colegas) sem consentimento.</li>
        <li>Não uses o Explicador para fazer fraudes académicas — usa-o para <em>aprender</em>. Trabalhos avaliados devem ser teus.</li>
        <li>Não tentes aceder a contas de outros utilizadores nem perturbar o funcionamento do serviço.</li>
      </ul>
      <p>Violações podem resultar em remoção de conteúdo, suspensão ou eliminação da conta, com possibilidade de recurso para <strong>apoio@turmamais.pt</strong>.</p>

      <h2>4. Conteúdo</h2>
      <p>Manténs a propriedade do que publicas. Concedes ao Turma+ uma licença limitada para alojar e apresentar esse conteúdo aos destinatários que escolheres (público, seguidores ou membros de grupo). Podes apagar o teu conteúdo a qualquer momento.</p>

      <h2>5. Calendário e informações oficiais</h2>
      <p>Os dados de feriados baseiam-se em fontes públicas oficiais. O calendário escolar e os avisos de greve nesta versão de demonstração são <strong>estimativas/dados de exemplo</strong> e não substituem as publicações oficiais (Diário da República, DGEstE, escolas). Confirma sempre junto da tua escola.</p>

      <h2>6. Apoio ao estudo ("Explicador")</h2>
      <p>As fichas de estudo são material de apoio educativo, revistas quanto ao currículo português, mas podem conter imprecisões. Não substituem professores nem manuais adotados. Reporta erros em apoio@turmamais.pt.</p>

      <h2>7. Disponibilidade e garantias</h2>
      <p>O serviço é fornecido "tal como está", sem garantia de disponibilidade ininterrupta. Podemos suspender o serviço para manutenção com aviso prévio sempre que possível.</p>

      <h2>8. Alterações</h2>
      <p>Alterações aos termos são notificadas na app com 14 dias de antecedência. O uso continuado após a entrada em vigor constitui aceitação.</p>
    </Shell>
  );
}

export function AboutPage() {
  return (
    <Shell>
      <h1>Sobre o Turma+</h1>
      <p className="updated">Versão 1.0.0 (demonstração)</p>
      <p>O Turma+ é uma plataforma integrada para estudantes portugueses — do básico ao secundário, do continente às regiões autónomas:</p>
      <ul>
        <li><strong>Feed</strong> comunitário com temas por disciplina, sondagens e hashtags;</li>
        <li><strong>Calendário oficial</strong>: 13 feriados nacionais + regionais (Açores e Madeira) + municipais, períodos letivos, férias, exames e greves, com exportação .ics;</li>
        <li><strong>Mensagens</strong> diretas e grupos de estudo em tempo real (SSE), com notificações push;</li>
        <li><strong>Apoio ao estudo</strong>: fichas estruturadas do currículo português, calculadora científica, resolvedor de equações, derivadas e planos de estudo — gratuito e offline;</li>
        <li><strong>Perfil</strong> com apontamentos guardados, definições de privacidade e exportação/eliminação de dados (RGPD).</li>
      </ul>
      <h2>Tecnologia</h2>
      <p>React + Vite (PWA instalável, offline-first), Node.js/Express, SQLite (migração PostgreSQL documentada), JWT + CSRF + rate limiting, Web Push/VAPID, SSE. Documentação completa em <code>docs/</code> e <code>README.md</code> no repositório.</p>
      <h2>Avisos da versão de demonstração</h2>
      <ul>
        <li>Os registos de <strong>greves</strong> são dados de exemplo, claramente identificados como tal.</li>
        <li>O <strong>calendário escolar</strong> é uma estimativa do padrão típico (a confirmar pelo despacho anual da DGEstE).</li>
        <li>O motor de apoio funciona com uma <strong>base de conhecimento curada</strong> local (100% offline); um fornecedor LLM pode ser ligado por configuração (sem alterar a experiência).</li>
      </ul>
      <p className="mt-3"><Link to="/" className="btn btn-primary">Voltar à app</Link></p>
    </Shell>
  );
}

export default function Static() {
  return <AboutPage />;
}
