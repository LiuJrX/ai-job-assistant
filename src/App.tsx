/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { 
  Briefcase, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Play, 
  Pause, 
  Settings, 
  Settings2,
  User,
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
  LogOut,
  ChevronRight,
  Code2,
  ExternalLink,
  MessageSquare,
  Key,
  Info,
  Save,
  Eye,
  EyeOff,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JobLog {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [activePlatform, setActivePlatform] = useState('boss');
  const [selectedCities, setSelectedCities] = useState(['深圳']);
  const [activeTab, setActiveTab] = useState('search');
  
  // Environment Config States
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=yourkeys');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.ruyun.fun');
  const [aiModel, setAiModel] = useState('gpt-5-nano-2025-08-07');
  const [apiKey, setApiKey] = useState('sk-....................');
  const [showApiKey, setShowApiKey] = useState(false);
  
  const platforms = [
    { id: 'boss', name: 'BOSS直聘', color: 'text-emerald-400' },
    { id: 'liepin', name: '猎聘', color: 'text-orange-400' },
    { id: 'zhipin', name: '智联招聘', color: 'text-blue-400' }
  ];

  const cityOptions = ["深圳", "广州", "珠海", "重庆"];

  const addLog = (message: string, type: JobLog['type'] = 'info') => {
    const newLog: JobLog = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const toggleBot = async () => {
    if (!isRunning) {
      setIsRunning(true);
      addLog("正在启动 AI 找工作助手...", "info");
      addLog("正在检测环境：Python (uv) 后端 (模拟)", "info");
      
      try {
        const response = await fetch('/api/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keywords: ["Java", "Python", "Agent"],
            cities: selectedCities,
            platforms: [activePlatform]
          })
        });
        const data = await response.json();
        addLog(data.message, "success");
        
        // Pulse animation effect
        setTimeout(() => addLog(`正在${selectedCities.join('/')}寻找职位...`, "info"), 1000);
        setTimeout(() => addLog("正在分析职位描述：'高级 Java/Python 工程师 (AI Agent 方向)'", "info"), 2500);
        setTimeout(() => addLog("AI 匹配得分: 98/100 (强烈推荐)", "success"), 4000);
        setTimeout(() => addLog("简历投递成功 (已根据 Agent 经历自动优化回复)！", "success"), 5500);
      } catch (err) {
        addLog("启动机器人失败", "error");
        setIsRunning(false);
      }
    } else {
      setIsRunning(false);
      addLog("机器人已停止", "warn");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sidebar (Fixed Navigation) */}
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

        <div className="flex flex-col gap-6 pt-4 border-t border-white/5">
          <NavItem icon={<Settings className="w-5 h-5" />} label="通用设置" />
          <NavItem icon={<LogOut className="w-5 h-5 text-red-400/70" />} label="退出登录" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-20 p-8 max-w-[1600px] mx-auto grid grid-cols-12 gap-8">
        <AnimatePresence mode="wait">
          {activeTab === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-12 grid grid-cols-12 gap-8"
            >
              {/* Header Column */}
              <header className="col-span-12 flex items-end justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-medium tracking-tight text-white mb-1">
                    AI 找工作助手 <span className="text-emerald-500/80 text-sm font-mono ml-3 border border-emerald-500/20 px-2 py-0.5 rounded-full">测试版</span>
                  </h1>
                  <p className="text-neutral-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Python 后端已准备就绪 (uv) | 当前使用 GPT-4 级别模型
                  </p>
                </div>

                <div className="flex items-center gap-4">
                   <div className="flex bg-[#141417] p-1 rounded-lg border border-white/5 shadow-inner">
                     {platforms.map(p => (
                       <button
                          key={p.id}
                          onClick={() => setActivePlatform(p.id)}
                          className={`px-4 py-1.5 rounded-md text-sm transition-all ${activePlatform === p.id ? 'bg-neutral-800 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                       >
                         {p.name}
                       </button>
                     ))}
                   </div>
                   
                   <button 
                     onClick={toggleBot}
                     className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                      isRunning 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                        : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                     }`}
                   >
                     {isRunning ? <><Pause className="w-4 h-4 fill-current" /> 停止服务</> : <><Play className="w-4 h-4 fill-current" /> 开始猎取</>}
                   </button>
                </div>
              </header>

              {/* Configuration Pane */}
              <section className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <Card title="搜索筛选器" icon={<Search className="w-4 h-4 text-emerald-400" />}>
                  <div className="space-y-4">
                     <div>
                       <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2 block">职位关键词</label>
                       <div className="flex flex-wrap gap-2">
                         {["Java", "Python", "Agent"].map(k => (
                           <span key={k} className="px-3 py-1 bg-neutral-800/50 rounded-md border border-white/5 text-xs text-neutral-300 flex items-center gap-1.5 hover:border-emerald-500/30 transition-colors cursor-pointer group">
                             {k} <span className="text-neutral-600 group-hover:text-emerald-500">×</span>
                           </span>
                         ))}
                         <button className="px-3 py-1 border border-dashed border-white/10 rounded-md text-xs text-neutral-600 hover:text-neutral-400 hover:border-white/20 transition-all">+ 新增</button>
                       </div>
                     </div>
                     
                     <div>
                       <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2 block">目标城市 (可多选)</label>
                       <div className="grid grid-cols-2 gap-2">
                         {cityOptions.map(city => (
                           <CityToggle 
                             key={city} 
                             name={city} 
                             active={selectedCities.includes(city)} 
                             onClick={() => {
                               setSelectedCities(prev => 
                                 prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
                               );
                             }}
                           />
                         ))}
                       </div>
                     </div>
                  </div>
                </Card>

                <Card title="AI 分析概览" icon={<Cpu className="w-4 h-4 text-blue-400" />}>
                   <div className="space-y-4">
                      <div className="p-3 bg-neutral-800/20 rounded-lg border border-white/5">
                        <span className="text-xs text-neutral-500 block mb-1">当前匹配策略</span>
                        <span className="text-sm text-neutral-200">深度学习 + 语义化 JD 匹配</span>
                      </div>
                      <div className="text-xs text-neutral-600 italic">
                        "系统将自动抓取职位描述，并由 AI 代理进行意向匹配投递。"
                      </div>
                   </div>
                </Card>
              </section>

              {/* Real-time Monitor Pane */}
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
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> 连接正常</span>
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-neutral-700 rounded-full" /> 节点 ID: 88A2</span>
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
                          <motion.div 
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-4 group"
                          >
                            <span className="text-neutral-700 whitespace-nowrap opacity-60">[{log.time}]</span>
                            <LogTypeBadge type={log.type} />
                            <span className={`flex-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-neutral-400'}`}>
                              {log.message}
                            </span>
                          </motion.div>
                        ))
                      )}
                  </div>

                  <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-xs font-mono text-neutral-600">
                    <span className="uppercase tracking-widest flex items-center gap-2">
                      <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} /> 
                      {isRunning ? '正在合成数据...' : '待命'}
                    </span>
                    <span className="text-[10px] opacity-40">自动滚动已启用</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <StatCard label="今日已投递" value="12" sub="较昨日 +3" />
                  <StatCard label="匹配结果" value="8" sub="匹配度 92%" />
                  <StatCard label="AI 预算消耗" value="1.2%" sub="预计 $0.04" />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'env' && (
            <motion.div 
              key="env"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-12 space-y-8"
            >
              {/* Env Config Header */}
              <div className="flex items-center justify-between p-6 bg-[#111114] border border-white/5 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <Code2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-medium text-white">环境变量配置</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">.env_template 环境变量管理</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                  <Save className="w-4 h-4" /> 保存配置
                </button>
              </div>

              {/* Sections */}
              <div className="space-y-6">
                {/* Enterprise Wechat Webhook */}
                <Card title="企业微信 Webhook" icon={<MessageSquare className="w-4 h-4 text-emerald-400" />}>
                  <div className="space-y-6">
                    <p className="text-xs text-neutral-500 -mt-2">配置企业微信群机器人，用于接收通知消息</p>
                    <div className="flex items-center">
                      <button 
                        onClick={() => setWebhookEnabled(!webhookEnabled)}
                        className={`w-12 h-6 flex items-center rounded-full transition-all px-1 ${webhookEnabled ? 'bg-emerald-500/30' : 'bg-neutral-800'}`}
                      >
                        <div className={`w-4 h-4 rounded-full transition-all ${webhookEnabled ? 'translate-x-6 bg-emerald-500' : 'bg-neutral-600'}`} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Webhook URL</label>
                      <input 
                        type="text" 
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full bg-[#0d0d0f] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all text-neutral-300 font-mono"
                        placeholder="https://qyapi.weixin.qq.com/..."
                      />
                      <p className="text-[10px] text-neutral-600">企业微信群机器人webhook地址，用于接收通知消息</p>
                    </div>
                  </div>
                </Card>

                {/* API Config */}
                <Card title="API 配置" icon={<Code2 className="w-4 h-4 text-blue-400" />}>
                  <div className="space-y-6">
                    <p className="text-xs text-neutral-500 -mt-2">配置 API 服务器地址和使用的 AI 模型</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                         <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">API Base URL</label>
                         <input 
                           type="text" 
                           value={apiBaseUrl}
                           onChange={(e) => setApiBaseUrl(e.target.value)}
                           className="w-full bg-[#0d0d0f] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 transition-all text-neutral-300 font-mono"
                         />
                         <p className="text-[10px] text-neutral-600">API服务器地址</p>
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">AI 模型</label>
                         <input 
                           type="text" 
                           value={aiModel}
                           onChange={(e) => setAiModel(e.target.value)}
                           className="w-full bg-[#0d0d0f] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/30 transition-all text-neutral-300 font-mono"
                         />
                         <p className="text-[10px] text-neutral-600">使用的AI模型名称</p>
                       </div>
                    </div>
                  </div>
                </Card>

                {/* API Key */}
                <Card title="API 密钥" icon={<Key className="w-4 h-4 text-amber-500" />}>
                  <div className="space-y-6">
                    <p className="text-xs text-neutral-500 -mt-2">配置 API 访问密钥，请妥善保管</p>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">API Key</label>
                      <div className="relative">
                        <input 
                          type={showApiKey ? "text" : "password"} 
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full bg-[#0d0d0f] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/30 transition-all text-neutral-300 pr-20 font-mono"
                        />
                        <button 
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors text-[10px] flex items-center gap-1.5 font-mono uppercase tracking-widest"
                        >
                          {showApiKey ? <><EyeOff className="w-3.5 h-3.5" /> 隐藏</> : <><Eye className="w-3.5 h-3.5" /> 显示</>}
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" /> API密钥将被安全存储，请妥善保管
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Info Footer */}
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-3">
                   <Info className="w-5 h-5 text-blue-400 shrink-0" />
                   <p className="text-sm text-blue-200/80">
                     <span className="font-bold mr-2 text-white">提示：</span>
                     这些环境变量将保存到 <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300 select-all">.env</code> 文件中。请勿将包含敏感信息的 .env 文件提交到版本控制系统。
                   </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai-config' && (
            <motion.div 
              key="ai-config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-12"
            >
              <h1 className="text-3xl font-medium tracking-tight text-white mb-8">AI 配置中心</h1>
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-6">
                  <Card title="模型参数设置" icon={<Cpu className="w-4 h-4 text-blue-400" />}>
                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-neutral-800/20 rounded-xl border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-base font-medium text-neutral-200">模型选择 (GPT 优先)</span>
                            <span className="text-xs text-neutral-500 mt-1">当前使用 Gemini 1.5 Pro 进行深度分析</span>
                          </div>
                          <div className="flex gap-2">
                             <button className="px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg shadow-lg">GPT-4</button>
                             <button className="px-4 py-1.5 bg-neutral-800 text-neutral-400 text-xs font-bold rounded-lg border border-white/5">GPT-3.5</button>
                             <button className="px-4 py-1.5 bg-neutral-800 text-neutral-400 text-xs font-bold rounded-lg border border-white/5">Gemini</button>
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
                          <span className="text-white font-mono">$12.45</span>
                        </div>
                     </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-12"
            >
              <h1 className="text-3xl font-medium tracking-tight text-white mb-8">个人中心</h1>
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-4 space-y-6">
                  <div className="bg-[#111114] border border-white/5 rounded-2xl p-8 text-center shadow-xl">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full mx-auto mb-4 border border-emerald-500/20 flex items-center justify-center">
                      <User className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-medium text-white">Java/Python 工程师</h2>
                    <p className="text-neutral-500 text-sm mt-1">Agent 开发专家</p>
                    <div className="mt-8 flex flex-col gap-2">
                       <button className="w-full py-2 bg-neutral-800 text-neutral-300 text-sm rounded-lg border border-white/5 hover:bg-neutral-700 transition-colors">编辑基本资料</button>
                       <button className="w-full py-2 bg-neutral-800 text-neutral-300 text-sm rounded-lg border border-white/5 hover:bg-neutral-700 transition-colors">查看广场投稿</button>
                    </div>
                  </div>
                </div>

                <div className="col-span-8 space-y-6">
                  <Card title="简历管理" icon={<Briefcase className="w-4 h-4 text-orange-400" />}>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-800/10 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center"><Terminal className="w-5 h-5 text-neutral-400" /></div>
                            <div>
                               <div className="text-sm font-medium text-neutral-200">标准求职简历_v2.pdf</div>
                               <div className="text-[10px] text-neutral-500 mt-1">更新于 2 天前 | 345 KB</div>
                            </div>
                          </div>
                          <button className="text-emerald-400 text-xs font-medium">预览</button>
                        </div>
                        <button className="w-full py-6 border-2 border-dashed border-white/5 rounded-xl text-neutral-600 hover:border-emerald-500/20 hover:text-emerald-500/50 transition-all text-sm font-medium">
                          + 上传新简历 (PDF/Docx)
                        </button>
                     </div>
                  </Card>

                  <Card title="画像管理" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}>
                     <div className="space-y-4">
                        <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest block">AI 提取画像</label>
                        <textarea 
                         className="w-full h-40 bg-neutral-900/50 border border-white/5 rounded-xl p-4 text-sm text-neutral-400 focus:outline-none focus:border-blue-500/30 transition-all resize-none shadow-inner"
                         defaultValue={"精通 Java/Python 双栈开发，具备丰富的 AI Agent 开发经历，熟悉大模型集成与编排（如 LangChain/Fixed）。擅长构建智能化后端系统，拥有深厚的系统架构与算法背景。"}
                       />
                       <div className="flex justify-between items-center bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                         <span className="text-xs text-blue-400 flex items-center gap-2"><Cpu className="w-3 h-3" /> 建议根据职位动态调整回复</span>
                         <button className="text-[10px] bg-blue-500 text-white px-2 py-1 rounded">智能校对</button>
                       </div>
                     </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="fixed bottom-6 right-8 flex items-center gap-6">
         <a href="https://github.com/loks666/get_jobs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 px-4 rounded-xl bg-[#141417] border border-white/5 hover:border-emerald-500/30 transition-all group">
            <Github className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400" />
            <span className="text-xs font-medium group-hover:text-emerald-400">查看原始仓库</span>
            <ChevronRight className="w-3 h-3 text-neutral-700 group-hover:translate-x-0.5 transition-transform" />
         </a>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl transition-all relative group ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
    >
      {icon}
      {active && <motion.div layoutId="nav-active" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
      <span className="absolute left-16 bg-[#1a1a1f] text-white text-[10px] px-2 py-1 rounded border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest font-mono">{label}</span>
    </button>
  );
}

function Card({ title, icon, children }: { title: string, icon: ReactNode, children: ReactNode }) {
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

function CityToggle({ name, active = false, onClick }: { name: string, active?: boolean, onClick: () => void, key?: React.Key }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left flex items-center justify-between group ${active ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-neutral-800/10 border-white/5 text-neutral-500 hover:border-white/10 hover:text-neutral-400'}`}>
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
    error: 'bg-red-500/10 text-red-500 border-red-500/30'
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border uppercase tracking-tighter ${colors[type]}`}>
      {type}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="p-5 bg-[#111114] border border-white/5 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/20 transition-all shadow-xl">
      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{label}</span>
      <div className="mt-2 mb-1 text-3xl font-medium text-white group-hover:text-emerald-400 transition-colors">{value}</div>
      <span className={`text-[10px] font-medium ${sub.includes('+') ? 'text-emerald-500/70' : 'text-neutral-600'}`}>{sub}</span>
    </div>
  );
}
