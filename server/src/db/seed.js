/**
 * Dados de demonstração do Turma+.
 * Executado automaticamente no primeiro arranque (ou `npm run seed`).
 * Conta demo: maria.silva / Estudante2026! (todas as contas seed usam esta palavra-passe).
 */
import bcrypt from 'bcryptjs';
import { getDb, nowIso, insertReturningId } from './index.js';
import { generateCalendarEvents, MUNICIPAL_HOLIDAYS } from '../services/pt-calendar.js';
import { KNOWLEDGE } from '../services/tutor/knowledge.js';

const DEMO_PASSWORD = 'Estudante2026!';

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
const daysAgo = (d) => hoursAgo(d * 24);

const USERS = [
  { username: 'turmamais', displayName: 'Equipa Turma+', role: 'admin', color: '#16A34A', bio: 'Conta oficial do Turma+. Novidades, notas de estudo e avisos de calendário.', school: 'Turma+', district: 'Lisboa', municipality: 'Lisboa', gradeYear: '', course: '' },
  { username: 'maria.silva', displayName: 'Maria Silva', color: '#DB2777', bio: '12.º ano, Ciências e Tecnologias. Objetivo: Medicina. Café e fichas de estudo.', school: 'Escola Secundária D. Pedro V', district: 'Lisboa', municipality: 'Lisboa', gradeYear: '12.º ano', course: 'Ciências e Tecnologias' },
  { username: 'joao.santos', displayName: 'João Santos', color: '#2563EB', bio: '11.º no Porto. Futebol, Física e francesinhas.', school: 'Escola Secundária Rodrigues de Freitas', district: 'Porto', municipality: 'Porto', gradeYear: '11.º ano', course: 'Ciências e Tecnologias' },
  { username: 'ana.costa', displayName: 'Ana Costa', color: '#7C3AED', bio: '12.º ano em Coimbra. Métodos de estudo e flashcards.', school: 'Escola Secundária José Falcão', district: 'Coimbra', municipality: 'Coimbra', gradeYear: '12.º ano', course: 'Ciências e Tecnologias' },
  { username: 'pedro.ferreira', displayName: 'Pedro Ferreira', color: '#D97706', bio: '10.º ano, recém-chegado ao secundário. Braga.', school: 'Escola Secundária Alberto Sampaio', district: 'Braga', municipality: 'Braga', gradeYear: '10.º ano', course: 'Humanidades' },
  { username: 'rita.rodrigues', displayName: 'Rita Rodrigues', color: '#E11D48', bio: 'Faro, 11.º. Sobreviver ao calor do Algarve é o meu desporto.', school: 'Escola Secundária João de Deus', district: 'Faro', municipality: 'Faro', gradeYear: '11.º ano', course: 'Artes Visuais' },
  { username: 'tiago.martins', displayName: 'Tiago Martins', color: '#0891B2', bio: '12.º, Matemática A é a minha vida (e o meu sofrimento).', school: 'Escola Secundária Dr. Jaime Magalhães Lima', district: 'Aveiro', municipality: 'Aveiro', gradeYear: '12.º ano', course: 'Ciências e Tecnologias' },
  { username: 'sofia.oliveira', displayName: 'Sofia Oliveira', color: '#059669', bio: 'Madeira, 11.º ano. Partilho aqui as dúvidas que não tenho coragem de levantar na aula.', school: 'Escola Secundária Jaime Moniz', district: 'Madeira', municipality: 'Funchal', gradeYear: '11.º ano', course: 'Línguas e Humanidades' },
  { username: 'guilherme.sousa', displayName: 'Guilherme Sousa', color: '#4F46E5', bio: 'Açores, 12.º. Estudo com vista para o Atlântico.', school: 'Escola Secundária Antero de Quental', district: 'Açores', municipality: 'Ponta Delgada', gradeYear: '12.º ano', course: 'Ciências e Tecnologias' },
  { username: 'beatriz.almeida', displayName: 'Beatriz Almeida', color: '#DC2626', bio: '10.º em Setúbal. À procura de gente para grupo de estudo!', school: 'Escola Secundária du Bocage', district: 'Setúbal', municipality: 'Setúbal', gradeYear: '10.º ano', course: 'Socioeconómica' },
  { username: 'diogo.carvalho', displayName: 'Diogo Carvalho', color: '#EA580C', bio: 'Viseu, 11.º. Basquete de manhã, Biologia à tarde.', school: 'Escola Secundária Viriato', district: 'Viseu', municipality: 'Viseu', gradeYear: '11.º ano', course: 'Ciências e Tecnologias' },
  { username: 'ines.pereira', displayName: 'Inês Pereira', color: '#9333EA', bio: '12.º ano em Leiria. Conta decrescente para os exames.', school: 'Escola Secundária Francisco Rodrigues Lobo', district: 'Leiria', municipality: 'Leiria', gradeYear: '12.º ano', course: 'Línguas e Humanidades' },
];

const POSTS = [
  { u: 'turmamais', h: 2, subject: 'Turma+', content: 'Bem-vindos ao Turma+.\n\nO que a plataforma reúne:\n- Feed com a comunidade estudantil de todo o país\n- Calendário com feriados nacionais, regionais e municipais, férias letivas e avisos de greve\n- Mensagens diretas e grupos de estudo\n- Apoio ao estudo: fichas por disciplina, calculadora, resolução de equações e planos de trabalho\n\nCompleta o teu perfil (escola, ano e município) para o calendário ser ajustado à tua região.' },
  { u: 'turmamais', h: 50, subject: 'Regresso às aulas', content: 'O ano letivo 2026/27 já está no calendário: períodos letivos, interrupções e feriados.\n\nNo separador Calendário, o botão "Exportar" gera um ficheiro .ics para integrares tudo na aplicação de calendário do teu telemóvel.\n\n#RegressoÀsAulas #AnoLetivo2627' },
  { u: 'maria.silva', h: 4, subject: '', content: 'Primeira semana de 12.º ano concluída. Balanço: Física e Química A já me custa noites de sono, e ainda nem houve testes.\n\nQuem vai fazer exames de Matemática A e Biologia? #12ºAno #ExamesNacionais', poll: { question: 'Qual é o teu maior medo deste ano letivo?', options: ['Exames nacionais', 'Apresentações orais', 'Acordar cedo', 'Escolher o curso'] } },
  { u: 'tiago.martins', h: 7, subject: 'Matemática A', content: 'Dica que me salvou em derivadas: antes de derivar, simplifica sempre a expressão. Metade dos erros que fazia eram de álgebra, não de derivadas.\n\nA ficha "Derivadas" do Apoio explica os passos termo a termo. #MatemáticaA' },
  { u: 'joao.santos', h: 10, subject: '', content: 'Porto em modo setembro: mochila nova, chuva no primeiro dia e o míster de Ed. Física a dizer que "este ano é para levar a sério".\n\nAlguém do norte por aqui? #Porto #RegressoÀsAulas' },
  { u: 'ana.costa', h: 14, subject: 'Métodos de estudo', content: 'O meu sistema de flashcards para Biologia (11.º→12.º):\n1. Faço as cartas na aula, à mão\n2. Reviso no dia seguinte, 3 dias depois e 1 semana depois\n3. O que erro 2× vai para o "caderno vermelho".\n\nResultados do ano passado: BG de 13 → 17. Repetição espaçada funciona mesmo. #Estudo #BiologiaGeologia' },
  { u: 'beatriz.almeida', h: 20, subject: '', content: 'Gente de Setúbal do 10.º ano: estou a montar um grupo de estudo para Socioeconómica (Matemática Aplicada e Economia). Quem quiser juntar-se, mande mensagem. #Setúbal #GrupoDeEstudo' },
  { u: 'turmamais', h: 28, subject: 'Apoio', content: 'O separador Apoio não é um assistente conversacional: é um explicador com fichas de estudo do currículo português.\n\nConteúdo disponível:\n- Equações do 2.º grau resolvidas passo a passo\n- Redox, pH e leis de Newton\n- Os Lusíadas, Fernando Pessoa e Estado Novo\n- Métodos de estudo com base em evidência científica\n\nO acesso é gratuito, funciona sem ligação e as fichas podem ser guardadas nos Apontamentos.' },
  { u: 'ines.pereira', h: 33, subject: 'Português', content: 'Resumo que fiz d\'Os Lusíadas para quem está a começar: 4 planos (Viagem, Deuses, História de Portugal, Povo), herói coletivo e oitava rima. Guardem o episódio do Adamastor: sai com frequência. #Português #Lusíadas' },
  { u: 'sofia.oliveira', h: 40, subject: '', content: 'Vantagem de estudar na Madeira: o feriado regional de 1 de julho já passou, mas a Primeira Oitava (26 de dezembro) está à espera.\n\nNo calendário do Turma+ já vejo os feriados regionais dos Açores e da Madeira — finalmente uma app que não se esquece das ilhas! #Madeira #Açores' },
  { u: 'guilherme.sousa', h: 46, subject: '', content: 'Açores presentes. O Dia da Região (segunda-feira do Espírito Santo) já está no meu calendário.\n\nPessoal das ilhas: como está a correr o regresso às aulas?' },
  { u: 'rita.rodrigues', h: 55, subject: '', content: 'Faro, 11.º ano, 34 °C na sala de aula. O aquecimento global devia ser matéria de exame só para o ministério perceber. #Faro #Clima' },
  { u: 'pedro.ferreira', h: 62, subject: '', content: 'O secundário é MUITO diferente do básico. Semana 1 e já tenho dossiers para 11 disciplinas.\n\nConselho que me deram e confirmo: não deixes acumular, 30 min por dia batem 5 h à sexta. #10ºAno', poll: { question: 'Humanidades ou Ciências — mudavas se pudesses?', options: ['Não, estou bem', 'Talvez', 'Sim, totalmente', 'Ainda estou a descobrir'] } },
  { u: 'diogo.carvalho', h: 70, subject: '', content: 'Viseu aqui! Basquete às 7h30 antes das aulas = chegar a FQ a pensar em triplos e não em moles.\n\nAlguém consegue treinar de manhã e render nas aulas? Dicas?' },
  { u: 'maria.silva', h: 80, subject: 'Métodos de estudo', content: 'Fiz um plano de estudo no Apoio até aos exames de junho: 3 fases (diagnóstico → revisão → prática com provas antigas) e 6 h/semana realistas.\n\nImprimi e colei na secretária. Partilho o método com quem pedir. #Estudo #ExamesNacionais' },
  { u: 'turmamais', h: 96, subject: 'Calendário', content: 'Nota sobre greves escolares: os registos de greve nesta versão são dados de demonstração.\n\nNuma versão de produção, esta secção seria alimentada por fontes oficiais (pré-avisos sindicais publicados e comunicados do Ministério da Educação), com verificação editorial antes de publicar. Detalhes na Política de Privacidade e nos Termos.' },
  { u: 'ana.costa', h: 105, subject: 'Filosofia', content: 'Kant vs utilitarismo explicado com um exemplo de escola:\n\nColar no exame — Kant: errado sempre (não posso querer "colar" como lei universal). Utilitarista: errado porque o dano coletivo supera o benefício.\n\nChegam ao mesmo veredicto por caminhos diferentes. A ficha do Apoio tem os dois lado a lado. #Filosofia' },
  { u: 'tiago.martins', h: 120, subject: 'Matemática A', content: 'Desafio rápido: quantas soluções reais tem 3x² + x + 5 = 0?\n\nNão resolves à mão primeiro — pensa só no discriminante. Resposta nos comentários daqui a umas horas. #MatemáticaA', poll: { question: 'Δ = b² − 4ac = 1 − 60 = −59. Então…', options: ['Duas soluções reais', 'Uma solução dupla', 'Nenhuma solução real', 'Infinitas'] } },
  { u: 'joao.santos', h: 130, subject: 'Física e Química A', content: 'FQ: as leis de Newton finalmente fizeram clique quando percebi que a Normal NEM SEMPRE é igual ao peso (planos inclinados, elevadores a acelerar…).\n\nDiagrama de corpo livre sempre antes de calcular; a ficha do Apoio ajuda a sistematizar o raciocínio. #FísicaQuímicaA' },
  { u: 'ines.pereira', h: 142, subject: 'História A', content: '25 de Abril: fixe que o MFA usou duas senhas de rádio — "E depois do adeus" e "Grândola, Vila Morena". Pormenores destes valem pontos nos critérios de correção. #HistóriaA' },
];

const COMMENTS = [
  { post: 2, u: 'tiago.martins', h: 3, content: 'Eu vou fazer Mat A e FQ. Força aí!' },
  { post: 2, u: 'ines.pereira', h: 2.5, content: 'Mat A + História aqui. O medo é real mas o plano de estudo ajuda.' },
  { post: 2, u: 'ana.costa', h: 1.5, content: 'Biologia também. Vamos organizando um grupo de estudo.' },
  { post: 4, u: 'maria.silva', h: 9, content: 'Confirmo, a ficha das derivadas está mesmo boa.' },
  { post: 6, u: 'pedro.ferreira', h: 13, content: 'Guardado! Vou experimentar o caderno vermelho.' },
  { post: 7, u: 'diogo.carvalho', h: 19, content: 'De Viseu mando força. Se precisares de materiais de Socioeconómica avisa.' },
  { post: 17, u: 'maria.silva', h: 118, content: 'Nenhuma solução real: discriminante negativo.' },
  { post: 17, u: 'ana.costa', h: 117, content: 'Complexas existem (x = −1/6 ± i√59/6), mas reais = zero.' },
  { post: 8, u: 'sofia.oliveira', h: 26, content: 'A secção de Pessoa salvou-me o teste. Obrigada equipa!' },
];

const LIKES = [
  { post: 0, users: ['maria.silva', 'joao.santos', 'ana.costa', 'pedro.ferreira', 'rita.rodrigues', 'tiago.martins', 'sofia.oliveira', 'guilherme.sousa', 'beatriz.almeida', 'diogo.carvalho', 'ines.pereira'] },
  { post: 2, users: ['ana.costa', 'tiago.martins', 'ines.pereira', 'joao.santos', 'sofia.oliveira'] },
  { post: 3, users: ['maria.silva', 'ines.pereira', 'guilherme.sousa'] },
  { post: 4, users: ['maria.silva', 'diogo.carvalho', 'rita.rodrigues'] },
  { post: 5, users: ['maria.silva', 'pedro.ferreira', 'beatriz.almeida', 'tiago.martins'] },
  { post: 7, users: ['ana.costa', 'sofia.oliveira', 'guilherme.sousa', 'diogo.carvalho', 'ines.pereira', 'rita.rodrigues'] },
  { post: 8, users: ['maria.silva', 'sofia.oliveira'] },
  { post: 11, users: ['maria.silva', 'beatriz.almeida', 'ana.costa'] },
  { post: 14, users: ['ines.pereira', 'tiago.martins', 'ana.costa', 'diogo.carvalho'] },
  { post: 16, users: ['maria.silva', 'pedro.ferreira'] },
  { post: 17, users: ['maria.silva', 'ana.costa', 'ines.pereira'] },
];

const FOLLOWS = [
  ['maria.silva', 'turmamais'], ['maria.silva', 'ana.costa'], ['maria.silva', 'tiago.martins'], ['maria.silva', 'joao.santos'], ['maria.silva', 'ines.pereira'],
  ['joao.santos', 'turmamais'], ['joao.santos', 'maria.silva'], ['joao.santos', 'diogo.carvalho'],
  ['ana.costa', 'turmamais'], ['ana.costa', 'maria.silva'], ['ana.costa', 'ines.pereira'], ['ana.costa', 'tiago.martins'],
  ['pedro.ferreira', 'turmamais'], ['pedro.ferreira', 'maria.silva'],
  ['rita.rodrigues', 'turmamais'], ['rita.rodrigues', 'sofia.oliveira'],
  ['tiago.martins', 'turmamais'], ['tiago.martins', 'maria.silva'], ['tiago.martins', 'ana.costa'],
  ['sofia.oliveira', 'turmamais'], ['sofia.oliveira', 'guilherme.sousa'], ['sofia.oliveira', 'rita.rodrigues'],
  ['guilherme.sousa', 'turmamais'], ['guilherme.sousa', 'sofia.oliveira'],
  ['beatriz.almeida', 'turmamais'], ['beatriz.almeida', 'maria.silva'],
  ['diogo.carvalho', 'turmamais'], ['diogo.carvalho', 'joao.santos'],
  ['ines.pereira', 'turmamais'], ['ines.pereira', 'maria.silva'], ['ines.pereira', 'ana.costa'],
  ['teste', 'turmamais'], ['teste', 'maria.silva'], ['teste', 'ana.costa'],
  ['turmamais', 'teste'], ['maria.silva', 'teste'],
];

export function ensureSeed({ force = false } = {}) {
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const evCount = db.prepare('SELECT COUNT(*) c FROM calendar_events WHERE type = ?').get('holiday_national').c;

  // --- Calendário (idempotente) ------------------------------------------------
  if (evCount === 0 || force) {
    const y = new Date().getFullYear();
    const events = generateCalendarEvents([y - 1, y, y + 1], nowIso());
    const ins = db.prepare(
      `INSERT INTO calendar_events (type, title, description, date_start, date_end, scope, region_key, official, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const now = nowIso();
    for (const e of events) {
      ins.run(e.type, e.title, e.description, e.date, e.date_end, e.scope, e.region_key, e.official ? 1 : 0, e.source, now);
    }
    console.log(`[seed] calendário: ${events.length} eventos (feriados ${y - 1}–${y + 1}, escolas, greves demo)`);
  }

  if (userCount > 0 && !force) return false;

  // --- Utilizadores -------------------------------------------------------------
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 12);
  const ids = {};
  for (const u of USERS) {
    ids[u.username] = insertReturningId(
      `INSERT INTO users (email, username, display_name, password_hash, avatar_color, bio, school, district, municipality,
        grade_year, course, role, consent_terms_at, consent_privacy_at, created_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${u.username.replace('.', '_')}@exemplo.pt`, u.username, u.displayName, hash, u.color, u.bio, u.school,
        u.district, u.municipality, u.gradeYear, u.course, u.role || 'student',
        daysAgo(30), daysAgo(30), daysAgo(30), hoursAgo(Math.random() * 4),
      ]
    );
  }

  // --- Conta de teste pública (para exploração) --------------------------------
  ids['teste'] = insertReturningId(
    `INSERT INTO users (email, username, display_name, password_hash, avatar_color, bio, school, district, municipality,
       grade_year, course, role, consent_terms_at, consent_privacy_at, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'teste@exemplo.pt', 'teste', 'Conta de Teste', bcrypt.hashSync('Testar2026!', 12), '#E11D48',
      'Conta destinada a testes e demonstração da plataforma.', '', '', '', '', '', 'student',
      daysAgo(30), daysAgo(30), daysAgo(30), hoursAgo(1),
    ]
  );

  // --- Seguidores ----------------------------------------------------------------
  const insFollow = db.prepare('INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)');
  for (const [a, b] of FOLLOWS) insFollow.run(ids[a], ids[b], daysAgo(Math.random() * 20));

  // --- Publicações -----------------------------------------------------------------
  const postIds = [];
  for (const p of POSTS) {
    const createdAt = hoursAgo(p.h);
    const id = insertReturningId('INSERT INTO posts (user_id, content, subject, created_at) VALUES (?, ?, ?, ?)', [ids[p.u], p.content, p.subject || '', createdAt]);
    postIds.push(id);
    if (p.poll) {
      const pollId = insertReturningId('INSERT INTO polls (post_id, question) VALUES (?, ?)', [id, p.poll.question]);
      const insOpt = db.prepare('INSERT INTO poll_options (poll_id, text, position) VALUES (?, ?, ?)');
      p.poll.options.forEach((o, i) => insOpt.run(pollId, o, i));
      // votos de demonstração
      const opts = db.prepare('SELECT id FROM poll_options WHERE poll_id = ? ORDER BY position').all(pollId);
      const voters = USERS.filter((u) => u.username !== p.u).map((u) => ids[u.username]);
      const insVote = db.prepare('INSERT OR IGNORE INTO poll_votes (option_id, user_id, created_at) VALUES (?, ?, ?)');
      voters.forEach((v, i) => { if (i % 2 === 0 || i === 1) insVote.run(opts[i % opts.length].id, v, hoursAgo(p.h - 0.5)); });
    }
  }

  // --- Gostos e comentários --------------------------------------------------------
  const insLike = db.prepare('INSERT OR IGNORE INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)');
  for (const l of LIKES) {
    for (const uname of l.users) insLike.run(ids[uname], postIds[l.post], hoursAgo(Math.random() * 40));
  }
  const insComment = db.prepare('INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)');
  for (const c of COMMENTS) insComment.run(postIds[c.post], ids[c.u], c.content, hoursAgo(c.h));

  // --- Conversas e mensagens ---------------------------------------------------------
  const now = nowIso();
  const mkConv = (type, title, members) => {
    const cid = insertReturningId("INSERT INTO conversations (type, title, created_by, created_at) VALUES (?, ?, ?, ?)", [type, title, ids[members[0]], now]);
    const insM = db.prepare('INSERT INTO conversation_members (conversation_id, user_id, joined_at, last_read_at) VALUES (?, ?, ?, ?)');
    for (const m of members) insM.run(cid, ids[m], now, null);
    return cid;
  };
  const mkMsg = (cid, uname, content, when) => {
    insertReturningId('INSERT INTO messages (conversation_id, user_id, content, created_at) VALUES (?, ?, ?, ?)', [cid, ids[uname], content, when]);
    db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?').run(when, cid);
  };

  // Grupo de estudo — Matemática A
  const g1 = mkConv('group', 'Estudo de Matemática A', ['maria.silva', 'tiago.martins', 'ines.pereira', 'ana.costa']);
  mkMsg(g1, 'tiago.martins', 'Pessoal, na quinta há teste de derivadas. Alguém tem exercícios de retas tangentes?', hoursAgo(6));
  mkMsg(g1, 'ana.costa', 'Eu tenho a ficha 4 do manual resolvida. Uso a fórmula y = f(a) + f′(a)(x − a) para tudo.', hoursAgo(5));
  mkMsg(g1, 'ines.pereira', 'Obrigada. Sou de Humanidades, mas Matemática também me apanha.', hoursAgo(4.5));
  mkMsg(g1, 'maria.silva', 'Vamos marcar sessão de estudo no sábado à tarde? Posso levar os resumos de limites.', hoursAgo(1));
  db.prepare('UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?').run(hoursAgo(7), g1, ids['maria.silva']); // maria tem 3 não lidas

  // Grupo geral da comunidade
  const g2 = mkConv('group', 'Regresso às Aulas 26/27', USERS.map((u) => u.username));
  mkMsg(g2, 'turmamais', 'Bem-vindos ao grupo oficial do novo ano letivo. Regra única: ajudem-se uns aos outros.', hoursAgo(30));
  mkMsg(g2, 'pedro.ferreira', '10.º ano de Braga, a dizer olá.', hoursAgo(20));
  mkMsg(g2, 'rita.rodrigues', 'Faro presente, e a derreter.', hoursAgo(18));
  mkMsg(g2, 'guilherme.sousa', 'Açores também! Alguém quer trocar apontamentos de Geografia A?', hoursAgo(3));
  db.prepare('UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?').run(hoursAgo(2), g2, ids['maria.silva']);

  // DM maria ↔ joao
  const d1 = mkConv('dm', '', ['maria.silva', 'joao.santos']);
  mkMsg(d1, 'joao.santos', 'Maria, viste o post do Tiago sobre simplificar antes de derivar? Genial.', hoursAgo(9));
  mkMsg(d1, 'maria.silva', 'Vi. Ele usa sempre o Explicador para confirmar os passos.', hoursAgo(8.5));
  mkMsg(d1, 'joao.santos', 'A propósito: no fim de semana há jogo do Porto. Se o grupo de estudo quiser fazer pausa…', hoursAgo(0.5));
  db.prepare('UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?').run(hoursAgo(10), d1, ids['maria.silva']); // 1 não lida

  // DM maria ↔ ana
  const d2 = mkConv('dm', '', ['maria.silva', 'ana.costa']);
  mkMsg(d2, 'ana.costa', 'Sábado às 15h na biblioteca? Levo as flashcards de BG para quem quiser.', hoursAgo(26));
  mkMsg(d2, 'maria.silva', 'Combinado. Levo os resumos de Matemática A.', hoursAgo(25));
  db.prepare('UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?').run(hoursAgo(1), d2, ids['maria.silva']);

  // DM de boas-vindas à conta de teste
  const d3 = mkConv('dm', '', ['turmamais', 'teste']);
  mkMsg(d3, 'turmamais', 'Olá. Bem-vindo ao Turma+. Esta é a tua conta de teste; explora todas as funcionalidades.', hoursAgo(2));
  mkMsg(d3, 'turmamais', 'Sugestões rápidas: 1) completa o teu perfil com escola, distrito e município para o calendário ganhar os feriados locais; 2) vai a Apoio e pede uma ficha (ex.: «como resolvo equações do 2.º grau?»); 3) exporta o calendário (.ics) para o telemóvel.', hoursAgo(2));
  mkMsg(d3, 'turmamais', 'Esta mensagem chegou em tempo real. Abre Mensagens para veres o contador de não lidas.', hoursAgo(1.9));

  // --- Notificações para maria (demo de badges) ---------------------------------------
  const insNotif = db.prepare(
    `INSERT INTO notifications (user_id, type, actor_id, post_id, conversation_id, text, url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insNotif.run(ids['maria.silva'], 'like', ids['ana.costa'], postIds[2], null, 'ana.costa gostou da tua publicação', '/perfil/ana.costa', hoursAgo(1.2));
  insNotif.run(ids['maria.silva'], 'comment', ids['tiago.martins'], postIds[14], null, 'tiago.martins comentou: "Partilha o plano!"', '/?focus=' + postIds[14], hoursAgo(2.2));
  insNotif.run(ids['maria.silva'], 'follow', ids['beatriz.almeida'], null, null, 'beatriz.almeida começou a seguir-te', '/perfil/beatriz.almeida', hoursAgo(5));
  insNotif.run(ids['maria.silva'], 'message', ids['joao.santos'], null, d1, 'joao.santos: A propósito, no fim de semana há jogo…', `/mensagens/${d1}`, hoursAgo(0.5));
  db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND type = ?').run(hoursAgo(1), ids['maria.silva'], 'follow');
  insNotif.run(ids['teste'], 'follow', ids['turmamais'], null, null, 'turmamais começou a seguir-te', '/perfil/turmamais', hoursAgo(1.8));

  // --- Ficha de estudo guardada (Apontamentos demo) ------------------------------------
  const eqFicha = KNOWLEDGE.find((k) => k.id === 'eq2grau').ficha;
  insertReturningId(
    'INSERT INTO tutor_fichas (user_id, subject, question, ficha, saved, created_at) VALUES (?, ?, ?, ?, 1, ?)',
    [ids['maria.silva'], 'Matemática A', 'Como se resolve uma equação do 2.º grau com a fórmula resolvente?', JSON.stringify(eqFicha), daysAgo(3)]
  );

  console.log(`[seed] ${USERS.length} utilizadores, ${POSTS.length} publicações, ${Object.keys(ids).length} perfis prontos.`);
  console.log(`[seed] conta demo → utilizador: maria.silva · palavra-passe: ${DEMO_PASSWORD}`);
  return true;
}

// execução direta: npm run seed
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  ensureSeed({ force: process.argv.includes('--force') });
}
