const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const FILES_DIR = SCRIPT_DIR;
const OUTPUT_DIR = path.join(SCRIPT_DIR, '..', 'supabase', 'import');

function parseHtmlTable(html) {
  const rows = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    const cells = [];
    const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      const cellContent = tdMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/[\u200B-\u200F\uFEFF]/g, '')
        .trim();
      cells.push(cellContent);
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

function readFile(filename) {
  const filePath = path.join(FILES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: File not found: ${filePath}`);
    process.exit(1);
  }
  console.log(`Reading: ${filename}`);
  return fs.readFileSync(filePath, 'utf-8');
}

function parseTickets(html) {
  const rows = parseHtmlTable(html);
  const tickets = [];
  let startIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const firstCell = (rows[i][0] || '').trim();
    if (/^[A-Z]$/.test(firstCell) || firstCell.toLowerCase().includes('issue id') || firstCell === '1') {
      startIdx = i + 1;
      console.log(`  Skipping row ${i}: "${rows[i].slice(0, 3).join(' | ')}..."`);
    }
  }
  while (startIdx < rows.length && rows[startIdx].every(c => !c.trim())) startIdx++;
  console.log(`  Data starts at row ${startIdx}`);

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    const issueId = (row[1] || '').trim();
    if (!issueId) continue;
    const ticket = {
      issueId,
      firstName: (row[2] || '').trim(),
      lastName: (row[3] || '').trim(),
      employeeId: (row[4] || '').trim(),
      symptom: (row[5] || '').trim(),
      department: (row[6] || '').trim(),
      dateResolved: (row[7] || '').trim(),
    };
    if (ticket.symptom || ticket.firstName) tickets.push(ticket);
  }
  return tickets;
}

function parseSymptoms(html) {
  const rows = parseHtmlTable(html);
  const symptoms = [];
  for (const row of rows) {
    if (row.length >= 2 && row[0] && row[1]) {
      const name = row[0].trim();
      const dept = row[1].trim();
      if (name.toLowerCase() === 'symptom' || name.toLowerCase() === 'sintoma') continue;
      symptoms.push({ name, department: dept });
    }
  }
  return symptoms;
}

function parseTechnicians(html) {
  const rows = parseHtmlTable(html);
  const technicians = [];
  for (const row of rows) {
    if (row.length >= 3 && row[0] && row[2]) {
      const name = row[0].trim();
      const sector = row[1].trim();
      const email = row[2].trim();
      if (name.toLowerCase() === 'name' || name.toLowerCase() === 'nome') continue;
      if (email.includes('@')) technicians.push({ name, sector, email });
    }
  }
  return technicians;
}

const SYMPTOM_TO_CATEGORY = {
  'Teclado ou Mouse': { name: 'Hardware - Perifericos', icon: 'Mouse' },
  'Computador ou Notebook não liga': { name: 'Hardware - Computador', icon: 'Monitor' },
  'Suseita de Vírus': { name: 'Seguranca - Virus', icon: 'Shield' },
  'Problema de comunicação na Impressora': { name: 'Impressora', icon: 'Printer' },
  'Envio de e-mail com falha': { name: 'E-mail', icon: 'Mail' },
  'Acesso a internet com falha': { name: 'Internet', icon: 'Globe' },
  'WebSite da empresa fora do ar': { name: 'Website', icon: 'Globe' },
  'App do tickets não atende sua demanda': { name: 'Sistema de Chamados', icon: 'AppWindow' },
  'Não listado': { name: 'Outro', icon: 'HelpCircle' },
  'web cam': { name: 'Webcam', icon: 'Camera' },
  'Ponto de Rede': { name: 'Rede - Ponto', icon: 'Network' },
  'iPad': { name: 'iPad', icon: 'Tablet' },
  'Internet com mau funcionamento': { name: 'Internet - Lentidao', icon: 'Globe' },
  'Catraca': { name: 'Catraca', icon: 'Lock' },
  'Áudio não funcionando': { name: 'Audio', icon: 'Volume2' },
  'Programa ou Software não funcionando bem': { name: 'Software', icon: 'Disc' },
  'Desenvolver': { name: 'Desenvolvimento', icon: 'Code' },
  'Acesso as câmeras': { name: 'CFTV - Cameras', icon: 'Camera' },
  'Certificado': { name: 'Certificado Digital', icon: 'FileText' },
  'Compras': { name: 'Compras de TI', icon: 'ShoppingCart' },
  'Nobreack': { name: 'Nobreak', icon: 'Battery' },
  'Celular': { name: 'Celular', icon: 'Smartphone' },
  'WI-FI': { name: 'Wi-Fi', icon: 'Wifi' },
  'Backup': { name: 'Backup', icon: 'HardDrive' },
};

const KEYWORD_CATEGORIES = [
  { keywords: ['impressora', 'imprimir', 'impressao', 'tonner', 'papel atolado', 'etiqueta', 'etiquetas', 'ribbon', 'riboon'], name: 'Impressora', icon: 'Printer' },
  { keywords: ['e-mail', 'email', 'outlook', 'e-amil'], name: 'E-mail', icon: 'Mail' },
  { keywords: ['internet', 'net', 'conexao', 'conexão', 'wifi', 'wi-fi', 'wi fi', 'wtti', 'sem internet', 'sem rede', 'sem rede de internet'], name: 'Internet', icon: 'Globe' },
  { keywords: ['camera', 'câmera', 'cftv', 'dvr', 'imagem'], name: 'CFTV - Cameras', icon: 'Camera' },
  { keywords: ['teclado', 'mouse', 'periferico', 'periférico', 'monitor', 'webcam'], name: 'Hardware - Perifericos', icon: 'Mouse' },
  { keywords: ['computador', 'pc', 'desktop', 'cpu', 'não liga', 'nao liga', 'não funcionando', 'pc não liga', 'pc liga'], name: 'Hardware - Computador', icon: 'Monitor' },
  { keywords: ['notebook', 'note', 'laptop'], name: 'Hardware - Computador', icon: 'Monitor' },
  { keywords: ['virus', 'vírus', 'antivirus', 'antivírus'], name: 'Seguranca - Virus', icon: 'Shield' },
  { keywords: ['ponto de rede', 'cabo de rede', 'rede cabeada', 'cabos', 'ponto'], name: 'Rede - Ponto', icon: 'Network' },
  { keywords: ['ipad', 'tablet'], name: 'iPad', icon: 'Tablet' },
  { keywords: ['catraca', 'dmpacesso', 'dmprep'], name: 'Catraca', icon: 'Lock' },
  { keywords: ['áudio', 'audio', 'som', 'microfone'], name: 'Audio', icon: 'Volume2' },
  { keywords: ['software', 'programa', 'protheus', 'senior', 'office', 'teams', 'google', 'teamviewer', 'temviewer', 'vpn', 'google chrome', 'excel', 'word', 'power', 'windows'], name: 'Software', icon: 'Disc' },
  { keywords: ['desenvolver', 'quiz', 'app', 'aplicativo', 'desenvolvimento', 'formulário', 'formulario'], name: 'Sistema de Chamados', icon: 'AppWindow' },
  { keywords: ['certificado', 'nfe', 'assinatura digital'], name: 'Certificado Digital', icon: 'FileText' },
  { keywords: ['compra', 'orçamento', 'orcamento'], name: 'Compras de TI', icon: 'ShoppingCart' },
  { keywords: ['nobreak', 'nobreack', 'energia', 'queda de energia', 'sem energia'], name: 'Nobreak', icon: 'Battery' },
  { keywords: ['celular', 'smartphone'], name: 'Celular', icon: 'Smartphone' },
  { keywords: ['backup', 'restauração', 'restauracao'], name: 'Backup', icon: 'HardDrive' },
  { keywords: ['website', 'site'], name: 'Website', icon: 'Globe' },
  { keywords: ['relogio', 'relógio', 'ponto eletrônico', 'ponto eletronico', 'kairos', 'biotime', 'marcação', 'marcaçao', 'afd'], name: 'Catraca', icon: 'Lock' },
  { keywords: ['scanner', 'digitalizar', 'scannear'], name: 'Hardware - Perifericos', icon: 'Mouse' },
  { keywords: ['senha', 'login', 'bloqueado', 'bloqueada'], name: 'Software', icon: 'Disc' },
  { keywords: ['reunião', 'reuniao', 'palestra', 'treinamento'], name: 'Sistema de Chamados', icon: 'AppWindow' },
  { keywords: ['telefones', 'telefone', 'voip', 'ramal', 'ramais'], name: 'Sistema de Chamados', icon: 'AppWindow' },
  { keywords: ['scanner', 'scanner'], name: 'Hardware - Perifericos', icon: 'Mouse' },
];

function matchCategory(symptom, department) {
  if (!symptom) return { name: 'Outro', icon: 'HelpCircle' };

  const text = symptom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const exactMatch = SYMPTOM_TO_CATEGORY[symptom];
  if (exactMatch) return exactMatch;

  for (const kc of KEYWORD_CATEGORIES) {
    for (const kw of kc.keywords) {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (text.includes(kwNorm)) return { name: kc.name, icon: kc.icon };
    }
  }

  const dept = (department || '').toLowerCase();
  if (dept.includes('website')) return { name: 'Website', icon: 'Globe' };
  if (dept.includes('ti web')) return { name: 'Desenvolvimento', icon: 'Code' };

  return { name: 'Outro', icon: 'HelpCircle' };
}

function normalizeLocation(firstName) {
  return firstName ? firstName.trim() : null;
}

function mapDepartment(oldDept) {
  const mapping = { 'Geral': 'Administrativo', 'TI': 'TI', 'TI WEB': 'TI', 'Website': 'TI', 'Apps': 'TI' };
  return mapping[oldDept] || 'TI';
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const brMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  const simpleMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (simpleMatch) return simpleMatch[0];
  return null;
}

function escapeSql(str) {
  if (!str) return 'NULL';
  const cleaned = str
    .replace(/[\r\n\t]/g, ' ').replace(/\u2028/g, ' ').replace(/\u2029/g, ' ')
    .replace(/[\u200B-\u200F\uFEFF]/g, '').replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ').trim();
  return "'" + cleaned.replace(/'/g, "''") + "'";
}

function generateSQL(tickets) {
  const ADMIN_UUID = '736d8f34-dfa4-4e27-9f76-0a0e837ef534';
  const files = [];

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const setupLines = [];
  setupLines.push('-- ============================================');
  setupLines.push('-- PASSO 1: Categorias e Departamentos');
  setupLines.push('-- ============================================');
  setupLines.push('');
  setupLines.push('-- INSTRUCOES:');
  setupLines.push('-- 1. Execute migration.sql PRIMEIRO');
  setupLines.push('-- 2. Copie o UUID do seu usuario admin no Supabase');
  setupLines.push('-- 3. Use Ctrl+H para substituir PASTE_YOUR_ADMIN_UUID_HERE em TODOS os arquivos');
  setupLines.push('-- 4. Execute em ordem: 01-setup, 02-tickets-*, 03-finalize');
  setupLines.push('');
  setupLines.push('-- Categories');

  const allCategories = new Set();
  for (const ticket of tickets) {
    const cat = matchCategory(ticket.symptom, ticket.department);
    allCategories.add(JSON.stringify(cat));
  }
  for (const catJson of allCategories) {
    const cat = JSON.parse(catJson);
    setupLines.push(`INSERT INTO ticket_categories (id, name, icon) VALUES (uuid_generate_v4(), ${escapeSql(cat.name)}, ${escapeSql(cat.icon)}) ON CONFLICT DO NOTHING;`);
  }
  setupLines.push('');
  setupLines.push('-- Departments');
  const deptNames = [...new Set(tickets.map(t => mapDepartment(t.department)).filter(Boolean))];
  for (const dept of deptNames) {
    setupLines.push(`INSERT INTO departments (name, description) VALUES (${escapeSql(dept)}, ${escapeSql(`Departamento ${dept}`)}) ON CONFLICT (name) DO NOTHING;`);
  }
  setupLines.push('');
  setupLines.push('-- Verifique: SELECT COUNT(*) FROM ticket_categories; SELECT COUNT(*) FROM departments;');
  files.push({ name: '01-setup.sql', content: setupLines.join('\n') });

  const TICKETS_PER_FILE = 100;
  let fileIndex = 0;
  for (let i = 0; i < tickets.length; i += TICKETS_PER_FILE) {
    fileIndex++;
    const chunk = tickets.slice(i, i + TICKETS_PER_FILE);
    const lines = [];
    lines.push(`-- ============================================`);
    lines.push(`-- PASSO 2: Tickets (lote ${fileIndex} - tickets ${i + 1} a ${Math.min(i + TICKETS_PER_FILE, tickets.length)})`);
    lines.push(`-- ============================================`);
    lines.push('');

    for (const ticket of chunk) {
      const resolvedDate = parseDate(ticket.dateResolved);
      const cat = matchCategory(ticket.symptom, ticket.department);
      const location = normalizeLocation(ticket.firstName);
      const department = mapDepartment(ticket.department);
      const title = `[#${ticket.issueId}] ${ticket.symptom || 'Chamado antigo'}`;
      const descParts = [
        `Chamado importado do sistema antigo (#${ticket.issueId})`,
        ticket.symptom ? `Problema: ${ticket.symptom}` : null,
        ticket.firstName ? `Local: ${ticket.firstName}` : null,
        ticket.lastName ? `Descricao: ${ticket.lastName}` : null,
        ticket.employeeId ? `Funcionario ID: ${ticket.employeeId}` : null,
        ticket.department ? `Categoria original: ${ticket.department}` : null,
      ].filter(Boolean);
      const description = descParts.join(' | ');
      const dateStr = resolvedDate ? `${resolvedDate}T12:00:00+00:00` : new Date().toISOString();

      lines.push(`INSERT INTO tickets (requester_id, title, description, status, priority, category_id, subcategory, assigned_to, department_id, location, phone, asset_id, created_at, resolved_at, closed_at, updated_at) SELECT`);
      lines.push(`  '${ADMIN_UUID}', ${escapeSql(title)}, ${escapeSql(description)}, 'closed', 'medium', (SELECT id FROM ticket_categories WHERE name = ${escapeSql(cat.name)} LIMIT 1), ${escapeSql(ticket.lastName)}, '${ADMIN_UUID}', (SELECT id FROM departments WHERE name = ${escapeSql(department)} LIMIT 1), ${escapeSql(location)}, NULL, NULL, '${dateStr}', '${dateStr}', '${dateStr}', '${dateStr}'`);
      lines.push(`WHERE NOT EXISTS (SELECT 1 FROM tickets WHERE title = ${escapeSql(title)});`);
      lines.push('');
    }
    files.push({ name: `02-tickets-${fileIndex}.sql`, content: lines.join('\n') });
  }

  const finalLines = [];
  finalLines.push('-- ============================================');
  finalLines.push('-- PASSO 3: Reset da sequencia');
  finalLines.push('-- ============================================');
  finalLines.push('');
  finalLines.push(`SELECT setval('tickets_ticket_number_seq', (SELECT COALESCE(MAX(ticket_number), 0) FROM tickets) + 1);`);
  finalLines.push('');
  finalLines.push('-- Verificacao final:');
  finalLines.push('-- SELECT COUNT(*) FROM tickets;');
  finalLines.push('-- SELECT status, COUNT(*) FROM tickets GROUP BY status;');
  finalLines.push('-- SELECT category_id, COUNT(*) FROM tickets GROUP BY category_id ORDER BY count DESC;');
  files.push({ name: '03-finalize.sql', content: finalLines.join('\n') });

  return files;
}

function main() {
  console.log('=== Historical Ticket Import Script ===\n');
  const ticketsHtml = readFile('Tickets.html');
  const symptomsHtml = readFile('Symptoms.html');
  const techniciansHtml = readFile('Technicians.html');

  console.log('\nParsing data...');
  const tickets = parseTickets(ticketsHtml);
  const symptoms = parseSymptoms(symptomsHtml);
  const technicians = parseTechnicians(techniciansHtml);

  console.log(`\n=== Data Summary ===`);
  console.log(`Tickets found: ${tickets.length}`);
  console.log(`Symptom types: ${symptoms.length}`);
  console.log(`Technicians: ${technicians.length}`);

  const uniqueLocations = [...new Set(tickets.map(t => t.firstName))].filter(Boolean);
  const uniqueSymptoms = [...new Set(tickets.map(t => t.symptom))].filter(Boolean);
  const uniqueDepts = [...new Set(tickets.map(t => t.department))].filter(Boolean);

  console.log(`\nUnique locations: ${uniqueLocations.length}`);
  console.log(`Unique symptoms: ${uniqueSymptoms.length}`);
  console.log(`Unique departments: ${uniqueDepts.length}`);

  const dates = tickets.map(t => parseDate(t.dateResolved)).filter(Boolean).sort();
  if (dates.length > 0) console.log(`\nDate range: ${dates[0]} to ${dates[dates.length - 1]}`);

  const catCounts = {};
  for (const ticket of tickets) {
    const cat = matchCategory(ticket.symptom, ticket.department);
    catCounts[cat.name] = (catCounts[cat.name] || 0) + 1;
  }
  console.log('\nCategory distribution:');
  Object.entries(catCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${v}x ${k}`));

  console.log('\nGenerating SQL files...');
  const files = generateSQL(tickets);

  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file.name);
    fs.writeFileSync(filePath, file.content, 'utf-8');
    const sizeKB = Math.round(Buffer.byteLength(file.content, 'utf-8') / 1024);
    console.log(`  ${file.name} (${sizeKB}KB)`);
  }

  console.log(`\nSQL files generated in: ${OUTPUT_DIR}`);
  console.log('\n=== Next Steps ===');
  console.log('Execute em ordem no Supabase SQL Editor: 01-setup, 02-tickets-*, 03-finalize');
}

main();
