#!/usr/bin/env python3
import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# ============================================================
# TASK 1: Colors, Fonts, Brand defaults
# ============================================================

# Replace the C const - rename to C_DARK and update accent color
old_c = 'const C={bg:"#06060b",card:"#0e0e16",card2:"#131320",brd:"#1a1a2c",brdL:"#24243a",acc:"#c8a44e",accD:"rgba(200,164,78,.1)",g:"#34d399",gD:"rgba(52,211,153,.1)",r:"#f87171",rD:"rgba(248,113,113,.1)",o:"#fb923c",oD:"rgba(251,146,60,.1)",b:"#60a5fa",bD:"rgba(96,165,250,.1)",t:"#e4e4e7",td:"#71717a",tm:"#3f3f50",v:"#a78bfa",vD:"rgba(167,139,250,.1)"};'

new_c = '''const C_DARK={bg:"#06060b",card:"#0e0e16",card2:"#131320",brd:"#1a1a2c",brdL:"#24243a",acc:"#FFAA00",accD:"rgba(255,170,0,.1)",g:"#34d399",gD:"rgba(52,211,153,.1)",r:"#f87171",rD:"rgba(248,113,113,.1)",o:"#fb923c",oD:"rgba(251,146,60,.1)",b:"#60a5fa",bD:"rgba(96,165,250,.1)",t:"#e4e4e7",td:"#71717a",tm:"#3f3f50",v:"#a78bfa",vD:"rgba(167,139,250,.1)"};
const C_LIGHT={bg:"#f5f5f5",card:"#ffffff",card2:"#f0f0f0",brd:"#e0e0e0",brdL:"#d0d0d0",acc:"#FFAA00",accD:"#FFF3D6",g:"#22c55e",gD:"#dcfce7",r:"#ef4444",rD:"#fee2e2",b:"#3b82f6",bD:"#dbeafe",o:"#f97316",oD:"#fff7ed",v:"#8b5cf6",vD:"#ede9fe",t:"#1a1a1a",td:"#666666",tm:"#999999"};
let C=C_DARK;'''

content = content.replace(old_c, new_c)

# Update FONT
content = content.replace(
    '''const FONT="'DM Sans',system-ui,sans-serif";''',
    '''const FONT="'Teachers',sans-serif";
const FONT_TITLE="'Eurostile','Square721 BT','Arial Black',sans-serif";'''
)

# Add Google Fonts import in CSS template literal
content = content.replace(
    'const CSS=`*{box-sizing:border-box;margin:0;padding:0}',
    "const CSS=`@import url('https://fonts.googleapis.com/css2?family=Teachers:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}"
)

# Update DH.brand defaults
content = content.replace(
    'brand:{name:"SCALE CORP",sub:"Plateforme de pilotage",logoUrl:"",logoLetter:"S",accentColor:"#c8a44e"}',
    'brand:{name:"SCALE CORP",sub:"Plateforme de pilotage",logoUrl:"",logoLetter:"S",accentColor:"#FFAA00",gradientFrom:"#FFBF00",gradientTo:"#FF9D00"}'
)

# Replace remaining #c8a44e references
content = content.replace('color:"#c8a44e"', 'color:"#FFAA00"')

# Update GHL_STAGES_COLORS
content = content.replace(
    'const GHL_STAGES_COLORS=["#60a5fa","#c8a44e",',
    'const GHL_STAGES_COLORS=["#60a5fa","#FFAA00",'
)

# Update colors array line 2575
content = content.replace(
    'const colors=["#c8a44e","#34d399",',
    'const colors=["#FFAA00","#34d399",'
)

# Update rgba(200,164,78 to rgba(255,170,0
content = content.replace('rgba(200,164,78,', 'rgba(255,170,0,')

# Update SVG stroke color in select dropdown
content = content.replace("stroke='%23c8a44e'", "stroke='%23FFAA00'")

# Update gradient in sidebar logo - old gold gradient
content = content.replace('#e8c85a', '#FF9D00')

# Update the remaining #c8a44e occurrences (accent color inputs etc.)
content = content.replace('"#c8a44e"', '"#FFAA00"')
content = content.replace("'#c8a44e'", "'#FFAA00'")

# Update DS leadx color
content = content.replace('{id:"leadx",nom:"LEADX",porteur:"Dayyaan",act:"Media Buying",pT:"benefices",pP:30,stat:"active",color:"#FFAA00"',
                          '{id:"leadx",nom:"LEADX",porteur:"Dayyaan",act:"Media Buying",pT:"benefices",pP:30,stat:"active",color:"#FFAA00"')

# ============================================================
# TASK 1b: Apply FONT_TITLE to title elements
# ============================================================

# Sect component title - add fontFamily
content = content.replace(
    '{title&&<h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,letterSpacing:.2}}>',
    '{title&&<h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,letterSpacing:.2,fontFamily:FONT_TITLE}}>'
)

# Login page h1
content = content.replace(
    '<h1 style={{margin:0,fontSize:18,fontWeight:900,letterSpacing:.5}}>',
    '<h1 style={{margin:0,fontSize:18,fontWeight:900,letterSpacing:.5,fontFamily:FONT_TITLE}}>'
)

# Sidebar brand name
content = content.replace(
    '<div style={{fontWeight:800,fontSize:12,letterSpacing:.5,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{brandTitle}</div>',
    '<div style={{fontWeight:800,fontSize:12,letterSpacing:.5,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:FONT_TITLE}}>{brandTitle}</div>'
)

# KPI labels in PorteurDashboard
content = content.replace(
    '<div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>{k.label}</div>',
    '<div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6,fontFamily:FONT_TITLE}}>{k.label}</div>'
)

# Onboarding/tutorial h2
content = content.replace(
    "<h2 style={{margin:0,fontSize:22,fontWeight:800,color:C.t}}>Bienvenue",
    "<h2 style={{margin:0,fontSize:22,fontWeight:800,color:C.t,fontFamily:FONT_TITLE}}>Bienvenue"
)

# ============================================================
# TASK 2: Light/Dark mode toggle  
# ============================================================

# In App component, add theme state after the loaded state
content = content.replace(
    ' const[loaded,setLoaded]=useState(false);const[role,setRole]=useState(null);',
    ' const[loaded,setLoaded]=useState(false);const[role,setRole]=useState(null);\n const[theme,setTheme]=useState(()=>localStorage.getItem("scTheme")||"dark");'
)

# Add theme toggle function and C reassignment before the loading check
content = content.replace(
    " if(!loaded)return",
    """ const toggleTheme=()=>{const next=theme==="dark"?"light":"dark";setTheme(next);localStorage.setItem("scTheme",next);};
 C=theme==="light"?C_LIGHT:C_DARK;
 if(!loaded)return"""
)

# Add theme toggle button in Sidebar footer (before the logout button)
content = content.replace(
    '''   <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,border:"none",background:"transparent",color:C.td,fontSize:10,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"background .12s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.rD;e.currentTarget.style.color=C.r;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.td;}}>
    <span style={{fontSize:12}}>↩</span><span>Déconnexion</span>
   </button>''',
    '''   {onThemeToggle&&<button onClick={onThemeToggle} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,border:"none",background:"transparent",color:C.td,fontSize:10,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background=C.card2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <span style={{fontSize:12}}>{C===C_LIGHT?"🌙":"☀️"}</span><span>{C===C_LIGHT?"Mode sombre":"Mode clair"}</span>
   </button>}
   <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,border:"none",background:"transparent",color:C.td,fontSize:10,cursor:"pointer",fontFamily:FONT,textAlign:"left",transition:"background .12s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.rD;e.currentTarget.style.color=C.r;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.td;}}>
    <span style={{fontSize:12}}>↩</span><span>Déconnexion</span>
   </button>'''
)

# Add onThemeToggle to Sidebar props
content = content.replace(
    'function Sidebar({items,activeTab,setTab,brandTitle,brandSub,onLogout,onTour,extra,dataTourPrefix,brand}){',
    'function Sidebar({items,activeTab,setTab,brandTitle,brandSub,onLogout,onTour,extra,dataTourPrefix,brand,onThemeToggle}){',
)

# Pass onThemeToggle to Sidebar in admin view
content = content.replace(
    '''<Sidebar items={SB_ADMIN} activeTab={tab} setTab={setTab} brandTitle={hold.brand?.name||"SCALE CORP"} brandSub={`${actS.length} sociétés · Admin`} onLogout={()=>setRole(null)} onTour={()=>setShowTour(true)} dataTourPrefix="admin" brand={hold.brand} extra={''',
    '''<Sidebar items={SB_ADMIN} activeTab={tab} setTab={setTab} brandTitle={hold.brand?.name||"SCALE CORP"} brandSub={`${actS.length} sociétés · Admin`} onLogout={()=>setRole(null)} onTour={()=>setShowTour(true)} dataTourPrefix="admin" brand={hold.brand} onThemeToggle={toggleTheme} extra={'''
)

# Pass toggleTheme to SocieteView - add prop
content = content.replace(
    'function SocieteView({soc,reps,allM,save,onLogout,actions,journal,pulses,saveAJ,savePulse,socBankData,syncSocBank,okrs,saveOkrs,kb,saveKb,socs,subs,saveSubs,team,saveTeam,clients,saveClients,ghlData,invoices,saveInvoices,hold,onTour}){',
    'function SocieteView({soc,reps,allM,save,onLogout,actions,journal,pulses,saveAJ,savePulse,socBankData,syncSocBank,okrs,saveOkrs,kb,saveKb,socs,subs,saveSubs,team,saveTeam,clients,saveClients,ghlData,invoices,saveInvoices,hold,onTour,onThemeToggle}){',
)

# Pass onThemeToggle to Sidebar in porteur view
content = content.replace(
    '''<Sidebar items={SB_PORTEUR} activeTab={pTab} setTab={setPTab} brandTitle={soc.nom} brandSub={`${soc.porteur}${soc.incub?" · "+sinceLbl(soc.incub):""}`} onLogout={onLogout} onTour={onTour||(() => {})} dataTourPrefix="porteur"''',
    '''<Sidebar items={SB_PORTEUR} activeTab={pTab} setTab={setPTab} brandTitle={soc.nom} brandSub={`${soc.porteur}${soc.incub?" · "+sinceLbl(soc.incub):""}`} onLogout={onLogout} onTour={onTour||(() => {})} onThemeToggle={onThemeToggle} dataTourPrefix="porteur"'''
)

# Pass onThemeToggle from App to SocieteView
content = content.replace(
    'hold={hold}/></>;}',
    'hold={hold} onThemeToggle={toggleTheme}/></>;}',
    1  # only first occurrence
)

# Add theme toggle on login page (top-right corner)
content = content.replace(
    '''<div className="si" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:16,padding:28,width:340,maxWidth:"100%",boxShadow:"0 24px 60px rgba(0,0,0,.5)"}}>''',
    '''<button onClick={toggleTheme} style={{position:"fixed",top:16,right:16,width:36,height:36,borderRadius:18,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,fontFamily:FONT}}>{C===C_LIGHT?"🌙":"☀️"}</button>
  <div className="si" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:16,padding:28,width:340,maxWidth:"100%",boxShadow:"0 24px 60px rgba(0,0,0,.5)"}}>'''
)

# ============================================================
# TASK 4: Fix remontée calculation
# ============================================================

# In autoGenerateReport, add prestataire calculation before the return
content = content.replace(
    " return{ca:String(Math.round(ca)),charges:String(Math.round(charges)),",
    " const prestataire=Math.round(sumTxns([\"lucien\",\"prestataire\"]));\n return{ca:String(Math.round(ca)),charges:String(Math.round(charges)),prestataireAmount:String(prestataire),"
)

# Fix calcH to use prestataireAmount instead of charges
content = content.replace(
    'let rem=0,cn=0;socs.forEach(s=>{if(s.id==="eco")return;if(["active","lancement"].includes(s.stat))cn++;const r=gr(reps,s.id,month);if(!r)return;const ca=pf(r.ca),ch=pf(r.charges);rem+=(s.pT==="ca"?ca:Math.max(0,ca-ch))*s.pP/100;});',
    'let rem=0,cn=0;socs.forEach(s=>{if(s.id==="eco")return;if(["active","lancement"].includes(s.stat))cn++;const r=gr(reps,s.id,month);if(!r)return;const ca=pf(r.ca),presta=pf(r.prestataireAmount||0);rem+=(s.pT==="ca"?ca:Math.max(0,ca-presta))*s.pP/100;});'
)

# Fix the "Ce que chaque société rapporte" section to use presta
content = content.replace(
    '''const r=gr(reps,s.id,cM2);const ca2=r?pf(r.ca):0,ch2=r?pf(r.charges):0;
    const base=s.pT==="ca"?ca2:Math.max(0,ca2-ch2);const remontee=base*s.pP/100;
    const margeNet=ca2-ch2;const margePct2=ca2>0?Math.round(margeNet/ca2*100):0;
    const salaire=r?pf(r.salaire):0;
    const divHold=r?pf(r.dividendesHolding):0;const resteVerser=remontee-divHold;''',
    '''const r=gr(reps,s.id,cM2);const ca2=r?pf(r.ca):0,ch2=r?pf(r.charges):0;
    const presta2=r?pf(r.prestataireAmount||0):0;
    const base=s.pT==="ca"?ca2:Math.max(0,ca2-presta2);const remontee=base*s.pP/100;
    const margeNet=ca2-ch2;const margePct2=ca2>0?Math.round(margeNet/ca2*100):0;
    const salaire=r?pf(r.salaire):0;
    const divHold=r?pf(r.dividendesHolding):0;const resteVerser=remontee-divHold;'''
)

# Update the display label from "des bénéfices" to "CA hors presta"
content = content.replace(
    '''<span style={{fontSize:9,color:C.td}}>({s.pP}% {s.pT==="ca"?"du CA":"des bénéfices"})</span>''',
    '''<span style={{fontSize:9,color:C.td}}>({s.pP}% {s.pT==="ca"?"du CA":"CA hors presta"})</span>'''
)

# Add presta detail line in the display
content = content.replace(
    '''<span style={{fontSize:9,color:C.td}}>CA: <strong style={{color:C.t}}>{fmt(ca2)}€</strong></span>
    <span style={{fontSize:9,color:C.td}}>Marge: <strong style={{color:margeNet>=0?C.g:C.r}}>{fmt(margeNet)}€ ({margePct2}%)</strong></span>
    {salaire>0&&<span style={{fontSize:9,color:C.td}}>Rém fondateur: <strong style={{color:C.o}}>{fmt(salaire)}€</strong></span>}''',
    '''<span style={{fontSize:9,color:C.td}}>CA: <strong style={{color:C.t}}>{fmt(ca2)}€</strong></span>
    {presta2>0&&<span style={{fontSize:9,color:C.td}}>Presta: <strong style={{color:C.o}}>{fmt(presta2)}€</strong></span>}
    <span style={{fontSize:9,color:C.td}}>Marge: <strong style={{color:margeNet>=0?C.g:C.r}}>{fmt(margeNet)}€ ({margePct2}%)</strong></span>
    {salaire>0&&<span style={{fontSize:9,color:C.td}}>Rém fondateur: <strong style={{color:C.o}}>{fmt(salaire)}€</strong></span>}'''
)

# Fix the remontée calculation in the porteur SocieteView
content = content.replace(
    'const remontee=(soc.pT==="ca"?ca:Math.max(0,marge))*soc.pP/100;',
    'const prestaP=pf(f.prestataireAmount||0);const remontee=(soc.pT==="ca"?ca:Math.max(0,ca-prestaP))*soc.pP/100;'
)

with open('src/App.jsx', 'w') as f:
    f.write(content)

print("All changes applied successfully!")
