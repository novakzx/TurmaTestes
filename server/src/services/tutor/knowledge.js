/**
 * Base de conhecimento curada do Explicador Turma+ (motor local, gratuito e
 * offline). Cada entrada devolve uma "ficha de estudo" estruturada:
 * resumo direto, passo a passo, conceitos-chave, exemplo resolvido,
 * exercícios com solução e recursos.
 *
 * Em produção, o motor local pode ser complementado por um LLM
 * (ver engine.js) — o formato da ficha é o mesmo.
 */

const E = (id, disciplinas, titulos, keywords, ficha) => ({ id, disciplinas, titulos, keywords, ficha });

export const SUBJECTS = [
  'Matemática A', 'Física e Química A', 'Biologia e Geologia', 'Português',
  'História A', 'Geografia A', 'Filosofia', 'Inglês', 'Economia A',
  'Métodos de estudo',
];

export const KNOWLEDGE = [
  // ===================== MATEMÁTICA A =====================
  E('eq2grau', ['Matemática A'], ['Equações do 2.º grau', 'Fórmula resolvente'],
    ['equacao', 'equacoes', '2 grau', 'segundo grau', 'resolvente', 'bhaskara', 'delta', 'discriminante', 'raizes', 'raiz', 'parabola', 'quadratica', 'x2', 'x^2'],
    {
      titulo: 'Equações do 2.º grau — fórmula resolvente',
      resumo: 'Uma equação do 2.º grau tem a forma ax² + bx + c = 0 (a ≠ 0). As soluções obtêm-se pela fórmula resolvente x = (−b ± √(b²−4ac)) / 2a. O discriminante Δ = b² − 4ac decide quantas soluções reais existem: Δ > 0 → duas, Δ = 0 → uma (dupla), Δ < 0 → nenhuma (no conjunto dos reais).',
      passos: [
        'Escreve a equação na forma canónica ax² + bx + c = 0 (passa todos os termos para um dos membros).',
        'Identifica a, b e c (com os sinais!).',
        'Calcula o discriminante: Δ = b² − 4ac.',
        'Aplica a fórmula resolvente: x = (−b ± √Δ) / 2a.',
        'Simplifica as frações e, se o enunciado pedir, verifica substituindo as soluções na equação original.',
        'Interpreta: numa parábola y = ax² + bx + c, as soluções são os zeros (interseções com o eixo Ox); o vértice está em x = −b/2a.',
      ],
      conceitos: [
        { nome: 'Discriminante (Δ)', definicao: 'b² − 4ac; indica o número e tipo de soluções da equação.' },
        { nome: 'Raiz dupla', definicao: 'Quando Δ = 0, as duas soluções coincidem: x = −b/2a.' },
        { nome: 'Fatorização', definicao: 'ax² + bx + c = a(x − x₁)(x − x₂); útil para resolver inequações do 2.º grau.' },
        { nome: 'Lei dos fatores nulos', definicao: 'Um produto é zero se e só se algum fator é zero — base da resolução por fatorização.' },
      ],
      exemplo: {
        enunciado: 'Resolve 2x² − 5x + 3 = 0.',
        resolucao: [
          'a = 2, b = −5, c = 3',
          'Δ = (−5)² − 4·2·3 = 25 − 24 = 1',
          'x = (5 ± √1) / 4',
          'x₁ = (5 + 1)/4 = 3/2   e   x₂ = (5 − 1)/4 = 1',
          'Verificação: 2(1)² − 5(1) + 3 = 0.'
        ],
      },
      exercicios: [
        { enunciado: 'Resolve x² − 7x + 10 = 0.', dica: 'Δ = 49 − 40 = 9.', solucao: 'x = 5 ou x = 2.' },
        { enunciado: 'Resolve −x² + 4x − 4 = 0.', dica: 'Multiplica por −1 primeiro.', solucao: 'Raiz dupla x = 2.' },
        { enunciado: 'Sem resolver, diz quantas soluções reais tem 3x² + x + 5 = 0.', dica: 'Basta o sinal de Δ.', solucao: 'Δ = 1 − 60 = −59 < 0 → nenhuma solução real.' },
      ],
      recursos: [
        { titulo: 'Ferramenta Turma+', descricao: 'Usa o separador "Equação 2.º grau" nas Ferramentas para veres os passos com os teus coeficientes.' },
        { titulo: 'Manual escolar', descricao: 'Capítulo de funções polinomiais do 2.º grau (10.º ano).' },
      ],
    }),

  E('derivadas', ['Matemática A'], ['Derivadas', 'Taxa de variação'],
    ['derivada', 'derivadas', 'derivar', 'tangente', 'taxa de variacao', 'declive', 'regra da potencia', 'f\'', 'diferenciacao'],
    {
      titulo: 'Derivadas — regra da potência e reta tangente',
      resumo: 'A derivada f′(a) mede a taxa de variação instantânea de f em a e é o declive da reta tangente ao gráfico nesse ponto. Regra da potência: (xⁿ)′ = n·xⁿ⁻¹. A derivada de uma constante é 0 e a derivada é linear: (af + bg)′ = af′ + bg′.',
      passos: [
        'Escreve f(x) como soma de termos da forma c·xⁿ.',
        'Aplica a regra da potência termo a termo: c·xⁿ → c·n·xⁿ⁻¹.',
        'Simplifica (lembra-te: x⁰ = 1, x⁻¹ = 1/x).',
        'Para a reta tangente em x = a: y = f(a) + f′(a)(x − a).',
        'Estuda o sinal de f′ para encontrar intervalos de monotonia: f′ > 0 → f cresce; f′ < 0 → f decresce; f′(a) = 0 → candidato a extremo.',
      ],
      conceitos: [
        { nome: 'Taxa de variação instantânea', definicao: 'Limite da taxa de variação média quando o intervalo tende para zero: f′(a) = lim (f(a+h) − f(a))/h.' },
        { nome: 'Reta tangente', definicao: 'Reta que "toca" o gráfico em a com declive f′(a).' },
        { nome: 'Extremo relativo', definicao: 'Ponto onde f′ se anula e muda de sinal (máximo: + → −; mínimo: − → +).' },
      ],
      exemplo: {
        enunciado: 'Deriva f(x) = 3x⁴ − 2x² + 5x − 7 e calcula f′(1).',
        resolucao: [
          'f′(x) = 3·4x³ − 2·2x + 5 = 12x³ − 4x + 5',
          'f′(1) = 12 − 4 + 5 = 13',
          'Conclusão: em x = 1 a função cresce com declive 13.',
        ],
      },
      exercicios: [
        { enunciado: 'Deriva g(x) = x⁵ − 3x³ + 2.', dica: 'Termo a termo.', solucao: 'g′(x) = 5x⁴ − 9x².' },
        { enunciado: 'Encontra os extremos relativos de f(x) = x³ − 3x.', dica: 'Resolve f′(x) = 3x² − 3 = 0.', solucao: 'x = −1 (máximo relativo, f = 2) e x = 1 (mínimo relativo, f = −2).' },
      ],
      recursos: [{ titulo: 'Ferramenta Turma+', descricao: 'A ferramenta "Derivada de polinómios" mostra-te os passos termo a termo.' }],
    }),

  E('trigonometria', ['Matemática A'], ['Trigonometria', 'Círculo trigonométrico'],
    ['trigonometria', 'seno', 'cosseno', 'tangente', 'circulo trigonometrico', 'radianos', 'radiano', 'graus', 'sin', 'cos', 'tan', 'identidade'],
    {
      titulo: 'Trigonometria — círculo unitário e valores notáveis',
      resumo: 'No círculo unitário (raio 1), a um ângulo α corresponde o ponto (cos α, sen α). A tangente é tan α = sen α / cos α (definida quando cos α ≠ 0). Identidade fundamental: sen²α + cos²α = 1. Graus e radianos: 180° = π rad.',
      passos: [
        'Converte unidades se necessário: rad = graus × π/180.',
        'Localiza o ângulo no círculo e o quadrante (dá o sinal de sen e cos).',
        'Usa os valores notáveis (30°, 45°, 60° ↔ π/6, π/4, π/3).',
        'Reduz ao 1.º quadrante com simetrias: sen(π − α) = sen α; cos(π − α) = −cos α; sen(−α) = −sen α; cos(−α) = cos α.',
        'Verifica com a identidade fundamental quando tiveres um dos valores.',
      ],
      conceitos: [
        { nome: 'Valores notáveis', definicao: 'sen 30° = 1/2, sen 45° = √2/2, sen 60° = √3/2; cossenos trocados por ordem inversa.' },
        { nome: 'Radiano', definicao: 'Ângulo cujo arco tem comprimento igual ao raio; 2π rad = 360°.' },
        { nome: 'Identidade fundamental', definicao: 'sen²α + cos²α = 1, consequência do teorema de Pitágoras no círculo unitário.' },
      ],
      exemplo: {
        enunciado: 'Determina sen(150°) e cos(150°).',
        resolucao: [
          '150° está no 2.º quadrante (sen positivo, cos negativo).',
          '150° = 180° − 30° → sen(150°) = sen(30°) = 1/2',
          'cos(150°) = −cos(30°) = −√3/2',
        ],
      },
      exercicios: [
        { enunciado: 'Converte 225° em radianos.', dica: '× π/180.', solucao: '5π/4 rad.' },
        { enunciado: 'Se sen α = 3/5 com α no 1.º quadrante, calcula cos α e tan α.', dica: 'Identidade fundamental.', solucao: 'cos α = 4/5; tan α = 3/4.' },
      ],
      recursos: [],
    }),

  E('logaritmos', ['Matemática A'], ['Logaritmos'],
    ['logaritmo', 'logaritmos', 'log', 'ln', 'exponencial', 'base', 'propriedade dos logaritmos'],
    {
      titulo: 'Logaritmos — definição e propriedades',
      resumo: 'log_a(b) = c significa a^c = b (a > 0, a ≠ 1, b > 0). O logaritmo é a operação inversa da exponencial. Propriedades essenciais: log(xy) = log x + log y; log(x/y) = log x − log y; log(xⁿ) = n·log x; mudança de base: log_a b = ln b / ln a.',
      passos: [
        'Passa da forma logarítmica para a exponencial (ou vice-versa) para "ver" a definição.',
        'Aplica as propriedades para somar/subtrair logaritmos antes de calcular.',
        'Para resolver equações a^x = b: x = log_a b = ln b / ln a.',
        'Confirma o domínio: argumentos de logaritmos têm de ser positivos.',
      ],
      conceitos: [
        { nome: 'ln', definicao: 'Logaritmo natural, de base e ≈ 2,718.' },
        { nome: 'Mudança de base', definicao: 'log_a b = log_c b / log_c a — permite calcular qualquer logaritmo com ln ou log₁₀.' },
      ],
      exemplo: {
        enunciado: 'Resolve 2^x = 10.',
        resolucao: ['x = log₂ 10 = ln 10 / ln 2', 'x ≈ 2,3026 / 0,6931 ≈ 3,32'],
      },
      exercicios: [
        { enunciado: 'Calcula log₂ 32.', dica: '32 = 2⁵.', solucao: '5.' },
        { enunciado: 'Simplifica log₃ 9 + log₃ 27.', dica: 'Soma de logs = log do produto.', solucao: 'log₃ 243 = 5.' },
      ],
      recursos: [],
    }),

  E('sucessoes', ['Matemática A'], ['Sucessões', 'Progressões'],
    ['sucessao', 'sucessoes', 'progressao', 'aritmetica', 'geometrica', 'termo geral', 'razao', 'soma de termos', 'limite de sucessao'],
    {
      titulo: 'Sucessões — progressões aritméticas e geométricas',
      resumo: 'Progressão aritmética (PA): cada termo soma uma razão r — aₙ = a₁ + (n−1)r; soma dos n primeiros termos Sₙ = n(a₁+aₙ)/2. Progressão geométrica (PG): cada termo multiplica por q — aₙ = a₁·qⁿ⁻¹; Sₙ = a₁(qⁿ−1)/(q−1) se q ≠ 1; soma infinita S = a₁/(1−q) quando |q| < 1.',
      passos: [
        'Identifica o tipo: diferenças constantes → PA; quocientes constantes → PG.',
        'Escreve o termo geral com a₁ e a razão.',
        'Para somas, escolhe a fórmula certa (atenção ao caso |q| < 1 em PG infinita).',
        'Limites: PA diverge (exceto r = 0); PG converge para 0 se |q| < 1.',
      ],
      conceitos: [
        { nome: 'Razão', definicao: 'Constante que gera a sucessão (r na PA, q na PG).' },
        { nome: 'Convergência', definicao: 'A sucessão aproxima-se de um valor finito quando n → +∞.' },
      ],
      exemplo: {
        enunciado: 'Calcula a soma 2 + 4 + 6 + … + 100.',
        resolucao: ['PA com a₁ = 2, r = 2, aₙ = 100 → n = 50', 'S₅₀ = 50·(2 + 100)/2 = 50·51 = 2550'],
      },
      exercicios: [
        { enunciado: 'PG com a₁ = 3 e q = 2. Qual é a₆?', dica: 'aₙ = a₁qⁿ⁻¹.', solucao: 'a₆ = 3·2⁵ = 96.' },
        { enunciado: 'Soma infinita 1 + 1/2 + 1/4 + …', dica: '|q| < 1.', solucao: 'S = 1/(1 − 1/2) = 2.' },
      ],
      recursos: [],
    }),

  E('probabilidades', ['Matemática A'], ['Probabilidades', 'Combinatória'],
    ['probabilidade', 'probabilidades', 'laplace', 'combinatoria', 'arranjos', 'permutacoes', 'combinacoes', 'fatorial', 'acontecimento', 'dados', 'dado', 'baralho', 'probabilidade condicionada'],
    {
      titulo: 'Probabilidades — Laplace e contagem',
      resumo: 'Lei de Laplace: P(A) = casos favoráveis / casos possíveis (equiprováveis). Contagem: permutações n!; arranjos A(n,p) = n!/(n−p)! (ordem importa); combinações C(n,p) = n!/(p!(n−p)!) (ordem não importa). Probabilidade condicionada: P(A|B) = P(A∩B)/P(B).',
      passos: [
        'Define o espaço de resultados Ω e confirma que os casos são equiprováveis.',
        'Conta |Ω| com produto/cartésia ou fórmulas de contagem.',
        'Conta os casos favoráveis ao acontecimento A.',
        'Aplica P(A) = |A|/|Ω| e simplifica.',
        'Com condições ("sabendo que…"), usa probabilidade condicionada e verifica independência: A e B independentes ⇔ P(A∩B) = P(A)·P(B).',
      ],
      conceitos: [
        { nome: 'Acontecimento', definicao: 'Subconjunto de Ω.' },
        { nome: 'Complementar', definicao: 'P(Ā) = 1 − P(A) — atalho útil para "pelo menos um".' },
        { nome: 'Regra do produto', definicao: 'P(A∩B) = P(A)·P(B|A).' },
      ],
      exemplo: {
        enunciado: 'Lançam-se dois dados. Qual é a probabilidade de a soma ser 7?',
        resolucao: ['|Ω| = 6·6 = 36', 'Favoráveis: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) → 6', 'P = 6/36 = 1/6 ≈ 16,7%'],
      },
      exercicios: [
        { enunciado: 'De um baralho de 52 cartas tira-se uma. P(figura)?', dica: 'Figuras: valete, dama, rei, 4 naipes.', solucao: '12/52 = 3/13.' },
        { enunciado: 'De quantas formas se escolhem 3 delegados entre 10 alunos (cargos iguais)?', dica: 'Combinações.', solucao: 'C(10,3) = 120.' },
      ],
      recursos: [],
    }),

  // ===================== FÍSICA E QUÍMICA A =====================
  E('mrua', ['Física e Química A'], ['Movimento uniformemente variado'],
    ['movimento', 'uniformemente', 'acelerado', 'aceleracao', 'velocidade', 'mrua', 'cinematica', 'queda livre', 'grafico velocidade', 'deslocamento', 'trajetoria'],
    {
      titulo: 'Cinemática — movimento retilíneo uniformemente variado',
      resumo: 'Com aceleração constante a: v = v₀ + at e x = x₀ + v₀t + ½at². Eliminando t: v² = v₀² + 2a(x − x₀). Queda livre: a = g ≈ 9,8 m/s² (para baixo). O gráfico v–t é uma reta cujo declive é a aceleração e cuja área sob a curva é o deslocamento.',
      passos: [
        'Define o referencial e o sentido positivo.',
        'Lista os dados (v₀, a, t, Δx) e a incógnita.',
        'Escolhe a equação que não envolve a variável que não tens/não queres.',
        'Resolve e verifica unidades (SI: m, s, m/s, m/s²).',
      ],
      conceitos: [
        { nome: 'Aceleração média', definicao: 'a = Δv/Δt.' },
        { nome: 'Queda livre', definicao: 'Movimento só com a ação da gravidade; todos os corpos caem com a mesma aceleração (desprezando a resistência do ar).' },
      ],
      exemplo: {
        enunciado: 'Um carro parte do repouso e acelera 2 m/s² durante 5 s. Que distância percorre e qual a velocidade final?',
        resolucao: ['x = 0 + 0·5 + ½·2·5² = 25 m', 'v = 0 + 2·5 = 10 m/s (= 36 km/h)'],
      },
      exercicios: [
        { enunciado: 'Uma pedra cai de 20 m (g = 10 m/s²). Quanto tempo demora a chegar ao solo?', dica: 'x = ½gt².', solucao: 't = √(2·20/10) = 2 s.' },
        { enunciado: 'Trava um carro de 20 m/s a 0 em 4 s. Aceleração e distância de travagem?', dica: 'a = Δv/Δt.', solucao: 'a = −5 m/s²; d = 20·4 + ½(−5)(16) = 40 m.' },
      ],
      recursos: [],
    }),

  E('newton', ['Física e Química A'], ['Leis de Newton'],
    ['newton', 'leis de newton', 'forca', 'forcas', 'inercia', 'acao reacao', 'peso', 'normal', 'atrito', 'diagrama de corpo livre', 'resultante'],
    {
      titulo: 'Dinâmica — as três leis de Newton',
      resumo: '1.ª lei (inércia): sem força resultante, um corpo mantém o repouso ou o movimento retilíneo uniforme. 2.ª lei: F⃗ resultante = m·a⃗. 3.ª lei (ação-reação): a toda a ação corresponde uma reação igual em módulo e oposta em direção, aplicadas em corpos diferentes.',
      passos: [
        'Desenha o diagrama de corpo livre: isola o corpo e representa TODAS as forças aplicadas nele (peso, normal, tração, atrito…).',
        'Escolhe eixos (útil: um eixo na direção do movimento).',
        'Decompõe forças inclinadas nas componentes.',
        'Aplica ΣF = m·a em cada eixo.',
        'Resolve o sistema; verifica casos-limite (a = 0 → equilíbrio).',
      ],
      conceitos: [
        { nome: 'Peso', definicao: 'P = m·g, força gravítica perto da superfície (g ≈ 9,8 N/kg).' },
        { nome: 'Força normal', definicao: 'Reação de apoio perpendicular à superfície de contacto; nem sempre igual ao peso!' },
        { nome: 'Atrito', definicao: 'F_atrito ≤ μ·N; opõe-se ao movimento (ou à sua iminência).' },
      ],
      exemplo: {
        enunciado: 'Bloco de 5 kg num plano horizontal, força de 20 N, atrito de 5 N. Aceleração?',
        resolucao: ['ΣF horizontal: 20 − 5 = 15 N', 'a = F/m = 15/5 = 3 m/s²'],
      },
      exercicios: [
        { enunciado: 'Elevador de 800 kg sobe com a = 1 m/s². Tensão no cabo? (g = 10)', dica: 'ΣF = T − P = ma.', solucao: 'T = 800·10 + 800·1 = 8800 N.' },
        { enunciado: 'Par ação-reação do peso de um livro em cima da mesa: qual é e onde se aplica?', dica: 'A reação ao peso aplica-se…', solucao: 'A atração que o livro exerce sobre a Terra, aplicada na Terra (não é a normal!).' },
      ],
      recursos: [],
    }),

  E('energia', ['Física e Química A'], ['Energia mecânica'],
    ['energia', 'conservacao da energia', 'energia cinetica', 'energia potencial', 'trabalho', 'potencia', 'mecanica', 'joule', 'em = ec + ep'],
    {
      titulo: 'Energia — trabalho, energia cinética e conservação',
      resumo: 'Energia cinética Ec = ½mv²; energia potencial gravítica Ep = mgh. Sem forças dissipativas, a energia mecânica Em = Ec + Ep conserva-se. O teorema da energia cinética: trabalho da força resultante = ΔEc. Potência P = W/Δt.',
      passos: [
        'Define o nível de referência para Ep (h = 0).',
        'Escreve Em inicial e Em final.',
        'Se há atrito/resistência: W_forças dissipativas = Em(final) − Em(inicial) (negativo).',
        'Se não há: Ec(i) + Ep(i) = Ec(f) + Ep(f) e resolve.',
      ],
      conceitos: [
        { nome: 'Trabalho', definicao: 'W = F·d·cos θ (J) — só a componente na direção do deslocamento trabalha.' },
        { nome: 'Forças conservativas', definicao: 'Gravítica e elástica: o trabalho não depende do caminho.' },
      ],
      exemplo: {
        enunciado: 'Montanha-russa parte do repouso a 30 m de altura. Velocidade em baixo? (g = 10)',
        resolucao: ['mgh = ½mv² → v = √(2gh)', 'v = √(2·10·30) = √600 ≈ 24,5 m/s (≈ 88 km/h)'],
      },
      exercicios: [
        { enunciado: 'Corpo de 2 kg a 3 m/s. Energia cinética?', dica: 'Ec = ½mv².', solucao: '9 J.' },
        { enunciado: 'Um trenó perde 200 J por atrito numa descida. Que efeito em Em?', dica: 'Força dissipativa.', solucao: 'Em final = Em inicial − 200 J.' },
      ],
      recursos: [],
    }),

  E('mol', ['Física e Química A'], ['Mole e massa molar'],
    ['mol', 'mole', 'massa molar', 'avogadro', 'quantidade de materia', 'concentracao', 'molaridade', 'estequiometria', 'gramas', 'numero de moleculas'],
    {
      titulo: 'Química — mole, massa molar e concentrações',
      resumo: '1 mol contém 6,022×10²³ entidades (constante de Avogadro). n = m/M (massa / massa molar). Em soluções: c = n/V (mol/dm³). Em gases nas CNTP (0 °C, 1 atm), Vm ≈ 22,4 dm³/mol. Estes três "tradutores" ligam o mundo microscópico ao macroscópico.',
      passos: [
        'Calcula a massa molar M somando as massas atómicas (tabela periódica).',
        'Converte massa → mol: n = m/M.',
        'Conforme o pedido, usa c = n/V, N = n·N_A ou V = n·Vm.',
        'Em reações, ajusta a equação química antes de usar as proporções (estequiometria).',
      ],
      conceitos: [
        { nome: 'Constante de Avogadro', definicao: 'N_A = 6,022×10²³ mol⁻¹.' },
        { nome: 'Solução', definicao: 'Soluto dissolvido em solvente; c = n(soluto)/V(solução).' },
      ],
      exemplo: {
        enunciado: 'Quantas moléculas há em 9 g de água (M(H₂O) = 18 g/mol)?',
        resolucao: ['n = 9/18 = 0,5 mol', 'N = 0,5 × 6,022×10²³ ≈ 3,01×10²³ moléculas'],
      },
      exercicios: [
        { enunciado: 'Prepara 500 mL de solução 0,2 mol/dm³ de NaCl (M = 58,5). Massa necessária?', dica: 'n = c·V.', solucao: 'n = 0,1 mol → m = 5,85 g.' },
        { enunciado: 'Volume de 2 mol de gás nas CNTP?', dica: 'Vm ≈ 22,4.', solucao: '44,8 dm³.' },
      ],
      recursos: [],
    }),

  E('ph', ['Física e Química A'], ['pH e ácido-base'],
    ['ph', 'acido', 'base', 'alcalino', 'hidrogeniao', 'h3o+', 'escala de ph', 'neutralizacao', 'ionizacao da agua', 'kw'],
    {
      titulo: 'Química — pH, ácidos e bases',
      resumo: 'pH = −log[H₃O⁺]. A 25 °C: pH < 7 ácido, pH = 7 neutro, pH > 7 básico. Produto iónico da água: Kw = [H₃O⁺][OH⁻] = 1,0×10⁻¹⁴. Cada unidade de pH corresponde a um fator 10 na concentração: pH 3 é 10× mais ácido que pH 4.',
      passos: [
        'De [H₃O⁺]: pH = −log[H₃O⁺].',
        'De pH: [H₃O⁺] = 10^(−pH).',
        'Para [OH⁻]: usa Kw → [H₃O⁺] = Kw/[OH⁻].',
        'Em diluições: c₁V₁ = c₂V₂; diluir 10× sobe o pH de 1 unidade (em ácidos).',
      ],
      conceitos: [
        { nome: 'Ácido (Brønsted-Lowry)', definicao: 'Dador de protões (H⁺).' },
        { nome: 'Base', definicao: 'Aceitador de protões.' },
        { nome: 'Neutralização', definicao: 'Ácido + base → sal + água.' },
      ],
      exemplo: {
        enunciado: 'Solução com [H₃O⁺] = 2×10⁻³ mol/dm³. Qual é o pH?',
        resolucao: ['pH = −log(2×10⁻³) = 3 − log 2 ≈ 3 − 0,30 = 2,70', 'pH < 7 → solução ácida.'],
      },
      exercicios: [
        { enunciado: 'pH = 9. Qual é [H₃O⁺]?', dica: '10^(−pH).', solucao: '1×10⁻⁹ mol/dm³.' },
        { enunciado: 'Sumo de limão pH 2 vs água pura pH 7: quantas vezes mais concentrado em H₃O⁺?', dica: 'Diferença de 5 unidades.', solucao: '10⁵ = 100 000 vezes.' },
      ],
      recursos: [],
    }),

  E('redox', ['Física e Química A'], ['Oxidação-redução'],
    ['redox', 'oxidacao', 'reducao', 'numero de oxidacao', 'agente oxidante', 'agente redutor', 'eletrões', 'pilhas', 'semirreacao'],
    {
      titulo: 'Química — reações redox',
      resumo: 'Oxidação = perda de eletrões (aumento do número de oxidacao); redução = ganho de eletrões. O agente oxidante provoca a oxidação e reduz-se; o agente redutor provoca a redução e oxida-se. Mnemónica: "OIL RIG" (Oxidation Is Loss, Reduction Is Gain) — ou "quem perde eletrões, oxida-se".',
      passos: [
        'Atribui números de oxidação a todos os átomos (regras: elemento livre 0; O geralmente −2; H geralmente +1; ião monoaómico = carga).',
        'Identifica quem aumenta (oxida) e quem diminui (reduz) o número de oxidação.',
        'Escreve as semirreações e iguala os eletrões transferidos.',
        'Combina e verifica a conservação de massa e carga.',
      ],
      conceitos: [
        { nome: 'Número de oxidação', definicao: 'Carga "formal" do átomo admitindo ligações iónicas.' },
        { nome: 'Pilha/galvânica', definicao: 'Dispositivo que converte energia química em elétrica através de uma redox espontânea.' },
      ],
      exemplo: {
        enunciado: 'Em Zn + Cu²⁺ → Zn²⁺ + Cu, quem oxida e quem reduz?',
        resolucao: ['Zn: 0 → +2 (perde 2 e⁻) → oxida-se; é o agente redutor.', 'Cu²⁺: +2 → 0 (ganha 2 e⁻) → reduz-se; é o agente oxidante.'],
      },
      exercicios: [
        { enunciado: 'Número de oxidação do S em H₂SO₄?', dica: 'H = +1, O = −2, soma = 0.', solucao: '+6.' },
        { enunciado: 'Na reação 2Mg + O₂ → 2MgO, quantos eletrões transfere cada Mg?', dica: 'Mg → Mg²⁺.', solucao: '2 eletrões (o O₂ aceita 4 no total).' },
      ],
      recursos: [],
    }),

  // ===================== BIOLOGIA E GEOLOGIA =====================
  E('fotossintese', ['Biologia e Geologia'], ['Fotossíntese e respiração celular'],
    ['fotossintese', 'fotossintetica', 'respiracao celular', 'clorofila', 'cloroplasto', 'atp', 'glicose', 'mitocondria', 'trocas gasosas', 'estomas'],
    {
      titulo: 'Biologia — fotossíntese vs respiração celular',
      resumo: 'Fotossíntese (cloroplastos): 6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂ — converte energia luminosa em energia química. Respiração celular (mitocôndrias): C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energia (ATP). São processos complementares: os produtos de um são os reagentes do outro.',
      passos: [
        'Fase fotoquímica (tilacoides): captação de luz, fotólise da água, formação de ATP e NADPH, libertação de O₂.',
        'Fase química (estroma, ciclo de Calvin): fixação de CO₂ usando ATP e NADPH → glicose.',
        'Respiração: glicólise (citoplasma) → ciclo de Krebs e cadeia respiratória (mitocôndria) → ~30-32 ATP.',
        'Compara localizações, reagentes/produtos e papel energético.',
      ],
      conceitos: [
        { nome: 'ATP', definicao: 'Molécula "moeda energética" da célula.' },
        { nome: 'Clorofila', definicao: 'Pigmento que absorve sobretudo luz azul-violeta e vermelha (reflete o verde).' },
        { nome: 'Estomas', definicao: 'Estruturas da folha que controlam as trocas gasosas e a transpiração.' },
      ],
      exemplo: {
        enunciado: 'Porque é que uma planta no escuro não produz O₂?',
        resolucao: ['A fotólise da água (que liberta O₂) depende diretamente da luz.', 'Sem luz, pára a fase fotoquímica e todo o processo fotossintético.', 'A planta continua a respirar: consome O₂ e liberta CO₂.'],
      },
      exercicios: [
        { enunciado: 'Onde ocorre o ciclo de Calvin?', dica: 'Parte líquida do cloroplasto.', solucao: 'No estroma.' },
        { enunciado: 'A fotossíntese é endoenergética ou exoenergética?', dica: 'Precisa de luz continuamente.', solucao: 'Endoenergética (armazena energia); a respiração é exoenergética.' },
      ],
      recursos: [],
    }),

  E('divisao-celular', ['Biologia e Geologia'], ['Mitose e meiose'],
    ['mitose', 'meiose', 'divisao celular', 'cromossomas', 'fase s', 'interfase', 'gametas', 'diploide', 'haploide', 'citocinese', 'fases da mitose'],
    {
      titulo: 'Biologia — mitose e meiose',
      resumo: 'Mitose: 1 célula 2n → 2 células 2n geneticamente iguais (crescimento e reparação). Meiose: 1 célula 2n → 4 células n geneticamente diferentes (formação de gametas), com duas divisões e variabilidade garantida por permutação (crossing-over) e segregação independente.',
      passos: [
        'Interfase: G1 (crescimento), S (replicação do DNA), G2 (preparação).',
        'Mitose: prófase → metáfase (cromossomas no plano equatorial) → anáfase (separação dos cromatídeos) → telófase + citocinese.',
        'Meiose I: homólogos emparelham (permutação na prófase I) e separam-se → células n com cromatídeos duplos.',
        'Meiose II: semelhante à mitose — separam-se os cromatídeos.',
      ],
      conceitos: [
        { nome: 'Diploide (2n) / Haploide (n)', definicao: 'Dois conjuntos de cromossomas (homólogos) vs um só.' },
        { nome: 'Crossing-over', definicao: 'Troca de segmentos entre cromatídeos homólogos na prófase I — fonte de variabilidade.' },
      ],
      exemplo: {
        enunciado: 'Célula humana (2n = 46) faz meiose. Quantos cromossomas tem cada gameta?',
        resolucao: ['Após a meiose I: 2 células com 23 cromossomas duplos.', 'Após a meiose II: 4 gametas com n = 23 cromossomas simples.'],
      },
      exercicios: [
        { enunciado: 'Em que fase da mitose os cromossomas estão mais condensados e alinhados?', dica: 'Plano equatorial.', solucao: 'Metáfase.' },
        { enunciado: 'Porque é que a meiose gera diversidade e a mitose não?', dica: 'Dois mecanismos exclusivos da prófase I e da anáfase I.', solucao: 'Permutação (crossing-over) e segregação independente dos homólogos.' },
      ],
      recursos: [],
    }),

  E('adn', ['Biologia e Geologia'], ['DNA e síntese de proteínas'],
    ['adn', 'dna', 'dupla helice', 'replicacao', 'transcricao', 'traducao', 'rnAm', 'arn', 'codigo genetico', 'nucleotido', 'bases azotadas', 'proteina', 'ribossoma'],
    {
      titulo: 'Biologia — DNA, do gene à proteína',
      resumo: 'O DNA é uma dupla hélice de nucleótidos (A–T, G–C). Replicação: semiconservativa, cada cadeia serve de molde. Transcrição: DNA → RNA mensageiro (no núcleo; U substitui T). Tradução: o RNAm é lido pelo ribossoma em codões (3 bases → 1 aminoácido), com ajuda do RNAt.',
      passos: [
        'Replicação: helicase abre a hélice; DNA polimerase sintetiza 5′→3′ cadeias complementares.',
        'Transcrição: RNA polimerase lê a cadeia molde e produz RNAm complementar (A→U).',
        'Tradução: codão de iniciação AUG → elongação (codão a codão) → codão de finalização (UAA, UAG, UGA).',
        'Cadeia polipeptídica dobra-se → proteína funcional.',
      ],
      conceitos: [
        { nome: 'Codão', definicao: 'Sequência de 3 nucleótidos do RNAm que codifica um aminoácido.' },
        { nome: 'Código genético', definicao: 'Universal, redundante (vários codões para o mesmo aminoácido) e não sobreposto.' },
        { nome: 'Mutação', definicao: 'Alteração da sequência de bases; pode mudar o aminoácido (ou não, pela redundância).' },
      ],
      exemplo: {
        enunciado: 'DNA molde: 3′-TAC GGC TTA-5′. Qual é o RNAm e a sequência de aminoácidos?',
        resolucao: ['RNAm: 5′-AUG CCG AAU-3′', 'Codões: AUG (Met/início) — CCG (Pro) — AAU (Asn)', 'Proteína: Met-Pro-Asn'],
      },
      exercicios: [
        { enunciado: 'Se numa replicação 20% das bases são G, quantas são A?', dica: 'Regras de Chargaff: G=C, A=T.', solucao: 'A = 30%.' },
        { enunciado: 'Porque se diz que a replicação é semiconservativa?', dica: 'Composição das novas hélices.', solucao: 'Cada dupla hélice nova conserva uma cadeia original e uma recém-sintetizada.' },
      ],
      recursos: [],
    }),

  // ===================== PORTUGUÊS =====================
  E('lusiadas', ['Português'], ['Os Lusíadas'],
    ['lusiadas', 'camoes', 'camoes épico', 'epopeia', 'vasco da gama', 'consilio dos deuses', 'ilha dos amores', 'estrutura interna', 'decimas', 'oitava rima', 'in medias res', 'plano da viagem'],
    {
      titulo: 'Os Lusíadas — estrutura, planos e herói épico',
      resumo: 'Epopéia de Camões (1572), em oitava rima (estrofes de 8 versos decassilábicos, esquema ABABABCC), 10 cantos. Proposição, invocação, dedicatória (a D. Sebastião) e narração em media res (a ação começa com a viagem já em curso). O herói é coletivo — "o peito ilustre lusitano" (o povo português) — com Vasco da Gama como figura central. Quatro planos: da Viagem, dos Deuses (mitologia), do Rei/História de Portugal e do Povo/Marinheiros.',
      passos: [
        'Memoriza a estrutura externa: oitava rima, verso decassilábico, 10 cantos, 8816 versos.',
        'Identifica as partes internas: proposição → invocação (Tágides) → dedicatória → narração.',
        'Distingue os quatro planos narrativos e dá um exemplo de episódio de cada (ex.: Consílio dos Deuses — plano mitológico; Inês de Castro — plano da História).',
        'Caracteriza o herói épico coletivo e os valores celebrados (fé, glória, coragem, patriotismo… e também a crítica no final do poema).',
        'Sabe localizar episódios-chave: Adamastor (canto V), Ilha dos Amores (IX-X), Velho do Restelo (IV).',
      ],
      conceitos: [
        { nome: 'In media res', definicao: 'A narração começa no meio da ação; o passado é contado por flashbacks (ex.: Gama narra a história de Portugal ao rei de Melinde).' },
        { nome: 'Oitava rima', definicao: 'Estrofe de 8 decassílabos, rima ABABABCC.' },
        { nome: 'Adamastor', definicao: 'Gigante mítico = Cabo das Tormentas; simboliza os perigos vencidos pelos navegadores.' },
        { nome: 'Velho do Restelo', definicao: 'Voz crítica que condena a ambição imperial e o abandono da pátria (canto IV).' },
      ],
      exemplo: {
        enunciado: 'Analisa o significado do episódio da Ilha dos Amores.',
        resolucao: [
          'Plano mitológico: Vénus e Cupido preparam a ilha como recompensa aos marinheiros.',
          'Simbolismo: o "prémio" do herói — a glória e a imortalidade ("Tethys" mostra a Máquina do Mundo).',
          'Mensagem: a imortalidade é alcançada pelos feitos e pela fama ("que não há senão a glória / de alcançar-se o impossível"…).',
        ],
      },
      exercicios: [
        { enunciado: 'A quem é dedicado o poema e com que intenção estratégica?', dica: 'D. Sebastião e o Sebastianismo.', solucao: 'A D. Sebastião; Camões liga a epopeia ao jovem rei e à continuação da expansão, procurando proteção e dando sentido messiânico ao empreendimento.' },
        { enunciado: 'Que plano narrativo domina o episódio do Consílio dos Deuses do Olimpo?', dica: 'Deuses que discutem o destino da viagem.', solucao: 'Plano da Mitologia (dos Deuses) — Vénus e Marte apoiam os portugueses; Baco opõe-se.' },
      ],
      recursos: [],
    }),

  E('pessoa', ['Português'], ['Fernando Pessoa — ortónimo e heterónimos'],
    ['pessoa', 'fernando pessoa', 'heteronimo', 'heteronimos', 'alberto caeiro', 'ricardo reis', 'alvaro de campos', 'bernardo soares', 'ortónimo', 'ortonomo', 'fingimento', 'sensacionismo', 'isto', 'poema em linha recta'],
    {
      titulo: 'Fernando Pessoa — ortónimo e heterónimos',
      resumo: 'Pessoa cria heterónimos: poetas com biografia, estilo e visão do mundo próprios (não são simples pseudónimos). Caeiro: sensacionista, "pensar é estar doente dos olhos", mestre dos outros; Ricardo Reis: neoclássico, epicurista/estoico, ode ao destino (fatum); Álvaro de Campos: engenheiro modernista, das odes futuristas ao tédio ("Tabacaria"). O ortónimo canta a dor de pensar, a saudade da infância e o "fingimento" poético ("Autopsicografia": o poeta é um fingidor).',
      passos: [
        'Distingue pseudónimo (assinatura) de heterónimo (personalidade literária completa).',
        'Para cada heterónimo: fixa biografia essencial, tema dominante, estilo e 1 poema-exemplo.',
        'No ortónimo, trabalha os núcleos: fingimento artístico, dor de pensar, fragmentação do eu, nostalgia da infância.',
        'Em análise, relaciona sempre forma (métrica, ritmo, pontuação em Campos) e conteúdo.',
      ],
      conceitos: [
        { nome: 'Fingimento poético', definicao: '"O poeta é um fingidor. / Finge tão completamente / Que chega a fingir que é dor / A dor que deveras sente." — a emoção é intelectualizada e recriada artisticamente.' },
        { nome: 'Sensacionismo', definicao: 'Sentir tudo de todas as maneiras; a sensação como única realidade (Caeiro).' },
        { nome: 'Dor de pensar', definicao: 'A consciência que separa o sujeito da felicidade simples (ortónimo).' },
      ],
      exemplo: {
        enunciado: 'Como distinguir um poema de Caeiro de um de Álvaro de Campos?',
        resolucao: [
          'Caeiro: versos livres simples, tom sereno, defesa do ver sem pensar, recusa da metafísica.',
          'Campos: versos longos e irregulares, exclamações, vocabulário moderno/máquinas, oscila entre a euforia futurista e o tédio existencial.',
        ],
      },
      exercicios: [
        { enunciado: 'Que heterónimo escreveu "Tabacaria"?', dica: '"Não sou nada. / Nunca serei nada…"', solucao: 'Álvaro de Campos (atribuído também a Bernardo Soares no Livro do Desassossego pela proximidade, mas Tabacaria é de Campos).' },
        { enunciado: 'Porque é Caeiro considerado "o mestre" dos heterónimos?', dica: 'Relação hierárquica criada por Pessoa.', solucao: 'Porque a sua poesia do sentir puro (sem pensar) é o modelo que Reis e Campos procuram seguir sem conseguir — a consciência impede-os.' },
      ],
      recursos: [],
    }),

  E('ensaio', ['Português', 'Métodos de estudo'], ['Como escrever um ensaio / texto de opinião'],
    ['ensaio', 'texto de opiniao', 'argumentativo', 'argumentacao', 'tese', 'introducao desenvolvimento conclusao', 'texto argumentativo', 'resposta de exame', 'como responder', 'interpretacao de texto'],
    {
      titulo: 'Texto argumentativo/ensaio — estrutura vencedora',
      resumo: 'Estrutura clássica: introdução (contextualização + tese clara), desenvolvimento (2–3 argumentos, cada um com explicação e exemplo/citação), conclusão (síntese + reafirmação da tese, eventualmente abertura). Regras de ouro: um parágrafo = uma ideia; conecta sempre com articuladores (contudo, por conseguinte, de facto); responde exatamente ao que é pedido.',
      passos: [
        'Lê o enunciado duas vezes e sublinha o verbo da tarefa (analisa, comenta, defende…) e as palavras-chave.',
        'Em 5 minutos: plano com tese + argumentos + exemplos.',
        'Introdução em 3-4 frases: tema → contexto → tese.',
        'Desenvolvimento: parágrafo por argumento — afirma, explica, exemplifica, remata.',
        'Conclusão: retoma a tese com outras palavras e fecha (sem ideias novas).',
        'Revisão final: coesão (conectores), correção gramatical, cotação de citações.',
      ],
      conceitos: [
        { nome: 'Tese', definicao: 'Posição clara e discutível que o texto defende.' },
        { nome: 'Contra-argumento', definicao: 'Reconhecer e refutar a posição oposta fortalece a argumentação.' },
      ],
      exemplo: {
        enunciado: 'Esqueleto para "A leitura de clássicos continua relevante?"',
        resolucao: [
          'Tese: sim, porque tratam temas universais e treinam o pensamento crítico.',
          'Arg. 1: universalidade (ex.: Camões e a ambição humana). Arg. 2: diálogo com o presente (ex.: distopias e redes sociais).',
          'Contra-argumento: linguagem difícil → refutação: edições anotadas e mediação escolar.',
          'Conclusão: reler os clássicos é reler-nos a nós próprios.',
        ],
      },
      exercicios: [
        { enunciado: 'Escreve uma tese discutível para "telemóveis na sala de aula".', dica: 'Tese não é um facto, é uma posição.', solucao: 'Ex.: "Os telemóveis devem ser proibidos nas aulas, porque a sua presença reduz a atenção mesmo desligados."' },
      ],
      recursos: [],
    }),

  // ===================== HISTÓRIA A =====================
  E('descobrimentos', ['História A'], ['Expansão portuguesa'],
    ['descobrimentos', 'expansao', 'expansão portuguesa', 'navegacoes', 'descobrimentos portugueses', 'ceuta', 'especiarias', 'rota do cabo', 'tratado de tordesilhas', 'infante d. henrique', 'imperio', 'colonizacao', 'vasco da gama india', 'cabral'],
    {
      titulo: 'Expansão portuguesa (séc. XV–XVI) — causas, fases e consequências',
      resumo: 'Causas: económicas (ouro, especiarias, contornar o monopólio italiano/muçulmano do Mediterrâneo), sociais (nobreza e burguesia em busca de mercês e mercados), religiosas (cruzadismo, evangelização) e científicas (avanços náuticos: caravela, astrolábio, volta do mar). Fases: conquista de Ceuta (1415) → Atlântico/Açores e Madeira → costa africana (Bartolomeu Dias, Cabo Bojador por Gil Eanes em 1434, Boa Esperança 1488) → Índia (Vasco da Gama 1498) → Brasil (Cabral 1500). Tordesilhas (1494) divide o mundo com Castela.',
      passos: [
        'Organiza a cronologia por décadas: 1415, 1434, 1488, 1494, 1498, 1500.',
        'Distingue os modelos de presença: feitorias (comércio), fortalezas (controlo militar das rotas), colonização (Brasil, ilhas).',
        'Relaciona cada avanço com o rei/príncipe do momento (D. João I, Infante D. Henrique, D. João II, D. Manuel I).',
        'Avalia consequências globais: primeira economia-mundo, choque demográfico e cultural, escravatura, "revolução dos preços".',
      ],
      conceitos: [
        { nome: 'Feitoria', definicao: 'Posto comercial fortificado no litoral (ex.: Arguim, Cochim).' },
        { nome: 'Volta do mar', definicao: 'Técnica de navegação usando os ventos/gyres do Atlântico para regressar.' },
        { nome: 'Tratado de Tordesilhas', definicao: '1494 — linha a 370 léguas de Cabo Verde divide as zonas de influência de Portugal e Castela.' },
      ],
      exemplo: {
        enunciado: 'Porque é Ceuta (1415) considerada o marco inicial?',
        resolucao: ['Primeira praça norte-africana conquistada — combina cruzadismo e interesse comercial (ouro sudanês).', 'Mostra logo os limites: o comércio desviou-se e a praça tornou-se cara — empurra Portugal para a exploração da costa atlântica.'],
      },
      exercicios: [
        { enunciado: 'Que problema económico motivava a busca do caminho marítimo para a Índia?', dica: 'Intermediários.', solucao: 'O monopólio veneziano/mameluco das especiarias no Mediterrâneo oriental, que encarecia os produtos.' },
        { enunciado: 'Relaciona D. João II com dois marcos.', dica: '"Príncipe Perfeito".', solucao: 'Fortalecimento do poder régio; apoio a Diogo Cão/Bartolomeu Dias (Boa Esperança, 1488) e preparação da armada de Gama.' },
      ],
      recursos: [],
    }),

  E('estadonovo', ['História A'], ['Estado Novo e 25 de Abril'],
    ['estado novo', 'salazar', 'salazarismo', '25 de abril', 'revolucao dos cravos', 'ditadura', 'pide', 'guerra colonial', 'marcelo caetano', 'mfa', 'prec', 'constituicao de 1976', 'censura'],
    {
      titulo: 'Estado Novo (1933–1974) e Revolução de 25 de Abril',
      resumo: 'Ditadura de Salazar: Constituição de 1933 (autoritarismo com fachada democrática), partido único (União Nacional), censura prévia, polícia política (PVDE/PIDE/DGS), Mocidade Portuguesa, corporativismo, colonialismo ("Acto Colonial"). Guerra colonial (1961–74: Angola, Guiné, Moçambique) desgasta o regime. Após a morte/afastamento de Salazar (1968), Marcelo Caetano não liberaliza de facto. A 25 de Abril de 1974, o MFA derruba o regime (Revolução dos Cravos, praticamente sem tiros: senha "Grândola, Vila Morena"); segue-se o PREC e a democracia (Constituição de 1976, descolonização).',
      passos: [
        'Caracteriza o regime em 4 pilares: autoritarismo, partido único, censura/repressão, ideologia (Deus, Pátria, Família + corporativismo).',
        'Explica a guerra colonial como causa próxima do golpe (custos humanos/económicos, isolamento internacional, consciência dos capitães).',
        'Descreve o 25 de Abril: MFA, adesão popular, fim da censura e dos presos políticos.',
        'Distingue 25 de Abril de 1974 (golpe/revolução) de 25 de Novembro de 1975 e da Constituição de 2 de abril de 1976 (institucionalização da democracia).',
      ],
      conceitos: [
        { nome: 'MFA', definicao: 'Movimento das Forças Armadas — organização de capitães que executa o golpe.' },
        { nome: 'PREC', definicao: 'Processo Revolucionário em Curso (1974–75): nacionalizações, reforma agrária, disputa política intensa.' },
        { nome: 'Corporativismo', definicao: 'Organização económica por corporações controladas pelo Estado, anti-liberal e anti-socialista.' },
      ],
      exemplo: {
        enunciado: 'Porque se diz que o 25 de Abril foi um "golpe" e uma "revolução"?',
        resolucao: ['Golpe: ação militar planeada pelo MFA que derruba o governo.', 'Revolução: a adesão popular imediata transformou-o em mudança social e política profunda (fim do império, direitos, democracia).'],
      },
      exercicios: [
        { enunciado: 'Indica duas medidas simbólicas do MFA no dia seguinte ao 25 de Abril.', dica: 'Censura e presos.', solucao: 'Fim da censura (imprensa livre) e libertação dos presos políticos (ex.: Peniche/Caxias).' },
      ],
      recursos: [],
    }),

  E('revolucao-industrial', ['História A'], ['Revolução Industrial'],
    ['revolucao industrial', 'industrializacao', 'maquina a vapor', 'fabricas', 'proletariado', 'movimento operario', 'capitalismo industrial', 'urbanizacao', 'james watt', 'spinning jenny'],
    {
      titulo: 'Revolução Industrial — causas, fases e sociedade',
      resumo: 'Arranca na Inglaterra (meados do séc. XVIII): capital acumulado, carvão e ferro, mão de obra liberta dos campos, mercado colonial, mentalidade prática. 1.ª fase: têxteis, máquina a vapor (Watt), ferro e carvão. 2.ª fase (1870+): aço, eletricidade, petróleo, química, automóvel. Consequências sociais: urbanização explosiva, proletariado, condições de trabalho duras → movimento operário (sindicatos, cartismo, socialismo/anarquismo) e legislação social.',
      passos: [
        'Explica a precedência inglesa com 4-5 fatores concretos.',
        'Distingue 1.ª e 2.ª Revolução Industrial (fontes de energia, setores, geografias).',
        'Descreve a sociedade industrial: burguesia industrial vs operariado; fábrica como novo espaço de disciplina do tempo.',
        'Relaciona industrialização → imperialismo do séc. XIX (matérias-primas e mercados).',
      ],
      conceitos: [
        { nome: 'Proletariado', definicao: 'Classe que vende a força de trabalho; "não tem senão a prole".' },
        { nome: 'Cartismo', definicao: 'Movimento operário inglês pelo sufrágio universal masculino (Carta do Povo, 1838).' },
      ],
      exemplo: { enunciado: 'Como mudou a fábrica a relação com o tempo?', resolucao: ['Do ritmo sazonal/agrário passa-se ao relógio da fábrica: horários, turnos, multas.', 'O tempo torna-se mercadoria (salário à hora/jornada).'] },
      exercicios: [
        { enunciado: 'Duas diferenças entre 1.ª e 2.ª Revolução Industrial.', dica: 'Energia e materiais.', solucao: 'Vapor/carvão/ferro/têxtil (GB) vs eletricidade/petróleo/aço/química (EUA, Alemanha, multipolar).' },
      ],
      recursos: [],
    }),

  // ===================== GEOGRAFIA A =====================
  E('populacao-pt', ['Geografia A'], ['População portuguesa'],
    ['populacao', 'população portuguesa', 'envelhecimento', 'taxa de natalidade', 'saldo natural', 'saldo migratorio', 'demografia', 'litoralizacao', 'desertificacao', 'indice de envelhecimento', 'censos'],
    {
      titulo: 'Geografia — a população portuguesa hoje',
      resumo: 'Portugal: população a diminuir desde 2010 (~10,3-10,6 milhões), envelhecimento acentuado (índice de envelhecimento > 170 idosos/100 jovens), saldo natural negativo compensado parcialmente por saldo migratório positivo recente. Fortes contrastes: litoralização (Área Metropolitana de Lisboa e Porto concentram população e emprego) vs desertificação do interior (Baixa Densidade).',
      passos: [
        'Domina os indicadores: natalidade, mortalidade, crescimento natural e migratório, esperança de vida, índice de envelhecimento/dependência.',
        'Explica as causas do envelhecimento (queda da natalidade + aumento da longevidade + emigração jovem histórica).',
        'Descreve a distribuição: faixa litoral Norte-Centro-Lisboa-Setúbal-Algarve vs vazio interior (Trás-os-Montes, Beira Interior, Alentejo).',
        'Apresenta políticas: apoio à natalidade/família, atração de imigração qualificada, coesão territorial (Portugal 2030), teletrabalho/vistos (nómadas digitais).',
      ],
      conceitos: [
        { nome: 'Saldo natural', definicao: 'Nascimentos − óbitos; negativo em Portugal desde 2007 (regra).' },
        { nome: 'Litoralização', definicao: 'Concentração da população e atividades junto ao litoral.' },
        { nome: 'Índice de envelhecimento', definicao: 'Pessoas com 65+ anos por cada 100 jovens (0-14).' },
      ],
      exemplo: { enunciado: 'Porque é que o saldo migratório positivo não resolve sozinho o envelhecimento?', resolucao: ['A imigração compensa população ativa e pode subir a natalidade, mas os volumes atuais são insuficientes para inverter a pirâmide etária.', 'O envelhecimento resulta de décadas de natalidade abaixo do nível de substituição (~2,1).'] },
      exercicios: [
        { enunciado: 'Define nível de substituição das gerações.', dica: 'Filhos por mulher.', solucao: '~2,1 filhos por mulher — garante a substituição da população sem migração.' },
      ],
      recursos: [{ titulo: 'INE / Pordata', descricao: 'Estatísticas oficiais de população — cita sempre a fonte nos trabalhos.' }],
    }),

  // ===================== FILOSOFIA =====================
  E('conhecimento', ['Filosofia'], ['Teoria do conhecimento — racionalismo vs empirismo'],
    ['conhecimento', 'racionalismo', 'empirismo', 'descartes', 'hume', 'kant', 'duvida metodica', 'cogito', 'a priori', 'a posteriori', 'tabula rasa', 'justificacao', 'crenca', 'teoria do conhecimento', 'gnosiologia'],
    {
      titulo: 'Filosofia — racionalismo, empirismo e a síntese de Kant',
      resumo: 'Racionalismo (Descartes): a razão é a fonte principal do conhecimento; há ideias inatas; método da dúvida → "penso, logo existo" como primeira certeza indubitável. Empirismo (Locke, Hume): todo o conhecimento deriva da experiência; a mente nasce como "tábua rasa"; Hume leva ao ceticismo sobre causalidade (hábito, não necessidade). Kant sintetiza: "os pensamentos sem conteúdo são vazios, as intuições sem conceitos são cegas" — conhecemos fenómenos estruturados pelas formas a priori (espaço, tempo, categorias), não a coisa-em-si.',
      passos: [
        'Define o problema: o que podemos conhecer e com que garantia?',
        'Contrasta as teses: origem do conhecimento (razão vs experiência) e alcance (verdades necessárias vs probabilidades).',
        'Distinge juízos analíticos/sintéticos e a priori/a posteriori (Kant) — o "golpe de mestre" é mostrar juízos sintéticos a priori (matemática, física pura).',
        'Aplica a um caso: porque sabemos que "o sol nascerá amanhã"? (Hume: hábito; Kant: categoria de causalidade como condição da experiência).',
      ],
      conceitos: [
        { nome: 'Dúvida metódica', definicao: 'Ferramenta cartesiana: duvidar de tudo para encontrar uma certeza inabalável.' },
        { nome: 'Tábua rasa', definicao: 'Locke: a mente nasce sem ideias; toda a experiência as escreve.' },
        { nome: 'Fenómeno vs númeno', definicao: 'Kant: o que nos aparece (conhecível) vs a coisa-em-si (incognoscível).' },
        { nome: 'Conhecimento como crença verdadeira justificada', definicao: 'Definição clássica (Teeteto); os contraexemplos de Gettier relançaram o debate no séc. XX.' },
      ],
      exemplo: { enunciado: 'Como responde Descartes ao sonho/demónio enganador?', resolucao: ['Mesmo enganado em tudo, tenho de existir para ser enganado: cogito ergo sum.', 'Daí reconstrói o conhecimento: clareza e distinção + veracidade de Deus garantem o resto.'] },
      exercicios: [
        { enunciado: 'Classifica: "todos os cisnes são brancos" — analítico ou sintético? a priori ou a posteriori?', dica: 'Depende da experiência?', solucao: 'Sintético e a posteriori (a experiência pode refutá-lo — cisnes negros).' },
        { enunciado: 'Que problema põe Hume à causalidade?', dica: 'Necessidade vs repetição.', solucao: 'Nunca observamos a "ligação necessária" entre causa e efeito — só conjunção constante; a causalidade é um hábito da mente.' },
      ],
      recursos: [],
    }),

  E('etica', ['Filosofia'], ['Ética — Kant vs utilitarismo'],
    ['etica', 'moral', 'kant', 'imperativo categorico', 'utilitarismo', 'mill', 'bentham', 'deontologia', 'consequencialismo', 'dilema', 'acao moral', 'dever', 'felicidade'],
    {
      titulo: 'Filosofia — ética deontológica (Kant) vs consequencialista (utilitarismo)',
      resumo: 'Kant: o valor moral está na intenção e no dever; age só segundo máximas que possas querer como lei universal (imperativo categórico) e trata a humanidade sempre como fim, nunca apenas como meio. Utilitarismo (Bentham, Mill): a ação certa é a que maximiza a felicidade/prazer global (princípio da maior felicidade); Mill distingue prazeres superiores e inferiores.',
      passos: [
        'Identifica a estrutura de cada teoria: critério de correção (dever vs consequências), conceito central (boa vontade vs utilidade).',
        'Aplica a um dilema: mentir para salvar alguém — Kant proíbe (máxima não universalizável); o utilitarista pode permitir (maximiza bem-estar).',
        'Levanta objeções cruzadas: a Kant, rigidez/risco de consequências desastrosas; ao utilitarismo, sacrificar minorias, cálculo impossível, reduz moral a prazer.',
        'Conclui comparando: intenções vs resultados; regras vs cálculo; dignidade vs agregação.',
      ],
      conceitos: [
        { nome: 'Imperativo categórico', definicao: 'Comando incondicional da razão: (1) universalização; (2) humanidade como fim em si.' },
        { nome: 'Princípio da utilidade', definicao: 'Aprova ações que promovem a maior felicidade do maior número.' },
        { nome: 'Deontologia', definicao: 'Ética do dever/regras, independente das consequências.' },
      ],
      exemplo: { enunciado: 'Colar num exame: análise pelas duas éticas.', resolucao: ['Kant: não posso querer que "colar" seja lei universal (destruiria a avaliação) + usar o avaliador como meio. Errado, ponto.', 'Utilitarismo: prazer de curto prazo vs dano (injustiça, risco, desvalorização do diploma); quase certamente errado — mas por razões de consequências.'], },
      exercicios: [
        { enunciado: 'Formula uma máxima não universalizável.', dica: 'Promessas.', solucao: '"Faço promessas que não tenciono cumprir" — se universal, ninguém confiaria em promessas (autodestrutiva).' },
      ],
      recursos: [],
    }),

  E('logica', ['Filosofia'], ['Lógica — validade e argumentação'],
    ['logica', 'validade', 'valido', 'solidez', 'silogismo', 'premissa', 'conclusao', 'modus ponens', 'modus tollens', 'falacia', 'falacias', 'deducao', 'inducao', 'argumento'],
    {
      titulo: 'Lógica — validade, solidez e falácias',
      resumo: 'Um argumento é válido se a conclusão decorre necessariamente das premissas (não podem ser todas verdadeiras com a conclusão falsa); é sólido se é válido E tem premissas verdadeiras. Formas válidas: modus ponens (P→Q; P; logo Q), modus tollens (P→Q; ¬Q; logo ¬P). Inválidas: afirmação da consequente, negação da antecedente. A validade é de forma, não de conteúdo.',
      passos: [
        'Formaliza: substitui frases por letras (P, Q) e identifica a forma.',
        'Testa a validade: imagina um caso com premissas verdadeiras e conclusão falsa — se for possível, é inválido.',
        'Distingue dedução (necessidade) de indução (probabilidade, generalização).',
        'Conhece falácias comuns: ad hominem, espantalho, apelo à autoridade/emoção, falsa dicotomia, petição de princípio, derrapagem (slope).',
      ],
      conceitos: [
        { nome: 'Validade', definicao: 'Propriedade da forma do argumento.' },
        { nome: 'Solidez', definicao: 'Validade + premissas verdadeiras.' },
        { nome: 'Silogismo', definicao: 'Argumento de duas premissas e conclusão (todo o A é B; C é A; logo C é B).' },
      ],
      exemplo: { enunciado: '"Se estudo, passo. Passei. Logo, estudei." Válido?', resolucao: ['Forma: P→Q; Q; logo P — afirmação da consequente.', 'Inválido: podia ter passado sem estudar (as premissas podem ser V com conclusão F).'] },
      exercicios: [
        { enunciado: 'Avalia: "Se chove, a rua molha-se. Não chove. Logo, a rua não está molhada."', dica: 'Negação da antecedente.', solucao: 'Inválido — a rua pode estar molhada por outra razão.' },
        { enunciado: 'Que falácia: "Não podes opinar sobre o clima, não és cientista"?', dica: 'Ataca a pessoa.', solucao: 'Ad hominem (e apelo à autoridade invertido).' },
      ],
      recursos: [],
    }),

  // ===================== ECONOMIA A =====================
  E('oferta-procura', ['Economia A'], ['Oferta, procura e preço de equilíbrio'],
    ['oferta', 'procura', 'mercado', 'equilibrio de mercado', 'preco de equilibrio', 'elasticidade', 'excedente', 'lei da procura', 'lei da oferta', 'bens substitutos', 'bens complementares'],
    {
      titulo: 'Economia — o funcionamento do mercado',
      resumo: 'Lei da procura: quanto maior o preço, menor a quantidade procurada (curva descendente). Lei da oferta: quanto maior o preço, maior a quantidade oferecida (curva ascendente). O preço de equilíbrio iguala as quantidades — onde as curvas se cruzam. Deslocações (não movimentos ao longo!) da curva por fatores como rendimento, gostos, preços de bens relacionados (procura) ou custos de produção, tecnologia (oferta).',
      passos: [
        'Distingue variação da quantidade procurada (movimento na curva, por preço) de variação da procura (deslocação da curva, por outros fatores).',
        'Analisa o choque: que curva desloca e para onde?',
        'Compara novo equilíbrio (preço e quantidade).',
        'Exemplo-tipo: subida do preço dos combustíveis → desloca oferta de transportes para a esquerda → preço sobe, quantidade desce.',
      ],
      conceitos: [
        { nome: 'Excedente/escassez', definicao: 'Preço acima do equilíbrio → excedente (pressão para descer); abaixo → escassez (pressão para subir).' },
        { nome: 'Elasticidade-preço da procura', definicao: 'Sensibilidade da quantidade a variações do preço; |E| > 1 elástica.' },
        { nome: 'Bens substitutos/complementares', definicao: 'Coca-Cola e Pepsi (substitutos: preço de um ↑ → procura do outro ↑); telemóvel e capa (complementares).' },
      ],
      exemplo: { enunciado: 'Estudo mostra que café faz bem à saúde. Efeito no mercado?', resolucao: ['Gostos mudam → procura desloca-se para a direita.', 'Novo equilíbrio: preço e quantidade mais altos.'] },
      exercicios: [
        { enunciado: 'Congelamento da colheita de laranja: o que acontece ao preço do sumo de laranja?', dica: 'Choque na oferta + bens relacionados.', solucao: 'Oferta de laranja desloca-se para a esquerda → preço da laranja sobe → custos do sumo sobem → oferta de sumo desloca-se para a esquerda → preço do sumo sobe.' },
      ],
      recursos: [],
    }),

  // ===================== INGLÊS =====================
  E('present-perfect', ['Inglês'], ['Present Perfect vs Past Simple'],
    ['present perfect', 'past simple', 'ingles', 'ingles tempos', 'have done', 'for since', 'just already yet', 'experiencia de vida', 'grammar english'],
    {
      titulo: 'Inglês — Present Perfect vs Past Simple',
      resumo: 'Past Simple: ação concluída num tempo definido (yesterday, in 2010, last week) — "I visited Lisbon in 2023". Present Perfect (have/has + particípio): liga o passado ao presente — experiência de vida sem data ("I have visited Lisbon"), ação recente com resultado ("I have just finished"), duração até agora com for/since ("I have lived here for 3 years"). Marcadores: yet/already/just/ever/never → Present Perfect; ago/last…/in+ano → Past Simple.',
      passos: [
        'Procura o marcador de tempo na frase — é a pista mais forte.',
        'Tempo definido e terminado → Past Simple.',
        'Tempo indefinido ou que chega até agora → Present Perfect.',
        'Cuidado: "for/since" com Present Perfect; "for/since" + data passada concreta em contexto americano pode aparecer com Past Simple, mas em exames usa a regra britânica.',
      ],
      conceitos: [
        { nome: 'Been vs gone', definicao: '"She has been to Paris" (foi e voltou) vs "She has gone to Paris" (foi e ainda lá está).' },
        { nome: 'For vs since', definicao: 'for + duração (for 3 years); since + ponto de origem (since 2023).' },
      ],
      exemplo: { enunciado: 'Completa: "I ___ (lose) my keys — I can\'t open the door!"', resolucao: ['"I have lost my keys" — resultado presente de uma ação passada → Present Perfect.'] },
      exercicios: [
        { enunciado: '"She lived in Porto for 5 years" vs "She has lived in Porto for 5 years" — diferença?', dica: 'Ainda vive lá?', solucao: 'A primeira: já não vive (período fechado). A segunda: ainda vive (até agora).' },
        { enunciado: 'Escolhe: "Did you ever eat francesinha?" ou "Have you ever eaten francesinha?"', dica: 'Experiência de vida.', solucao: '"Have you ever eaten…?" — ever de experiência pede Present Perfect (BrE; em AmE "Did you ever eat" também ocorre).' },
      ],
      recursos: [],
    }),

  // ===================== MÉTODOS DE ESTUDO =====================
  E('plano-estudo', ['Métodos de estudo'], ['Como organizar o estudo'],
    ['como estudar', 'organizar estudo', 'plano de estudo', 'cronograma', 'rotina', 'horario de estudo', 'pomodoro', 'repeticao espacada', 'active recall', 'recuperacao ativa', 'memorizar', 'memoria', 'estudar para teste'],
    {
      titulo: 'Métodos de estudo — ciência da aprendizagem eficaz',
      resumo: 'As técnicas com mais evidência científica: recuperação ativa (testar-te em vez de reler), repetição espaçada (rever em intervalos crescentes), prática intercalada (misturar temas/tipos de exercício) e autoexplicação. Reler e sublinhar são das técnicas MENOS eficazes — dão sensação de fluência sem aprendizagem. Usa Pomodoro (25-50 min foco + pausas) e dorme: a consolidação da memória acontece no sono.',
      passos: [
        'Diagnóstico: lista os temas e avalia cada um (1-5) com um mini-teste, não com a tua sensação.',
        'Plano semanal fixo: blocos por disciplina com objetivo concreto ("fazer 10 exercícios de trigonometria", não "estudar matemática").',
        'Em cada bloco: 10 min recuperar ativamente o que sabes → aprender/rever o que falhou → praticar → 5 min planear o próximo.',
        'Agenda revisões espaçadas: 1 dia, 3 dias, 1 semana, 2 semanas depois.',
        'Sábado: simulado ou exercícios mistos; domingo: descanso ativo (a memória precisa dele).',
      ],
      conceitos: [
        { nome: 'Recuperação ativa (active recall)', definicao: 'Puxar informação da memória (flashcards, folhas em branco, auto-testes) — fortalece muito mais do que reler.' },
        { nome: 'Repetição espaçada', definicao: 'Rever no limiar do esquecimento (curva de Ebbinghaus) — apps tipo Anki automatizam isto.' },
        { nome: 'Prática intercalada', definicao: 'Alternar tipos de problema — pior no treino, melhor no exame.' },
        { nome: 'Efeito de teste', definicao: 'Testar-se melhora a retenção mesmo quando se erra.' },
      ],
      exemplo: { enunciado: 'Sessão de 50 minutos bem estruturada.', resolucao: ['0-5: objetivo da sessão. 5-15: folha em branco — escreve tudo o que sabes do tema (recuperação). 15-35: revê só o que falhaste + exercícios. 35-45: corrige e regista erros. 45-50: agenda a próxima revisão (daqui a 2 dias).'] },
      exercicios: [
        { enunciado: 'Transforma "estudar biologia na terça" num objetivo de sessão válido.', dica: 'Concreto + mensurável.', solucao: 'Ex.: "terça 17h: fazer 15 flashcards de fotossíntese e resolver 6 questões de exames anteriores sem apontamentos".' },
      ],
      recursos: [
        { titulo: 'Ferramenta Turma+', descricao: 'O "Plano de estudo" gera um plano faseado até à data do teu exame/teste.' },
      ],
    }),

  E('exame-nacional', ['Métodos de estudo'], ['Como preparar exames nacionais'],
    ['exame nacional', 'exames nacionais', 'prova final', 'preparar exame', 'ansiedade de exame', 'como me preparo', 'cfd', 'media de exame', 'fase 1', 'fase 2', 'prova de ingresso'],
    {
      titulo: 'Exames nacionais — preparação estratégica',
      resumo: 'O exame nacional não testa só matéria: testa gestão de tempo, leitura de enunciado e resposta segundo os critérios. Estratégia: (1) domínio do programa e da Informação-Prova (IAVE); (2) prática com provas de anos anteriores cronometradas; (3) caderno de erros; (4) simulacros completos nas últimas 3 semanas; (5) rotinas de exame (material, sono, leitura do enunciado, gestão do tempo).',
      passos: [
        'Descarrega a Informação-Prova do IAVE da tua disciplina — diz exatamente o que sai e como é avaliado.',
        'Faz um diagnóstico com uma prova antiga completa; regista tempo por grupo e erros.',
        'Plano: revisão por temas fracos + 2 provas antigas por semana cronometradas.',
        'Treina a escrita de respostas: nos critérios de correção, palavras-chave valem pontos — estrutura e vocabulário específico contam.',
        'Na véspera: nada de matéria nova. Material preparado, dormir 8h.',
        'No exame: lê tudo primeiro, começa pelo que dominas, gere o tempo por cotação, nunca deixes respostas em branco (parciais pontuam).',
      ],
      conceitos: [
        { nome: 'Informação-Prova (IAVE)', definicao: 'Documento oficial com objeto de avaliação, estrutura e critérios — o teu mapa do exame.' },
        { nome: 'Caderno de erros', definicao: 'Registo dos erros por tipo (conteúdo, leitura, tempo, cálculo) com a correção certa ao lado.' },
      ],
      exemplo: { enunciado: 'Gestão de tempo numa prova de 120 min com 2 grupos.', resolucao: ['Lê a prova toda: 5-10 min.', 'Aloca tempo proporcional à cotação (grupo de 60% → ~65 min).', 'Reserva 15 min finais para rever e completar respostas em branco.'] },
      exercicios: [
        { enunciado: 'Que 3 informações tira uma prova antiga além da matéria?', dica: 'Formato.', solucao: 'Estrutura/cotações, tempo real necessário por item e estilo de perguntas/critérios.' },
      ],
      recursos: [{ titulo: 'IAVE', descricao: 'Provas e critérios oficiais de anos anteriores — gratuitos em iave.pt.' }],
    }),

  E('concentracao', ['Métodos de estudo'], ['Concentração e procrastinação'],
    ['concentracao', 'procrastinacao', 'adiao', 'distraido', 'telemovel', 'foco', 'nao consigo estudar', 'motivacao', 'preguica', 'bloqueio'],
    {
      titulo: 'Concentração — vencer a procrastinação',
      resumo: 'A procrastinação é gestão de emoções, não de tempo: adiamos o que nos faz sentir ansiedade/tédio. Combate com fricção zero para começar (regra dos 2 minutos: "só vou abrir o livro"), ambiente sem gatilhos (telemóvel noutra divisão — só virado não chega, os estudos mostram que a mera presença consome atenção), e recompensas planeadas. A motivação segue a ação, não o contrário.',
      passos: [
        'Regra dos 2 minutos: compromete-te só a começar ("ler o primeiro exercício").',
        'Telemóvel fora da vista e em modo avião; apps de foco se necessário.',
        'Blocos curtos (Pomodoro 25/5); aumenta gradualmente para 45-50 min.',
        'Define o "primeiro gesto concreto" de cada sessão na noite anterior.',
        'Recompensa pós-sessão (não durante): episódio, passeio, snack.',
        'Auto-compaixão: falhar um dia não anula o plano — retoma no bloco seguinte.',
      ],
      conceitos: [
        { nome: 'Fricção de arranque', definicao: 'O custo de começar é o maior obstáculo; reduzir passos até ao início aumenta arranques.' },
        { nome: 'Atenção residual', definicao: 'Trocar de tarefa deixa "restos" de atenção na anterior — daí os blocos monotemáticos.' },
      ],
      exemplo: { enunciado: 'Plano de emergência para "não consigo começar".', resolucao: ['Mesa limpa, só o material da tarefa.', 'Timer 10 min: objetivo mínimo ridículo ("ler a página 12").', 'Terminado o timer, decide: parar (já ganhaste) ou continuar (normalmente continuas).'] },
      exercicios: [
        { enunciado: 'Qual é o teu principal gatilho de distração e que fricção lhe vais acrescentar hoje?', dica: 'Torna o gatilho mais difícil, não só "força de vontade".', solucao: 'Resposta pessoal — ex.: telemóvel → fica na cozinha durante blocos; notificações de jogos → desinstaladas na semana de testes.' },
      ],
      recursos: [],
    }),
];

// ---------------------------------------------------------------------------
// Ficha genérica (fallback honesto quando a pergunta não corresponde à base)
// ---------------------------------------------------------------------------
export function genericFicha(question, subject) {
  return {
    titulo: 'Como abordar esta dúvida',
    resumo:
      `Ainda não tenho uma ficha específica sobre "${question.slice(0, 80)}"${subject ? ` em ${subject}` : ''}. ` +
      'Em vez de inventar, deixo-te o método que funciona para qualquer matéria — e podes reformular a pergunta com termos mais específicos (ex.: o nome do tema, fórmula ou obra) para eu procurar melhor.',
    passos: [
      'Escreve a dúvida pela tua palavras e identifica o que já sabes sobre o tema (recuperação ativa).',
      'Procura o tema no índice do manual e no caderno: onde foi dado? Que exemplos foram resolvidos na aula?',
      'Divide a dúvida em sub-perguntas mais pequenas e responde a cada uma com o material.',
      'Faz um mini-teste: explica o tema em voz alta como se ensinasses um colega (técnica Feynman) — onde gaguejas é onde tens de voltar.',
      'Se continuar difícil, coloca a dúvida aqui com mais detalhe ou pergunta a um professor/colega no grupo de estudo.',
    ],
    conceitos: [
      { nome: 'Técnica Feynman', definicao: 'Explicar o conceito em linguagem simples; as falhas na explicação revelam as falhas na aprendizagem.' },
      { nome: 'Pergunta bem formada', definicao: '"O que tentaste, o que esperavas, o que aconteceu" — acelera qualquer ajuda.' },
    ],
    exemplo: {
      enunciado: 'De "não percebo isto nada" para uma pergunta respondível:',
      resolucao: [
        'Original: "não percebo frações"',
        'Melhor: "sei somar frações com o mesmo denominador, mas não sei quando tenho de encontrar o denominador comum"',
        'Com esta formulação, a ficha certa (ou o professor) aparece logo.',
      ],
    },
    exercicios: [],
    recursos: [
      { titulo: 'Grupos de estudo Turma+', descricao: 'Pergunta no grupo da tua disciplina em Mensagens — há sempre alguém que já passou por isto.' },
    ],
    aviso: 'Esta é uma ficha de método: o motor local cobre os temas mais pedidos do secundário. Sugestões de novos temas são bem-vindas!',
  };
}
