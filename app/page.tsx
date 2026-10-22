'use client';

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  FileText,
  Leaf,
  LockKeyhole,
  Menu,
  Moon,
  PanelTop,
  Sun,
  SunMedium,
  X,
  Zap,
} from 'lucide-react';
import {
  calculateSavings,
  locations,
  type CalculatorInputs,
  type PropertyType,
  type RoofExposure,
} from './calculations';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ModalName = 'lead' | 'embed' | null;
type PresetName = 'Residential Average' | 'Commercial Business' | 'High-Bill Property';

const presets: Record<PresetName, CalculatorInputs> = {
  'Residential Average': { monthlyBill: 240, exposure: 'Average', propertyType: 'Residential', location: 'CA' },
  'Commercial Business': { monthlyBill: 920, exposure: 'High', propertyType: 'Commercial', location: 'TX' },
  'High-Bill Property': { monthlyBill: 1450, exposure: 'Average', propertyType: 'Commercial', location: 'MA' },
};

const currency = (amount: number, compact = false) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  ...(compact ? { notation: 'compact' as const, maximumFractionDigits: 1 } : {}),
}).format(amount);

function MetricCard({ label, value, note, icon: Icon, accent = false }: {
  label: string;
  value: string;
  note: string;
  icon: typeof Leaf;
  accent?: boolean;
}) {
  return (
    <motion.article layout className={`metric-card${accent ? ' metric-card-accent' : ''}`}>
      <div className="metric-top"><span>{label}</span><Icon size={17} strokeWidth={1.8} /></div>
      <strong>{value}</strong>
      <small>{note}</small>
    </motion.article>
  );
}

export default function Home() {
  const [inputs, setInputs] = useState<CalculatorInputs>(presets['Residential Average']);
  const [activePreset, setActivePreset] = useState<PresetName | null>('Residential Average');
  const [modal, setModal] = useState<ModalName>(null);
  const [isDark, setIsDark] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reportUnlocked, setReportUnlocked] = useState(false);
  const [toast, setToast] = useState('');
  const [accent, setAccent] = useState('#bddb55');
  const [embedOrigin, setEmbedOrigin] = useState('https://your-domain.com');
  const [isEmbed, setIsEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');
  const [lead, setLead] = useState({ fullName: '', email: '', phone: '', zipCode: '' });
  const result = useMemo(() => calculateSavings(inputs), [inputs]);

  useEffect(() => {
    setEmbedOrigin(window.location.origin);
    const params = new URLSearchParams(window.location.search);
    setIsEmbed(params.get('embed') === '1');
    const requestedAccent = params.get('accent');
    if (requestedAccent && /^#[0-9a-f]{6}$/i.test(requestedAccent)) setAccent(requestedAccent);
  }, []);

  const updateInputs = <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => {
    setInputs((current) => ({ ...current, [key]: value }));
    setActivePreset(null);
  };

  const choosePreset = (name: PresetName) => {
    setInputs(presets[name]);
    setActivePreset(name);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3600);
  };

  const downloadReport = () => {
    const rows = [
      ['SOLSTICE SOLAR SAVINGS SUMMARY', ''],
      ['Monthly electric bill', currency(inputs.monthlyBill)],
      ['Property type', inputs.propertyType],
      ['Roof sun exposure', inputs.exposure],
      ['Location', locations.find((item) => item.code === inputs.location)?.state ?? ''],
      ['Estimated monthly savings', currency(result.monthlySavings)],
      ['10-year net savings', currency(result.netSavings)],
      ['Estimated system cost', currency(result.systemCost)],
      ['30% federal tax credit estimate', currency(result.taxCredit)],
      ['Estimated break-even', `${result.paybackYears} years`],
      ['Carbon reduction over 10 years', `${result.carbonTons} metric tons CO2e`],
      ['Property value uplift estimate', currency(result.propertyValueIncrease)],
      ['', ''],
      ['10-YEAR CUMULATIVE SOLAR POSITION', ''],
      ...result.projections.slice(1).map((point) => [point.year, currency(point.solar)]),
      ['', 'Estimates only. Incentive eligibility and savings vary by system, utility, site, and applicable law.'],
    ];
    const content = `<!doctype html><html><head><meta charset="utf-8"><title>Solar savings summary</title><style>body{font:16px Arial,sans-serif;max-width:720px;margin:64px auto;color:#172b29}h1{font-size:28px}table{width:100%;border-collapse:collapse;margin-top:32px}td{padding:14px 8px;border-bottom:1px solid #ddd}td:first-child{color:#596762}tr:last-child td{font-size:12px;color:#71807a}</style></head><body><h1>Solar savings summary</h1><p>Prepared with Solstice Solar ROI Calculator</p><table>${rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('')}</table></body></html>`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'solstice-solar-savings-summary.html';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const submitLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entry = { ...lead, submittedAt: new Date().toISOString(), inputs, estimate: result };
    try {
      const existing = JSON.parse(localStorage.getItem('solstice-leads') ?? '[]') as unknown[];
      localStorage.setItem('solstice-leads', JSON.stringify([...existing, entry]));
    } catch {
      setFormError('Your browser could not save this request. Please check local storage and try again.');
      return;
    }
    setReportUnlocked(true);
    setModal(null);
    setFormError('');
    showToast('Your solar audit is unlocked. Your estimate is ready to download.');
  };

  const embedSnippet = `<iframe src="${embedOrigin}/?embed=1&accent=${encodeURIComponent(accent)}" title="Solar savings calculator" width="100%" height="1040" style="border:0;border-radius:8px;max-width:1200px" loading="lazy"></iframe>`;

  const copyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast('Clipboard access is unavailable in this browser. Select and copy the code.');
    }
  };

  return (
    <main className={`app-shell${isDark ? ' dark-mode' : ''}${isEmbed ? ' embed-mode' : ''}`} style={{ '--accent': accent } as CSSProperties}>
      <aside className={`sidebar${mobileNavOpen ? ' sidebar-open' : ''}`}>
        <a className="brand" href="#overview" aria-label="Solstice dashboard home">
          <span className="brand-mark"><SunMedium size={21} strokeWidth={2.2} /></span>
          <span>solstice<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#overview" onClick={() => setMobileNavOpen(false)}><PanelTop size={17} />Overview</a>
          <a className="nav-link" href="#calculator" onClick={() => setMobileNavOpen(false)}><Zap size={17} />Savings calculator</a>
          <button className="nav-link" onClick={() => { setModal('lead'); setMobileNavOpen(false); }}><FileText size={17} />Audit report<span className="nav-lock"><LockKeyhole size={12} /></span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="live-dot" />All systems operational</div>
          <div className="profile-row">
            <div className="profile-avatar">S</div>
            <div><strong>Solstice Energy</strong><small>Sales workspace</small></div>
            <ChevronDown size={15} className="profile-chevron" />
          </div>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <section className="main-column" id="overview">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>Overview</strong></div>
          <div className="top-actions">
            <button className="button button-quiet embed-button" onClick={() => setModal('embed')}><PanelTop size={15} />Embed on your site</button>
            <button className="icon-button theme-button" aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`} onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
            <div className="top-avatar">SE</div>
          </div>
        </header>

        <div className="page-content">
          <motion.section className="page-intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div>
              <div className="eyebrow"><span className="eyebrow-line" />CLEAN ENERGY, CLEAR NUMBERS</div>
              <h1>Make the case<br className="desktop-break" /> for <span>what comes next.</span></h1>
              <p>A sharper picture of solar savings starts with a few details.</p>
            </div>
            <div className="intro-stamp"><Sun size={18} /><span>YOUR SOLAR<br />OPPORTUNITY</span></div>
          </motion.section>

          <section className="presets-section" aria-label="Example scenarios">
            <span className="presets-label">TRY A SCENARIO</span>
            <div className="preset-list">
              {(Object.keys(presets) as PresetName[]).map((name) => (
                <button className={`preset-chip${activePreset === name ? ' selected' : ''}`} key={name} onClick={() => choosePreset(name)}>
                  {name === 'Residential Average' ? <SunMedium size={14} /> : name === 'Commercial Business' ? <PanelTop size={14} /> : <ArrowUpRight size={14} />}{name}
                </button>
              ))}
            </div>
          </section>

          <section className="workspace-grid" id="calculator">
            <motion.article className="panel calculator-panel" layout>
              <div className="panel-heading">
                <div><div className="section-index">01 <span>/ YOUR PROPERTY</span></div><h2>Set the scene</h2></div>
                <button className="help-button" title="Estimates use typical system costs and utility rates." aria-label="About these estimates"><CircleHelp size={17} /></button>
              </div>
              <div className="field-group bill-group">
                <div className="field-label-row"><label htmlFor="monthly-bill">Monthly electric bill</label><span className="unit-label">USD / MONTH</span></div>
                <div className="bill-input-wrap"><span>$</span><input id="monthly-bill" type="number" min={50} max={2000} step={10} value={inputs.monthlyBill} onChange={(event) => updateInputs('monthlyBill', Math.min(2000, Math.max(50, Number(event.target.value) || 50)))} aria-label="Monthly electric bill in dollars" /></div>
                <input className="bill-slider" type="range" min="50" max="2000" step="10" value={inputs.monthlyBill} style={{ '--range': `${((inputs.monthlyBill - 50) / 1950) * 100}%` } as CSSProperties} onChange={(event) => updateInputs('monthlyBill', Number(event.target.value))} aria-label="Adjust monthly electric bill" />
                <div className="range-labels"><span>$50</span><span>$2,000+</span></div>
              </div>
              <div className="field-group">
                <div className="field-label-row"><span className="field-label">Roof sun exposure</span><span className="unit-label">ESTIMATE</span></div>
                <div className="segmented-control exposure-control" role="group" aria-label="Roof sun exposure">
                  {(['Low', 'Average', 'High'] as RoofExposure[]).map((item) => <button key={item} className={inputs.exposure === item ? 'segment active' : 'segment'} onClick={() => updateInputs('exposure', item)}>{item}</button>)}
                </div>
              </div>
              <div className="field-group">
                <div className="field-label-row"><span className="field-label">Property type</span></div>
                <div className="property-options" role="group" aria-label="Property type">
                  {(['Residential', 'Commercial'] as PropertyType[]).map((item) => <button key={item} className={inputs.propertyType === item ? 'property-option active' : 'property-option'} onClick={() => updateInputs('propertyType', item)}><span className="radio-indicator" />{item}</button>)}
                </div>
              </div>
              <div className="field-group location-group">
                <div className="field-label-row"><label htmlFor="location">State / location</label><span className="unit-label">UTILITY PROFILE</span></div>
                <div className="select-wrap"><select id="location" value={inputs.location} onChange={(event) => updateInputs('location', event.target.value as CalculatorInputs['location'])}>{locations.map((item) => <option key={item.code} value={item.code}>{item.state}</option>)}</select><ChevronDown size={16} /></div>
              </div>
              <div className="calculator-footnote"><span>↗</span>State rates adjust projected utility inflation.</div>
            </motion.article>

            <div className="results-column">
              <motion.article className="savings-panel" layout>
                <div className="savings-text">
                  <div className="savings-kicker"><span className="sparkle-mark">✳</span> ESTIMATED MONTHLY SAVINGS</div>
                  <motion.div key={result.monthlySavings} className="savings-number" initial={{ opacity: 0.55, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>{currency(result.monthlySavings)}<span>/mo</span></motion.div>
                  <div className="savings-subtext">Based on your current energy profile</div>
                  <div className="payback-pill"><ArrowDownRight size={14} />Break-even in <strong>{result.paybackYears} years</strong></div>
                </div>
                <div className="savings-art" aria-hidden="true"><div className="sun-halo" /><div className="sun-core" /><div className="art-horizon" /><div className="art-field field-one" /><div className="art-field field-two" /><div className="solar-array"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div>
                <div className="savings-panel-foot"><span><span className="pulse-dot" /> LIVE ESTIMATE</span><span>30% federal tax credit included</span></div>
              </motion.article>

              <div className="metrics-grid">
                <MetricCard label="10-year net savings" value={currency(result.netSavings, true)} note={`${result.roi}% estimated net return`} icon={ArrowUpRight} accent />
                <MetricCard label="Carbon reduced" value={`${result.carbonTons} t`} note="Metric tons of CO₂ equivalent" icon={Leaf} />
                <MetricCard label="Property value uplift" value={currency(result.propertyValueIncrease, true)} note="Estimated at 4% property value" icon={SunMedium} />
              </div>
            </div>
          </section>

          <section className="panel chart-panel" aria-label="Ten-year savings projection">
            <div className="chart-header">
              <div><div className="section-index">02 <span>/ THE LONG VIEW</span></div><h2>Ten years, two paths.</h2><p>Cumulative position compared with staying on utility power.</p></div>
              <div className="chart-legend"><span><i className="legend-solar" />Switching to solar</span><span><i className="legend-baseline" />Doing nothing</span></div>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.projections} margin={{ top: 12, right: 10, left: 5, bottom: 2 }}>
                  <defs><linearGradient id="solarFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a9cb43" stopOpacity={0.22} /><stop offset="95%" stopColor="#a9cb43" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} interval={1} dy={11} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(value: number) => currency(value, true)} width={57} />
                  <Tooltip formatter={(value) => currency(Number(value))} labelStyle={{ color: '#172b29', fontWeight: 700 }} contentStyle={{ border: '1px solid #e7eae4', borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="var(--baseline)" strokeDasharray="4 4" />
                  <Line type="linear" dataKey="doingNothing" name="Doing nothing" stroke="var(--baseline)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={false} />
                  <Area type="monotone" dataKey="solar" name="Switching to solar" stroke="#78952d" strokeWidth={2.5} fill="url(#solarFill)" activeDot={{ r: 5, fill: '#78952d', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-summary"><span>ESTIMATED FEDERAL TAX CREDIT <strong>{currency(result.taxCredit)}</strong></span><span>NET SYSTEM COST <strong>{currency(result.netSystemCost)}</strong></span><span>UTILITY INFLATION <strong>{(result.inflation * 100).toFixed(1)}% / yr</strong></span></div>
          </section>

          <section className={`unlock-banner${reportUnlocked ? ' unlocked' : ''}`}>
            <div className="unlock-icon">{reportUnlocked ? <Check size={20} /> : <FileText size={19} />}</div>
            <div className="unlock-copy"><strong>{reportUnlocked ? 'Your full solar audit is ready.' : 'There’s more behind the estimate.'}</strong><span>{reportUnlocked ? 'Your personalized estimate and detailed breakdown are unlocked.' : 'Unlock a detailed 10-page audit with your system estimate, incentives, and projections.'}</span></div>
            {reportUnlocked ? <button className="button button-dark" onClick={downloadReport}><Download size={15} />Download report</button> : <button className="button button-dark" onClick={() => setModal('lead')}>Unlock your solar audit<ArrowRight size={16} /></button>}
          </section>
          <footer className="page-footer"><span>© 2026 Solstice Energy</span><span>Estimates are illustrative and not a guarantee of savings or tax eligibility.</span><a href="#calculator">Adjust your estimate ↑</a></footer>
        </div>
      </section>

      <AnimatePresence>
        {modal && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <motion.section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.2 }}>
            <button className="modal-close" aria-label="Close dialog" onClick={() => { setModal(null); setFormError(''); }}><X size={19} /></button>
            {modal === 'lead' ? <>
              <div className="modal-icon"><FileText size={21} /></div>
              <div className="modal-eyebrow">YOUR NEXT STEP</div>
              <h2 id="modal-title">Get your full solar audit.</h2>
              <p className="modal-description">We’ll save your estimate and unlock a personalized savings breakdown.</p>
              <form className="lead-form" onSubmit={submitLead}>
                <label>Full name<input required autoComplete="name" value={lead.fullName} onChange={(event) => setLead({ ...lead, fullName: event.target.value })} placeholder="Jordan Lee" /></label>
                <label>Email address<input required type="email" autoComplete="email" value={lead.email} onChange={(event) => setLead({ ...lead, email: event.target.value })} placeholder="jordan@company.com" /></label>
                <div className="form-split"><label>Phone number<input required type="tel" autoComplete="tel" value={lead.phone} onChange={(event) => setLead({ ...lead, phone: event.target.value })} placeholder="(555) 123-4567" /></label><label>ZIP code<input required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="postal-code" value={lead.zipCode} onChange={(event) => setLead({ ...lead, zipCode: event.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="94103" /></label></div>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <button className="button button-dark submit-button" type="submit">Unlock my solar audit<ArrowRight size={16} /></button>
                <small className="privacy-note"><LockKeyhole size={12} />Your details stay private and are stored in this browser.</small>
              </form>
            </> : <>
              <div className="modal-icon"><PanelTop size={21} /></div>
              <div className="modal-eyebrow">TAKE SOLSTICE WITH YOU</div>
              <h2 id="modal-title">Embed the calculator.</h2>
              <p className="modal-description">Choose an accent color, then add this snippet to your site.</p>
              <label className="color-picker-label">BRAND ACCENT<span className="color-picker-wrap"><input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} /><code>{accent.toUpperCase()}</code></span></label>
              <textarea className="embed-code" readOnly value={embedSnippet} onFocus={(event) => event.target.select()} aria-label="Embeddable iframe snippet" />
              <button className="button button-dark submit-button" onClick={copyEmbed}>{copied ? <Check size={16} /> : <PanelTop size={16} />}{copied ? 'Copied to clipboard' : 'Copy embed code'}</button>
              <p className="embed-note">The snippet uses this site&apos;s current address. Update the iframe height to fit your page.</p>
            </>}
          </motion.section>
        </motion.div>}
      </AnimatePresence>
      <AnimatePresence>{toast && <motion.div className="toast-message" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}><Check size={16} />{toast}</motion.div>}</AnimatePresence>
    </main>
  );
}