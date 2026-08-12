/**
 * Regra pedida: encaminhar SOMENTE vagas de trabalho. Palestras, eventos, cursos,
 * mentorias avulsas e demais avisos devem ser descartados.
 *
 * Ajuste as listas abaixo livremente para calibrar o filtro sem tocar no resto do código.
 */

const INCLUDE_KEYWORDS = [
  'vaga', 'vagas', 'contratando', 'contrata-se', 'contrate-se', 'estamos contratando',
  'oportunidade de emprego', 'oportunidade de trabalho', 'oportunidade de carreira',
  'processo seletivo', 'inscricoes abertas para a vaga', 'envie seu curriculo',
  'envie curriculo', 'enviar curriculo', 'curriculo para', 'cv para', 'cv em anexo',
  'hiring', "we're hiring", 'were hiring', 'job opening', 'job opportunity',
  'buscamos', 'procura-se', 'recrutamento', 'recrutando', 'estagio', 'trainee',
  'home office (vaga)', 'clt', 'pj (vaga)',
];

const EXCLUDE_KEYWORDS = [
  'palestra', 'webinar', 'workshop', 'mentoria gratuita', 'bate-papo', 'live gratuita',
  ' live ', 'meetup', 'curso gratuito', 'masterclass', 'podcast', 'evento gratuito',
  'inscreva-se no evento', 'convite para o evento', 'certificado gratuito', 'bootcamp gratuito',
  'aula gratuita', 'encontro online', 'roda de conversa',
];

const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g');

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, ''); // remove acentos
}

function matchesAny(normalizedText, keywords) {
  return keywords.some((keyword) => normalizedText.includes(normalize(keyword)));
}

/** Retorna true somente quando o texto parece uma vaga de trabalho real. */
function isJobPosting(text) {
  if (!text || !text.trim()) return false;

  const normalized = normalize(text);
  const hasJobSignal = matchesAny(normalized, INCLUDE_KEYWORDS);
  if (!hasJobSignal) return false;

  const hasExclusionSignal = matchesAny(normalized, EXCLUDE_KEYWORDS);
  return !hasExclusionSignal;
}

module.exports = { isJobPosting, INCLUDE_KEYWORDS, EXCLUDE_KEYWORDS };
