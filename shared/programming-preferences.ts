/**
 * Programming mode preferences
 *
 * 控制编程 Tab 的 AI 辅助行为、模型偏好、终端自动确认等。
 * 通过 `GET/PUT /api/preferences/programming` 读写，持久化到 preferences.json。
 */

export interface ProgrammingPreferences {
  /** 是否启用 AI 编程辅助（关闭后编程 Tab 仍可用，但 Agent 不会主动提供代码建议） */
  aiAssistEnabled: boolean;
  /** 编程模型偏好（provider/modelId 字符串，'' 表示自动选择） */
  codingModel: string;
  /** 终端命令自动确认（默认 false，启用后 Agent 执行的 shell 命令不再逐条请求用户确认） */
  autoConfirmTerminal: boolean;
}

const DEFAULT_PREFS: ProgrammingPreferences = Object.freeze({
  aiAssistEnabled: true,
  codingModel: '',
  autoConfirmTerminal: false,
});

export const PROGRAMMING_PREFERENCES_DEFAULTS: Readonly<ProgrammingPreferences> = DEFAULT_PREFS;

export function normalizeProgrammingPreferences(value: unknown = {}): ProgrammingPreferences {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
  return {
    aiAssistEnabled: source.aiAssistEnabled !== false,
    codingModel: typeof source.codingModel === 'string' ? source.codingModel : '',
    autoConfirmTerminal: source.autoConfirmTerminal === true,
  };
}

export function mergeProgrammingPreferences(
  existing: unknown = {},
  patch: unknown = {},
): ProgrammingPreferences {
  return normalizeProgrammingPreferences({
    ...normalizeProgrammingPreferences(existing),
    ...(patch && typeof patch === 'object' && !Array.isArray(patch) ? patch : {}),
  });
}