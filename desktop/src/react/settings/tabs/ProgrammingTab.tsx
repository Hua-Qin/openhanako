/**
 * ProgrammingTab — 编程模式设置面板
 *
 * 设置项：
 *   - AI 编程辅助开关（编程 Tab 是否启用 AI 代码建议）
 *   - 编程模型偏好（coding 类 provider 优先，''=自动）
 *   - 终端命令自动确认（Agent 执行的 shell 命令是否逐条确认）
 *
 * 通过 `GET/PUT /api/preferences/programming` 读写，由 Settings store 缓存。
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSettingsStore } from '../store';
import { hanaFetch } from '../api';
import { t } from '../helpers';
import { updateSettingsSnapshot } from '../actions';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Toggle } from '../widgets/Toggle';
import { SelectWidget } from '../widgets/SelectWidget';
import {
  normalizeProgrammingPreferences,
  type ProgrammingPreferences,
} from '../../../../../shared/programming-preferences.ts';
import styles from '../Settings.module.css';

/**
 * 编程专用 provider 列表（来自 lib/providers/*-coding.ts）
 * - dashscope-coding (百炼 Coding Plan)
 * - kimi-coding       (Kimi Code)
 * - zhipu-coding      (Zhipu GLM Coding)
 * - volcengine-coding (火山引擎 Coding)
 * - opencode-go       (OpenCode Go)
 * - copilot           (GitHub Copilot，作为补充)
 */
const CODING_PROVIDER_PRESETS: Array<{ value: string; label: string }> = [
  { value: 'dashscope-coding/qwen3-coder-plus', label: '百炼 Coding Plan · qwen3-coder-plus' },
  { value: 'kimi-coding/kimi-k2-0905-preview', label: 'Kimi Code · kimi-k2' },
  { value: 'zhipu-coding/glm-4.6', label: 'Zhipu GLM Coding · glm-4.6' },
  { value: 'volcengine-coding/doubao-seed-code', label: '火山引擎 Coding · doubao-seed-code' },
  { value: 'opencode-go/anthropic-claude-sonnet-4', label: 'OpenCode Go · claude-sonnet-4' },
];

export function ProgrammingTab() {
  const snapshotProgramming = useSettingsStore(s => s.settingsSnapshot.data?.preferences?.programming);
  const showToast = useSettingsStore(s => s.showToast);

  const [prefs, setPrefs] = useState<ProgrammingPreferences | null>(() => {
    const snap = useSettingsStore.getState().settingsSnapshot.data?.preferences?.programming;
    return snap ? normalizeProgrammingPreferences(snap) : null;
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (snapshotProgramming) {
      setPrefs(normalizeProgrammingPreferences(snapshotProgramming));
      return undefined;
    }
    let alive = true;
    hanaFetch('/api/preferences/programming')
      .then(res => res.json())
      .then((data) => {
        if (!alive) return;
        setPrefs(normalizeProgrammingPreferences(data?.programming));
      })
      .catch((err) => {
        if (!alive) return;
        showToast(t('settings.saveFailed') + ': ' + (err?.message || String(err)), 'error');
      });
    return () => {
      alive = false;
    };
  }, [showToast, snapshotProgramming]);

  const saveProgrammingPreferences = useCallback(async (patch: Partial<ProgrammingPreferences>) => {
    if (!prefs) return;
    const previous = prefs;
    const next = normalizeProgrammingPreferences({ ...prefs, ...patch });
    setPrefs(next);
    setSaving(true);
    try {
      const res = await hanaFetch('/api/preferences/programming', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.programming) {
        updateSettingsSnapshot({
          preferences: { programming: data.programming },
        });
        setPrefs(normalizeProgrammingPreferences(data.programming));
      }
    } catch (err) {
      setPrefs(previous);
      showToast(t('settings.saveFailed') + ': ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setSaving(false);
    }
  }, [prefs, showToast]);

  const modelOptions = useMemo(() => {
    return [
      { value: '', label: t('settings.programming.modelAuto', { defaultValue: '自动（跟随场景）' }) },
      ...CODING_PROVIDER_PRESETS,
    ];
  }, []);

  if (!prefs) {
    return (
      <div className={styles['settings-loading']}>
        <span>{t('settings.loading', { defaultValue: '加载中...' })}</span>
      </div>
    );
  }

  return (
    <div className={styles['settings-tab-pane']}>
      <SettingsSection
        title={t('settings.programming.aiAssistSection', { defaultValue: 'AI 编程辅助' })}
        description={t('settings.programming.aiAssistDesc', {
          defaultValue: '在编程模式下启用 AI 代码建议、代码解释和智能修复能力。',
        })}
      >
        <SettingsRow
          label={t('settings.programming.aiAssistLabel', { defaultValue: '启用 AI 编程辅助' })}
          description={t('settings.programming.aiAssistHint', {
            defaultValue: '关闭后编程 Tab 仍可使用，但 AI 不会主动建议代码修改。',
          })}
        >
          <Toggle
            checked={prefs.aiAssistEnabled}
            disabled={saving}
            onChange={(on) => saveProgrammingPreferences({ aiAssistEnabled: on })}
          />
        </SettingsRow>

        <SettingsRow
          label={t('settings.programming.modelPreferenceLabel', { defaultValue: '编程模型偏好' })}
          description={t('settings.programming.modelPreferenceHint', {
            defaultValue: '优先使用 coding 类 provider（dashscope-coding / kimi-coding / zhipu-coding / volcengine-coding / opencode-go）。',
          })}
        >
          <SelectWidget
            value={prefs.codingModel}
            options={modelOptions}
            disabled={saving}
            onChange={(v) => saveProgrammingPreferences({ codingModel: v })}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title={t('settings.programming.terminalSection', { defaultValue: '终端与执行' })}
        description={t('settings.programming.terminalDesc', {
          defaultValue: '控制 Agent 在编程模式下执行 shell 命令的确认策略。',
        })}
      >
        <SettingsRow
          label={t('settings.programming.autoConfirmTerminalLabel', { defaultValue: '终端命令自动确认' })}
          description={t('settings.programming.autoConfirmTerminalHint', {
            defaultValue: '启用后 Agent 执行的 shell 命令不再逐条请求确认。⚠️ 关闭更安全。',
          })}
        >
          <Toggle
            checked={prefs.autoConfirmTerminal}
            disabled={saving}
            onChange={(on) => saveProgrammingPreferences({ autoConfirmTerminal: on })}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}