/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Code2,
  Cpu,
  Eye,
  EyeOff,
  FileText,
  Info,
  Key,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Terminal,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface JobLog {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

interface GuidanceDraft {
  markdown: string;
  updatedAt: string | null;
}

interface StartResultItem {
  platform: string;
  job: {
    title: string;
    company: string;
    location: string;
    salary: string;
    description: string;
    link: string;
    tags: string[];
  };
  decision: {
    should_apply: boolean;
    reason: string;
    matched_rules: string[];
    rejected_by: string | null;
  };
}

interface StartResponse {
  message?: string;
  status?: string;
  success?: boolean;
  logs?: Array<{ level: string; message: string }>;
  search_intent?: {
    keywords: string[];
    cities: string[];
    salary_range_text?: string | null;
    target_directions?: string[];
  };
  results?: StartResultItem[];
}

interface RuntimeSettings {
  webhookEnabled: boolean;
  webhookUrl: string;
  apiBaseUrl: string;
  aiModel: string;
  apiKey: string;
}

interface BossCookieStatus {
  hasCookie: boolean;
  updatedAt: string | null;
  sessionValid: boolean;
  status: string;
  message: string;
  authDir: string;
}

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [activePlatform, setActivePlatform] = useState('boss');
  const [selectedCities, setSelectedCities] = useState(['深圳']);
  const [activeTab, setActiveTab] = useState('search');

  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [guidanceDraft, setGuidanceDraft] = useState<GuidanceDraft>({ markdown: '', updatedAt: null });
  const [savedGuidance, setSavedGuidance] = useState<GuidanceDraft>({ markdown: '', updatedAt: null });
  const [guidanceMode, setGuidanceMode] = useState<'split' | 'preview'>('preview');
  const [isSavingGuidance, setIsSavingGuidance] = useState(false);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(true);
  const [runResults, setRunResults] = useState<StartResultItem[]>([]);
  const [lastIntent, setLastIntent] = useState<StartResponse['search_intent'] | null>(null);
  const [bossCookieStatus, setBossCookieStatus] = useState<BossCookieStatus | null>(null);
  const [isRefreshingCookie, setIsRefreshingCookie] = useState(false);
  const [queryOverride, setQueryOverride] = useState('Agent');

  const platforms = [{ id: 'boss', name: 'BOSS直聘' }];

  const cityOptions = ['深圳', '广州', '珠海', '重庆'];
  const guidanceDirty = JSON.stringify(guidanceDraft) !== JSON.stringify(savedGuidance);

  const guidancePreviewContent = useMemo(() => {
    return guidanceDraft.markdown.trim() || '# 投递评价';
  }, [guidanceDraft]);

  const stats = useMemo(() => {
    const total = runResults.length;
    const matched = runResults.filter((item) => item.decision.should_apply).length;
    const rejected = total - matched;
    const matchRate = total ? `${Math.round((matched / total) * 100)}%` : '0%';
    return { total, matched, rejected, matchRate };
  }, [runResults]);

  useEffect(() => {
    void loadGuidance();
    void loadSettings();
    void loadBossCookieStatus();
  }, []);

  const addLog = (message: string, type: JobLog['type'] = 'info') => {
    const newLog: JobLog = {
      id: Math.random().toString(36).slice(2, 11),
      time: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 80));
  };

  const loadGuidance = async () => {
    setIsGuidanceLoading(true);
    try {
      const response = await fetch('/api/profile-center/guidance');
      const data = (await response.json()) as GuidanceDraft;
      setGuidanceDraft(data);
      setSavedGuidance(data);
      addLog('已从服务端加载投递岗位标准', 'success');
    } catch (error) {
      console.error(error);
      addLog('加载投递岗位标准失败', 'error');
    } finally {
      setIsGuidanceLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = (await response.json()) as RuntimeSettings;
      setWebhookEnabled(data.webhookEnabled);
      setWebhookUrl(data.webhookUrl);
      setApiBaseUrl(data.apiBaseUrl);
      setAiModel(data.aiModel);
      setApiKey(data.apiKey);
      addLog('已加载运行配置', 'success');
    } catch (error) {
      console.error(error);
      addLog('加载运行配置失败', 'error');
    }
  };

  const loadBossCookieStatus = async () => {
    try {
      const response = await fetch('/api/boss/cookie-status');
      const data = (await response.json()) as BossCookieStatus;
      setBossCookieStatus(data);
    } catch (error) {
      console.error(error);
      addLog('加载 BOSS Cookie 状态失败', 'error');
    }
  };

  const refreshBossCookie = async () => {
    setIsRefreshingCookie(true);
    addLog('正在打开 BOSS 登录页，请手动获取 Cookie...', 'info');
    try {
      const response = await fetch('/api/boss/cookie/refresh', { method: 'POST' });
      const data = (await response.json()) as { success: boolean; payload?: StartResponse; status?: BossCookieStatus; message?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? '获取 Cookie 失败');
      }
      if (data.payload?.logs?.length) {
        for (const item of data.payload.logs) {
          addLog(item.message, item.level === 'success' || item.level === 'warn' || item.level === 'error' ? item.level : 'info');
        }
      }
      if (data.status) {
        setBossCookieStatus(data.status);
      } else {
        await loadBossCookieStatus();
      }
      addLog('BOSS Cookie 已刷新', 'success');
    } catch (error) {
      console.error(error);
      addLog(error instanceof Error ? error.message : '获取 Cookie 失败', 'error');
    } finally {
      setIsRefreshingCookie(false);
    }
  };

  const clearBossCookie = async () => {
    try {
      await fetch('/api/boss/cookie', { method: 'DELETE' });
      await loadBossCookieStatus();
      addLog('已清除本地 BOSS Cookie', 'warn');
    } catch (error) {
      console.error(error);
      addLog('清除 BOSS Cookie 失败', 'error');
    }
  };

  const toggleBot = async () => {
    if (isRunning) {
      setIsRunning(false);
      addLog('当前轮次已标记为停止', 'warn');
      return;
    }

    setIsRunning(true);
    setRunResults([]);
    setLastIntent(null);
    addLog('正在启动真实后端检索链...', 'info');

    try {
      const response = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: [activePlatform],
          cities: selectedCities,
          queryOverride: queryOverride.trim() || undefined,
        }),
      });

      const data = (await response.json()) as StartResponse;
      const backendLogs = (data.logs ?? []).map((item) => ({
        id: Math.random().toString(36).slice(2, 11),
        time: new Date().toLocaleTimeString(),
        type: (item.level === 'success' || item.level === 'warn' || item.level === 'error' ? item.level : 'info') as JobLog['type'],
        message: item.message,
      }));
      setLogs((prev) => [...backendLogs.reverse(), ...prev].slice(0, 80));
      if (!response.ok || data.success === false) {
        throw new Error(data.message ?? '后端执行失败');
      }

      const results = data.results ?? [];
      setRunResults(results);
      setLastIntent(data.search_intent ?? null);

      addLog(data.message ?? '后端执行完成', 'success');
      if (data.search_intent) {
        addLog(`实际搜索关键词：${data.search_intent.keywords.join(' / ')}`, 'info');
        addLog(`实际搜索城市：${data.search_intent.cities.join(' / ')}`, 'info');
      }

      for (const item of results.slice(0, 12)) {
        const base = `${item.job.title} @ ${item.job.company} (${item.job.location} ${item.job.salary})`;
        if (item.decision.should_apply) {
          addLog(`建议投递：${base}｜${item.decision.reason}`, 'success');
        } else {
          addLog(`过滤岗位：${base}｜${item.decision.reason}`, 'warn');
        }
      }

      if (results.length === 0) {
        addLog('本轮没有返回任何岗位结果', 'warn');
      }
    } catch (error) {
      console.error(error);
      addLog(error instanceof Error ? error.message : '启动机器人失败', 'error');
    } finally {
      setIsRunning(false);
      await loadBossCookieStatus();
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookEnabled,
          webhookUrl,
          apiBaseUrl,
          aiModel,
          apiKey,
        }),
      });
      const data = (await response.json()) as { settings: RuntimeSettings };
      setWebhookEnabled(data.settings.webhookEnabled);
      setWebhookUrl(data.settings.webhookUrl);
      setApiBaseUrl(data.settings.apiBaseUrl);
      setAiModel(data.settings.aiModel);
      setApiKey(data.settings.apiKey);
      addLog('运行配置已保存到服务端', 'success');
    } catch (error) {
      console.error(error);
      addLog('保存运行配置失败', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveGuidance = async () => {
    setIsSavingGuidance(true);
    try {
      const response = await fetch('/api/profile-center/guidance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: guidanceDraft.markdown }),
      });
      const data = (await response.json()) as { guidance: GuidanceDraft };
      setGuidanceDraft(data.guidance);
      setSavedGuidance(data.guidance);
      addLog('投递岗位标准已保存到服务端', 'success');
    } catch (error) {
      console.error(error);
      addLog('保存投递岗位标准失败', 'error');
    } finally {
      setIsSavingGuidance(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <aside className="fixed left-0 top-0 h-full w-20 border-r border-white/5 bg-[#0d0d0f] flex flex-col items-center py-8 gap-10">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <Briefcase className="w-6 h-6 text-emerald-400" />
        </div>

        <nav className="flex flex-col gap-8 flex-1">
          <NavItem icon={<Search className="w-5 h-5" />} label="职位搜索" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
          <NavItem icon={<Code2 className="w-5 h-5" />} label="环境配置" active={activeTab === 'env'} onClick={() => setActiveTab('env')} />
          <NavItem icon={<Settings2 className="w-5 h-5" />} label="AI 配置" active={activeTab === 'ai-config'} onClick={() => setActiveTab('ai-config')} />
          <NavItem icon={<User className="w-5 h-5" />} label="个人中心" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>
      </aside>

      <main className="ml-20 p-8 max-w-[1600px] mx-auto grid grid-cols-12 gap-8">
        <AnimatePresence mode="wait">
          {activeTab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="col-span-12 grid grid-cols-12 gap-8">
              <header className="col-span-12 flex items-end justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-medium tracking-tight text-white mb-1">
                    AI 找工作助手 <span className="text-emerald-500/80 text-sm font-mono ml-3 border border-emerald-500/20 px-2 py-0.5 rounded-full">测试版</span>
                  </h1>
                  <p className="text-neutral-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    参考 get_jobs 工作流 | 当前仅保留 BOSS直聘
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex bg-[#141417] p-1 rounded-lg border border-white/5 shadow-inner">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => setActivePlatform(platform.id)}
                        className={`px-4 py-1.5 rounded-md text-sm transition-all ${
                          activePlatform === platform.id ? 'bg-neutral-800 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        {platform.name}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={toggleBot}
                    disabled={!bossCookieStatus?.sessionValid || isRefreshingCookie}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                      isRunning
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                        : !bossCookieStatus?.sessionValid || isRefreshingCookie
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                    }`}
                  >
                    {isRunning ? <><Pause className="w-4 h-4 fill-current" /> 检索中</> : <><Play className="w-4 h-4 fill-current" /> 开始检索</>}
                  </button>
                </div>
              </header>

              <section className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <Card title="Cookie 管理" icon={<ShieldCheck className="w-4 h-4 text-amber-400" />}>
                  <div className="space-y-4">
                    <div className="p-3 bg-neutral-800/20 rounded-lg border border-white/5">
                      <span className="text-xs text-neutral-500 block mb-1">当前状态</span>
                      <span className={`text-sm ${bossCookieStatus?.sessionValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {bossCookieStatus?.message ?? '正在检查 Cookie 状态...'}
                      </span>
                      <div className="text-[10px] text-neutral-600 mt-2">
                        {bossCookieStatus?.updatedAt ? `最近刷新 ${formatSavedAt(bossCookieStatus.updatedAt)}` : '还没有可用 Cookie'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest block">手动检索关键词</label>
                      <input
                        type="text"
                        value={queryOverride}
                        onChange={(event) => setQueryOverride(event.target.value)}
                        className="w-full bg-[#0d0d0f] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/30 transition-all text-neutral-300 font-mono"
                        placeholder="例如 Agent"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={refreshBossCookie} disabled={isRefreshingCookie} className="flex-1 px-3 py-2 rounded-lg bg-amber-500 text-black text-sm font-medium disabled:opacity-60">
                        {isRefreshingCookie ? '获取中...' : bossCookieStatus?.hasCookie ? '重新获取 Cookie' : '获取 Cookie'}
                      </button>
                      <button onClick={clearBossCookie} className="px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-sm font-medium border border-white/5">
                        清除
                      </button>
                    </div>

                    <p className="text-[10px] text-neutral-600 leading-5">
                      没有 Cookie 或 Cookie 过期时，请先手动点击“获取 Cookie”，完成登录/安全验证后再开始检索。
                    </p>
                  </div>
                </Card>

                <Card title="搜索筛选器" icon={<Search className="w-4 h-4 text-emerald-400" />}>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2 block">职位关键词</label>
                      <div className="flex flex-wrap gap-2">
                        {(lastIntent?.keywords?.length ? lastIntent.keywords : ['Java', 'Python', 'Agent']).map((keyword) => (
                          <span key={keyword} className="px-3 py-1 bg-neutral-800/50 rounded-md border border-white/5 text-xs text-neutral-300 flex items-center gap-1.5">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2 block">目标城市 (可多选)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {cityOptions.map((city) => (
                          <CityToggle key={city} name={city} active={selectedCities.includes(city)} onClick={() => setSelectedCities((prev) => (prev.includes(city) ? prev.filter((item) => item !== city) : [...prev, city]))} />
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="AI 分析概览" icon={<Cpu className="w-4 h-4 text-blue-400" />}>
                  <div className="space-y-4">
                    <div className="p-3 bg-neutral-800/20 rounded-lg border border-white/5">
                      <span className="text-xs text-neutral-500 block mb-1">当前匹配策略</span>
                      <span className="text-sm text-neutral-200">投递岗位标准驱动 + 规则判断 + AI 补充分析</span>
                    </div>
                    <div className="text-xs text-neutral-600 italic">
                      {lastIntent?.salary_range_text ? `当前薪资约束：${lastIntent.salary_range_text}` : '"系统将按照投递岗位标准评估每个 JD。"' }
                    </div>
                  </div>
                </Card>
              </section>

              <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                <div className="flex-1 bg-[#111114] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                  <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-800 rounded-lg border border-white/10">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h2 className="text-sm font-medium text-white tracking-wide uppercase">实时活动日志</h2>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[10px] text-neutral-600">
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> 真实后端</span>
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-neutral-700 rounded-full" /> 平台: BOSS</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-3 bg-[#0d0d0f] custom-scrollbar h-[400px]">
                    {logs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-neutral-700 select-none">
                        <Terminal className="w-12 h-12 mb-4 opacity-10" />
                        <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-40">系统空闲：等待启动</p>
                      </div>
                    ) : (
                      logs.map((log) => (
                        <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4 group">
                          <span className="text-neutral-700 whitespace-nowrap opacity-60">[{log.time}]</span>
                          <LogTypeBadge type={log.type} />
                          <span className={`flex-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-400' : 'text-neutral-400'}`}>{log.message}</span>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-xs font-mono text-neutral-600">
                    <span className="uppercase tracking-widest flex items-center gap-2">
                      <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
                      {isRunning ? '后端执行中...' : '待命'}
                    </span>
                    <span className="text-[10px] opacity-40">自动滚动已启用</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <StatCard label="抓取岗位" value={String(stats.total)} sub={lastIntent ? `城市 ${lastIntent.cities.join('/')}` : '等待执行'} />
                  <StatCard label="建议投递" value={String(stats.matched)} sub={`通过率 ${stats.matchRate}`} />
                  <StatCard label="过滤岗位" value={String(stats.rejected)} sub={stats.total ? '来自真实后端判断' : '等待执行'} />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'env' && (
            <motion.div key="env" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="col-span-12 space-y-8">
              <div className="flex items-center justify-between p-6 bg-[#111114] border border-white/5 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <Code2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-medium text-white">环境变量配置</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">运行配置将持久化到本地服务端</p>
                  </div>
                </div>
                <button onClick={saveSettings} disabled={isSavingSettings} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-60">
                  <Save className="w-4 h-4" /> 保存配置
                </button>
              </div>

              <div className="space-y-6">
                <Card title="企业微信 Webhook" icon={<MessageSquare className="w-4 h-4 text-emerald-400" />}>
                  <div className="space-y-6">
                    <p className="text-xs text-neutral-500 -mt-2">配置企业微信群机器人，用于接收通知消息</p>
                    <div className="flex items-center">
                      <button onClick={() => setWebhookEnabled(!webhookEnabled)} className={`w-12 h-6 flex items-center rounded-full transition-all px-1 ${webhookEnabled ? 'bg-emerald-500/30' : 'bg-neutral-800'}`}>
                        <div className={`w-4 h-4 rounded-full transition-all ${webhookEnabled ? 'translate-x-6 bg-emerald-500' : 'bg-neutral-600'}`} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Webhook URL</label>
                      <input type="text" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} className="w-full bg-[#0d0d0f] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all text-neutral-300 font-mono" placeholder="https://qyapi.weixin.qq.com/..." />
                      <p className="text-[10px] text-neutral-600">企业微信群机器人 webhook 地址，用于接收通知消息</p>
                    </div>
                  </div>
                </Card>

                <Card title="API 配置" icon={<Code2 className="w-4 h-4 text-blue-400" />}>
                  <div className="space-y-6">
                    <p className="text-xs text-neutral-500 -mt-2">配置 API 服务器地址和使用的 AI 模型</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">API Base URL</label>
                        <input type="text" value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} className="w-full bg-[#0d0d0f] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 transition-all text-neutral-300 font-mono" />
                        <p className="text-[10px] text-neutral-600">API 服务器地址</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">AI 模型</label>
                        <input type="text" value={aiModel} onChange={(event) => setAiModel(event.target.value)} className="w-full bg-[#0d0d0f] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 transition-all text-neutral-300 font-mono" />
                        <p className="text-[10px] text-neutral-600">使用的 AI 模型名称</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="API 密钥" icon={<Key className="w-4 h-4 text-amber-500" />}>
                  <div className="space-y-6">
                    <p className="text-xs text-neutral-500 -mt-2">配置 API 访问密钥，请妥善保管</p>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">API Key</label>
                      <div className="relative">
                        <input type={showApiKey ? 'text' : 'password'} value={apiKey} onChange={(event) => setApiKey(event.target.value)} className="w-full bg-[#0d0d0f] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/30 transition-all text-neutral-300 pr-20 font-mono" />
                        <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors text-[10px] flex items-center gap-1.5 font-mono uppercase tracking-widest">
                          {showApiKey ? <><EyeOff className="w-3.5 h-3.5" /> 隐藏</> : <><Eye className="w-3.5 h-3.5" /> 显示</>}
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" /> API 密钥将被安全存储，请妥善保管
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-400 shrink-0" />
                  <p className="text-sm text-blue-200/80">
                    <span className="font-bold mr-2 text-white">提示：</span>
                    这些运行配置会保存到本地服务端文件中，启动抓取时会注入后端执行链。请不要把包含密钥的数据文件提交到版本控制系统。
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai-config' && (
            <motion.div key="ai-config" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="col-span-12">
              <h1 className="text-3xl font-medium tracking-tight text-white mb-8">AI 配置中心</h1>
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-6">
                  <Card title="模型参数设置" icon={<Cpu className="w-4 h-4 text-blue-400" />}>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-neutral-800/20 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-base font-medium text-neutral-200">当前分析方式</span>
                          <span className="text-xs text-neutral-500 mt-1">默认先跑规则判断，配置 AI 后再补充语义判断</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg shadow-lg">规则 + AI</button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3 block text-center border-b border-white/5 pb-2">匹配敏感度 (Temperature)</label>
                        <input type="range" className="w-full accent-emerald-500" />
                        <div className="flex justify-between text-[10px] font-mono text-neutral-600 mt-2 lowercase">
                          <span>Strict (更严谨)</span>
                          <span>Creative (更开放)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-mono text-neutral-500 uppercase">最大 Token 限制</label>
                          <input type="number" defaultValue={2048} className="w-full bg-neutral-900 border border-white/5 rounded-lg p-2.5 text-sm text-neutral-300 focus:border-emerald-500/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-mono text-neutral-500 uppercase">回复语气</label>
                          <select className="w-full bg-neutral-900 border border-white/5 rounded-lg p-2.5 text-sm text-neutral-300 focus:border-blue-500/50 outline-none">
                            <option>专业/正式</option>
                            <option>积极/热情</option>
                            <option>简练/高效</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="col-span-4 space-y-6">
                  <Card title="成本监控" icon={<RefreshCw className="w-4 h-4 text-emerald-400" />}>
                    <div className="space-y-4">
                      <div className="h-40 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                        <span className="text-xs font-mono text-neutral-700">Cost Chart Placeholder</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">本月累计消耗</span>
                        <span className="text-white font-mono">{runResults.length ? 'Active' : '$0.00'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="col-span-12">
              <div className="flex items-end justify-between gap-6 mb-8">
                <div>
                  <h1 className="text-3xl font-medium tracking-tight text-white">个人中心</h1>
                  <p className="text-sm text-neutral-500 mt-2">这里只保留一份投递评价 Markdown 文档。</p>
                </div>
              </div>

              <Card title="投递评价" icon={<FileText className="w-4 h-4 text-orange-400" />}>
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl border border-white/5 bg-neutral-900/40">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-neutral-100">投递岗位标准.md</div>
                        <div className="text-[11px] text-neutral-500 mt-1">
                          {guidanceDraft.updatedAt ? `最近更新 ${formatSavedAt(guidanceDraft.updatedAt)}` : isGuidanceLoading ? '加载中...' : '还没有保存过'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setGuidanceMode('split')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${guidanceMode === 'split' ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                          编辑模式
                        </button>
                        <button onClick={() => setGuidanceMode('preview')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${guidanceMode === 'preview' ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                          只看预览
                        </button>
                        <button
                          onClick={saveGuidance}
                          disabled={!guidanceDirty || isSavingGuidance}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            guidanceDirty && !isSavingGuidance ? 'bg-neutral-100 text-black hover:bg-white' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          {isSavingGuidance ? '保存中...' : '保存 Markdown'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`grid gap-4 ${guidanceMode === 'split' ? 'xl:grid-cols-2' : 'grid-cols-1'}`}>
                    {guidanceMode === 'split' && (
                      <div className="rounded-2xl border border-white/5 bg-[#0d0d0f] overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">Markdown 编辑器</div>
                            <div className="text-[11px] text-neutral-500 mt-1">在线编辑并保存。</div>
                          </div>
                          <button
                            onClick={saveGuidance}
                            disabled={!guidanceDirty || isSavingGuidance}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              guidanceDirty && !isSavingGuidance ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            }`}
                          >
                            {isSavingGuidance ? '保存中...' : '保存'}
                          </button>
                        </div>
                        <textarea
                          value={guidanceDraft.markdown}
                          onChange={(event) => setGuidanceDraft((prev) => ({ ...prev, markdown: event.target.value }))}
                          placeholder="在这里写 Markdown 内容。"
                          className="w-full h-[560px] bg-transparent p-5 text-sm text-neutral-300 font-mono leading-7 focus:outline-none resize-none custom-scrollbar"
                        />
                      </div>
                    )}

                    <div className="rounded-2xl border border-white/5 bg-[#0d0d0f] overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5">
                        <div className="text-sm font-medium text-white">Markdown 预览</div>
                        <div className="text-[11px] text-neutral-500 mt-1">实时预览。</div>
                      </div>
                      <div className="h-[560px] overflow-y-auto px-6 py-5 custom-scrollbar">
                        <div className="markdown-preview">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{guidancePreviewContent}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-xl transition-all relative group ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}>
      {icon}
      {active && <motion.div layoutId="nav-active" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
      <span className="absolute left-16 bg-[#1a1a1f] text-white text-[10px] px-2 py-1 rounded border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest font-mono">{label}</span>
    </button>
  );
}

function Card({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-neutral-800 rounded-lg border border-white/10">{icon}</div>
        <h2 className="text-sm font-medium text-white tracking-wide uppercase">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function CityToggle({ name, active = false, onClick }: { name: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left flex items-center justify-between group ${active ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-neutral-800/10 border-white/5 text-neutral-500 hover:border-white/10 hover:text-neutral-400'}`}>
      {name}
      <div className={`w-1.5 h-1.5 rounded-full transition-all ${active ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-neutral-700 group-hover:bg-neutral-600'}`} />
    </button>
  );
}

function LogTypeBadge({ type }: { type: JobLog['type'] }) {
  const colors = {
    info: 'bg-neutral-800 text-neutral-500 border-neutral-700',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    warn: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    error: 'bg-red-500/10 text-red-500 border-red-500/30',
  };

  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border uppercase tracking-tighter ${colors[type]}`}>{type}</span>;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/20 transition-all shadow-xl">
      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{label}</span>
      <div className="mt-2 mb-1 text-3xl font-medium text-white group-hover:text-emerald-400 transition-colors">{value}</div>
      <span className={`text-[10px] font-medium ${sub.includes('%') || sub.includes('+') ? 'text-emerald-500/70' : 'text-neutral-600'}`}>{sub}</span>
    </div>
  );
}

function formatSavedAt(value: string) {
  const date = new Date(value);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
