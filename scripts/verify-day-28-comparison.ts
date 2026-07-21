import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

interface CommandResult {
  readonly exitCode: number | null;
  readonly output: string;
}

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(currentDirectory, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const legacyLocator = "getByRole('button', { name: '搜尋活動', exact: true })";
const evidenceDirectory = path.join(projectDirectory, 'docs', 'evidence', 'assets');
const day5FailureOutputPath = path.join(evidenceDirectory, 'day-28-day-05-failure.txt');

const day5Result = await runCommand('Day 5 原始 Playwright 實驗', [
  'run',
  'test:browser:button-copy'
]);

if (day5Result.exitCode === 0) {
  throw new Error('Day 5 原始 Playwright 實驗意外成功，無法證明按鈕文案相依性。');
}

if (!day5Result.output.includes(legacyLocator)) {
  throw new Error('Day 5 實驗雖然失敗，但不是因為預期的「搜尋活動」按鈕 locator。');
}

await mkdir(evidenceDirectory, { recursive: true });
await writeEvidenceIfChanged(day5FailureOutputPath, normalizeProjectPath(day5Result.output));

const toolResult = await runCommand('Day 28 正式 Tool 直接執行', [
  'run',
  'test:day-28:tool'
]);

if (toolResult.exitCode !== 0) {
  throw new Error('Day 28 正式 Tool 直接執行失敗。');
}

const browserResult = await runCommand('Day 28 並列視覺驗證', [
  'run',
  'test:day-28:browser'
]);

if (browserResult.exitCode !== 0) {
  throw new Error('Day 28 並列視覺驗證失敗。');
}

console.log(JSON.stringify({
  day5OriginalExperiment: {
    expectedFailure: true,
    legacyLocator
  },
  formalToolDirectInvocation: {
    query: '前端',
    expectedEventId: 'event-frontend-summit'
  },
  savedFailureOutput: day5FailureOutputPath,
  boundary: 'Tool contract 不依賴按鈕文案；此驗證不是原生 Agent 執行，也不代表 WebMCP 取代 UI 測試。'
}, null, 2));

async function runCommand(label: string, args: readonly string[]): Promise<CommandResult> {
  const command = process.platform === 'win32'
    ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `${npmCommand} ${args.join(' ')}`], {
        cwd: projectDirectory,
        shell: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      })
    : spawn(npmCommand, args, {
    cwd: projectDirectory,
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';

  command.stdout.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  command.stderr.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });

  const exitCode = await new Promise<number | null>((resolve, reject) => {
    command.once('error', reject);
    command.once('close', resolve);
  });

  console.log(`\n===== ${label} =====\n${output.trim()}\n`);

  return { exitCode, output };
}

function normalizeProjectPath(output: string): string {
  // Playwright 的 error context 會帶入目前 clone 的絕對路徑；讀者快照必須跨 clone 路徑保持相同內容。
  return output.replaceAll(projectDirectory, '<project>');
}

async function writeEvidenceIfChanged(evidencePath: string, content: string): Promise<void> {
  try {
    const existingContent = await readFile(evidencePath, 'utf8');

    if (normalizeLineEndings(existingContent) === normalizeLineEndings(content)) {
      return;
    }
  } catch {
    // 第一次建立 reader evidence 時，尚未有可比較的檔案。
  }

  await writeFile(evidencePath, content, 'utf8');
}

function normalizeLineEndings(content: string): string {
  return content.replaceAll('\r\n', '\n');
}
