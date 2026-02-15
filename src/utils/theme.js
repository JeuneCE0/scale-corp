// Theme state — mutable, shared across all modules
export const C_DARK={bg:"#06060b",card:"#0e0e16",card2:"#131320",brd:"#1a1a2c",brdL:"#24243a",acc:"#FFAA00",accD:"rgba(255,170,0,.12)",g:"#34d399",gD:"rgba(52,211,153,.1)",r:"#f87171",rD:"rgba(248,113,113,.1)",o:"#fb923c",oD:"rgba(251,146,60,.1)",b:"#60a5fa",bD:"rgba(96,165,250,.1)",t:"#e4e4e7",td:"#71717a",tm:"#3f3f50",v:"#a78bfa",vD:"rgba(167,139,250,.1)"};
export const C_LIGHT={bg:"#f5f5f5",card:"#ffffff",card2:"#f0f0f0",brd:"#e0e0e0",brdL:"#d0d0d0",acc:"#FFAA00",accD:"#FFF3D6",g:"#22c55e",gD:"#dcfce7",r:"#ef4444",rD:"#fee2e2",b:"#3b82f6",bD:"#dbeafe",o:"#f97316",oD:"#fff7ed",v:"#8b5cf6",vD:"#ede9fe",t:"#1a1a1a",td:"#666666",tm:"#999999"};

// Mutable theme ref — ES module live binding ensures all importers see updates
export let C = C_DARK;

export function getTheme(){try{return localStorage.getItem("scTheme")||"dark";}catch{return"dark";}}
export function applyTheme(t){try{localStorage.setItem("scTheme",t);}catch{}C=t==="light"?C_LIGHT:C_DARK;}

// Initialize on load
applyTheme(getTheme());
