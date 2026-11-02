export const DEFAULTS={theme:'system',textSize:'default',reduceMotion:false,briefEnabled:true,briefTime:'08:00',stalledHints:true,focusMinutes:25,breakMinutes:5,sound:false,vibration:true,autoStart:false,maxProjects:3,maxToday:3,aiConsent:false,detail:'standard',steps:6,instructions:'',progressControl:'all',stallDays:3,reminderWording:'gentle',snoozeMinutes:15,requireEvidence:true,reflection:true,completedDays:7,quietStart:'22:00',quietEnd:'08:00',hideSensitive:true,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'};
const enums={
 theme:['system','light','dark','oled','neon','light-blue','red','midnight-blue','purple','warm-light'],
 textSize:['default','large'],
 detail:['brief','standard','detailed'],
 progressControl:['all','buttons','slider','number'],
 reminderWording:['gentle','neutral','concise','direct']
};
const ranges={focusMinutes:[1,120],breakMinutes:[1,60],maxProjects:[1,20],maxToday:[1,30],steps:[1,20],stallDays:[1,90],snoozeMinutes:[1,1440],completedDays:[1,365]};
let owner=null;
export const setPreferenceOwner=id=>{owner=id||null;};
export const preferenceKey=id=>'pkos_mvp_preferences:'+id;
export function validatePreferences(input){const next={...DEFAULTS};for(const [key,def] of Object.entries(DEFAULTS)){const value=input?.[key];if(value===undefined)continue;if(enums[key]){if(!enums[key].includes(value))throw Error(`Invalid ${key}`);}else if(ranges[key]){const [min,max]=ranges[key];if(!Number.isInteger(value)||value<min||value>max)throw Error(`${key} must be ${min}–${max}`);}else if(typeof def==='boolean'){if(typeof value!=='boolean')throw Error(`Invalid ${key}`);}else if(key==='timeZone'){try{new Intl.DateTimeFormat('en',{timeZone:value}).format();}catch{throw Error('Choose a valid timezone, such as America/New_York.');}}else if(key==='instructions'){if(typeof value!=='string'||value.length>2000)throw Error('Instructions must be 2,000 characters or fewer.');}else if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))throw Error('Choose a valid time.');next[key]=value;}return next;}
export function readPreferences(id=owner){try{return validatePreferences(id?JSON.parse(localStorage.getItem(preferenceKey(id))||'{}'):{});}catch{return {...DEFAULTS};}}
export function writePreferences(input,id=owner){if(!id)throw Error('Sign in before saving preferences.');const value=validatePreferences(input);localStorage.setItem(preferenceKey(id),JSON.stringify(value));window.dispatchEvent(new Event('pkos:preferences'));return value;}
export const currentOwner=()=>owner;
export const localDay=(date=new Date(),zone=readPreferences().timeZone)=>new Intl.DateTimeFormat('en-CA',{timeZone:zone}).format(date);
export const isStalled=(project,prefs=readPreferences(),now=Date.now())=>project.status==='Active'&&(now-Date.parse(project.last_activity_at||project.updated_date||project.created_date||new Date(now).toISOString()))>=prefs.stallDays*86400000;
export function applyAppearance(prefs){const dark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=prefs.theme==='system'?(dark?'dark':'light-blue'):prefs.theme==='light'?'light-blue':prefs.theme;document.documentElement.dataset.textSize=prefs.textSize;document.documentElement.dataset.reduceMotion=String(prefs.reduceMotion);localStorage.setItem('smart_pkos_theme',prefs.theme);localStorage.setItem('pkos_progress_control',prefs.progressControl);}
